const express = require('express');
const router = express.Router();
const Seat = require('../models/Seat');
const {
  atomicHoldSeat,
  atomicBatchHoldSeats,
  atomicReleaseSeat,
  getAllHeldSeats,
} = require('../config/redis');
const { scheduleSeatExpiry } = require('../queues/holdQueue');
const { isMongoConnected } = require('../config/db');

// In-memory fallback seats if MongoDB is not running
const fallbackSeats = {};
const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
rows.forEach((row) => {
  let tier = 'Grandstand';
  let price = 80;
  if (['A', 'B', 'C'].includes(row)) {
    tier = 'VIP';
    price = 250;
  } else if (['D', 'E', 'F', 'G'].includes(row)) {
    tier = 'Club';
    price = 150;
  }
  for (let num = 1; num <= 12; num++) {
    const id = `${row}-${num}`;
    fallbackSeats[id] = {
      seatId: id,
      row,
      number: num,
      tier,
      price,
      status: 'available',
    };
  }
});

// GET /api/seats — Get live seat grid with Redis lock states
router.get('/', async (req, res) => {
  try {
    let seatList = [];

    if (isMongoConnected()) {
      seatList = await Seat.find({ eventId: 'coldplay-2026' }).lean();
    }

    if (seatList.length === 0) {
      seatList = Object.values(fallbackSeats);
    }

    // Hydrate with active Redis distributed locks
    const heldMap = await getAllHeldSeats();

    const hydratedSeats = seatList.map((s) => {
      const heldInfo = heldMap[s.seatId];
      if (s.status !== 'booked' && heldInfo) {
        return {
          ...s,
          status: 'held',
          heldBy: heldInfo.heldBy,
          holdTtl: heldInfo.ttl,
        };
      }
      return s;
    });

    res.json({
      success: true,
      count: hydratedSeats.length,
      seats: hydratedSeats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/seats/hold — Atomic Single Seat Lock (SET NX EX)
router.post('/hold', async (req, res) => {
  const { seatId, userId } = req.body;
  const io = req.app.get('io');

  if (!seatId || !userId) {
    return res.status(400).json({ success: false, message: 'seatId and userId are required.' });
  }

  const ttl = parseInt(process.env.HOLD_TTL_SECONDS || '600', 10);
  const acquired = await atomicHoldSeat(seatId, userId, ttl);

  if (!acquired) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: `Seat ${seatId} is already held or locked by another user.`,
    });
  }

  // Schedule 10-min BullMQ release
  await scheduleSeatExpiry([seatId], userId, ttl * 1000, async (expiredSeats, expUser) => {
    for (const sid of expiredSeats) {
      await atomicReleaseSeat(sid, expUser);
    }
    if (io) {
      io.emit('seats:released', {
        seatIds: expiredSeats,
        reason: 'TIMEOUT_AUTO_RELEASE',
      });
    }
  });

  // Broadcast WebSocket update
  if (io) {
    io.emit('seat:held', {
      seatId,
      userId,
      holdTtl: ttl,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    seatId,
    userId,
    holdTtl: ttl,
    message: `Seat ${seatId} locked successfully for ${ttl}s.`,
  });
});

// POST /api/seats/batch-hold — FAANG Multi-Seat Atomic Lock (Lua Script)
router.post('/batch-hold', async (req, res) => {
  const { seatIds, userId } = req.body;
  const io = req.app.get('io');

  if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0 || !userId) {
    return res.status(400).json({ success: false, message: 'Array of seatIds and userId are required.' });
  }

  if (seatIds.length > 8) {
    return res.status(400).json({ success: false, message: 'Max 8 seats per batch allowed.' });
  }

  const ttl = parseInt(process.env.HOLD_TTL_SECONDS || '600', 10);
  const acquired = await atomicBatchHoldSeats(seatIds, userId, ttl);

  if (!acquired) {
    return res.status(409).json({
      success: false,
      conflict: true,
      message: 'Batch lock failed. One or more seats in your selection are already held. Zero partial locks acquired.',
    });
  }

  // Schedule BullMQ expiration
  await scheduleSeatExpiry(seatIds, userId, ttl * 1000, async (expiredSeats, expUser) => {
    for (const sid of expiredSeats) {
      await atomicReleaseSeat(sid, expUser);
    }
    if (io) {
      io.emit('seats:released', {
        seatIds: expiredSeats,
        reason: 'TIMEOUT_AUTO_RELEASE',
      });
    }
  });

  // Broadcast WebSocket update
  if (io) {
    io.emit('seats:batch_held', {
      seatIds,
      userId,
      holdTtl: ttl,
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    success: true,
    seatIds,
    userId,
    holdTtl: ttl,
    message: `Successfully locked ${seatIds.length} seats atomically with Redis Lua script.`,
  });
});

// POST /api/seats/release — Release Seats Manually
router.post('/release', async (req, res) => {
  const { seatIds, userId } = req.body;
  const io = req.app.get('io');

  if (!seatIds || !Array.isArray(seatIds)) {
    return res.status(400).json({ success: false, message: 'seatIds array is required.' });
  }

  for (const sid of seatIds) {
    await atomicReleaseSeat(sid, userId);
  }

  if (io) {
    io.emit('seats:released', {
      seatIds,
      releasedBy: userId,
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: `Released ${seatIds.length} seats back to available pool.`,
  });
});

module.exports = router;

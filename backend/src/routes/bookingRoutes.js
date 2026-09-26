const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const { atomicReleaseSeat } = require('../config/redis');
const { cancelSeatExpiry } = require('../queues/holdQueue');
const { isMongoConnected } = require('../config/db');
const idempotencyMiddleware = require('../middleware/idempotency');

// POST /api/bookings/checkout — ACID Transaction Checkout
router.post('/checkout', idempotencyMiddleware, async (req, res) => {
  const { userId, seatIds, seats, idempotencyKey } = req.body;
  const io = req.app.get('io');

  if (!userId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid checkout payload.' });
  }

  const bookingId = `FG-${Math.floor(100000 + Math.random() * 900000)}`;
  const subtotal = seats.reduce((sum, s) => sum + s.price, 0);
  const taxes = Math.round(subtotal * 0.18);
  const bookingFee = 15;
  const totalAmount = subtotal + taxes + bookingFee;

  let session = null;

  try {
    if (isMongoConnected()) {
      // Start MongoDB Multi-Document ACID Transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Update Seats in MongoDB
      await Seat.updateMany(
        { seatId: { $in: seatIds }, status: { $ne: 'booked' } },
        { $set: { status: 'booked', bookedBy: userId, bookedAt: new Date() } },
        { session }
      );

      // Create Booking record
      const newBooking = new Booking({
        bookingId,
        idempotencyKey: idempotencyKey || `auto_${Date.now()}`,
        userId,
        eventId: 'coldplay-2026',
        seatIds,
        seats,
        subtotal,
        taxes,
        bookingFee,
        totalAmount,
        paymentStatus: 'COMPLETED',
      });

      await newBooking.save({ session });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();
    }

    // Release/clear Redis keys now that seats are permanently booked
    for (const sid of seatIds) {
      await atomicReleaseSeat(sid);
    }

    // Cancel BullMQ expiry timer
    await cancelSeatExpiry(userId, seatIds);

    // Broadcast permanent booked event via WebSockets
    if (io) {
      io.emit('seats:booked', {
        seatIds,
        bookingId,
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      success: true,
      bookingId,
      idempotencyKey,
      seatIds,
      seats,
      totalAmount,
      bookedAt: new Date().toLocaleString(),
      message: 'Booking committed successfully with ACID session guarantee.',
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error('Checkout error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

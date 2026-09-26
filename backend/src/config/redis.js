const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

let redisClient = null;
let isRedisConnected = false;

// In-memory fallback map for zero-setup execution if Redis isn't running locally yet
const memoryStore = new Map();
const memoryExpiryMap = new Map();

const initRedis = () => {
  const host = process.env.REDIS_HOST || '127.0.0.1';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  try {
    redisClient = new Redis({
      host,
      port,
      password,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis connection unavailable. Switching to In-Memory Concurrency Simulator.');
          return null; // Stop retrying and use memory fallback
        }
        return Math.min(times * 200, 1000);
      },
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    redisClient.connect()
      .then(() => {
        isRedisConnected = true;
        console.log(`✅ Connected to Redis at ${host}:${port}`);
      })
      .catch((err) => {
        isRedisConnected = false;
        console.warn(`⚠️  Could not connect to Redis (${err.message}). Using In-Memory Concurrency Engine.`);
      });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
    });
  } catch (error) {
    isRedisConnected = false;
  }

  return redisClient;
};

// Atomic Hold Single Seat (SET NX EX)
const atomicHoldSeat = async (seatId, userId, ttl = 600) => {
  const key = `seat:${seatId}`;

  if (isRedisConnected && redisClient) {
    // True Redis SET NX EX
    const result = await redisClient.set(key, userId, 'NX', 'EX', ttl);
    return result === 'OK';
  } else {
    // Memory engine simulation
    const now = Date.now();
    const existing = memoryStore.get(key);
    const expiresAt = memoryExpiryMap.get(key);

    if (existing && expiresAt > now) {
      return false; // Key already locked by another user
    }

    memoryStore.set(key, userId);
    memoryExpiryMap.set(key, now + ttl * 1000);
    return true;
  }
};

// Atomic Batch Multi-Seat Lock (All-or-Nothing via Lua Script simulation)
const atomicBatchHoldSeats = async (seatIds, userId, ttl = 600) => {
  if (!seatIds || seatIds.length === 0) return false;

  if (isRedisConnected && redisClient) {
    // Custom Lua Script for multi-seat atomic lock
    const luaScript = `
      local userId = ARGV[1]
      local ttl = tonumber(ARGV[2])
      
      -- Phase 1: Check if ALL requested seats are free
      for i = 1, #KEYS do
        local exists = redis.call('EXISTS', KEYS[i])
        if exists == 1 then
          return 0 -- Abort: at least one seat is already locked
        end
      end
      
      -- Phase 2: Lock all seats atomically
      for i = 1, #KEYS do
        redis.call('SET', KEYS[i], userId, 'EX', ttl)
      end
      
      return 1 -- Success: all seats locked
    `;

    const keys = seatIds.map((id) => `seat:${id}`);
    const result = await redisClient.eval(luaScript, keys.length, ...keys, userId, ttl);
    return result === 1;
  } else {
    // In-memory atomic check-all-then-lock
    const now = Date.now();
    for (const id of seatIds) {
      const key = `seat:${id}`;
      const existing = memoryStore.get(key);
      const expiresAt = memoryExpiryMap.get(key);
      if (existing && expiresAt > now) {
        return false; // Rollback
      }
    }

    for (const id of seatIds) {
      const key = `seat:${id}`;
      memoryStore.set(key, userId);
      memoryExpiryMap.set(key, now + ttl * 1000);
    }
    return true;
  }
};

// Release Seat Lock (Only lock owner or system can release)
const atomicReleaseSeat = async (seatId, userId = null) => {
  const key = `seat:${seatId}`;

  if (isRedisConnected && redisClient) {
    if (userId) {
      // Release only if lock matches userId
      const luaScript = `
        if redis.call('GET', KEYS[1]) == ARGV[1] then
          return redis.call('DEL', KEYS[1])
        else
          return 0
        end
      `;
      return await redisClient.eval(luaScript, 1, key, userId);
    } else {
      return await redisClient.del(key);
    }
  } else {
    memoryStore.delete(key);
    memoryExpiryMap.delete(key);
    return 1;
  }
};

// Get All Active Held Seats
const getAllHeldSeats = async () => {
  const held = {};
  const now = Date.now();

  if (isRedisConnected && redisClient) {
    const keys = await redisClient.keys('seat:*');
    for (const key of keys) {
      const seatId = key.replace('seat:', '');
      const userId = await redisClient.get(key);
      const ttl = await redisClient.ttl(key);
      if (userId && ttl > 0) {
        held[seatId] = { heldBy: userId, ttl };
      }
    }
  } else {
    for (const [key, userId] of memoryStore.entries()) {
      const expiresAt = memoryExpiryMap.get(key);
      if (expiresAt > now) {
        const seatId = key.replace('seat:', '');
        held[seatId] = { heldBy: userId, ttl: Math.round((expiresAt - now) / 1000) };
      }
    }
  }

  return held;
};

module.exports = {
  initRedis,
  getRedisClient: () => redisClient,
  atomicHoldSeat,
  atomicBatchHoldSeats,
  atomicReleaseSeat,
  getAllHeldSeats,
  isRedisConnected: () => isRedisConnected,
};

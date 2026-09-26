const { Queue } = require('bullmq');
const { isRedisConnected, getRedisClient } = require('../config/redis');

let holdQueue = null;
const memoryDelayedJobs = new Map();

const initHoldQueue = () => {
  if (isRedisConnected()) {
    try {
      const connection = {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
      };

      holdQueue = new Queue('seatHoldExpiryQueue', { connection });
      console.log('✅ BullMQ Hold Expiry Queue initialized.');
    } catch (err) {
      console.warn('⚠️  BullMQ Queue init failed. Using In-Memory Job Scheduler.');
      holdQueue = null;
    }
  }
};

// Schedule 10-minute hold expiry
const scheduleSeatExpiry = async (seatIds, userId, delayMs = 600000, onExpireCallback = null) => {
  const jobData = { seatIds, userId, timestamp: Date.now() };

  if (holdQueue && isRedisConnected()) {
    const jobId = `hold_${userId}_${seatIds.join('_')}`;
    await holdQueue.add('expireSeat', jobData, {
      delay: delayMs,
      jobId,
      removeOnComplete: true,
      removeOnFail: true,
    });
  } else {
    // In-memory delayed timer fallback
    const timerId = setTimeout(async () => {
      if (onExpireCallback) {
        await onExpireCallback(seatIds, userId);
      }
      memoryDelayedJobs.delete(userId);
    }, delayMs);

    memoryDelayedJobs.set(userId, timerId);
  }
};

// Cancel expiry when user completes checkout
const cancelSeatExpiry = async (userId, seatIds = []) => {
  if (memoryDelayedJobs.has(userId)) {
    clearTimeout(memoryDelayedJobs.get(userId));
    memoryDelayedJobs.delete(userId);
  }

  if (holdQueue && isRedisConnected()) {
    try {
      const jobId = `hold_${userId}_${seatIds.join('_')}`;
      const job = await holdQueue.getJob(jobId);
      if (job) await job.remove();
    } catch (e) {
      // Ignore
    }
  }
};

module.exports = {
  initHoldQueue,
  scheduleSeatExpiry,
  cancelSeatExpiry,
};

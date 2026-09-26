const { Worker } = require('bullmq');
const { atomicReleaseSeat, isRedisConnected } = require('../config/redis');

let worker = null;

const initExpiryWorker = (io) => {
  if (!isRedisConnected()) return;

  try {
    const connection = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    worker = new Worker(
      'seatHoldExpiryQueue',
      async (job) => {
        const { seatIds, userId } = job.data;
        console.log(`⏱️ [BULLMQ_WORKER] Processing 10-min expiration for user: ${userId}, seats: ${seatIds.join(', ')}`);

        for (const seatId of seatIds) {
          await atomicReleaseSeat(seatId, userId);
        }

        // Broadcast release event over WebSockets
        if (io) {
          io.emit('seats:released', {
            seatIds,
            reason: 'BULLMQ_TIMEOUT_EXPIRED',
            timestamp: new Date().toISOString(),
          });
        }
      },
      { connection }
    );

    worker.on('completed', (job) => {
      console.log(`✅ [BULLMQ_WORKER] Expired job ${job.id} released successfully.`);
    });

    worker.on('error', (err) => {
      console.error('⚠️  BullMQ worker error:', err.message);
    });

    console.log('✅ BullMQ Expiry Worker listening for 10-minute hold expirations.');
  } catch (err) {
    console.warn('⚠️  Could not start BullMQ Worker:', err.message);
  }
};

module.exports = {
  initExpiryWorker,
};

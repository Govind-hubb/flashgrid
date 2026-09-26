require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initRedis } = require('./src/config/redis');
const { initHoldQueue } = require('./src/queues/holdQueue');
const { initExpiryWorker } = require('./src/workers/expiryWorker');
const { initSocketIO } = require('./src/sockets/seatSocket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('⚡ Starting FlashGrid Concurrency Engine Server...');

  // 1. Initialize Redis & MongoDB
  initRedis();
  await connectDB();

  // 2. Setup Express & HTTP Server
  const app = createApp();
  const server = http.createServer(app);

  // 3. Setup Socket.io Gateway
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach io to Express app for route emission
  app.set('io', io);
  initSocketIO(io);

  // 4. Initialize BullMQ Delayed Expiry Worker
  initHoldQueue();
  initExpiryWorker(io);

  // 5. Start listening
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 FlashGrid Backend running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket Gateway active on ws://localhost:${PORT}`);
    console.log(`🛡️  Redis Concurrency & Distributed Lock Engine Active`);
    console.log(`=======================================================`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
});

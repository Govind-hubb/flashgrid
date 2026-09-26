const { getAllHeldSeats } = require('../config/redis');

let activeConnections = 0;

const initSocketIO = (io) => {
  io.on('connection', async (socket) => {
    activeConnections++;
    console.log(`🔌 Client connected [${socket.id}] • Total active viewers: ${activeConnections}`);

    // Send initial snapshot of all active Redis held seats
    const heldSeats = await getAllHeldSeats();
    socket.emit('seats:snapshot', {
      heldSeats,
      activeConnections,
      serverTime: Date.now(),
    });

    // Broadcast active user telemetry
    io.emit('telemetry:viewers', { activeConnections });

    // Handle client ping for latency telemetry
    socket.on('ping:telemetry', (clientTimestamp, callback) => {
      if (typeof callback === 'function') {
        callback({
          clientTimestamp,
          serverTimestamp: Date.now(),
        });
      }
    });

    socket.on('disconnect', () => {
      activeConnections = Math.max(0, activeConnections - 1);
      io.emit('telemetry:viewers', { activeConnections });
      console.log(`🔌 Client disconnected [${socket.id}] • Remaining: ${activeConnections}`);
    });
  });
};

module.exports = {
  initSocketIO,
  getActiveViewers: () => activeConnections,
};

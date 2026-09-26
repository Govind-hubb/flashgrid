const express = require('express');
const cors = require('cors');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key'],
  }));
  app.use(express.json());

  // Health Check & Telemetry
  app.get('/health', (req, res) => {
    res.json({
      status: 'HEALTHY',
      service: 'flashgrid-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Mount API routes
  app.use('/api/seats', seatRoutes);
  app.use('/api/bookings', bookingRoutes);

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  });

  return app;
};

module.exports = createApp;

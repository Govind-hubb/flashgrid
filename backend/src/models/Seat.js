const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
  {
    seatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    row: {
      type: String,
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    tier: {
      type: String,
      enum: ['VIP', 'Club', 'Grandstand'],
      default: 'Grandstand',
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'held', 'booked'],
      default: 'available',
      index: true,
    },
    eventId: {
      type: String,
      default: 'coldplay-2026',
      index: true,
    },
    bookedBy: {
      type: String,
      default: null,
    },
    bookedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: '__v', // Optimistic Concurrency Control
  }
);

module.exports = mongoose.model('Seat', seatSchema);

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      default: 'coldplay-2026',
    },
    seatIds: [
      {
        type: String,
        required: true,
      },
    ],
    seats: [
      {
        seatId: String,
        row: String,
        number: Number,
        tier: String,
        price: Number,
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    taxes: {
      type: Number,
      required: true,
    },
    bookingFee: {
      type: Number,
      default: 15,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);

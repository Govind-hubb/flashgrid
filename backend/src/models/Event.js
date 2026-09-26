const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    totalSeats: {
      type: Number,
      default: 120,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);

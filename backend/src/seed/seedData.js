require('dotenv').config();
const mongoose = require('mongoose');
const Seat = require('../models/Seat');
const Event = require('../models/Event');

const seedDatabase = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flashgrid';
  console.log(`🌱 Connecting to ${uri} to seed 120 stadium seats...`);

  try {
    await mongoose.connect(uri);

    // Clear existing
    await Seat.deleteMany({ eventId: 'coldplay-2026' });
    await Event.deleteMany({ eventId: 'coldplay-2026' });

    // Seed Event
    await Event.create({
      eventId: 'coldplay-2026',
      title: 'Coldplay: Music of the Spheres World Tour',
      venue: 'Grand Arena Stadium',
      date: 'Saturday, 8:00 PM',
      totalSeats: 120,
    });

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsToInsert = [];

    rows.forEach((row) => {
      let tier = 'Grandstand';
      let price = 80;

      if (['A', 'B', 'C'].includes(row)) {
        tier = 'VIP';
        price = 250;
      } else if (['D', 'E', 'F', 'G'].includes(row)) {
        tier = 'Club';
        price = 150;
      }

      for (let num = 1; num <= 12; num++) {
        const id = `${row}-${num}`;
        let status = 'available';

        // Pre-seed some booked seats
        if ((row === 'A' && (num === 5 || num === 6)) || (row === 'E' && num === 8) || (row === 'I' && (num === 2 || num === 3))) {
          status = 'booked';
        }

        seatsToInsert.push({
          seatId: id,
          row,
          number: num,
          tier,
          price,
          status,
          eventId: 'coldplay-2026',
        });
      }
    });

    await Seat.insertMany(seatsToInsert);
    console.log(`✅ Successfully seeded 1 Event & ${seatsToInsert.length} Seats into MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();

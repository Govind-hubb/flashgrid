const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flashgrid';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log(`✅ Connected to MongoDB at ${uri}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`⚠️  MongoDB connection failed (${error.message}). Using In-Memory Database Store.`);
  }
};

module.exports = {
  connectDB,
  isMongoConnected: () => isMongoConnected,
};

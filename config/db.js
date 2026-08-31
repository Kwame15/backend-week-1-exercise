const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_manager_db';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection warning: ${error.message}`);
    console.warn('⚠️  If MongoDB is not running locally, install MongoDB or provide a MongoDB Atlas URI in .env');
    return false;
  }
};

module.exports = connectDB;

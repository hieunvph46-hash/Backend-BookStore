const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookstore';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('MongoDB connected:', uri);
}

module.exports = { connectDB };

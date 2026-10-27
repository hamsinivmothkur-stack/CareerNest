
const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!primaryUri) {
    console.error('[Database Error] MONGO_URI is not configured in environment variables.');
    return null;
  }

  try {
    const conn = await mongoose.connect(primaryUri, {
      dbName: 'careernest',
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;

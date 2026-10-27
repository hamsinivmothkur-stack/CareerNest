
const mongoose = require('mongoose');

const STANDARD_ATLAS_URI =
  'mongodb://hamsinivmothkur_db_user:sB185nT3VWhW3Jkc@ac-iaiuswe-shard-00-00.ujzqwog.mongodb.net:27017,ac-iaiuswe-shard-00-01.ujzqwog.mongodb.net:27017,ac-iaiuswe-shard-00-02.ujzqwog.mongodb.net:27017/careernest?ssl=true&replicaSet=atlas-ov49f8-shard-0&authSource=admin&retryWrites=true&w=majority';

const SRV_ATLAS_URI =
  'mongodb+srv://hamsinivmothkur_db_user:sB185nT3VWhW3Jkc@cluster0.ujzqwog.mongodb.net/careernest?retryWrites=true&w=majority';

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return null;
  }
  isConnecting = true;

  const envUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  // Try standard direct replica set URI first on cloud hosts for maximum DNS compatibility
  const urisToTry = [
    STANDARD_ATLAS_URI,
    envUri,
    SRV_ATLAS_URI,
  ].filter(Boolean);

  for (const uri of urisToTry) {
    try {
      const conn = await mongoose.connect(uri, {
        dbName: 'careernest',
        serverSelectionTimeoutMS: 8000,
      });
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      isConnecting = false;
      global.dbLastError = null;
      return conn;
    } catch (err) {
      global.dbLastError = `${err.name}: ${err.message}`;
      console.warn(`[Database] Connection format failed (${err.message}). Trying fallback...`);
    }
  }

  isConnecting = false;
  console.error('[Database Error] All MongoDB connection attempts failed.');
  return null;
};

// Reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB disconnected. Scheduling reconnection in 5s...');
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;

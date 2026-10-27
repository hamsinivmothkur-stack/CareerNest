
const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS resolution for Atlas mongodb+srv URIs
if (dns && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('[Database] Could not set custom DNS servers:', err.message);
  }
}

const connectDB = async () => {
  const primaryUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb+srv://hamsinivmothkur_db_user:sB185nT3VWhW3Jkc@cluster0.ujzqwog.mongodb.net/careernest?retryWrites=true&w=majority';

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

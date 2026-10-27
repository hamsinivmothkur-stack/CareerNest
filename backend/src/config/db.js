const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS resolution for Atlas mongodb+srv URIs on Windows
if (dns && typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (err) {
    console.warn('[Database] Could not set custom DNS servers:', err.message);
  }
}

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careernest';
  const fallbackUri = 'mongodb://127.0.0.1:27017/careernest';

  try {
    const conn = await mongoose.connect(primaryUri, {
      dbName: 'careernest',
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;

  } catch (error) {
    console.error(`[Database Error] Primary connection failed: ${error.message}`);

    // If primary was Atlas and failed, try local MongoDB fallback
    if (primaryUri !== fallbackUri) {
      console.log('[Database] Attempting connection to local MongoDB fallback...');
      try {
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] Connected to local fallback: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`[Database Error] Local fallback also failed: ${fallbackError.message}`);
      }
    }

    return null;
  }
};

module.exports = connectDB;
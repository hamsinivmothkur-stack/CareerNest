const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev mode for testing
      }
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure database connection for API routes
app.use(async (req, res, next) => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1 && req.originalUrl.startsWith('/api') && req.originalUrl !== '/api/health') {
    try {
      await connectDB();
    } catch (_) {}
  }
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  let connectError = null;
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      connectError = err.message;
    }
  }
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbHost: mongoose.connection.host || null,
    lastDbError: global.dbLastError || null,
    error: connectError,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));

// Serve static frontend files (if built in backend/public or frontend/dist)
const path = require('path');
const fs = require('fs');

const publicPath = path.resolve(__dirname, '../public');
const distPath = path.resolve(__dirname, '../../frontend/dist');
const staticPath = fs.existsSync(publicPath) ? publicPath : (fs.existsSync(distPath) ? distPath : null);

if (staticPath) {
  console.log(`[CareerNest Server] Serving frontend static files from: ${staticPath}`);
  app.use(express.static(staticPath));

  // Client-side SPA routing: send index.html for non-API GET requests
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// 404 Handler for undefined API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`,
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[CareerNest Server] Running on http://localhost:${PORT}`);
  console.log(`[CareerNest Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const migrate = require('../scripts/migrate');
const seed = require('../scripts/seed');

const authRoutes = require('./routes/authRoutes');
const membershipRoutes = require('./routes/membershipRoutes');
const schedulingRoutes = require('./routes/schedulingRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Synchronous Latency tracking middleware (ensures <2s response)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn(`[LATENCY WARNING] ${req.method} ${req.originalUrl} took ${duration}ms (>2000ms target)`);
    }
  });
  next();
});

// Static public directory for Web UI test dashboard
app.use(express.static(path.join(__dirname, 'public')));

// API Routes (Single Entry Point / Gateway)
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/notifications', notificationRoutes);

// General Health Check Endpoint
app.get('/api/health-check', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Run migrations & seed data automatically on startup
async function startServer() {
  try {
    await migrate();
    await seed();
  } catch (err) {
    console.warn('Startup initialization note:', err.message);
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Fitness Club & Wellness Analytics Server listening on port ${port}`);
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createDatabase } = require('./db');
const { createExpensesRouter } = require('./routes/expenses');
const { errorHandler } = require('./middleware/errorHandler');

/**
 * Create and configure the Express application.
 * Accepts an optional database instance for testing.
 *
 * In production, the backend also serves the React frontend's
 * static build output, enabling single-process deployment on Render.
 */
function createApp(db) {
  if (!db) {
    db = createDatabase();
  }

  const app = express();

  // --- Middleware ---
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key'],
  }));
  app.use(express.json());

  // --- Health check ---
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- API Routes ---
  app.use('/expenses', createExpensesRouter(db));

  // --- Serve frontend static files in production ---
  const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for any non-API route
  app.get('*', (req, res, next) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/expenses') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) next(); // If file doesn't exist (dev mode), skip
    });
  });

  // --- Error handler (must be last) ---
  app.use(errorHandler);

  return { app, db };
}

// Start server if run directly (not imported for tests)
if (require.main === module) {
  require('dotenv').config();
  const PORT = process.env.PORT || 3001;
  const { app } = createApp();
  app.listen(PORT, () => {
    console.log(`💰 Expense Tracker API running on http://localhost:${PORT}`);
  });
}

module.exports = { createApp };

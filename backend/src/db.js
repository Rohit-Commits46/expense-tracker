const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Initialize and return a SQLite database connection.
 * Uses a file-based DB for persistence across restarts.
 * Accepts an optional path override for testing (e.g., :memory:).
 */
function createDatabase(dbPath) {
  if (!dbPath) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    dbPath = path.join(dataDir, 'expenses.db');
  }

  const db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      idempotency_key TEXT UNIQUE
    )
  `);

  // Index for common queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_idempotency ON expenses(idempotency_key)
  `);

  return db;
}

module.exports = { createDatabase };

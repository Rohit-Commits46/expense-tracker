const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { toPaise, toRupees } = require('../utils/money');

/**
 * Create the expenses router.
 * Accepts a database instance via dependency injection (makes testing easy).
 */
function createExpensesRouter(db) {
  const router = express.Router();

  // Prepared statements for performance
  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, amount, category, description, date, created_at, idempotency_key)
    VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  const findByIdempotencyKey = db.prepare(`
    SELECT * FROM expenses WHERE idempotency_key = ?
  `);

  /**
   * POST /expenses
   * Create a new expense entry.
   *
   * Body: { amount, category, description, date, idempotencyKey }
   *
   * Idempotency: If the same idempotencyKey is sent again (e.g., due to
   * a network retry or double-click), the server returns the original
   * expense instead of creating a duplicate.
   */
  router.post('/', (req, res, next) => {
    try {
      const { amount, category, description, date, idempotencyKey } = req.body;

      // --- Validation ---
      if (amount === undefined || amount === null || amount === '') {
        const err = new Error('Amount is required');
        err.status = 400;
        throw err;
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        const err = new Error('Amount must be a positive number');
        err.status = 400;
        throw err;
      }

      if (!category || typeof category !== 'string' || category.trim() === '') {
        const err = new Error('Category is required');
        err.status = 400;
        throw err;
      }

      if (!date || typeof date !== 'string') {
        const err = new Error('Date is required');
        err.status = 400;
        throw err;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        const err = new Error('Date must be in YYYY-MM-DD format');
        err.status = 400;
        throw err;
      }

      // Check the date is actually valid (e.g., reject 2024-02-30)
      const parsedDate = new Date(date + 'T00:00:00');
      if (isNaN(parsedDate.getTime())) {
        const err = new Error('Date is not a valid calendar date');
        err.status = 400;
        throw err;
      }

      // --- Idempotency Check ---
      if (idempotencyKey) {
        const existing = findByIdempotencyKey.get(idempotencyKey);
        if (existing) {
          // Return the previously created expense — no duplicate
          return res.status(200).json({
            ...existing,
            amount: toRupees(existing.amount),
            _idempotent: true, // signal to client that this was a replay
          });
        }
      }

      // --- Create Expense ---
      const id = uuidv4();
      const amountInPaise = toPaise(numericAmount);
      const trimmedCategory = category.trim();
      const trimmedDescription = (description || '').trim();

      insertExpense.run(
        id,
        amountInPaise,
        trimmedCategory,
        trimmedDescription,
        date,
        idempotencyKey || null
      );

      const expense = {
        id,
        amount: numericAmount,
        category: trimmedCategory,
        description: trimmedDescription,
        date,
        created_at: new Date().toISOString(),
      };

      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /expenses
   * Retrieve a list of expenses.
   *
   * Query params:
   *   - category: filter by category (exact match, case-insensitive)
   *   - sort: "date_desc" for newest first, "date_asc" for oldest first
   */
  router.get('/', (req, res, next) => {
    try {
      const { category, sort } = req.query;

      let sql = 'SELECT * FROM expenses';
      const params = [];
      const conditions = [];

      // Filter by category
      if (category && category.trim() !== '') {
        conditions.push('LOWER(category) = LOWER(?)');
        params.push(category.trim());
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      // Sort
      if (sort === 'date_asc') {
        sql += ' ORDER BY date ASC, created_at ASC';
      } else {
        // Default: newest first (date_desc)
        sql += ' ORDER BY date DESC, created_at DESC';
      }

      const stmt = db.prepare(sql);
      const expenses = stmt.all(...params);

      // Convert amounts from paise to rupees for the response
      const result = expenses.map((exp) => ({
        ...exp,
        amount: toRupees(exp.amount),
      }));

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /expenses/categories
   * Return distinct categories for the filter dropdown.
   */
  router.get('/categories', (req, res, next) => {
    try {
      const stmt = db.prepare(
        'SELECT DISTINCT category FROM expenses ORDER BY category ASC'
      );
      const rows = stmt.all();
      const categories = rows.map((r) => r.category);
      res.json(categories);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createExpensesRouter };

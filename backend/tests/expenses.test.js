import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { createDatabase } from '../src/db.js';

describe('Expenses API', () => {
  let app, db;

  beforeEach(() => {
    // Use in-memory SQLite for fast, isolated tests
    db = createDatabase(':memory:');
    ({ app } = createApp(db));
  });

  afterEach(() => {
    db.close();
  });

  // ─── POST /expenses ────────────────────────────────────────────

  describe('POST /expenses', () => {
    it('should create a new expense', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 150.50,
          category: 'Food',
          description: 'Lunch at cafe',
          date: '2025-04-28',
          idempotencyKey: 'test-key-1',
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        amount: 150.50,
        category: 'Food',
        description: 'Lunch at cafe',
        date: '2025-04-28',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should return the same expense on duplicate idempotency key (no duplicate created)', async () => {
      const payload = {
        amount: 200,
        category: 'Transport',
        description: 'Uber ride',
        date: '2025-04-27',
        idempotencyKey: 'retry-key-abc',
      };

      // First request — creates the expense
      const res1 = await request(app).post('/expenses').send(payload);
      expect(res1.status).toBe(201);

      // Second request — same key, should return existing (not create duplicate)
      const res2 = await request(app).post('/expenses').send(payload);
      expect(res2.status).toBe(200);
      expect(res2.body._idempotent).toBe(true);
      expect(res2.body.id).toBe(res1.body.id);

      // Verify only one expense exists
      const list = await request(app).get('/expenses');
      expect(list.body).toHaveLength(1);
    });

    it('should reject negative amounts', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: -50,
          category: 'Food',
          description: 'Invalid',
          date: '2025-04-28',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('should reject zero amount', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 0,
          category: 'Food',
          description: 'Zero',
          date: '2025-04-28',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive/i);
    });

    it('should reject missing category', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 100,
          description: 'No category',
          date: '2025-04-28',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/category/i);
    });

    it('should reject missing date', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 100,
          category: 'Food',
          description: 'No date',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/date/i);
    });

    it('should reject invalid date format', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 100,
          category: 'Food',
          description: 'Bad date',
          date: '28-04-2025',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/YYYY-MM-DD/);
    });

    it('should handle money precision correctly (0.1 + 0.2 scenario)', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 0.1,
          category: 'Test',
          description: 'Precision test',
          date: '2025-04-28',
          idempotencyKey: 'precision-1',
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(0.1);
    });
  });

  // ─── GET /expenses ─────────────────────────────────────────────

  describe('GET /expenses', () => {
    beforeEach(async () => {
      const expenses = [
        { amount: 100, category: 'Food', description: 'Lunch', date: '2025-04-25', idempotencyKey: 'seed-1' },
        { amount: 250, category: 'Transport', description: 'Taxi', date: '2025-04-27', idempotencyKey: 'seed-2' },
        { amount: 75.50, category: 'Food', description: 'Snacks', date: '2025-04-26', idempotencyKey: 'seed-3' },
        { amount: 500, category: 'Shopping', description: 'Clothes', date: '2025-04-28', idempotencyKey: 'seed-4' },
      ];

      for (const exp of expenses) {
        await request(app).post('/expenses').send(exp);
      }
    });

    it('should return all expenses', async () => {
      const res = await request(app).get('/expenses');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);
    });

    it('should sort by date descending by default (newest first)', async () => {
      const res = await request(app).get('/expenses?sort=date_desc');
      expect(res.status).toBe(200);

      const dates = res.body.map((e) => e.date);
      expect(dates).toEqual(['2025-04-28', '2025-04-27', '2025-04-26', '2025-04-25']);
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/expenses?category=Food');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((e) => e.category === 'Food')).toBe(true);
    });

    it('should filter by category case-insensitively', async () => {
      const res = await request(app).get('/expenses?category=food');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter and sort together', async () => {
      const res = await request(app).get('/expenses?category=Food&sort=date_desc');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].date).toBe('2025-04-26');
      expect(res.body[1].date).toBe('2025-04-25');
    });

    it('should return empty array when no expenses match filter', async () => {
      const res = await request(app).get('/expenses?category=Nonexistent');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ─── GET /expenses/categories ──────────────────────────────────

  describe('GET /expenses/categories', () => {
    it('should return distinct categories', async () => {
      await request(app).post('/expenses').send({
        amount: 100, category: 'Food', description: 'A', date: '2025-04-25', idempotencyKey: 'cat-1',
      });
      await request(app).post('/expenses').send({
        amount: 200, category: 'Transport', description: 'B', date: '2025-04-26', idempotencyKey: 'cat-2',
      });
      await request(app).post('/expenses').send({
        amount: 50, category: 'Food', description: 'C', date: '2025-04-27', idempotencyKey: 'cat-3',
      });

      const res = await request(app).get('/expenses/categories');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(['Food', 'Transport']);
    });
  });
});

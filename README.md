# Expense Tracker

A minimal, production-quality full-stack expense tracking application. Record, review, filter, and analyze personal expenses with a clean, modern interface.

**Live Demo:** _[Link will be added after deployment]_

---

## Tech Stack

| Layer     | Technology                        | Why                                                                                                     |
| --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Backend   | Node.js + Express                 | Lightweight, fast, widely understood. Perfect for a small API.                                          |
| Database  | SQLite (via `better-sqlite3`)     | Zero-config file-based relational DB. Survives restarts, no external service needed. Ideal for single-user personal tools. |
| Frontend  | React 18 + Vite                   | Modern, fast dev experience. Component architecture keeps UI maintainable.                              |

---

## Key Design Decisions

### 1. Money as Integers (Paise)
All monetary values are stored internally as **integers in paise** (1 ₹ = 100 paise). This eliminates floating-point precision errors that plague naive `REAL`/`FLOAT` storage (e.g., `0.1 + 0.2 !== 0.3`). Conversion to/from rupees happens at the API boundary.

### 2. Idempotent Expense Creation
The `POST /expenses` endpoint supports **client-generated idempotency keys**. When the frontend submits an expense, it generates a UUID and attaches it. If the same key is sent again (double-click, network retry, page refresh re-submit), the server returns the original expense instead of creating a duplicate. This is the standard pattern used by Stripe, PayPal, and other financial APIs.

### 3. SQLite for Persistence
Chosen over in-memory storage (data loss on restart) and PostgreSQL/MongoDB (unnecessary complexity for a single-user tool). SQLite provides ACID transactions, survives process restarts, requires zero configuration, and deploys as a single file.

### 4. Server-Side Filtering & Sorting
Filtering and sorting are handled by the database via parameterized SQL queries, not in the frontend. This ensures consistency and would scale better with larger datasets.

### 5. Retry with Exponential Backoff
The frontend API client automatically retries failed requests (network errors, 5xx) with exponential backoff (500ms → 1s → 2s), but does **not** retry 4xx client errors (validation failures).

---

## Trade-offs (Due to Timebox)

| Decision                             | Rationale                                                       |
| ------------------------------------ | --------------------------------------------------------------- |
| No authentication                    | Single-user personal tool per the assignment scope              |
| No pagination                        | Acceptable for personal expense tracking (hundreds, not millions of rows) |
| No expense editing/deletion          | Not in the acceptance criteria; would add significant complexity |
| SQLite instead of PostgreSQL         | Simpler deployment, sufficient for single-user, no cloud DB costs |
| No WebSocket/real-time updates       | Single-user tool, polling on page load is sufficient            |

---

## Intentionally Not Done

- **User authentication** — Not required for a single-user personal tool
- **Expense edit/delete** — Not in acceptance criteria
- **Pagination** — Dataset expected to be small for personal use
- **Offline support (PWA)** — Would add significant complexity for limited benefit
- **Currency conversion** — Fixed to INR (₹) as per requirements

---

## Features

### Core (All acceptance criteria met)
- ✅ Create expense with amount, category, description, date
- ✅ View list of expenses
- ✅ Filter by category
- ✅ Sort by date (newest first)
- ✅ Total of currently visible expenses

### Nice to Have (Implemented)
- ✅ Input validation (positive amounts, required fields, date format)
- ✅ Category-wise summary with visual bar chart
- ✅ Automated integration tests (15 tests)
- ✅ Loading states (skeleton UI)
- ✅ Error states with retry button
- ✅ Idempotent creation (handles double-clicks, retries, refreshes)

---

## API Endpoints

### `POST /expenses`
Create a new expense.

```json
{
  "amount": 150.50,
  "category": "Food",
  "description": "Lunch at cafe",
  "date": "2025-04-28",
  "idempotencyKey": "uuid-v4-here"
}
```

- Returns `201` on first creation
- Returns `200` with `_idempotent: true` if the same `idempotencyKey` is sent again
- Returns `400` for validation errors

### `GET /expenses`
List expenses with optional filtering and sorting.

| Param      | Example               | Description                    |
| ---------- | --------------------- | ------------------------------ |
| `category` | `?category=Food`      | Filter by category (case-insensitive) |
| `sort`     | `?sort=date_desc`     | Sort by date (newest first)    |

### `GET /expenses/categories`
Returns distinct category names for the filter dropdown.

---

## Running Locally

### Prerequisites
- Node.js 18+ and npm

### Backend
```bash
cd backend
npm install
npm run dev     # Starts on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # Starts on http://localhost:5173
```

### Tests
```bash
cd backend
npm test        # Runs 15 integration tests
```

---

## Project Structure
```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── db.js                 # SQLite setup & migrations
│   │   ├── routes/expenses.js    # API endpoints
│   │   ├── middleware/errorHandler.js
│   │   └── utils/money.js        # Paise ↔ Rupee conversion
│   ├── tests/expenses.test.js    # Integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Main layout
│   │   ├── components/           # React components
│   │   ├── hooks/useExpenses.js  # State management
│   │   ├── utils/                # API client & formatters
│   │   └── index.css             # Full design system
│   └── package.json
├── README.md
└── .gitignore
```

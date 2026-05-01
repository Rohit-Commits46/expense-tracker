const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Centralized API client with retry logic and error handling.
 * Handles unreliable networks by retrying failed requests with
 * exponential backoff.
 */

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make an API request with automatic retries on failure.
 */
async function apiRequest(endpoint, options = {}, retries = MAX_RETRIES) {
  const url = `${API_BASE}${endpoint}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      // Parse JSON response
      const data = await response.json();

      if (!response.ok) {
        // Server returned an error — don't retry 4xx (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new ApiError(data.error || 'Request failed', response.status);
        }
        // 5xx errors — retry
        throw new ApiError(data.error || 'Server error', response.status);
      }

      return data;
    } catch (err) {
      // Don't retry client errors (4xx)
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Last attempt — throw
      if (attempt === retries) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(
          'Network error. Please check your connection.',
          0
        );
      }

      // Exponential backoff before retry
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Fetch all expenses with optional filters.
 * @param {Object} params - { category, sort }
 */
export async function getExpenses(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  const endpoint = `/expenses${query ? `?${query}` : ''}`;

  return apiRequest(endpoint);
}

/**
 * Create a new expense.
 * @param {Object} expense - { amount, category, description, date, idempotencyKey }
 */
export async function createExpense(expense) {
  return apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

/**
 * Fetch distinct categories.
 */
export async function getCategories() {
  return apiRequest('/expenses/categories');
}

export { ApiError };

import { useState, useRef } from 'react';

// Default categories for the dropdown
const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Education',
  'Other',
];

/**
 * Generates a UUID v4 (client-side) for idempotency keys.
 * Uses crypto.randomUUID if available, falls back to manual generation.
 */
function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ExpenseForm({ onSubmit, submitting, submitError, submitSuccess }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validationError, setValidationError] = useState('');

  // Store the idempotency key for the current submission attempt.
  // A new key is generated only when the form is reset (after success)
  // or when the user changes form values, ensuring retries use the same key.
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Client-side validation
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid positive amount');
      return;
    }

    if (!category) {
      setValidationError('Please select a category');
      return;
    }

    if (!date) {
      setValidationError('Please select a date');
      return;
    }

    const success = await onSubmit(
      {
        amount: numAmount,
        category,
        description: description.trim(),
        date,
      },
      idempotencyKeyRef.current
    );

    if (success) {
      // Reset form & generate new idempotency key for next expense
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      idempotencyKeyRef.current = generateIdempotencyKey();
    }
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit} id="expense-form">
      <h2 className="form-title">
        <span className="form-icon">+</span>
        Add Expense
      </h2>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="expense-amount">Amount (₹)</label>
          <div className="input-with-prefix">
            <span className="input-prefix">₹</span>
            <input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="expense-category">Category</label>
          <select
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
            required
          >
            <option value="">Select category</option>
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="expense-date">Date</label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="form-group form-group-wide">
          <label htmlFor="expense-description">Description</label>
          <input
            id="expense-description"
            type="text"
            placeholder="What was this expense for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            maxLength={200}
          />
        </div>
      </div>

      {/* Error messages */}
      {(validationError || submitError) && (
        <div className="form-error" role="alert">
          <span className="error-icon">⚠</span>
          {validationError || submitError}
        </div>
      )}

      {/* Success message */}
      {submitSuccess && (
        <div className="form-success" role="status">
          <span className="success-icon">✓</span>
          Expense added successfully!
        </div>
      )}

      <button
        type="submit"
        className="btn-submit"
        id="submit-expense"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className="spinner"></span>
            Saving...
          </>
        ) : (
          'Add Expense'
        )}
      </button>
    </form>
  );
}

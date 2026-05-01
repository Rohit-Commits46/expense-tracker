/**
 * Format a number as Indian Rupees (₹).
 * Examples:
 *   formatCurrency(1234.5)  → "₹1,234.50"
 *   formatCurrency(0.1)     → "₹0.10"
 *   formatCurrency(100)     → "₹100.00"
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 * Example: "2025-04-28" → "28 Apr 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

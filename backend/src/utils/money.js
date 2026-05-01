/**
 * Money utility functions.
 *
 * We store money as integers (paise) in the database to avoid
 * floating-point precision issues. 1 ₹ = 100 paise.
 *
 * Example: ₹123.45 is stored as 12345 (integer).
 */

/**
 * Convert a rupee amount (decimal) to paise (integer).
 * Rounds to the nearest paisa to handle floating-point quirks.
 * @param {number} rupees - Amount in rupees (e.g., 123.45)
 * @returns {number} Amount in paise (e.g., 12345)
 */
function toPaise(rupees) {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    throw new Error('Amount must be a valid number');
  }
  return Math.round(rupees * 100);
}

/**
 * Convert a paise amount (integer) to rupees (decimal).
 * @param {number} paise - Amount in paise (e.g., 12345)
 * @returns {number} Amount in rupees (e.g., 123.45)
 */
function toRupees(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    throw new Error('Amount must be a valid number');
  }
  return paise / 100;
}

module.exports = { toPaise, toRupees };

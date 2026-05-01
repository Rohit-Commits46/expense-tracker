/**
 * Global error handling middleware.
 * Catches all unhandled errors and returns a structured JSON response.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  // Validation errors from our routes
  if (err.status) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  // SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: 'A conflict occurred. The record may already exist.',
    });
  }

  // Unexpected errors — don't leak internal details
  res.status(500).json({
    error: 'An internal server error occurred. Please try again.',
  });
}

module.exports = { errorHandler };

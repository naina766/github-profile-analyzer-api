/**
 * Centralized Error Middleware
 */
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[API Error] ${req.method} ${req.originalUrl} - Status: ${status} - Message: ${message}`);
  
  if (status === 500) {
    console.error(err.stack);
  }

  return res.status(status).json({
    success: false,
    status,
    message: status === 500 && process.env.NODE_ENV === 'production'
      ? 'An unexpected database or server error occurred.'
      : message
  });
}

module.exports = errorMiddleware;

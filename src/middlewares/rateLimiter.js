const rateLimit = require('express-rate-limit');

/**
 * Configure rate limiting rules for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable deprecated headers
  message: {
    success: false,
    status: 429,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter
};

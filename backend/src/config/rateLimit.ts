import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  // Limit requests to the auth routes
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20,                   // 20 requests per window
  message: 'Too many attempts, try again later'
});
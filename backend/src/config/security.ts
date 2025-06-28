// config/security.ts
import helmet from 'helmet';

export const securityMiddleware = [
  helmet(),
  helmet.hsts({ maxAge: 31536000, includeSubDomains: true })
];
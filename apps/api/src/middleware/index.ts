// apps/api/src/middleware/index.ts
// Central export for all middleware

export { errorHandler, notFoundHandler, createHttpError } from './errorHandler';
export { requestLogger, simpleLogger } from './requestLogger';

// Re-export from existing middleware
export { requireAuth } from '../middleware.auth';

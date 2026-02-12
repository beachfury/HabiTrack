// apps/api/src/middleware/index.ts
// Central export for all middleware

export { errorHandler, notFoundHandler, createHttpError } from './errorHandler';
export { requestLogger, simpleLogger } from './requestLogger';

// Kiosk security middleware
export { kioskLocalOnly, isLocalNetwork, isRequestFromLocal } from './kiosk-local-only';
export { kioskRestrictions, isKioskBlockedRoute, markAsKioskSession } from './kiosk-restrictions';

// Re-export from existing middleware
export { requireAuth } from '../middleware.auth';

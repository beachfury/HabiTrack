// apps/api/src/middleware/errorHandler.ts
// Centralized error handling middleware

import type { Request, Response, NextFunction } from 'express';
import { logAudit } from '../audit';

export interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: HttpError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log server errors
  if (status >= 500) {
    console.error('[Server Error]', {
      method: req.method,
      path: req.path,
      error: err.message,
      stack: err.stack,
    });

    // Audit log for 500 errors
    logAudit({
      action: 'server.error',
      result: 'error',
      ip: req.ip,
      ua: req.get('user-agent'),
      details: {
        method: req.method,
        path: req.path,
        error: err.message,
      },
    }).catch(() => {});
  }

  res.status(status).json({
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && status >= 500 ? undefined : message,
    },
  });
}

/**
 * Not found handler (404)
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * Create an HTTP error
 */
export function createHttpError(status: number, code: string, message?: string): HttpError {
  const error: HttpError = new Error(message || code);
  error.status = status;
  error.code = code;
  return error;
}

// apps/api/src/utils/errors.ts
// Centralized error response utilities for consistent API responses

import type { Response } from 'express';

// Standard error codes
export const ErrorCodes = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Input validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

interface ErrorResponse {
  error: {
    code: ErrorCode;
    message?: string;
  };
}

/**
 * Send a standardized error response
 */
export function sendError(
  res: Response,
  status: number,
  code: ErrorCode,
  message?: string
): Response {
  const response: ErrorResponse = {
    error: { code },
  };
  if (message) {
    response.error.message = message;
  }
  return res.status(status).json(response);
}

// Convenience methods for common errors

/**
 * 401 - Authentication required
 */
export function authRequired(res: Response): Response {
  return sendError(res, 401, ErrorCodes.AUTH_REQUIRED);
}

/**
 * 403 - Forbidden (authenticated but not authorized)
 */
export function forbidden(res: Response, message?: string): Response {
  return sendError(res, 403, ErrorCodes.FORBIDDEN, message);
}

/**
 * 400 - Invalid input
 */
export function invalidInput(res: Response, message: string): Response {
  return sendError(res, 400, ErrorCodes.INVALID_INPUT, message);
}

/**
 * 404 - Not found
 */
export function notFound(res: Response, resource: string = 'Resource'): Response {
  return sendError(res, 404, ErrorCodes.NOT_FOUND, `${resource} not found`);
}

/**
 * 409 - Conflict / Already exists
 */
export function conflict(res: Response, message: string): Response {
  return sendError(res, 409, ErrorCodes.CONFLICT, message);
}

/**
 * 500 - Server error
 */
export function serverError(res: Response, message?: string): Response {
  return sendError(res, 500, ErrorCodes.SERVER_ERROR, message);
}

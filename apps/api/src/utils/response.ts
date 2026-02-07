// apps/api/src/utils/response.ts
// Standardized API response helpers

import type { Response } from 'express';

/**
 * Standard error codes
 */
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  DUPLICATE: 'DUPLICATE',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Send success response
 */
export function success<T>(res: Response, data: T, status: number = 200) {
  return res.status(status).json(data);
}

/**
 * Send created response (201)
 */
export function created<T>(res: Response, data: T) {
  return res.status(201).json(data);
}

/**
 * Send error response
 */
export function error(
  res: Response,
  code: ErrorCode,
  message?: string,
  status: number = 400
) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

/**
 * Send 401 Unauthorized
 */
export function unauthorized(res: Response, message?: string) {
  return error(res, ErrorCodes.AUTH_REQUIRED, message, 401);
}

/**
 * Send 403 Forbidden
 */
export function forbidden(res: Response, message?: string) {
  return error(res, ErrorCodes.FORBIDDEN, message, 403);
}

/**
 * Send 404 Not Found
 */
export function notFound(res: Response, message?: string) {
  return error(res, ErrorCodes.NOT_FOUND, message, 404);
}

/**
 * Send 409 Conflict (duplicate)
 */
export function duplicate(res: Response, message?: string) {
  return error(res, ErrorCodes.DUPLICATE, message, 409);
}

/**
 * Send 500 Server Error
 */
export function serverError(res: Response, err?: Error) {
  console.error('[SERVER_ERROR]', err);
  return error(res, ErrorCodes.SERVER_ERROR, undefined, 500);
}

/**
 * Send validation error
 */
export function validationError(res: Response, message: string) {
  return error(res, ErrorCodes.INVALID_INPUT, message, 400);
}

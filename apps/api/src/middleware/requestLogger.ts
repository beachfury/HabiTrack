// apps/api/src/middleware/requestLogger.ts
// Request logging middleware

import type { Request, Response, NextFunction } from 'express';

export interface RequestLogOptions {
  /** Skip logging for these paths */
  skip?: string[];
  /** Include request body in logs */
  logBody?: boolean;
  /** Include query params in logs */
  logQuery?: boolean;
}

/**
 * Request logger middleware
 */
export function requestLogger(options: RequestLogOptions = {}) {
  const { skip = ['/health', '/api/csrf'], logBody = false, logQuery = true } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip certain paths
    if (skip.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();

    // Log on response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData: Record<string, any> = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.socket.remoteAddress,
      };

      if (logQuery && Object.keys(req.query).length > 0) {
        logData.query = req.query;
      }

      if (logBody && req.body && Object.keys(req.body).length > 0) {
        // Redact sensitive fields
        const redactedBody = { ...req.body };
        const sensitiveFields = ['password', 'secret', 'pin', 'token', 'code'];
        for (const field of sensitiveFields) {
          if (redactedBody[field]) {
            redactedBody[field] = '[REDACTED]';
          }
        }
        logData.body = redactedBody;
      }

      // Color-code by status
      const statusColor = res.statusCode >= 500 ? '31' : // red
                          res.statusCode >= 400 ? '33' : // yellow
                          res.statusCode >= 300 ? '36' : // cyan
                          '32'; // green

      console.log(
        `\x1b[${statusColor}m${req.method}\x1b[0m ${req.path} ${res.statusCode} ${duration}ms`
      );
    });

    next();
  };
}

/**
 * Simple request logger (one line per request)
 */
export function simpleLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

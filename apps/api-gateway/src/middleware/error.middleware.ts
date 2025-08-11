import { Request, Response, NextFunction } from 'express';
import { Logger } from '../services/logger.service';

const logger = new Logger('ErrorMiddleware');

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const statusCode = (err as ApiError).statusCode || 500;
  const errorCode = (err as ApiError).errorCode;
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`Unhandled error: ${err.message}`, err);
  } else {
    logger.warn(`Request error: ${err.message}`, {
      statusCode,
      path: req.path,
      method: req.method,
      errorCode,
      requestId: req.headers['x-request-id']
    });
  }
  
  // Return standardized error response
  res.status(statusCode).json({
    message: statusCode >= 500 ? 'Internal server error' : err.message,
    error: errorCode || 'error_occurred',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
    path: req.path
  });
}

/**
 * Not found handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    requestId: req.headers['x-request-id']
  });
  
  res.status(404).json({
    message: 'Resource not found',
    error: 'not_found',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString(),
    path: req.path
  });
}
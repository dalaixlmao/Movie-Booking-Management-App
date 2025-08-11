/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;

  constructor(message: string, statusCode = 500, errorCode = 'internal_error', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, 'not_found', details);
  }
}

/**
 * Bad Request error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details?: any) {
    super(message, 400, 'bad_request', details);
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details?: any) {
    super(message, 401, 'unauthorized', details);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden', details?: any) {
    super(message, 403, 'forbidden', details);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: any) {
    super(message, 409, 'conflict', details);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: any) {
    super(message, 400, 'validation_error', details);
  }
}

/**
 * Rate limit exceeded error (429)
 */
export class RateLimitError extends ApiError {
  constructor(message = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'rate_limit_exceeded', details);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error', details?: any) {
    super(message, 500, 'internal_error', details);
  }
}
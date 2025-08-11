import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../logger';
import { ApiError } from '../error';

// Extend Request type with user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      requestId?: string;
      startTime?: number;
    }
  }
}

const logger = new Logger({ context: 'Middleware' });

/**
 * Middleware to add request ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] || 
                    req.query.requestId?.toString() || 
                    generateRequestId();
                    
  req.requestId = requestId.toString();
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
}

/**
 * Middleware to log all requests
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  req.startTime = Date.now();
  
  // Log when request is received
  logger.info(`Request received: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    requestId: req.requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Log when response is sent
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());
    
    const logMethod = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logMethod](`Request completed: ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId: req.requestId
    });
  });
  
  next();
}

/**
 * Middleware to validate JWT tokens
 */
export function authMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError('Authentication required', 401, 'auth_required'));
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError('Authentication token expired', 401, 'token_expired'));
      }
      
      return next(new ApiError('Invalid authentication token', 401, 'invalid_token'));
    }
  };
}

/**
 * Middleware to check if user has required role
 */
export function roleMiddleware(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError('Authentication required', 401, 'auth_required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ApiError('Insufficient permissions', 403, 'insufficient_permissions'));
    }
    
    next();
  };
}

/**
 * Middleware to handle errors
 */
export function errorMiddleware(err: Error | ApiError, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = (err as ApiError).statusCode || 500;
  const errorCode = (err as ApiError).errorCode || 'internal_error';
  
  // Log internal server errors
  if (statusCode >= 500) {
    logger.error(`Internal server error: ${err.message}`, err);
  }
  
  res.status(statusCode).json({
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    error: errorCode,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
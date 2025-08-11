import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Logger } from '../services/logger.service';

const logger = new Logger('ValidationMiddleware');

type ValidationType = 'body' | 'query' | 'params';

/**
 * Middleware factory for request validation
 * 
 * @param schema - Joi schema for validation
 * @param type - Which part of request to validate ('body', 'query', 'params')
 * @returns Express middleware function
 */
export function validateSchema(schema: Joi.Schema, type: ValidationType = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    let dataToValidate;
    
    switch (type) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      default:
        dataToValidate = req.body;
    }
    
    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      // Format validation errors in a user-friendly way
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }));
      
      logger.warn(`Validation failed for ${req.method} ${req.path}`, {
        errors: errorDetails,
        requestId: req.headers['x-request-id']
      });
      
      return res.status(400).json({
        message: 'Validation failed',
        error: 'One or more request parameters failed validation',
        details: errorDetails
      });
    }
    
    // Replace the request data with the validated data
    switch (type) {
      case 'body':
        req.body = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'params':
        req.params = value;
        break;
    }
    
    next();
  };
}

/**
 * Middleware to sanitize and validate pagination parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  });
  
  const { error, value } = paginationSchema.validate(req.query, {
    stripUnknown: false
  });
  
  if (error) {
    return res.status(400).json({
      message: 'Invalid pagination parameters',
      error: error.details[0].message
    });
  }
  
  // Apply validated pagination parameters
  req.query.page = value.page;
  req.query.limit = value.limit;
  
  next();
}

/**
 * Middleware to validate content type
 */
export function validateContentType(allowedTypes: string[] = ['application/json']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    // Skip validation for GET and DELETE requests as they typically don't have a body
    if (['GET', 'DELETE'].includes(req.method)) {
      return next();
    }
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      logger.warn(`Invalid content type: ${contentType}`, {
        allowedTypes,
        requestId: req.headers['x-request-id']
      });
      
      return res.status(415).json({
        message: 'Unsupported Media Type',
        error: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
}
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Logger } from '../logger';
import { ApiError } from '../error';

const logger = new Logger({ context: 'Validation' });

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
        requestId: req.requestId
      });
      
      throw new ApiError('Validation failed', 400, 'validation_error');
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
 * Pagination schema for list endpoints
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

/**
 * Middleware to validate pagination parameters
 */
export function validatePagination(req: Request, res: Response, next: NextFunction) {
  const { error, value } = paginationSchema.validate(req.query, {
    stripUnknown: false
  });
  
  if (error) {
    throw new ApiError(
      'Invalid pagination parameters', 
      400,
      'invalid_pagination'
    );
  }
  
  // Apply validated pagination parameters
  req.query.page = value.page;
  req.query.limit = value.limit;
  if (value.sortBy) req.query.sortBy = value.sortBy;
  if (value.sortOrder) req.query.sortOrder = value.sortOrder;
  
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
        requestId: req.requestId
      });
      
      throw new ApiError(
        `Unsupported Media Type. Content-Type must be one of: ${allowedTypes.join(', ')}`,
        415,
        'unsupported_media_type'
      );
    }
    
    next();
  };
}
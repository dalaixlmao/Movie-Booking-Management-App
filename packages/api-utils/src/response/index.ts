import { Response } from 'express';

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    [key: string]: any;
  };
}

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  message: string;
  error: string;
  details?: any;
  requestId?: string;
  timestamp: string;
}

/**
 * Standard API pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Helper function to send a success response
 */
export function sendSuccess<T>(
  res: Response, 
  data: T, 
  statusCode = 200, 
  meta?: Record<string, any>
): Response {
  return res.status(statusCode).json({
    data,
    meta: meta || {}
  });
}

/**
 * Helper function to send a paginated response
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  totalItems: number,
  meta?: Record<string, any>
): Response {
  const totalPages = Math.ceil(totalItems / limit);
  
  return res.status(200).json({
    data,
    meta: {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      ...meta
    }
  });
}

/**
 * Helper function to send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  error = 'bad_request',
  details?: any
): Response {
  return res.status(statusCode).json({
    message,
    error,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper function to send a created response (201)
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): Response {
  return sendSuccess(res, data, 201, meta);
}

/**
 * Helper function to send a no content response (204)
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).end();
}
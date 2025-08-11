/**
 * Common types used across API services
 */

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination result with metadata
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  };
}

/**
 * Authentication user data from JWT token
 */
export interface AuthUser {
  id: number | string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Filter operators for query building
 */
export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith'
}

/**
 * Generic filter definition
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

/**
 * Health check response
 */
export interface HealthCheckResult {
  status: 'ok' | 'error';
  version?: string;
  timestamp: string;
  services?: {
    [serviceName: string]: {
      status: 'ok' | 'error';
      message?: string;
    };
  };
}

/**
 * Service to service communication message
 */
export interface ServiceMessage<T = any> {
  type: string;
  payload: T;
  metadata: {
    timestamp: string;
    sender: string;
    correlationId: string;
  };
}
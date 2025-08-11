import { Request, Response, NextFunction } from 'express';
import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Logger } from './logger.service';

export class MonitoringService {
  private readonly logger = new Logger('MonitoringService');
  private readonly requestDurationHistogram: Histogram<string>;
  private readonly requestCounter: Counter<string>;
  private readonly activeConnectionsGauge: Gauge<string>;
  private readonly errorCounter: Counter<string>;
  
  constructor() {
    // Initialize metrics collection
    register.clear();

    // Request duration histogram
    this.requestDurationHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10]
    });
    
    // Request counter
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });
    
    // Error counter
    this.errorCounter = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type', 'status_code']
    });
    
    // Active connections gauge
    this.activeConnectionsGauge = new Gauge({
      name: 'http_active_connections',
      help: 'Number of active HTTP connections'
    });
    
    this.logger.info('Prometheus metrics initialized');
  }
  
  /**
   * Middleware to log requests and collect metrics
   */
  public requestLogger() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = req.headers['x-request-id'] || this.generateRequestId();
      
      // Set request ID if not present
      if (!req.headers['x-request-id']) {
        req.headers['x-request-id'] = requestId;
      }
      
      // Track active connections
      this.activeConnectionsGauge.inc();
      
      // Add response hook to capture metrics after request completes
      res.on('finish', () => {
        const duration = (Date.now() - startTime) / 1000;
        const route = this.normalizeRoute(req.path);
        const method = req.method;
        const statusCode = res.statusCode.toString();
        
        // Record metrics
        this.requestDurationHistogram.observe(
          { method, route, status_code: statusCode }, 
          duration
        );
        
        this.requestCounter.inc({ 
          method, 
          route, 
          status_code: statusCode 
        });
        
        // Track errors (status >= 400)
        if (res.statusCode >= 400) {
          const errorType = this.categorizeError(res.statusCode);
          this.errorCounter.inc({ 
            method, 
            route, 
            error_type: errorType,
            status_code: statusCode 
          });
        }
        
        // Decrement active connections
        this.activeConnectionsGauge.dec();
        
        // Log request details
        this.logger.info(
          `${method} ${req.path} ${statusCode} ${duration.toFixed(3)}s`,
          { requestId, userId: req.user?.id || 'anonymous', userAgent: req.headers['user-agent'] }
        );
      });
      
      next();
    };
  }
  
  /**
   * Handler for Prometheus metrics endpoint
   */
  public metricsEndpoint() {
    return async (_req: Request, res: Response) => {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    };
  }
  
  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Normalize route path to prevent high cardinality in metrics
   * e.g., /users/123 becomes /users/:id
   */
  private normalizeRoute(path: string): string {
    // Common ID patterns in URLs
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f]{8,}/gi, '/:uuid')
      .replace(/\/[0-9a-f]{24}/gi, '/:objectId');
  }
  
  /**
   * Categorize error by status code
   */
  private categorizeError(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) {
      switch (statusCode) {
        case 401: return 'unauthorized';
        case 403: return 'forbidden';
        case 404: return 'not_found';
        case 429: return 'rate_limited';
        default: return 'client_error';
      }
    }
    return 'server_error';
  }
}

// Export singleton instance
export default new MonitoringService();
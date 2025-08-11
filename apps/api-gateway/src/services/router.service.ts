import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import AuthService from './auth.service';
import RateLimitService from './rate-limit.service';
import { Logger } from './logger.service';
import { validateSchema } from '../middleware/validation.middleware';
import { movieSchemas, bookingSchemas } from '../schemas';

export class RouterService {
  private router = Router();
  private logger = new Logger('RouterService');
  
  constructor() {
    this.setupRoutes();
    this.logger.info('API routes configured');
  }
  
  /**
   * Configure all API routes
   */
  private setupRoutes() {
    // Health check endpoint
    this.router.get('/health', (_, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // API Documentation
    this.router.use('/api/docs', (req, res) => {
      res.redirect('/api/v1/docs');
    });
    
    // API version info
    this.router.get('/api', (_, res) => {
      res.status(200).json({
        name: 'Movie Booking API',
        versions: ['v1'],
        currentVersion: 'v1',
        documentation: '/api/docs'
      });
    });
    
    // Auth endpoints
    this.setupAuthRoutes();
    
    // Movie endpoints (public)
    this.setupMovieRoutes();
    
    // Booking endpoints (authenticated)
    this.setupBookingRoutes();
    
    // Admin endpoints (admin role required)
    this.setupAdminRoutes();

    // Fallback for unmatched routes
    this.router.use('*', (req, res) => {
      this.logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        message: 'Resource not found',
        error: 'The requested endpoint does not exist'
      });
    });
  }
  
  /**
   * Configure authentication routes
   */
  private setupAuthRoutes() {
    // Auth endpoints are proxied to the auth service
    this.router.use('/api/v1/auth', 
      RateLimitService.createLimiter(30),
      createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/auth': '/' },
        onProxyReq: (proxyReq, req) => {
          // Add request ID for tracing
          if (req.headers['x-request-id']) {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
          }
        },
        onProxyRes: (proxyRes, req) => {
          // Add versioning headers
          proxyRes.headers['X-API-Version'] = '1.0.0';
          this.logger.debug(`Proxied ${req.method} ${req.path} to auth service`);
        }
      })
    );
    
    // Special endpoint for token refresh
    this.router.post('/api/v1/auth/refresh-token', 
      RateLimitService.createLimiter(10),
      (req, res) => {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
          return res.status(400).json({ 
            message: 'Refresh token is required',
            error: 'Missing refresh token in request body'
          });
        }
        
        const result = AuthService.refreshAccessToken(refreshToken);
        
        if (!result) {
          return res.status(401).json({ 
            message: 'Invalid or expired refresh token',
            error: 'Unable to refresh access token'
          });
        }
        
        res.status(200).json({
          accessToken: result.accessToken,
          tokenType: 'Bearer'
        });
      }
    );
  }
  
  /**
   * Configure movie-related routes (public)
   */
  private setupMovieRoutes() {
    this.router.use('/api/v1/movies', 
      RateLimitService.createLimiter(100),
      createProxyMiddleware({
        target: process.env.MOVIE_SERVICE_URL || 'http://localhost:3002',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/movies': '/movies' },
        onProxyReq: (proxyReq, req) => {
          if (req.headers['x-request-id']) {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
          }
        },
        onProxyRes: (proxyRes) => {
          proxyRes.headers['X-API-Version'] = '1.0.0';
        }
      })
    );
    
    // Movie search endpoint with validation
    this.router.get('/api/v1/movies/search',
      validateSchema(movieSchemas.searchSchema, 'query'),
      RateLimitService.createLimiter(50),
      createProxyMiddleware({
        target: process.env.MOVIE_SERVICE_URL || 'http://localhost:3002',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/movies/search': '/movies/search' }
      })
    );
  }
  
  /**
   * Configure booking-related routes (authenticated)
   */
  private setupBookingRoutes() {
    this.router.use('/api/v1/bookings', 
      AuthService.validateToken,
      RateLimitService.createLimiter(30),
      createProxyMiddleware({
        target: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/bookings': '/' },
        onProxyReq: (proxyReq, req) => {
          // Add user ID from JWT to the proxied request
          proxyReq.setHeader('X-User-Id', req.user.id);
          
          if (req.headers['x-request-id']) {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
          }
        },
        onProxyRes: (proxyRes) => {
          proxyRes.headers['X-API-Version'] = '1.0.0';
        }
      })
    );
    
    // Create booking endpoint with validation
    this.router.post('/api/v1/bookings',
      AuthService.validateToken,
      validateSchema(bookingSchemas.createBookingSchema),
      RateLimitService.createLimiter(10),
      createProxyMiddleware({
        target: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/bookings': '/' }
      })
    );
  }
  
  /**
   * Configure admin routes (admin role required)
   */
  private setupAdminRoutes() {
    this.router.use('/api/v1/admin', 
      AuthService.validateToken,
      AuthService.requireRole(['admin']),
      RateLimitService.createLimiter(50),
      createProxyMiddleware({
        target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3004',
        changeOrigin: true,
        pathRewrite: { '^/api/v1/admin': '/' },
        onProxyReq: (proxyReq, req) => {
          proxyReq.setHeader('X-User-Id', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
          
          if (req.headers['x-request-id']) {
            proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
          }
        },
        onProxyRes: (proxyRes) => {
          proxyRes.headers['X-API-Version'] = '1.0.0';
        }
      })
    );
  }
  
  /**
   * Get the configured router instance
   */
  public getRouter(): Router {
    return this.router;
  }
}

// Export singleton instance
export default new RouterService();
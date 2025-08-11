import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { Logger } from './logger.service';

export class RateLimitService {
  private readonly redisClient;
  private readonly logger = new Logger('RateLimitService');
  private readonly windowSizeInSeconds: number;
  private isConnected: boolean = false;

  constructor() {
    this.windowSizeInSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
    this.redisClient = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379' 
    });

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis client error', err);
      this.isConnected = false;
    });

    this.redisClient.connect()
      .then(() => {
        this.isConnected = true;
        this.logger.info('Connected to Redis for rate limiting');
      })
      .catch(err => {
        this.logger.error('Failed to connect to Redis', err);
        this.isConnected = false;
      });
  }

  /**
   * Create a rate limiter middleware with specified max requests
   */
  public createLimiter(maxRequests: number, identifierExtractor?: (req: Request) => string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip rate limiting if Redis is not connected
      if (!this.isConnected) {
        this.logger.warn('Rate limiting skipped: Redis not connected');
        return next();
      }

      // Get identifier (IP, user ID, or custom)
      let identifier: string;
      
      if (identifierExtractor) {
        identifier = identifierExtractor(req);
      } else if (req.user?.id) {
        // If authenticated, use user ID
        identifier = `user:${req.user.id}`;
      } else {
        // Otherwise use IP address
        identifier = req.ip || 
                    (req.headers['x-forwarded-for'] as string) || 
                    'unknown';
      }
      
      const key = `rate-limit:${identifier}:${this.getRouteKey(req)}`;
      
      try {
        // Get current count
        const currentCount = await this.redisClient.get(key) || '0';
        const count = parseInt(currentCount, 10);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count - 1).toString());
        res.setHeader('X-RateLimit-Reset', (Math.floor(Date.now() / 1000) + this.windowSizeInSeconds).toString());
        
        // Check if limit exceeded
        if (count >= maxRequests) {
          this.logger.warn(`Rate limit exceeded for ${identifier} on ${req.method} ${req.path}`);
          
          return res.status(429).json({ 
            message: 'Too many requests, please try again later',
            error: 'Rate limit exceeded',
            retryAfter: this.windowSizeInSeconds
          });
        }
        
        // First request in this window
        if (count === 0) {
          await this.redisClient.set(key, '1', { EX: this.windowSizeInSeconds });
        } else {
          await this.redisClient.incr(key);
        }
        
        next();
      } catch (error) {
        // Log error but let request through if rate limiting fails
        this.logger.error('Rate limiting error', error);
        next();
      }
    };
  }
  
  /**
   * Generate a key for the current route
   * This allows rate limiting different endpoints at different rates
   */
  private getRouteKey(req: Request): string {
    // Extract base path for rate limiting (e.g., /api/v1/movies -> movies)
    const path = req.path.split('/').filter(Boolean);
    const basePath = path.length > 0 ? path[path.length - 1] : 'root';
    return `${req.method.toLowerCase()}:${basePath}`;
  }
}

// Export singleton instance
export default new RateLimitService();
import { createClient, RedisClientType } from 'redis';
import { Logger } from '../logger';

const logger = new Logger({ context: 'CacheService' });

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

export class CacheService {
  private client: RedisClientType;
  private isConnected = false;
  private namespace: string;
  private defaultTtl: number;
  
  constructor(redisUrl?: string, options: CacheOptions = {}) {
    this.namespace = options.namespace || 'app';
    this.defaultTtl = options.ttl || 3600; // 1 hour default
    
    this.client = createClient({ 
      url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.client.on('error', (err) => {
      logger.error('Redis client error', err);
      this.isConnected = false;
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to Redis');
      this.isConnected = true;
    });
    
    // Connect on instantiation
    this.connect().catch(err => {
      logger.error('Failed to connect to Redis on startup', err);
    });
  }
  
  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }
  
  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }
  
  /**
   * Get formatted cache key with namespace
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
  
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const data = await this.client.get(this.getKey(key));
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error getting cache key ${key}`, error);
      return null;
    }
  }
  
  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const expirySeconds = ttl || this.defaultTtl;
      await this.client.set(
        this.getKey(key), 
        JSON.stringify(value),
        { EX: expirySeconds }
      );
      
      return true;
    } catch (error) {
      logger.error(`Error setting cache key ${key}`, error);
      return false;
    }
  }
  
  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      await this.client.del(this.getKey(key));
      return true;
    } catch (error) {
      logger.error(`Error deleting cache key ${key}`, error);
      return false;
    }
  }
  
  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}`, error);
      return false;
    }
  }
  
  /**
   * Get or set a value in cache (with callback for miss)
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Clear all keys with this namespace
   */
  async clear(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const keys = await this.client.keys(`${this.namespace}:*`);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      
      return true;
    } catch (error) {
      logger.error('Error clearing cache', error);
      return false;
    }
  }
  
  /**
   * Set multiple values in a hash
   */
  async hmset(key: string, data: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const hashKey = this.getKey(key);
      
      // Convert values to strings (Redis requirement)
      const stringifiedData = Object.entries(data).reduce(
        (acc, [field, value]) => {
          acc[field] = typeof value === 'string' ? value : JSON.stringify(value);
          return acc;
        },
        {} as Record<string, string>
      );
      
      await this.client.hSet(hashKey, stringifiedData);
      
      if (ttl || this.defaultTtl) {
        await this.client.expire(hashKey, ttl || this.defaultTtl);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting hash ${key}`, error);
      return false;
    }
  }
  
  /**
   * Get all values from a hash
   */
  async hgetall<T extends Record<string, any>>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      
      const data = await this.client.hGetAll(this.getKey(key));
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }
      
      // Parse JSON values
      return Object.entries(data).reduce(
        (acc, [field, value]) => {
          try {
            acc[field] = JSON.parse(value);
          } catch {
            acc[field] = value;
          }
          return acc;
        },
        {} as T
      );
    } catch (error) {
      logger.error(`Error getting hash ${key}`, error);
      return null;
    }
  }
}

// Export singleton instance with default configuration
export const cacheService = new CacheService();

export default cacheService;
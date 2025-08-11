import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Add user property to Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.tokenExpiration = process.env.JWT_EXPIRATION || '1h';
    this.refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || '7d';
  }

  /**
   * Middleware to validate JWT tokens in the Authorization header
   */
  public validateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'Authentication required', 
        error: 'Missing or invalid authorization header' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Authentication token expired', 
          error: 'Token has expired, please refresh your token' 
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid authentication token', 
        error: 'Token verification failed' 
      });
    }
  }
  
  /**
   * Middleware to check if user has required role
   */
  public requireRole(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentication required',
          error: 'User not authenticated' 
        });
      }
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          error: `Required roles: ${roles.join(', ')}` 
        });
      }
      
      next();
    };
  }

  /**
   * Generate access token for a user
   */
  public generateAccessToken(userId: string, role: string): string {
    return jwt.sign(
      { id: userId, role },
      this.jwtSecret,
      { expiresIn: this.tokenExpiration }
    );
  }

  /**
   * Generate refresh token for a user
   */
  public generateRefreshToken(userId: string): string {
    return jwt.sign(
      { id: userId, tokenType: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.refreshTokenExpiration }
    );
  }

  /**
   * Validate refresh token and generate new access token
   */
  public refreshAccessToken(refreshToken: string): { accessToken: string } | null {
    try {
      const decoded: any = jwt.verify(refreshToken, this.jwtSecret);
      
      // Ensure it's actually a refresh token
      if (!decoded.tokenType || decoded.tokenType !== 'refresh') {
        return null;
      }
      
      // Generate new access token
      const accessToken = this.generateAccessToken(decoded.id, decoded.role || 'user');
      
      return { accessToken };
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export default new AuthService();
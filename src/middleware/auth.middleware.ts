import { 
  Injectable, 
  NestMiddleware, 
  UnauthorizedException, 
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

// Extend Express Request to include user


@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  constructor(private configService: ConfigService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get token from header
      let token = req.headers.authorization;

      if (!token) {
        this.logger.error('No authorization token provided');
        throw new UnauthorizedException('Authentication token is required');
      }

      // Remove Bearer prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      // Get JWT secret from environment
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        this.logger.error('JWT_SECRET_KEY not configured');
        throw new InternalServerErrorException('JWT configuration error');
      }

      try {
        const decodedToken = jwt.verify(token, jwtSecret) as JwtPayload;
        (req as any).user = decodedToken;        
        next();
        
      } catch (jwtError) {
        this.logger.error('JWT verification failed:', jwtError);

        if (jwtError instanceof jwt.TokenExpiredError) {
          throw new UnauthorizedException('Token has expired');
        }
        if (jwtError instanceof jwt.JsonWebTokenError) {
          throw new UnauthorizedException('Invalid token');
        }
        if (jwtError instanceof jwt.NotBeforeError) {
          throw new UnauthorizedException('Token not yet active');
        }

        throw new UnauthorizedException('Token verification failed');
      }
    } catch (error) {
      this.logger.error('Auth middleware error:', error);
      throw error;
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import accessService from '../services/accessService';

// Extend Express Request type to include user and file
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
}

// Middleware to verify JWT token
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};

// Middleware to check if user has valid temporary access
export const checkTemporaryAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated',
      });
    }

    // Admins and Consultants bypass temporary access checks
    if (req.user.role === 'ADMIN' || req.user.role === 'CONSULTANT') {
      return next();
    }

    // Check if user has valid access
    const hasAccess = await accessService.checkUserAccess(req.user.userId);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access at this time. Please check your temporary access window.',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Error checking access',
    });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not authenticated',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }

  next();
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

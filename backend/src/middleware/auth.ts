import { Request, Response, NextFunction } from 'express';
import authService from '../services/authService';
import accessService from '../services/accessService';
import { verifyKeycloakToken, extractRole, KeycloakToken } from '../config/keycloak';

// Extend Express Request type to include user and file
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
  file?: Express.Multer.File;
}

// Middleware to verify JWT token (Keycloak ou JWT local)
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
        success: false,
        error: 'Non autorisé. Token manquant.',
        statusCode: 401,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Essayer d'abord de vérifier avec Keycloak
      const keycloakToken: KeycloakToken = await verifyKeycloakToken(token);

      // Extraire les informations utilisateur du token Keycloak
      req.user = {
        userId: keycloakToken.sub,
        email: keycloakToken.email,
        role: extractRole(keycloakToken.realm_access?.roles || []),
        firstName: keycloakToken.given_name,
        lastName: keycloakToken.family_name,
      };

      return next();
    } catch (keycloakError) {
      // Si Keycloak échoue, essayer le JWT local (fallback pour compatibilité)
      try {
        const decoded = authService.verifyToken(token);
        req.user = decoded;
        return next();
      } catch (localError) {
        // Les deux méthodes ont échoué
        return res.status(401).json({
          success: false,
          error: 'Token invalide ou expiré.',
          statusCode: 401,
        });
      }
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Erreur de vérification du token.',
      statusCode: 401,
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

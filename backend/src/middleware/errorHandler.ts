import { Request, Response, NextFunction } from 'express';
import { AppError, mapError } from '../utils/errors';

/**
 * Middleware global de gestion des erreurs
 * Capture toutes les erreurs et renvoie des réponses formatées en français
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Mapper l'erreur vers une AppError
  const appError = mapError(err);

  // Logger l'erreur (sauf en test)
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Erreur:', {
      message: appError.message,
      statusCode: appError.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      stack: appError.isOperational ? undefined : appError.stack,
    });
  }

  // Ne pas exposer les stack traces en production
  const response: any = {
    success: false,
    error: appError.message,
    statusCode: appError.statusCode,
  };

  // Ajouter des détails en développement
  if (process.env.NODE_ENV === 'development' && !appError.isOperational) {
    response.stack = appError.stack;
    response.details = err.message;
  }

  res.status(appError.statusCode).json(response);
};

/**
 * Middleware pour capturer les erreurs async
 * Wrapper autour des handlers async pour éviter les try/catch partout
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route non trouvée : ${req.method} ${req.path}`,
    statusCode: 404,
  });
};

import { Response } from 'express';

/**
 * Helper pour formatter les réponses API de manière cohérente
 */

interface SuccessResponse {
  success: true;
  message: string;
  data?: any;
}

interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  details?: any;
}

export class ResponseHelper {
  /**
   * Réponse de succès
   */
  static success(
    res: Response,
    message: string,
    data?: any,
    statusCode = 200
  ): Response<SuccessResponse> {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data && { data }),
    });
  }

  /**
   * Réponse de succès pour création (201)
   */
  static created(
    res: Response,
    message: string,
    data?: any
  ): Response<SuccessResponse> {
    return this.success(res, message, data, 201);
  }

  /**
   * Réponse d'erreur
   */
  static error(
    res: Response,
    error: string,
    statusCode = 400,
    details?: any
  ): Response<ErrorResponse> {
    return res.status(statusCode).json({
      success: false,
      error,
      statusCode,
      ...(details && process.env.NODE_ENV === 'development' && { details }),
    });
  }

  /**
   * Erreur de validation (400)
   */
  static validationError(
    res: Response,
    errors: any[]
  ): Response<ErrorResponse> {
    return res.status(400).json({
      success: false,
      error: 'Erreur de validation des données.',
      statusCode: 400,
      details: errors,
    });
  }

  /**
   * Non autorisé (401)
   */
  static unauthorized(
    res: Response,
    message = 'Non autorisé. Veuillez vous connecter.'
  ): Response<ErrorResponse> {
    return this.error(res, message, 401);
  }

  /**
   * Accès refusé (403)
   */
  static forbidden(
    res: Response,
    message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.'
  ): Response<ErrorResponse> {
    return this.error(res, message, 403);
  }

  /**
   * Non trouvé (404)
   */
  static notFound(
    res: Response,
    resource = 'Ressource'
  ): Response<ErrorResponse> {
    return this.error(res, `${resource} non trouvé(e).`, 404);
  }

  /**
   * Conflit (409)
   */
  static conflict(
    res: Response,
    message: string
  ): Response<ErrorResponse> {
    return this.error(res, message, 409);
  }

  /**
   * Erreur serveur (500)
   */
  static serverError(
    res: Response,
    message = 'Une erreur interne s\'est produite. Veuillez réessayer.'
  ): Response<ErrorResponse> {
    return this.error(res, message, 500);
  }

  /**
   * Service indisponible (503)
   */
  static serviceUnavailable(
    res: Response,
    service = 'Le service'
  ): Response<ErrorResponse> {
    return this.error(
      res,
      `${service} est temporairement indisponible. Veuillez réessayer dans quelques instants.`,
      503
    );
  }
}

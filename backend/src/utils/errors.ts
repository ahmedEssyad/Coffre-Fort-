/**
 * Système centralisé de gestion des erreurs
 * Tous les messages sont en français pour l'utilisateur final
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erreurs d'authentification (401)
export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé. Veuillez vous connecter.') {
    super(401, message);
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Email ou mot de passe incorrect.');
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Votre session a expiré. Veuillez vous reconnecter.');
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor() {
    super('Token invalide. Veuillez vous reconnecter.');
  }
}

// Erreurs de permission (403)
export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.') {
    super(403, message);
  }
}

export class AdminOnlyError extends ForbiddenError {
  constructor() {
    super('Cette action nécessite les privilèges administrateur.');
  }
}

export class TemporaryAccessDeniedError extends ForbiddenError {
  constructor() {
    super('Accès refusé. Vous n\'avez pas de fenêtre d\'accès active. Contactez un administrateur.');
  }
}

// Erreurs de ressource non trouvée (404)
export class NotFoundError extends AppError {
  constructor(resource = 'Ressource') {
    super(404, `${resource} non trouvé(e).`);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Utilisateur');
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor() {
    super('Document');
  }
}

export class AccessNotFoundError extends NotFoundError {
  constructor() {
    super('Fenêtre d\'accès');
  }
}

// Erreurs de validation (400)
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class InvalidEmailError extends ValidationError {
  constructor() {
    super('Adresse email invalide.');
  }
}

export class WeakPasswordError extends ValidationError {
  constructor() {
    super('Le mot de passe doit contenir au moins 8 caractères.');
  }
}

export class UserAlreadyExistsError extends ValidationError {
  constructor() {
    super('Un utilisateur avec cet email existe déjà.');
  }
}

export class InvalidDateRangeError extends ValidationError {
  constructor() {
    super('La date de fin doit être après la date de début.');
  }
}

// Erreurs de conflit (409)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class CannotDeleteSelfError extends ConflictError {
  constructor() {
    super('Vous ne pouvez pas supprimer votre propre compte.');
  }
}

export class CannotDemoteSelfError extends ConflictError {
  constructor() {
    super('Vous ne pouvez pas modifier votre propre rôle d\'administrateur.');
  }
}

export class LastAdminError extends ConflictError {
  constructor() {
    super('Impossible de supprimer ou rétrograder le dernier administrateur. Il doit rester au moins un admin.');
  }
}

// Erreurs de service externe (502/503)
export class ServiceUnavailableError extends AppError {
  constructor(service = 'Service') {
    super(503, `${service} temporairement indisponible. Veuillez réessayer dans quelques instants.`);
  }
}

export class MayanServiceError extends ServiceUnavailableError {
  constructor() {
    super('Le service de gestion documentaire');
  }
}

export class AIServiceError extends ServiceUnavailableError {
  constructor() {
    super('Le service d\'intelligence artificielle');
  }
}

export class EmailServiceError extends ServiceUnavailableError {
  constructor() {
    super('Le service d\'envoi d\'email');
  }
}

// Erreurs serveur internes (500)
export class InternalServerError extends AppError {
  constructor(message = 'Une erreur interne s\'est produite. Veuillez réessayer.') {
    super(500, message, false); // non-operational
  }
}

export class DatabaseError extends InternalServerError {
  constructor() {
    super('Erreur de base de données. Veuillez réessayer.');
  }
}

/**
 * Messages de succès standardisés
 */
export const SuccessMessages = {
  // Auth
  LOGIN_SUCCESS: 'Connexion réussie. Bienvenue !',
  LOGOUT_SUCCESS: 'Déconnexion réussie.',
  REGISTER_SUCCESS: 'Compte créé avec succès. Bienvenue !',
  PASSWORD_RESET_EMAIL_SENT: 'Un email de réinitialisation a été envoyé à votre adresse.',
  PASSWORD_CHANGED: 'Votre mot de passe a été modifié avec succès.',

  // Users
  USER_CREATED: 'Utilisateur créé avec succès.',
  USER_UPDATED: 'Utilisateur mis à jour avec succès.',
  USER_DELETED: 'Utilisateur supprimé avec succès.',
  USER_INVITED: 'Invitation envoyée avec succès.',
  ROLE_UPDATED: 'Rôle modifié avec succès.',

  // Documents
  DOCUMENT_UPLOADED: 'Document téléversé avec succès.',
  DOCUMENT_DELETED: 'Document supprimé avec succès.',
  DOCUMENT_DOWNLOADED: 'Document téléchargé avec succès.',

  // Access
  ACCESS_CREATED: 'Fenêtre d\'accès créée avec succès.',
  ACCESS_UPDATED: 'Fenêtre d\'accès mise à jour avec succès.',
  ACCESS_DELETED: 'Fenêtre d\'accès supprimée avec succès.',

  // AI
  ANALYSIS_COMPLETE: 'Analyse terminée avec succès.',
};

/**
 * Mapper les erreurs courantes vers des erreurs applicatives
 */
export function mapError(error: any): AppError {
  // Erreurs Prisma
  if (error.code === 'P2002') {
    return new UserAlreadyExistsError();
  }
  if (error.code === 'P2025') {
    return new NotFoundError();
  }

  // Erreurs JWT
  if (error.name === 'JsonWebTokenError') {
    return new InvalidTokenError();
  }
  if (error.name === 'TokenExpiredError') {
    return new TokenExpiredError();
  }

  // Erreur réseau Axios/Fetch
  if (error.code === 'ECONNREFUSED') {
    return new ServiceUnavailableError();
  }

  // Si c'est déjà une AppError, la retourner
  if (error instanceof AppError) {
    return error;
  }

  // Erreur inconnue
  return new InternalServerError(
    process.env.NODE_ENV === 'production'
      ? 'Une erreur est survenue. Veuillez réessayer.'
      : error.message
  );
}

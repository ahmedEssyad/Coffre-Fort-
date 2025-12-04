import toast from 'react-hot-toast';

/**
 * Système de notifications toast centralisé
 * Tous les messages en français avec des styles cohérents
 */

const defaultOptions = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
  },
};

export const showToast = {
  /**
   * Succès
   */
  success: (message: string) => {
    toast.success(message, {
      ...defaultOptions,
      icon: '✅',
      style: {
        ...defaultOptions.style,
        background: '#10b981',
        color: '#fff',
      },
    });
  },

  /**
   * Erreur
   */
  error: (message: string) => {
    toast.error(message, {
      ...defaultOptions,
      duration: 5000, // Plus long pour les erreurs
      icon: '❌',
      style: {
        ...defaultOptions.style,
        background: '#ef4444',
        color: '#fff',
      },
    });
  },

  /**
   * Avertissement
   */
  warning: (message: string) => {
    toast(message, {
      ...defaultOptions,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        background: '#f59e0b',
        color: '#fff',
      },
    });
  },

  /**
   * Information
   */
  info: (message: string) => {
    toast(message, {
      ...defaultOptions,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        background: '#3b82f6',
        color: '#fff',
      },
    });
  },

  /**
   * Chargement (avec promesse)
   */
  loading: (message: string) => {
    return toast.loading(message, {
      ...defaultOptions,
      style: {
        ...defaultOptions.style,
        background: '#6b7280',
        color: '#fff',
      },
    });
  },

  /**
   * Dismiss un toast spécifique
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss tous les toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Toast promesse (affiche loading, puis succès ou erreur)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      defaultOptions
    );
  },
};

/**
 * Messages d'erreur standardisés
 */
export const ErrorMessages = {
  // Auth
  LOGIN_FAILED: 'Échec de la connexion. Veuillez vérifier vos identifiants.',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',

  // Network
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',

  // Generic
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
  OPERATION_FAILED: 'L\'opération a échoué. Veuillez réessayer.',

  // Documents
  UPLOAD_FAILED: 'Échec du téléversement du document.',
  DOWNLOAD_FAILED: 'Échec du téléchargement du document.',
  DELETE_FAILED: 'Échec de la suppression du document.',

  // AI
  ANALYSIS_FAILED: 'Échec de l\'analyse IA. Veuillez réessayer.',

  // Admin
  USER_CREATE_FAILED: 'Échec de la création de l\'utilisateur.',
  USER_DELETE_FAILED: 'Échec de la suppression de l\'utilisateur.',
  ROLE_UPDATE_FAILED: 'Échec de la modification du rôle.',
  ACCESS_CREATE_FAILED: 'Échec de la création de la fenêtre d\'accès.',
};

/**
 * Messages de succès standardisés
 */
export const SuccessMessages = {
  // Auth
  LOGIN_SUCCESS: 'Connexion réussie. Bienvenue !',
  LOGOUT_SUCCESS: 'Déconnexion réussie.',
  REGISTER_SUCCESS: 'Compte créé avec succès.',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès.',

  // Documents
  UPLOAD_SUCCESS: 'Document téléversé avec succès.',
  DOWNLOAD_SUCCESS: 'Document téléchargé avec succès.',
  DELETE_SUCCESS: 'Document supprimé avec succès.',

  // AI
  ANALYSIS_SUCCESS: 'Analyse terminée avec succès.',

  // Admin
  USER_CREATED: 'Utilisateur créé avec succès.',
  USER_DELETED: 'Utilisateur supprimé avec succès.',
  ROLE_UPDATED: 'Rôle modifié avec succès.',
  INVITATION_SENT: 'Invitation envoyée avec succès.',
  ACCESS_CREATED: 'Fenêtre d\'accès créée avec succès.',
  ACCESS_UPDATED: 'Fenêtre d\'accès mise à jour avec succès.',
  ACCESS_DELETED: 'Fenêtre d\'accès supprimée avec succès.',
};

/**
 * Extraire le message d'erreur d'une réponse API
 */
export function extractErrorMessage(error: any): string {
  // Si c'est une erreur Axios
  if (error.response) {
    const data = error.response.data;

    // Message d'erreur du serveur
    if (data.error) return data.error;
    if (data.message) return data.message;

    // Erreurs de validation
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.msg || e.message).join(', ');
    }

    // Status HTTP
    if (error.response.status === 401) {
      return ErrorMessages.UNAUTHORIZED;
    }
    if (error.response.status === 403) {
      return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
    }
    if (error.response.status === 404) {
      return 'Ressource non trouvée.';
    }
    if (error.response.status >= 500) {
      return ErrorMessages.SERVER_ERROR;
    }
  }

  // Erreurs réseau
  if (error.message === 'Network Error') {
    return ErrorMessages.NETWORK_ERROR;
  }

  if (error.code === 'ECONNABORTED') {
    return ErrorMessages.TIMEOUT;
  }

  // Message d'erreur générique
  if (error.message) {
    return error.message;
  }

  return ErrorMessages.UNKNOWN_ERROR;
}

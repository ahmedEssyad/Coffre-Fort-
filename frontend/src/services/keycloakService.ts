import { UserManager, WebStorageStateStore, User } from 'oidc-client-ts';

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = 'coffrefort';

// Extended profile type for Keycloak claims
interface KeycloakProfile {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  realm_access?: {
    roles: string[];
  };
}

/**
 * Configuration OIDC pour Keycloak
 */
const oidcConfig = {
  authority: `${KEYCLOAK_URL}/realms/${REALM}`,
  client_id: 'frontend-app',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  silent_redirect_uri: `${window.location.origin}/silent-callback.html`,
};

export const userManager = new UserManager(oidcConfig);

/**
 * Service Keycloak pour l'authentification OIDC
 */
class KeycloakService {
  /**
   * Initier la connexion SSO
   * Redirige vers Keycloak pour l'authentification
   */
  async login(): Promise<void> {
    try {
      await userManager.signinRedirect({
        redirect_uri: `${window.location.origin}/callback`,
      });
    } catch (error) {
      console.error('Erreur lors de la redirection SSO:', error);
      throw error;
    }
  }

  /**
   * Gérer le callback après authentification Keycloak
   * Retourne l'utilisateur authentifié
   */
  async handleCallback(): Promise<User | null> {
    try {
      const user = await userManager.signinRedirectCallback();
      return user;
    } catch (error) {
      console.error('Erreur lors du callback SSO:', error);
      return null;
    }
  }

  /**
   * Déconnexion SSO
   * Redirige vers Keycloak pour logout
   */
  async logout(): Promise<void> {
    try {
      await userManager.signoutRedirect();
    } catch (error) {
      console.error('Erreur lors de la déconnexion SSO:', error);
      // Nettoyage local même si Keycloak échoue
      await userManager.removeUser();
    }
  }

  /**
   * Récupérer l'utilisateur courant depuis le store
   */
  async getUser(): Promise<User | null> {
    try {
      return await userManager.getUser();
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer le access token JWT
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const user = await this.getUser();
      return user?.access_token || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getUser();
      return user !== null && !user.expired;
    } catch (error) {
      return false;
    }
  }

  /**
   * Renouveler silencieusement le token
   */
  async renewToken(): Promise<User | null> {
    try {
      return await userManager.signinSilent();
    } catch (error) {
      console.error('Erreur lors du renouvellement du token:', error);
      return null;
    }
  }

  /**
   * Supprimer l'utilisateur du store local
   */
  async removeUser(): Promise<void> {
    try {
      await userManager.removeUser();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    }
  }

  /**
   * Obtenir les infos utilisateur depuis le token
   */
  async getUserInfo(): Promise<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  } | null> {
    try {
      const user = await this.getUser();
      if (!user) return null;

      const profile = user.profile as KeycloakProfile;

      return {
        id: profile.sub || '',
        email: profile.email || '',
        firstName: profile.given_name,
        lastName: profile.family_name,
        roles: profile.realm_access?.roles || [],
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      return null;
    }
  }
}

export default new KeycloakService();

import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const REALM = process.env.KEYCLOAK_REALM || 'coffrefort';

/**
 * JWKS client pour récupérer les clés publiques de Keycloak
 * Utilise le cache pour éviter de fetcher à chaque requête
 */
export const jwksClient = jwksRsa({
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  cacheMaxEntries: 5,
});

/**
 * Fonction pour récupérer la clé de signature JWT
 * Utilisée par jwt.verify()
 */
export function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

/**
 * Configuration Keycloak pour le backend
 */
export const keycloakConfig = {
  realm: REALM,
  authServerUrl: KEYCLOAK_URL,
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'backend-service',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  publicKeyUrl: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
  issuer: `${KEYCLOAK_URL}/realms/${REALM}`,
};

/**
 * Interface pour les claims JWT Keycloak
 */
export interface KeycloakToken {
  sub: string; // User ID
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
  iss: string;
  exp: number;
  iat: number;
}

/**
 * Extraire le rôle principal depuis les rôles Keycloak
 * Priorité: admin > consultant > user
 */
export function extractRole(keycloakRoles: string[] = []): 'ADMIN' | 'CONSULTANT' | 'USER' {
  if (keycloakRoles.includes('admin')) return 'ADMIN';
  if (keycloakRoles.includes('consultant')) return 'CONSULTANT';
  return 'USER';
}

/**
 * Vérifier le token JWT Keycloak
 * Retourne une promesse avec le token décodé
 */
export function verifyKeycloakToken(token: string): Promise<KeycloakToken> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        issuer: keycloakConfig.issuer,
      },
      (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded as KeycloakToken);
      }
    );
  });
}

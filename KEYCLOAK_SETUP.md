# 🔐 Configuration Keycloak pour MayanConnect

## Vue d'ensemble

Keycloak est le serveur d'identité (IdP) centralisé pour MayanConnect. Il gère l'authentification SSO (Single Sign-On) et émet des tokens JWT pour l'accès au backend et à Mayan EDMS.

---

## 📋 Accès Keycloak

Après le démarrage avec `docker-compose up -d` :

- **URL Locale** : http://localhost:8080
- **URL Réseau** : http://<HOST_IP>:8080 (remplacer par l'IP détectée avec `./get-host-ip.sh`)
- **Admin Username** : `admin`
- **Admin Password** : `admin`

**Note** : Pour accès réseau, remplacez `localhost` par votre IP dans toutes les configurations ci-dessous.

---

## 🔧 Configuration Initiale

### 1. Créer le Realm `mayanconnect`

1. Connectez-vous à la console admin Keycloak
2. Cliquez sur le menu déroulant "Master" en haut à gauche
3. Cliquez sur **"Create Realm"**
4. Name : `mayanconnect`
5. Cliquez sur **"Create"**

### 2. Configuration du Realm

Dans Realm Settings :

#### **Login Tab**
- ✅ User registration : `ON` (optionnel, permet aux users de s'inscrire eux-mêmes)
- ✅ Forgot password : `ON`
- ✅ Remember me : `ON`

#### **Tokens Tab**
- Access Token Lifespan : `30 minutes`
- Access Token Lifespan For Implicit Flow : `15 minutes`
- Client login timeout : `30 minutes`
- Refresh Token Max Reuse : `0`

---

## 🎯 Créer les Clients

### Client 1: `frontend-app` (Public)

**Pour l'application React**

1. Allez dans **Clients** → **Create client**
2. Configuration :
   - Client type : `OpenID Connect`
   - Client ID : `frontend-app`
   - Name : `MayanConnect Frontend`
   - Description : `Application frontend React`
3. Cliquez sur **Next**
4. Capability config :
   - ✅ Client authentication : `OFF` (Public client)
   - ✅ Authorization : `OFF`
   - ✅ Standard flow : `ON`
   - ✅ Direct access grants : `ON`
5. Cliquez sur **Next**
6. Login settings :
   - Root URL : `http://localhost`
   - Valid redirect URIs :
     - `http://localhost/*`
     - `http://localhost:3000/*`
     - `http://<HOST_IP>/*` ⚠️ **Remplacez <HOST_IP> par votre IP réseau (ex: 10.17.14.203)**
   - Valid post logout redirect URIs :
     - `http://localhost/*`
     - `http://<HOST_IP>/*`
   - Web origins :
     - `http://localhost`
     - `http://localhost:3000`
     - `http://<HOST_IP>` ⚠️ **Ajoutez votre IP pour CORS**
7. Cliquez sur **Save**

### Client 2: `backend-service` (Confidential)

**Pour le backend Node.js**

1. Allez dans **Clients** → **Create client**
2. Configuration :
   - Client type : `OpenID Connect`
   - Client ID : `backend-service`
   - Name : `MayanConnect Backend`
   - Description : `Service backend Node.js`
3. Cliquez sur **Next**
4. Capability config :
   - ✅ Client authentication : `ON` (Confidential client)
   - ✅ Authorization : `OFF`
   - ✅ Standard flow : `ON`
   - ✅ Direct access grants : `ON`
   - ✅ Service accounts roles : `ON`
5. Cliquez sur **Next**
6. Login settings :
   - Root URL : `http://localhost:3001`
   - Valid redirect URIs : `http://localhost:3001/*`
   - Web origins : `http://localhost:3001`
7. Cliquez sur **Save**
8. Allez dans l'onglet **Credentials**
9. **Copiez le Client Secret** → Vous en aurez besoin pour le `.env`

### Client 3: `mayan-proxy` (Bearer-only)

**Pour le reverse proxy NGINX devant Mayan**

1. Allez dans **Clients** → **Create client**
2. Configuration :
   - Client type : `OpenID Connect`
   - Client ID : `mayan-proxy`
   - Name : `Mayan EDMS Proxy`
   - Description : `Reverse proxy NGINX pour Mayan`
3. Cliquez sur **Next**
4. Capability config :
   - ✅ Client authentication : `ON`
   - ✅ Authorization : `OFF`
   - ✅ Standard flow : `OFF`
   - ✅ Direct access grants : `OFF`
5. Cliquez sur **Save**
6. Dans Settings :
   - Access Type : `bearer-only`
7. Cliquez sur **Save**

---

## 👤 Créer les Rôles

### 1. Créer les Realm Roles

Allez dans **Realm roles** → **Create role**

#### Rôle : `admin`
- Role name : `admin`
- Description : `Administrateur - Accès complet au système`
- Cliquez sur **Save**

#### Rôle : `consultant`
- Role name : `consultant`
- Description : `Consultant - Accès permanent aux documents`
- Cliquez sur **Save**

#### Rôle : `user`
- Role name : `user`
- Description : `Utilisateur - Accès temporaire aux documents`
- Cliquez sur **Save**

### 2. Configurer le rôle par défaut

1. Allez dans **Realm settings** → **User registration** tab
2. Default roles : Ajoutez `user`
3. Cliquez sur **Save**

---

## 🗺️ Configurer les Role Mappers

Pour que les rôles soient inclus dans le JWT token :

### Pour le client `frontend-app`

1. Allez dans **Clients** → **frontend-app** → **Client scopes** tab
2. Cliquez sur **frontend-app-dedicated**
3. Allez dans **Mappers** tab
4. Cliquez sur **Add mapper** → **By configuration**
5. Sélectionnez **User Realm Role**
6. Configuration :
   - Name : `realm-roles`
   - Token Claim Name : `realm_access.roles`
   - Claim JSON Type : `String`
   - ✅ Add to ID token : `ON`
   - ✅ Add to access token : `ON`
   - ✅ Add to userinfo : `ON`
7. Cliquez sur **Save**

### Répéter pour le client `backend-service`

Même procédure que pour `frontend-app`.

---

## 🧑‍💼 Créer des Utilisateurs de Test

### Utilisateur Admin

1. Allez dans **Users** → **Add user**
2. Configuration :
   - Username : `admin@mayanconnect.com`
   - Email : `admin@mayanconnect.com`
   - First name : `Admin`
   - Last name : `System`
   - ✅ Email verified : `ON`
   - ✅ Enabled : `ON`
3. Cliquez sur **Create**
4. Allez dans l'onglet **Credentials**
5. Set password : `admin123`
6. ❌ Temporary : `OFF`
7. Cliquez sur **Save**
8. Allez dans l'onglet **Role mapping**
9. Cliquez sur **Assign role**
10. Sélectionnez `admin` et `consultant`
11. Cliquez sur **Assign**

### Utilisateur Consultant

1. **Users** → **Add user**
2. Configuration :
   - Username : `consultant@mayanconnect.com`
   - Email : `consultant@mayanconnect.com`
   - First name : `Jean`
   - Last name : `Consultant`
   - ✅ Email verified : `ON`
3. Cliquez sur **Create**
4. **Credentials** → Set password : `consultant123`
5. **Role mapping** → Assign role : `consultant`

### Utilisateur Standard

1. **Users** → **Add user**
2. Configuration :
   - Username : `user@mayanconnect.com`
   - Email : `user@mayanconnect.com`
   - First name : `Marie`
   - Last name : `Utilisateur`
   - ✅ Email verified : `ON`
3. Cliquez sur **Create**
4. **Credentials** → Set password : `user123`
5. **Role mapping** → Assign role : `user`

---

## 🔐 Configuration Backend (.env)

Ajoutez ces variables dans `/backend/.env` :

```env
# Keycloak OIDC
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=mayanconnect
KEYCLOAK_CLIENT_ID=backend-service
KEYCLOAK_CLIENT_SECRET=<COLLER_ICI_LE_CLIENT_SECRET>
```

Remplacez `<COLLER_ICI_LE_CLIENT_SECRET>` par le secret copié depuis Keycloak (Client backend-service → Credentials).

---

## 🎨 Configuration Frontend

Le frontend utilise les variables d'environnement build-time définies dans `docker-compose.yml` :

```yaml
args:
  VITE_KEYCLOAK_URL: http://${HOST_IP:-localhost}:8080
```

**Configuration automatique avec IP** :
1. Lancez `./get-host-ip.sh` pour détecter l'IP et mettre à jour `.env`
2. Rebuild le frontend : `docker-compose up -d --build frontend`
3. Le frontend utilisera automatiquement l'IP réseau pour Keycloak

Pas de configuration supplémentaire nécessaire.

---

## ✅ Vérification de la Configuration

### Test 1: Accéder à Keycloak

**Accès local** :
```bash
curl http://localhost:8080/realms/mayanconnect/.well-known/openid-configuration
```

**Accès réseau** :
```bash
# Remplacez 10.17.14.203 par votre IP détectée
curl http://10.17.14.203:8080/realms/mayanconnect/.well-known/openid-configuration
```

Doit retourner un JSON avec la configuration OIDC.

### Test 2: Vérifier les rôles dans le token

1. Connectez-vous via l'interface MayanConnect avec SSO
2. Inspectez le token JWT sur https://jwt.io
3. Vérifiez que `realm_access.roles` contient les rôles assignés

### Test 3: Backend accepte le token

```bash
# Récupérer un token (remplacer admin@... et admin123 par vos credentials)
TOKEN=$(curl -X POST "http://localhost:8080/realms/mayanconnect/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@mayanconnect.com" \
  -d "password=admin123" \
  -d "grant_type=password" \
  -d "client_id=frontend-app" | jq -r '.access_token')

# Tester l'API backend
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/auth/me
```

Doit retourner les informations utilisateur.

---

## 🚀 Flux SSO Complet

```
1. User clique "Se connecter avec SSO" dans MayanConnect
   ↓
2. Redirection vers Keycloak (/realms/mayanconnect/protocol/openid-connect/auth)
   ↓
3. User s'authentifie avec email/password
   ↓
4. Keycloak redirige vers /callback avec code
   ↓
5. Frontend échange le code contre un JWT token
   ↓
6. Token stocké dans localStorage
   ↓
7. Toutes les requêtes incluent le token dans Authorization: Bearer
   ↓
8. Backend vérifie le token avec les clés publiques Keycloak
   ↓
9. NGINX proxy vérifie le token avant de forward vers Mayan
```

---

## 🔧 Dépannage

### Problème : "Invalid redirect URI"
**Solution** : Vérifiez que `http://localhost/callback` est dans les Valid redirect URIs du client frontend-app.

### Problème : "Token invalide"
**Solution** :
1. Vérifiez que KEYCLOAK_URL est correct dans le backend
2. Vérifiez que l'horloge du serveur est synchronisée
3. Regénérez le client secret si nécessaire

### Problème : "Roles manquants dans le token"
**Solution** : Vérifiez que les role mappers sont correctement configurés dans les client scopes.

### Problème : "CORS error"
**Solution** : Ajoutez les Web origins dans la configuration du client (http://localhost, http://localhost:3000).

---

## 📊 Architecture des Tokens

### Access Token (JWT)
- **Durée** : 30 minutes
- **Usage** : API backend + Mayan proxy
- **Claims** : sub, email, realm_access.roles, given_name, family_name

### Refresh Token
- **Durée** : 30 jours
- **Usage** : Renouveler l'access token sans re-login
- **Storage** : localStorage (géré par oidc-client-ts)

---

## 🎯 Production Checklist

Pour déployer en production :

- [ ] Changer le mot de passe admin Keycloak
- [ ] Configurer HTTPS pour Keycloak
- [ ] Utiliser une base de données externe (pas PostgreSQL en container)
- [ ] Configurer les hostnames corrects dans Valid redirect URIs
- [ ] Activer le rate limiting
- [ ] Configurer les email SMTP pour reset password
- [ ] Activer l'authentification multi-facteurs (MFA)
- [ ] Configurer les logs et monitoring
- [ ] Backup régulier de la base Keycloak

---

**🎉 Configuration Keycloak terminée !** Vous pouvez maintenant utiliser l'authentification SSO dans MayanConnect.

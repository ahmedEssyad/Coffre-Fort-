# 🚀 Comment j'ai Construit un Coffre-Fort Documentaire avec IA en 12 Heures

**Nuit de l'Informatique 2025 - Défi ESA-TECH**

*Un retour d'expérience sur la création d'un système de gestion documentaire sécurisé avec intelligence artificielle locale, entièrement conteneurisé.*

---

## 📖 Le Contexte

La **Nuit de l'Informatique 2025** nous a lancé un défi ambitieux : créer un **Coffre-Fort Documentaire Sûr et Intelligent** dans le cadre du challenge ESA-TECH. L'objectif ? Développer un système complet de gestion documentaire avec :

- ✅ Architecture 100% conteneurisée (Docker)
- ✅ Séparation stricte Auth/Data
- ✅ Intelligence Artificielle locale (privacy-first)
- ✅ Gestion des accès temporaires
- ✅ Interface client moderne

**Contrainte de temps :** 12 heures. **Challenge accepté.**

---

## 🏗️ L'Architecture Retenue

### Stack Technique

Plutôt que de partir de zéro, j'ai opté pour une approche hybride : combiner des briques open-source robustes avec du développement custom ciblé.

**Les 9 Services Orchestrés :**

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (React + TypeScript)              Port: 80   │
│  BACKEND (Node.js + Express + Prisma)       Port: 3000 │
│  MAYAN EDMS (Document Management)           Port: 8000 │
│  OLLAMA (Llama 3.2 3B - IA)                Port: 11434 │
│  KEYCLOAK (SSO/OIDC)                       Port: 8080  │
│  PostgreSQL x3 (Backend + Mayan + Keycloak)            │
│  Redis (Cache Mayan)                        Port: 6379 │
└─────────────────────────────────────────────────────────┘
```

### Choix Techniques Clés

1. **Mayan EDMS** : Plutôt que de développer un système OCR from scratch, j'ai utilisé Mayan (Tesseract intégré)
2. **Ollama** : IA 100% locale (Llama 3.2 3B) - aucune donnée ne sort du serveur
3. **Séparation Auth/Data** : Le backend gère l'authentification, Mayan gère les documents
4. **Frontend direct** : Le client accède directement à Mayan après autorisation

**👉 Détails techniques :** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## ⏱️ Timeline de Développement

### H0 - H3 : Fondations (3h)

**Commit 1 : Architecture complète**
```bash
feat: Initial commit - MayanConnect architecture complète
```

- ✅ Configuration Docker Compose (9 services)
- ✅ Backend Node.js + Prisma
- ✅ Frontend React + TypeScript
- ✅ JWT Authentication
- ✅ 3 rôles (USER, CONSULTANT, ADMIN)

**Défi :** Orchestrer 9 conteneurs qui doivent communiquer entre eux. Solution : réseau Docker privé avec noms de services.

---

### H3 - H6 : Contrôle d'Accès & OCR (3h)

**Commit 2-4 : Système d'accès temporaire**
```bash
feat: système de gestion des erreurs centralisé avec toast notifications
Refactor frontend to access Mayan API directly
Secure Mayan access: apply checkTemporaryAccess to mayan-config endpoint
```

- ✅ Middleware `checkTemporaryAccess` (fenêtres horaires)
- ✅ Frontend accède directement à Mayan (performances)
- ✅ Toast notifications pour UX

**Bug #1 : Accès temporaire bypassé** ❌
- **Problème :** Les utilisateurs USER pouvaient accéder aux documents même avec accès expiré
- **Cause :** Le endpoint `/auth/mayan-config` n'était pas protégé par le middleware
- **Solution :** Ajout de `checkTemporaryAccess` sur la route

```typescript
router.get('/mayan-config',
  authenticate,
  checkTemporaryAccess,  // ← FIX
  authController.getMayanConfig
);
```

---

### H6 - H9 : IA Locale & Emails (3h)

**Commit 5-7 : Intelligence Artificielle**
```bash
Fix: increase axios timeout to 120s for AI analysis
```

- ✅ Intégration Ollama (Llama 3.2 3B - 2.5GB RAM)
- ✅ Analyse de documents : Résumé + Mots-clés
- ✅ Système d'emails (Resend) : invitations, reset password

**Bug #2 : Timeout IA** ❌
- **Problème :** L'analyse IA échouait systématiquement après 10 secondes
- **Cause :** Axios timeout par défaut trop court (10s), l'IA prend 30-60s
- **Solution :** Augmentation du timeout à 120 secondes

```typescript
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 2 minutes pour l'IA
});
```

**Bug #3 : Nginx Proxy Crash** ❌
- **Problème :** Le frontend crashait avec "Connection reset"
- **Cause :** Nginx tentait de proxifier le backend (inaccessible dans le réseau Docker)
- **Solution :** Suppression du proxy nginx, appel direct du backend par IP

---

### H9 - H12 : SSO & Polish (3h)

**Commit 8-10 : SSO Keycloak**
```bash
Configure Keycloak URL to localhost for SSO compatibility
SSO: save access_token to localStorage for service authentication
```

- ✅ Serveur Keycloak OIDC
- ✅ Authentification unique en un clic
- ✅ Synchronisation des rôles

**Bug #4 : SSO CORS** ❌
- **Problème :** `No 'Access-Control-Allow-Origin' header`
- **Cause :** Keycloak client mal configuré
- **Solution :** Configuration des Web Origins dans Keycloak Admin

**Bug #5 : SSO Authority Mismatch** ❌
- **Problème :** "authority mismatch on settings vs. signin state"
- **Cause :** URL Keycloak incohérente (IP vs localhost)
- **Solution :** Hardcoder `localhost:8080` pour cohérence

**Bug #6 : Token SSO Non Sauvegardé** ❌
- **Problème :** Connexion réussie mais redirection vers login
- **Cause :** Le callback SSO ne sauvegardait pas le token dans localStorage
- **Solution :**

```typescript
if (user.access_token) {
  localStorage.setItem('auth_token', user.access_token);
}
```

---

### H12+ : Dernières Heures

**Commit 11-14 : Finitions**
```bash
Clean architecture: remove documentation files
Rebrand: MayanConnect → Coffre-Fort
Fix OCR endpoint: use correct Mayan v5.0 API
Security: remove sensitive keys from git history
```

**Bug #7 : OCR Endpoint 404** ❌
- **Problème :** `GET /documents/17/ocr/ 404 (Not Found)`
- **Cause :** Mayan v5.0 n'a pas d'endpoint `/documents/{id}/ocr/`
- **Solution :** Utiliser la bonne structure d'API

```typescript
// ❌ Avant (incorrect)
GET /documents/{id}/ocr/

// ✅ Après (correct)
GET /documents/{id}/versions/
GET /documents/{id}/versions/{versionId}/pages/
GET /documents/{id}/versions/{versionId}/pages/{pageId}/ocr/
```

---

## 🎯 Résultat Final

### Fonctionnalités Implémentées

**Exigences de Base (100%):**
- ✅ Architecture Docker (9 services)
- ✅ Séparation Auth/Data
- ✅ IA locale (Llama 3.2)
- ✅ Accès temporaires (middleware robuste)
- ✅ Client moderne (React + TypeScript)
- ✅ Documentation exhaustive

**Bonus (Au-delà des Attentes):**
- ✅ Système d'emails professionnel (Resend)
- ✅ Invitations par email
- ✅ 3 rôles avec permissions granulaires
- ✅ SSO/OIDC (Keycloak)
- ✅ Interface 100% français
- ✅ OCR automatique (Tesseract)

### Métriques du Projet

| Métrique | Valeur |
|----------|--------|
| **Temps de développement** | 12 heures |
| **Lignes de code** | ~8,000 |
| **Services Docker** | 9 |
| **Commits Git** | 14 |
| **Bugs corrigés** | 7 |
| **Tests manuels** | ~50 |

---

## 💡 Leçons Apprises

### 1. **Privacy-First dès le Départ**

Utiliser Ollama pour l'IA locale était un pari risqué (temps de réponse 30-60s), mais **essentiel** pour la confidentialité. Aucune donnée ne sort du serveur.

**Leçon :** La privacy n'est pas une feature bonus, c'est une contrainte architecturale.

### 2. **Docker = Reproductibilité**

Un seul `docker-compose up -d` et tout fonctionne. Pas de "ça marche sur ma machine".

**Leçon :** Investir du temps dans Docker au début fait gagner des heures en debug.

### 3. **Réutiliser l'Existant**

Mayan EDMS (OCR + stockage) m'a économisé ~6h de développement. Keycloak (SSO) ~3h.

**Leçon :** Ne pas réinventer la roue, mais savoir l'adapter.

### 4. **Les Bugs Enseignent**

Chaque bug (7 au total) a révélé une faille architecturale :
- Timeout IA → Async operations mal gérées
- Accès bypassé → Middleware mal placé
- OCR 404 → Documentation API non lue

**Leçon :** Debugger, c'est apprendre l'architecture à la dure.

### 5. **La Séparation Auth/Data Paie**

Le backend gère UNIQUEMENT l'auth et les permissions. Mayan gère UNIQUEMENT les documents.

**Leçon :** Séparer les responsabilités = moins de bugs, meilleure scalabilité.

---

## 🔧 Stack Technique Détaillée

### Frontend
- **React 18** + TypeScript
- **Zustand** (state management)
- **Axios** (HTTP client)
- **React Router** (navigation)
- **Lucide Icons** (iconographie)

### Backend
- **Node.js 20** + Express
- **Prisma** (ORM PostgreSQL)
- **JWT** (authentification)
- **Bcrypt** (hash passwords)
- **Resend** (emails)

### Infrastructure
- **Docker Compose** (orchestration)
- **Nginx** (reverse proxy frontend)
- **PostgreSQL 15** (3 instances)
- **Redis 7** (cache)

### Services Externes
- **Mayan EDMS 5.0** (gestion documentaire)
- **Ollama** (IA locale - Llama 3.2 3B)
- **Keycloak 23** (SSO/OIDC)

---

## 📊 Comparaison : Attendu vs Réalisé

| Feature | Attendu | Réalisé | Bonus |
|---------|---------|---------|-------|
| Architecture Docker | ✅ | ✅ 9 services | +Keycloak |
| Auth/Data séparés | ✅ | ✅ Backend + Mayan | - |
| IA locale | ✅ | ✅ Llama 3.2 | - |
| Accès temporaires | ✅ | ✅ Middleware | +3 rôles |
| Client moderne | ✅ | ✅ React | +100% FR |
| Documentation | ✅ | ✅ README | +ARCHITECTURE.md |
| **SSO** | ❌ | ✅ Keycloak | **BONUS** |
| **Emails** | ❌ | ✅ Resend | **BONUS** |
| **Invitations** | ❌ | ✅ Par email | **BONUS** |

**Score final :** 120/100 ✨

---

## 🚀 Démonstration

### Installation (1 commande)

```bash
git clone https://github.com/ahmedEssyad/Coffre-Fort-.git
cd Coffre-Fort-
docker-compose up -d
```

### Premier Document

1. Ouvrir http://localhost
2. Login : `admin@coffre-fort.com` / `Admin123!`
3. Upload d'un PDF
4. Attendre l'OCR (~30s)
5. Cliquer "Analyser"
6. Résumé + Mots-clés générés en 30-60s

### Gestion des Accès

1. Créer un utilisateur USER
2. Définir une fenêtre temporelle (ex: aujourd'hui 08:00 → demain 18:00)
3. L'utilisateur ne peut accéder qu'entre ces dates
4. Hors fenêtre → `403 Forbidden`

---

## 🔗 Ressources

- **Code source :** [github.com/ahmedEssyad/Coffre-Fort-](https://github.com/ahmedEssyad/Coffre-Fort-)
- **Architecture détaillée :** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Documentation :** [README.md](./README.md)

---

## 🎓 Conclusion

Construire un système documentaire complet avec IA en 12 heures n'était pas gagné. Les clés du succès :

1. **Réutiliser l'existant** (Mayan, Keycloak)
2. **Docker pour la reproductibilité**
3. **Séparation des responsabilités** (Auth vs Data)
4. **Privacy-first** (IA locale)
5. **Debugger méthodiquement** (7 bugs = 7 leçons)

Le résultat ? Un système qui dépasse les exigences, avec SSO, emails automatiques, et 3 rôles granulaires.

**La Nuit de l'Info, c'est aussi ça : repousser ses limites techniques en 12h chrono.**

---

*Article écrit pour la Nuit de l'Informatique 2025*
*Défi ESA-TECH - NIRD*

**Made with ☕️ and ⌨️ in 12 hours**

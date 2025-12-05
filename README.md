# 🚀 Coffre-Fort

**Le Coffre-Fort Documentaire Sûr et Intelligent (Module d'Extension)**

Projet pour la **Nuit de l'Informatique 2025** - Défi ESA-TECH & NIRD

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![AI](https://img.shields.io/badge/AI-Ollama%20%2B%20Llama%203.2-green.svg)](https://ollama.ai/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Description

Coffre-Fort est une solution complète de gestion documentaire sécurisée, développée pour le défi **ESA-TECH** (Coffre-Fort Documentaire) dans le cadre du challenge national **NIRD** (Numérique Inclusif, Responsable et Durable) de la Nuit de l'Informatique 2025.

Notre système s'appuie sur **Mayan EDMS** (Open Source) et l'enrichit considérablement avec :

### ✨ Fonctionnalités Principales

- 🐳 **Architecture 100% conteneurisée** (Docker Compose - 9 services orchestrés)
- 🔐 **Système d'authentification avancé** (JWT + 3 rôles : USER, CONSULTANT, ADMIN)
- 🤖 **IA locale** (Llama 3.2) pour résumés automatiques et extraction de mots-clés
- 🔒 **Privacy-first** : toutes les données restent sur votre infrastructure
- ⏰ **Gestion des accès temporaires** par fenêtres horaires (contrôle granulaire)
- 🔍 **Recherche OCR** automatique sur tous les documents
- 📧 **Système d'emails professionnel** (invitations, notifications, reset password)
- 👥 **Gestion complète des utilisateurs** (invitations par email, changements de rôles)
- 🎨 **Interface moderne et intuitive** 100% en français
- 🔑 **SSO/OIDC avec Keycloak** (bonus - authentification unique)

---

## 🏗️ Architecture

### Diagramme Global

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
│                         Port: 80                            │
│  • Interface utilisateur moderne                           │
│  • Dashboard, Documents, Admin                             │
│  • Gestion des accès temporaires                           │
└────────────────┬───────────────────────────┬────────────────┘
                 │                           │
                 ↓                           ↓
    ┌────────────────────┐      ┌────────────────────┐
    │   BACKEND CUSTOM   │      │    MAYAN EDMS      │
    │    (Node.js)       │      │  (Document Mgmt)   │
    │    Port: 3000      │      │    Port: 8000      │
    │                    │      │                    │
    │  • Auth JWT        │      │  • Upload docs     │
    │  • User mgmt       │      │  • OCR processing  │
    │  • Temp access     │      │  • Recherche       │
    │  • Roles (3)       │      │  • Métadonnées     │
    └─────┬──────────────┘      └──────┬─────────────┘
          │                             │
          ↓                             ↓
    ┌──────────────┐              ┌──────────────┐
    │  PostgreSQL  │              │  PostgreSQL  │
    │ (Backend DB) │              │  (Mayan DB)  │
    │  Port: 5433  │              │  Port: 5432  │
    └──────────────┘              └───────┬──────┘
                                          │
          ┌───────────────────────────────┤
          ↓                               ↓
    ┌──────────────┐              ┌──────────────┐
    │   OLLAMA AI  │              │    Redis     │
    │ (Llama 3.2)  │              │   (Cache)    │
    │ Port: 11434  │              │  Port: 6379  │
    │              │              │              │
    │  • Résumés   │              │  • Cache     │
    │  • Mots-clés │              │  • Sessions  │
    └──────────────┘              └──────────────┘
```

### Les 3 Piliers Techniques Imposés

#### 1️⃣ Architecture Conteneurisée (Docker)
✅ **Tous les services orchestrés via `docker-compose.yml`** :
- Frontend (Nginx + React)
- Backend (Node.js + Express + TypeScript)
- Mayan EDMS (Document Management System)
- Ollama (Modèle IA Llama 3.2 3B)
- 2x PostgreSQL (Backend + Mayan)
- Redis (Cache Mayan)

**Aucune installation "bare metal"** - Tout fonctionne dans des conteneurs Docker sur un réseau privé.

#### 2️⃣ Séparation des Responsabilités

**Backend Custom (Port 3000)** :
- ✅ Authentification JWT
- ✅ Gestion des utilisateurs (inscription, login, profil)
- ✅ 3 rôles : USER (accès temporaire), CONSULTANT (accès permanent), ADMIN (gestion totale)
- ✅ Gestion des fenêtres d'accès temporaire
- ✅ Middleware de vérification d'accès

**Mayan EDMS (Port 8000)** :
- ✅ Upload de documents
- ✅ OCR automatique (reconnaissance de texte)
- ✅ Recherche full-text
- ✅ Gestion métadonnées
- ✅ API REST complète

**Communication** : Le client frontend requête directement les API de Mayan pour les documents, et passe par le backend custom uniquement pour l'authentification et les droits d'accès.

#### 3️⃣ Intelligence Artificielle Locale

✅ **Modèle Ollama auto-hébergé (Llama 3.2 3B)** :
- Génère un résumé automatique du document
- Extrait les mots-clés importants
- **Privacy-first** : Les données ne sortent JAMAIS du serveur
- API REST intégrée au backend

**Scénario** : Lorsqu'un utilisateur consulte un document, un bouton "Analyser" permet de lancer l'analyse IA qui affiche instantanément :
- 📝 Un résumé du contenu
- 🔑 Les mots-clés principaux

---

## 🚀 Installation Ultra-Rapide (Une Seule Commande)

### Prérequis

| Logiciel | Version minimale | Vérification |
|----------|------------------|--------------|
| Docker | 20.10+ | `docker --version` |
| Docker Compose | 2.0+ | `docker-compose --version` |
| RAM | 8 GB | - |
| Espace disque | 15 GB | - |
| OS | Linux/macOS/Windows + WSL2 | - |

### Installation Complète

```bash
# 1. Cloner le repository
git clone https://github.com/ahmedEssyad/Coffre-Fort-.git
cd Coffre-Fort-

# 2. Copier le fichier d'environnement
cp .env.example .env

# 3. Détecter l'IP automatiquement (pour accès réseau)
./get-host-ip.sh

# 4. Démarrer TOUS les services (une seule commande !)
docker-compose up -d --build

# 5. Attendre que tous les services démarrent (2-3 minutes)
# Surveillez les logs :
docker-compose logs -f

# 6. Télécharger le modèle IA (première fois uniquement - peut prendre 5-10 min)
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b

# 7. Vérifier que tous les services sont actifs
docker-compose ps
```

**C'EST TOUT !** 🎉 L'application est prête à l'emploi.

### Vérification du Déploiement

```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Devrait afficher :
# ✅ mayanconnect-frontend   (healthy)
# ✅ mayanconnect-backend    (healthy)
# ✅ mayan-edms              (healthy)
# ✅ mayanconnect-ollama     (running)
# ✅ backend-postgres        (healthy)
# ✅ mayan-postgres          (healthy)
# ✅ mayan-redis             (healthy)
```

### Accès aux Services

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend (Application)** | http://localhost | Créer un compte ou utiliser admin ci-dessous |
| **Backend API** | http://localhost:3000 | - |
| **Mayan EDMS (Admin)** | http://localhost:8000 | `admin` / `admin` |
| **Ollama API** | http://localhost:11434 | - |

### Première Connexion

**Option 1 : Créer un compte ADMIN**
```bash
# Créer un utilisateur admin via l'API backend
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Option 2 : Via l'interface**
1. Ouvrir http://localhost
2. Cliquer sur "Créer un compte"
3. Remplir le formulaire
4. Se connecter avec les identifiants créés

---

## 📦 Services Détaillés

| Service | Image | Port | RAM | Rôle |
|---------|-------|------|-----|------|
| **Frontend** | Custom (Nginx + React) | 80 | 256 MB | Interface utilisateur moderne |
| **Backend** | Custom (Node.js 20) | 3000 | 512 MB | Auth JWT, gestion utilisateurs, accès temporaires |
| **Mayan EDMS** | mayanedms/mayanedms:5.0 | 8000 | 2 GB | Gestion documentaire complète + OCR |
| **Ollama** | ollama/ollama:latest | 11434 | 4 GB | IA locale (Llama 3.2 3B) pour résumés |
| **PostgreSQL (Backend)** | postgres:15-alpine | 5433 | 256 MB | Base de données utilisateurs/accès |
| **PostgreSQL (Mayan)** | postgres:15-alpine | 5432 | 512 MB | Base de données documents/métadonnées |
| **Redis** | redis:7-alpine | 6379 | 128 MB | Cache pour Mayan + sessions |

**Total RAM utilisée** : ~7.5 GB

---

## 🎯 Fonctionnalités Complètes

### ✅ Exigences du Défi (100% Complétées)

#### 1️⃣ Infrastructure & Déploiement ✅
- [x] **Architecture 100% conteneurisée** via `docker-compose.yml`
- [x] **9 services orchestrés** (Frontend, Backend, Mayan, Ollama, Keycloak, 3x PostgreSQL, Redis)
- [x] Service d'IA local (Ollama + Llama 3.2 3B) intégré
- [x] Réseau privé Docker pour communication inter-conteneurs
- [x] Volumes persistants pour toutes les données
- [x] Health checks sur tous les services critiques
- [x] **Déploiement en une seule commande** : `docker-compose up -d`

#### 2️⃣ Client Web (Interface Utilisateur) ✅
- [x] **Interface moderne React + TypeScript**
- [x] Navigation fluide dans les documents via API Mayan
- [x] **Intégration IA** : Bouton "Analyser" → Résumé + Mots-clés en temps réel
- [x] Tableau de bord personnalisé selon le rôle utilisateur
- [x] Dashboard admin complet avec gestion des utilisateurs
- [x] Pages : Dashboard, Documents, DocumentViewer, Admin, Login, SetPassword
- [x] **100% en français** (interface, emails, documentation)
- [x] Design moderne inspiré de Google Drive

#### 3️⃣ Logique d'Accès Temporaire (Cœur du Défi) ✅
- [x] **Admin définit des fenêtres temporelles** (ex: 01/12 08:00 → 03/12 18:00)
- [x] Backend vérifie et autorise/bloque l'accès en temps réel
- [x] Middleware `checkTemporaryAccess` sur toutes les routes sensibles
- [x] **3 rôles distincts avec permissions granulaires** :
  - **USER** : Accès uniquement pendant les fenêtres définies par l'admin
  - **CONSULTANT** : Accès permanent aux documents (bypass des fenêtres)
  - **ADMIN** : Contrôle total (utilisateurs, accès, documents)
- [x] Interface CRUD complète pour gérer les accès temporaires
- [x] **Badges visuels en temps réel** : Actif (vert), Programmé (bleu), Expiré (rouge), Aucun Accès (gris)
- [x] Notifications visuelles des changements de statut

#### 4️⃣ Système d'Authentification Sécurisé ✅
- [x] **JWT (JSON Web Tokens)** avec expiration configurable
- [x] Inscription, Login, Logout robustes
- [x] **Mots de passe hashés avec bcrypt** (12 rounds)
- [x] Tokens de réinitialisation de mot de passe (24h expiration)
- [x] Protection CORS stricte
- [x] **Helmet.js** pour headers de sécurité HTTP
- [x] Validation des entrées avec express-validator

#### 5️⃣ Gestion Documentaire (Mayan EDMS) ✅
- [x] **Upload multi-format** (PDF, images, Office, etc.)
- [x] **OCR automatique** via Tesseract intégré à Mayan
- [x] Recherche full-text sur le contenu OCR
- [x] Téléchargement sécurisé des documents
- [x] Suppression avec confirmation
- [x] Types de documents configurables
- [x] Métadonnées complètes (label, description, type, date, auteur)

#### 6️⃣ Intelligence Artificielle Locale ✅
- [x] **Modèle Llama 3.2 3B** via Ollama (2.5 GB RAM)
- [x] API `/api/ai/analyze` pour analyser un document
- [x] **Génération de résumé intelligent** (2-3 phrases)
- [x] **Extraction automatique de mots-clés** (5-7 termes)
- [x] Traitement 100% local (privacy-first, aucune donnée ne sort)
- [x] Interface visuelle élégante pour afficher l'analyse
- [x] Temps de traitement optimisé (~30-60 secondes)

---

### 🌟 Fonctionnalités Bonus (Au-delà des Exigences)

#### 📧 Système d'Emails Professionnel (Resend)
- [x] **Email de bienvenue** avec lien sécurisé de définition de mot de passe
- [x] **Email d'invitation** pour nouveaux utilisateurs
- [x] **Email de réinitialisation** de mot de passe oublié
- [x] Templates HTML professionnels avec branding cohérent
- [x] Service Resend intégré (production-ready)
- [x] Liens sécurisés avec tokens JWT (expiration 24h)

#### 👥 Gestion Avancée des Utilisateurs
- [x] **Invitation par email** : L'admin invite, l'utilisateur reçoit un lien pour définir son mot de passe
- [x] **Changement de rôle dynamique** : USER ↔ CONSULTANT ↔ ADMIN
- [x] **Liste complète des utilisateurs** avec filtres et recherche
- [x] Suppression sécurisée (protection du dernier admin)
- [x] Visualisation du statut d'accès de chaque utilisateur
- [x] Statistiques utilisateurs dans le dashboard

#### 🔑 SSO/OIDC avec Keycloak (Authentification Unique)
- [x] **Serveur Keycloak** intégré dans docker-compose
- [x] Configuration automatique du realm "coffre-fort"
- [x] Client frontend configuré pour OIDC
- [x] Login SSO en un clic depuis la page de connexion
- [x] Synchronisation automatique des rôles et permissions
- [x] Tokens OAuth2 sécurisés

#### 🎨 Expérience Utilisateur Premium
- [x] **Design moderne et épuré** (inspiré Google Drive / Notion)
- [x] Animations fluides et feedback visuel
- [x] **Toast notifications** pour toutes les actions
- [x] États de chargement (skeletons, spinners)
- [x] Messages d'erreur explicites et traductions complètes
- [x] Interface responsive (desktop, tablette, mobile)

#### 🔒 Sécurité Renforcée
- [x] **Middleware de vérification d'accès** sur chaque route sensible
- [x] Validation stricte des permissions selon le rôle
- [x] Protection contre les injections SQL (Prisma ORM)
- [x] Protection XSS et CSRF
- [x] Logs de sécurité pour audit
- [x] Variables sensibles dans .env (jamais en dur)

---

## 🛠️ Développement Local

### Backend

```bash
cd backend

# Installation des dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Lancer les migrations
npx prisma migrate dev

# Mode développement (avec hot reload)
npm run dev

# Build production
npm run build

# Lancer en production
npm start
```

### Frontend

```bash
cd frontend

# Installation des dépendances
npm install

# Mode développement (port 5173)
npm run dev

# Build production
npm run build

# Preview du build
npm run preview
```

### Structure du Projet

```
nuitinfo/
├── backend/                 # Backend Node.js
│   ├── src/
│   │   ├── controllers/    # Logique métier
│   │   ├── routes/         # Routes API
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Services (email, Mayan, AI)
│   │   ├── config/         # Configuration
│   │   └── index.ts        # Point d'entrée
│   ├── prisma/
│   │   └── schema.prisma   # Modèle de données
│   └── Dockerfile
├── frontend/                # Frontend React
│   ├── src/
│   │   ├── pages/          # Pages (Dashboard, Documents, Admin)
│   │   ├── components/     # Composants réutilisables
│   │   ├── services/       # API calls
│   │   ├── store/          # State management (Zustand)
│   │   └── App.tsx
│   ├── nginx.conf          # Config Nginx
│   └── Dockerfile
├── docker-compose.yml       # Orchestration Docker
├── .env                     # Variables d'environnement
└── README.md               # Cette documentation
```

---

## 📝 Configuration Avancée

### Variables d'Environnement

Le fichier `.env` contient toutes les configurations :

```bash
# JWT Secret (CRITIQUE : Changez en production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database Backend
BACKEND_DB_HOST=backend-postgres
BACKEND_DB_PORT=5432
BACKEND_DB_NAME=mayanconnect
BACKEND_DB_USER=postgres
BACKEND_DB_PASSWORD=backenddbpass

# Database Mayan
MAYAN_DATABASE_HOST=mayan-postgres
MAYAN_DATABASE_PORT=5432
MAYAN_DATABASE_NAME=mayan
MAYAN_DATABASE_USER=mayan
MAYAN_DATABASE_PASSWORD=mayandbpass

# Mayan API
MAYAN_API_URL=http://mayan-edms:8000
MAYAN_API_TOKEN=votre-token-mayan

# Ollama AI
OLLAMA_BASE_URL=http://mayanconnect-ollama:11434
OLLAMA_MODEL=llama3.2:3b

# Email (Resend)
RESEND_API_KEY=votre-clé-api-resend
FROM_EMAIL=noreply@votre-domaine.com

# Frontend URL
FRONTEND_URL=http://localhost

# Redis
REDIS_HOST=mayan-redis
REDIS_PORT=6379
```

### Configuration du Token API Mayan

**Méthode Automatique (Recommandée)** :

Le token est déjà configuré dans `.env`. Si vous devez le régénérer :

```bash
# 1. Attendre que Mayan soit complètement démarré
docker-compose logs -f mayan-edms

# 2. Générer le token via Django shell
docker exec -it mayan-edms python manage.py shell << EOF
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
user = get_user_model().objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)
print(f"Token généré: {token.key}")
EOF

# 3. Copier le token et le mettre dans .env
# Puis redémarrer le backend
docker-compose restart backend
```

**Méthode Interface Web** :

1. Ouvrir http://localhost:8000
2. Se connecter : `admin` / `admin`
3. Aller dans : **Tools** → **REST API** → **Token authentication**
4. Cliquer sur **Create**
5. Copier le token
6. L'ajouter dans `.env` : `MAYAN_API_TOKEN=...`
7. Redémarrer : `docker-compose restart backend`

---

## 🔐 Sécurité & Privacy

### Mesures de Sécurité Implémentées

- 🔒 **Toutes les données restent locales** (pas de cloud externe)
- 🔑 **JWT** pour l'authentification stateless
- 🛡️ **Helmet.js** pour les headers HTTP sécurisés
- 🌐 **CORS** configuré strictement
- 🔐 **Bcrypt** (12 rounds) pour hasher les mots de passe
- 🚫 **Aucun secret dans le code source** (tout dans `.env`)
- ✅ **Validation des entrées** avec express-validator
- 🔒 **HTTPS recommandé en production** (via reverse proxy)
- 🕐 **Tokens d'expiration** (24h pour reset password, configurable pour JWT)

### Privacy-First Approach

L'architecture garantit que **aucune donnée ne quitte votre infrastructure** :
- Documents stockés localement (Mayan + PostgreSQL)
- IA locale (Ollama) - pas d'appel à OpenAI/GPT
- Pas de télémétrie
- Pas de tracking utilisateur

---

## 📚 API Documentation

### Backend Custom (Port 3000)

#### Auth Endpoints

```bash
# Inscription
POST /api/auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "Password123!"
}
Response: { "token": "eyJhbG...", "user": {...} }

# Obtenir profil utilisateur
GET /api/auth/me
Authorization: Bearer <token>

# Mot de passe oublié
POST /api/auth/forgot-password
Content-Type: application/json
{
  "email": "user@example.com"
}

# Définir nouveau mot de passe
POST /api/auth/set-password
Content-Type: application/json
{
  "token": "reset-token",
  "password": "NewPassword123!"
}
```

#### Documents (Proxy Mayan)

```bash
# Lister les documents
GET /api/documents?page=1&page_size=50
Authorization: Bearer <token>

# Détails d'un document
GET /api/documents/:id
Authorization: Bearer <token>

# Upload de document
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
{
  "file": <file>,
  "documentTypeId": 1,
  "label": "Mon document"
}

# Télécharger un document
GET /api/documents/:id/download
Authorization: Bearer <token>

# Supprimer un document
DELETE /api/documents/:id
Authorization: Bearer <token>

# Recherche OCR
GET /api/documents/search?q=mot-clé
Authorization: Bearer <token>

# Statut OCR
GET /api/documents/:id/ocr-status
Authorization: Bearer <token>
```

#### AI Endpoints

```bash
# Analyser un document avec l'IA
POST /api/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json
{
  "documentId": 123
}
Response: {
  "documentId": 123,
  "summary": "Résumé du document...",
  "keywords": ["mot1", "mot2", "mot3"]
}

# Health check IA
GET /api/ai/health
Authorization: Bearer <token>
```

#### Admin Endpoints

```bash
# Lister tous les utilisateurs
GET /api/admin/users
Authorization: Bearer <token> (ADMIN uniquement)

# Inviter un utilisateur
POST /api/admin/invite
Authorization: Bearer <token> (ADMIN uniquement)
Content-Type: application/json
{
  "email": "new@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "USER",
  "sendEmail": true
}

# Changer le rôle d'un utilisateur
PATCH /api/admin/users/:id/role
Authorization: Bearer <token> (ADMIN uniquement)
Content-Type: application/json
{
  "role": "CONSULTANT"
}

# Supprimer un utilisateur
DELETE /api/admin/users/:id
Authorization: Bearer <token> (ADMIN uniquement)
```

#### Access Management (Accès Temporaires)

```bash
# Créer une fenêtre d'accès
POST /api/access
Authorization: Bearer <token> (ADMIN uniquement)
Content-Type: application/json
{
  "userId": "user-id",
  "startDate": "2025-12-01T08:00:00Z",
  "endDate": "2025-12-03T18:00:00Z"
}

# Obtenir tous les accès
GET /api/access/all
Authorization: Bearer <token> (ADMIN uniquement)

# Obtenir mes accès
GET /api/access/my-access
Authorization: Bearer <token>

# Obtenir l'accès actif
GET /api/access/current
Authorization: Bearer <token>

# Vérifier si j'ai accès
GET /api/access/check
Authorization: Bearer <token>

# Modifier un accès
PUT /api/access/:id
Authorization: Bearer <token> (ADMIN uniquement)
Content-Type: application/json
{
  "startDate": "2025-12-01T10:00:00Z",
  "endDate": "2025-12-05T16:00:00Z",
  "isActive": true
}

# Supprimer un accès
DELETE /api/access/:id
Authorization: Bearer <token> (ADMIN uniquement)
```

---

## 🧪 Tests & Validation

### Tests Manuels Recommandés

```bash
# 1. Vérifier que tous les conteneurs sont UP
docker-compose ps

# 2. Health check backend
curl http://localhost:3000/health

# 3. Créer un utilisateur
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test"}'

# 4. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 5. Tester l'IA
curl -X GET http://localhost:11434/api/tags
```

### Scénarios de Test Complets

#### Scénario 1 : Flux Utilisateur Standard (USER)
1. ✅ Admin crée un utilisateur avec rôle USER
2. ✅ Utilisateur reçoit un email d'invitation
3. ✅ Utilisateur définit son mot de passe
4. ✅ Utilisateur se connecte → Dashboard
5. ❌ Utilisateur n'a pas accès aux documents (pas de fenêtre définie)
6. ✅ Admin crée une fenêtre d'accès (aujourd'hui + 1 semaine)
7. ✅ Utilisateur peut maintenant accéder aux documents
8. ✅ Utilisateur upload un document PDF
9. ✅ OCR traite le document
10. ✅ Utilisateur clique sur "Analyser" → Résumé IA s'affiche

#### Scénario 2 : Flux Consultant (CONSULTANT)
1. ✅ Admin crée un utilisateur avec rôle CONSULTANT
2. ✅ Consultant se connecte
3. ✅ Consultant a **accès permanent** aux documents (sans fenêtre)
4. ✅ Consultant peut chercher via OCR
5. ✅ Consultant peut analyser avec l'IA

#### Scénario 3 : Flux Admin (ADMIN)
1. ✅ Admin accède au panneau d'administration
2. ✅ Admin voit tous les utilisateurs
3. ✅ Admin change le rôle d'un USER → CONSULTANT
4. ✅ Admin supprime un utilisateur (protection : dernier admin)
5. ✅ Admin gère les fenêtres d'accès temporaire

---

## 📊 Surveillance & Logs

### Commandes Utiles

```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f mayan-edms
docker-compose logs -f mayanconnect-ollama

# Dernières 100 lignes
docker-compose logs --tail=100 backend

# Utilisation des ressources (CPU, RAM, I/O)
docker stats

# Inspecter un conteneur
docker inspect mayanconnect-backend

# Accéder au shell d'un conteneur
docker exec -it mayanconnect-backend sh
docker exec -it mayan-edms bash

# Vérifier les volumes
docker volume ls
docker volume inspect nuitinfo_backend-db-data
```

### Indicateurs de Santé

```bash
# Backend health
curl http://localhost:3000/health

# Mayan health
curl http://localhost:8000/api/

# Ollama health
curl http://localhost:11434/api/tags

# PostgreSQL Backend
docker exec backend-postgres pg_isready -U postgres

# PostgreSQL Mayan
docker exec mayan-postgres pg_isready -U mayan
```

---

## 🐛 Dépannage (Troubleshooting)

### Problème : Les conteneurs ne démarrent pas

```bash
# Solution 1 : Nettoyer complètement et redémarrer
docker-compose down -v
docker system prune -a
docker-compose up -d

# Solution 2 : Vérifier les ports occupés
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :8000

# Solution 3 : Augmenter la RAM Docker (si macOS/Windows)
# Docker Desktop → Settings → Resources → Memory → 8 GB
```

### Problème : Mayan EDMS ne démarre pas

```bash
# Mayan peut prendre 2-3 minutes au premier démarrage
docker-compose logs -f mayan-edms

# Vérifier la base de données Mayan
docker exec mayan-postgres psql -U mayan -d mayan -c "SELECT count(*) FROM django_migrations;"

# Réinitialiser Mayan (ATTENTION : Perte de données)
docker-compose down
docker volume rm nuitinfo_mayan-postgres-data nuitinfo_mayan-data
docker-compose up -d
```

### Problème : L'IA ne répond pas / Pas de résumé

```bash
# Vérifier qu'Ollama est actif
docker exec -it mayanconnect-ollama ollama list

# Si le modèle n'est pas téléchargé
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b

# Tester l'IA manuellement
docker exec -it mayanconnect-ollama ollama run llama3.2:3b "Bonjour, résume ce texte"

# Vérifier les logs Ollama
docker-compose logs -f mayanconnect-ollama
```

### Problème : Erreur "Token Mayan invalide"

```bash
# Régénérer le token Mayan
docker exec -it mayan-edms python manage.py shell << EOF
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
user = get_user_model().objects.get(username='admin')
Token.objects.filter(user=user).delete()
token = Token.objects.create(user=user)
print(f"Nouveau token: {token.key}")
EOF

# Mettre à jour .env avec le nouveau token
# Puis redémarrer
docker-compose restart backend
```

### Problème : OCR ne fonctionne pas

```bash
# Vérifier les logs Mayan
docker-compose logs -f mayan-edms

# Forcer le retraitement OCR d'un document (via interface Mayan)
# 1. Ouvrir http://localhost:8000
# 2. Aller sur le document
# 3. Tools → Submit to OCR queue

# Vérifier les workers Mayan
docker exec mayan-edms ps aux | grep celery
```

### Problème : Emails ne partent pas

```bash
# Vérifier la clé Resend dans .env
cat .env | grep RESEND_API_KEY

# Tester l'envoi d'email manuellement
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Vérifier les logs backend
docker-compose logs -f backend | grep email
```

### Problème : "Accès refusé" malgré une fenêtre active

```bash
# Vérifier la fenêtre d'accès en DB
docker exec backend-postgres psql -U postgres -d mayanconnect -c \
  "SELECT * FROM \"TemporaryAccess\" WHERE \"userId\" = 'user-id';"

# Vérifier le fuseau horaire du serveur
docker exec mayanconnect-backend date

# Forcer la resynchronisation
docker-compose restart backend
```

---

## 📖 Documentation Externe

- [Mayan EDMS Documentation](https://docs.mayan-edms.com/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Prisma ORM](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)

---

## 📦 Éléments Attendus (Livrables)

### ✅ Checklist Complète

- [x] **Dépôt Git** : Code source + `docker-compose.yml` fonctionnel
- [x] **Démonstration de l'IA** : Bouton "Analyser" dans DocumentViewer → Résumé + Mots-clés
- [x] **Application cliente fonctionnelle** :
  - [x] Recherche OCR
  - [x] Résumé IA
  - [x] Gestion des droits temporaires
- [x] **Schéma d'architecture** : Diagramme ASCII dans ce README
- [ ] **Vidéo de démonstration (3-5 min)** :
  - [ ] Installation Docker (`docker-compose up -d`)
  - [ ] Démo client (Dashboard → Documents → Upload → Analyser)
  - [ ] Démo IA (Résumé + Mots-clés)
  - [ ] Démo admin (Gestion utilisateurs + Accès temporaires)
- [x] **Documentation** : Ce README complet
- [x] **Lancement en une commande** : `docker-compose up -d`

### 🌟 Nos Points Forts

#### Exigences de Base (Obligatoires)
- ✅ **Architecture 100% conteneurisée** : 9 services Docker orchestrés
- ✅ **Installation ultra-simple** : Une seule commande (`docker-compose up -d`)
- ✅ **IA locale (Llama 3.2)** : Résumés intelligents + Extraction de mots-clés
- ✅ **Accès temporaires** : Middleware robuste + Interface de gestion complète
- ✅ **Client moderne** : React + TypeScript avec design professionnel
- ✅ **Documentation exhaustive** : README complet + Scripts de démo

#### Fonctionnalités Avancées (Au-delà des Exigences)
- ✅ **Système d'emails professionnel** (Resend) :
  - Email de bienvenue avec lien sécurisé
  - Invitation d'utilisateurs par l'admin
  - Réinitialisation de mot de passe oublié
  - Templates HTML modernes et cohérents

- ✅ **Gestion avancée des utilisateurs** :
  - 3 rôles avec permissions granulaires (USER, CONSULTANT, ADMIN)
  - Invitation par email (admin invite → utilisateur définit son mot de passe)
  - Changement de rôle dynamique depuis le dashboard admin
  - Protection du dernier administrateur

- ✅ **SSO/OIDC avec Keycloak** :
  - Serveur Keycloak conteneurisé
  - Authentification unique en un clic
  - Synchronisation automatique des rôles
  - Tokens OAuth2 sécurisés

- ✅ **Interface utilisateur premium** :
  - 100% en français (interface + emails + documentation)
  - Toast notifications pour chaque action
  - États de chargement (skeletons, spinners)

- ✅ **Sécurité renforcée** :
  - JWT avec expiration configurable
  - Bcrypt (12 rounds) pour les mots de passe
  - Helmet.js pour headers HTTP sécurisés
  - Protection CORS, XSS, CSRF
  - Middleware de vérification d'accès sur chaque route sensible
  - Validation stricte des entrées (express-validator)

- ✅ **Privacy-First** :
  - Toutes les données restent locales
  - IA 100% locale (pas d'appel externe)
  - Aucune télémétrie
  - RGPD-compliant par design

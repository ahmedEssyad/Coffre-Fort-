# 🚀 Guide Complet MayanConnect - De Zéro à l'Utilisation

## 📋 Table des Matières

1. [Présentation du Projet](#présentation-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Installation Complète](#installation-complète)
4. [Configuration Initiale](#configuration-initiale)
5. [Utilisation de l'Application](#utilisation-de-lapplication)
6. [Fonctionnalités Avancées](#fonctionnalités-avancées)
7. [Administration](#administration)
8. [Dépannage](#dépannage)

---

## 1. Présentation du Projet

### Qu'est-ce que MayanConnect ?

**MayanConnect** est un système de gestion documentaire intelligent qui combine :
- 🔒 **Stockage sécurisé** de documents (Mayan EDMS)
- 🤖 **Analyse IA locale** (résumés automatiques + mots-clés)
- ⏰ **Gestion des accès temporaires** par fenêtres horaires
- 🔐 **Authentification robuste** (JWT + SSO Keycloak)
- 🔍 **Recherche OCR** full-text dans tous les documents

### Pour qui ?

- **Administrateurs** : Gestion complète des utilisateurs, documents et accès
- **Consultants** : Accès permanent aux documents
- **Utilisateurs** : Accès temporaire selon fenêtres horaires définies

### Privacy-First

**Toutes les données restent sur votre infrastructure** - aucune donnée ne sort de vos serveurs.

---

## 2. Architecture Technique

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEUR FINAL                        │
│                  (Navigateur Web)                           │
└────────────────┬───────────────────────────┬────────────────┘
                 │                           │
                 ↓                           ↓
    ┌────────────────────┐      ┌────────────────────┐
    │   FRONTEND (React) │      │   KEYCLOAK (SSO)   │
    │    Port: 80        │      │    Port: 8080      │
    └─────────┬──────────┘      └────────────────────┘
              │
              ↓
    ┌────────────────────┐
    │  BACKEND (Node.js) │
    │    Port: 3001      │
    │                    │
    │  • Auth JWT        │
    │  • Accès temporels │
    │  • Proxy Mayan API │
    └─────────┬──────────┘
              │
    ┌─────────┴─────────┬────────────────┬──────────────┐
    ↓                   ↓                ↓              ↓
┌──────────┐    ┌──────────────┐   ┌─────────┐   ┌─────────┐
│ Mayan    │    │ Ollama AI    │   │ Redis   │   │ 3x      │
│ EDMS     │    │ (Llama 3.2)  │   │ Cache   │   │ PostgreSQL│
│ Port:8000│    │ Port: 11434  │   │         │   │ Databases │
└──────────┘    └──────────────┘   └─────────┘   └─────────┘
```

### Services Docker

| Service | Image | Port | Rôle |
|---------|-------|------|------|
| **frontend** | Custom (Nginx + React) | 80 | Interface utilisateur |
| **backend** | Custom (Node.js 20) | 3001 | API, Auth, Logique métier |
| **mayan** | mayanedms/mayanedms:latest | 8000 | Gestion documentaire + OCR |
| **keycloak** | quay.io/keycloak/keycloak:23.0 | 8080 | SSO (Single Sign-On) |
| **ollama** | ollama/ollama:latest | 11434 | IA locale (Llama 3.2 3B) |
| **mayan-db** | postgres:15-alpine | 5432 | Base données Mayan |
| **backend-db** | postgres:15-alpine | 5433 | Base données Backend |
| **keycloak-db** | postgres:15-alpine | 5434 | Base données Keycloak |
| **redis** | redis:7-alpine | 6379 | Cache Mayan |

---

## 3. Installation Complète

### Prérequis

| Logiciel | Version minimale | Vérification |
|----------|------------------|--------------|
| **Docker** | 20.10+ | `docker --version` |
| **Docker Compose** | 2.0+ | `docker-compose --version` |
| **RAM** | 8 GB minimum | - |
| **Espace disque** | 15 GB minimum | - |
| **OS** | Linux / macOS / Windows + WSL2 | - |

### Étape 1 : Cloner le Projet

```bash
# Cloner le repository
git clone https://github.com/votre-repo/nuitinfo.git
cd nuitinfo
```

### Étape 2 : Configuration de l'Environnement

```bash
# Copier le fichier d'environnement exemple
cp .env.example .env

# Détecter automatiquement l'IP de votre machine (pour accès réseau)
./get-host-ip.sh
```

**Le script `get-host-ip.sh` fait automatiquement** :
- ✅ Détecte votre adresse IP (ex: 10.17.14.203)
- ✅ Met à jour le fichier `.env` avec cette IP
- ✅ Configure les URLs publiques pour accès réseau

**Sortie attendue** :
```
✅ IP détectée: 10.17.14.203
🔄 HOST_IP mis à jour dans .env
🔄 URLs publiques mises à jour avec l'IP réseau
```

### Étape 3 : Démarrer TOUS les Services

```bash
# Lancer l'ensemble de la stack (une seule commande !)
docker-compose up -d --build
```

**Cette commande** :
- 📦 Télécharge toutes les images Docker nécessaires
- 🔨 Build le frontend et le backend
- 🚀 Démarre les 9 conteneurs en arrière-plan
- ⏱️ **Durée** : 3-5 minutes au premier lancement

### Étape 4 : Télécharger le Modèle IA (une seule fois)

```bash
# Télécharger le modèle Llama 3.2 3B (5-10 minutes)
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b
```

**Sortie attendue** :
```
pulling manifest
pulling 4f1e... 100%
pulling 1e34... 100%
...
success
```

### Étape 5 : Vérifier que Tout Fonctionne

```bash
# Vérifier l'état des conteneurs
docker-compose ps
```

**Tous les services doivent être "Up" ou "healthy"** :
```
✅ mayanconnect-frontend   (healthy)
✅ mayanconnect-backend    (healthy)
✅ mayan-edms              (healthy)
✅ mayanconnect-keycloak   (running)
✅ mayanconnect-ollama     (running)
✅ backend-postgres        (healthy)
✅ mayan-postgres          (healthy)
✅ keycloak-postgres       (healthy)
✅ mayan-redis             (healthy)
```

### Étape 6 : Accéder à l'Application

**Accès Local** :
- 🌐 Frontend : http://localhost
- 🔐 Keycloak : http://localhost:8080
- 📄 Mayan EDMS : http://localhost:8000
- 🔌 Backend API : http://localhost:3001

**Accès Réseau** (depuis n'importe quelle machine) :
- 🌐 Frontend : http://10.17.14.203 (remplacez par votre IP)
- 🔐 Keycloak : http://10.17.14.203:8080
- 📄 Mayan EDMS : http://10.17.14.203:8000
- 🔌 Backend API : http://10.17.14.203:3001

---

## 4. Configuration Initiale

### Option A : Première Connexion via l'Interface

1. **Ouvrir l'application** : http://localhost (ou http://votre-ip)

2. **Créer un compte Admin** :
   - Cliquez sur "Créer un compte"
   - Remplissez le formulaire :
     ```
     Email: admin@example.com
     Mot de passe: Admin123!
     Prénom: Admin
     Nom: User
     ```
   - Le **premier compte créé devient automatiquement ADMIN**

3. **Se connecter** avec ces identifiants

### Option B : Créer un Admin via API

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

### Configuration de Mayan EDMS (Optionnel)

**Si vous voulez accéder directement à Mayan** :

1. Ouvrir http://localhost:8000
2. Login par défaut :
   - Username: `admin`
   - Password: `admin`

**Générer un Token API Mayan** (si nécessaire) :

```bash
docker exec -it mayan-edms python manage.py shell << EOF
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
user = get_user_model().objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")
EOF
```

Copiez le token et ajoutez-le dans `.env` :
```bash
MAYAN_API_TOKEN=votre-token-ici
```

Puis redémarrez le backend :
```bash
docker-compose restart backend
```

---

## 5. Utilisation de l'Application

### 5.1. Connexion Utilisateur

**Méthode 1 : Login Classique (JWT)**

1. Ouvrir http://localhost
2. Entrer email + mot de passe
3. Cliquer sur "Se connecter"
4. ✅ Redirection vers le Dashboard

**Méthode 2 : SSO avec Keycloak (Bonus)**

> ⚠️ **Note** : Le SSO fonctionne uniquement en localhost (http://localhost) car il nécessite HTTPS pour l'accès réseau IP.

1. Ouvrir http://localhost
2. Cliquer sur "Se connecter avec SSO"
3. Redirection vers Keycloak
4. Login avec credentials Keycloak
5. ✅ Redirection automatique vers l'application

### 5.2. Dashboard Utilisateur

**Après connexion, vous voyez** :

```
┌─────────────────────────────────────────────────┐
│  MayanConnect - Dashboard                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  📊 Statistiques                                │
│  • Documents uploadés: 12                       │
│  • Documents consultés: 45                      │
│                                                 │
│  ⏰ Statut d'Accès (si USER)                    │
│  • Accès actif jusqu'au 05/12/2025 18:00       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 5.3. Upload de Documents

**Pour les Admins uniquement** :

1. Aller dans **"Documents"** (menu gauche)
2. Cliquer sur **"Upload Document"**
3. Sélectionner un fichier PDF
4. Remplir les métadonnées :
   - **Label** : Nom du document
   - **Type** : Sélectionner un type (ex: "Contrat", "Facture")
5. Cliquer sur **"Upload"**
6. ✅ Le document apparaît dans la liste

**Traitement automatique après upload** :
- 🔄 Mayan EDMS stocke le fichier
- 🔍 OCR démarre automatiquement (2-3 minutes selon taille)
- 📊 Progression OCR visible : "2/5 pages traitées"

### 5.4. Consultation de Documents

1. Aller dans **"Documents"**
2. Cliquer sur un document dans la liste
3. **Visualisation** :
   ```
   ┌──────────────────────────────────────────┐
   │  Aperçu PDF                              │
   │  ┌────────────────────────────────────┐  │
   │  │                                    │  │
   │  │     [Contenu du PDF affiché]       │  │
   │  │                                    │  │
   │  └────────────────────────────────────┘  │
   │                                          │
   │  Analyse IA                              │
   │  ┌────────────────────────────────────┐  │
   │  │ [Bouton "Analyser"]                │  │
   │  │                                    │  │
   │  │ OCR: ⏳ 3/5 pages traitées...      │  │
   │  └────────────────────────────────────┘  │
   └──────────────────────────────────────────┘
   ```

### 5.5. Analyse IA de Documents

**Pré-requis** : L'OCR doit être terminé (indicateur vert ✅)

**Étapes** :

1. Ouvrir un document (section 5.4)
2. Attendre que **"OCR Terminé - Prêt pour l'analyse"** s'affiche
3. Cliquer sur le bouton **"Analyser"** (icône cerveau 🧠)

**Processus d'analyse** :

```
⏳ Vérification du cache...
   ↓
📊 Analyse en cours avec IA... (20-40 secondes)
   ↓
✅ Résumé généré !
```

**Résultat affiché** :

```
┌─────────────────────────────────────────────┐
│  📝 Résumé                                  │
│  Ce document présente les conditions       │
│  générales de vente applicables aux        │
│  prestations de services proposées...      │
│                                             │
│  🔑 Mots-clés                               │
│  [Contrat] [Service] [Conditions]          │
│  [Paiement] [Durée]                         │
└─────────────────────────────────────────────┘
```

**Cache intelligent** :
- ✅ L'analyse est **mise en cache**
- ✅ Clics suivants sur "Analyser" = résultat **instantané**
- ✅ Cache **invalidé automatiquement** si document modifié

### 5.6. Recherche de Documents

**Recherche par nom** :

1. Dans "Documents", utiliser la barre de recherche
2. Taper le nom du document
3. ✅ Résultats filtrés en temps réel

**Recherche OCR (Full-Text)** :

> 🔍 Recherche dans le **contenu** des documents

```bash
# Via l'interface
Documents → Champ de recherche → Taper un mot du contenu

# Via API (pour développeurs)
curl "http://localhost:3001/api/documents/search?q=contrat"
```

**Exemple** :
- Document contient : "Le montant total s'élève à 1500 euros"
- Recherche "1500" → ✅ Document trouvé
- Recherche "euros" → ✅ Document trouvé

### 5.7. Téléchargement de Documents

1. Ouvrir un document
2. Cliquer sur **"Télécharger"** (icône ⬇️)
3. ✅ Le PDF se télécharge sur votre machine

---

## 6. Fonctionnalités Avancées

### 6.1. Gestion des Accès Temporaires

**Concept** :
- Les utilisateurs avec le rôle **USER** ont un accès limité dans le temps
- Les **fenêtres d'accès** définissent quand ils peuvent consulter les documents

**Statuts possibles** :

| Statut | Signification | Icône |
|--------|---------------|-------|
| **Actif** | Accès en cours (entre start et end) | 🟢 |
| **Programmé** | Accès futur (avant start) | 🔵 |
| **Expiré** | Accès terminé (après end) | 🔴 |
| **Aucun Accès** | Aucune fenêtre définie | ⚫ |

**Rôles et Accès** :

| Rôle | Accès Documents | Bypass Fenêtres |
|------|-----------------|-----------------|
| **USER** | ⏰ Selon fenêtres | ❌ Non |
| **CONSULTANT** | ✅ Permanent | ✅ Oui |
| **ADMIN** | ✅ Permanent | ✅ Oui |

### 6.2. Emails Automatiques

**Email de Bienvenue** :

Lorsqu'un admin invite un utilisateur :

```
┌────────────────────────────────────────┐
│  🚀 Bienvenue sur MayanConnect        │
│                                        │
│  Bonjour Marie !                       │
│                                        │
│  Un compte a été créé pour vous.       │
│                                        │
│  [Définir Mon Mot de Passe]            │
│  http://10.17.14.203/set-password?...  │
│                                        │
│  ⚠️ Lien valide 24h                    │
└────────────────────────────────────────┘
```

**Email de Réinitialisation** :

Lorsqu'un utilisateur oublie son mot de passe :

```
┌────────────────────────────────────────┐
│  🔐 Réinitialisation Mot de Passe     │
│                                        │
│  [Réinitialiser Mon Mot de Passe]      │
│  http://10.17.14.203/set-password?...  │
│                                        │
│  ⚠️ Lien valide 24h                    │
└────────────────────────────────────────┘
```

---

## 7. Administration

### 7.1. Panneau d'Administration

**Accès** : Menu "Admin" (visible uniquement pour les ADMIN)

**Fonctionnalités** :

```
┌─────────────────────────────────────────────────┐
│  Admin Panel                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  👥 Gestion des Utilisateurs                    │
│  • Voir tous les utilisateurs                   │
│  • Inviter de nouveaux utilisateurs             │
│  • Changer les rôles (USER ↔ CONSULTANT)       │
│  • Supprimer des utilisateurs                   │
│                                                 │
│  ⏰ Gestion des Accès Temporaires               │
│  • Créer des fenêtres d'accès                   │
│  • Modifier les fenêtres existantes             │
│  • Voir le statut en temps réel                 │
│  • Supprimer des accès                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.2. Inviter un Utilisateur

1. Aller dans **Admin** → **Utilisateurs**
2. Cliquer sur **"Inviter Utilisateur"**
3. Remplir le formulaire :
   ```
   Email: marie@example.com
   Prénom: Marie
   Nom: Dupont
   Rôle: USER
   ☑️ Envoyer email d'invitation
   ```
4. Cliquer sur **"Inviter"**
5. ✅ Email envoyé automatiquement avec lien de définition de mot de passe

### 7.3. Créer une Fenêtre d'Accès Temporaire

1. Aller dans **Admin** → **Accès Temporaires**
2. Cliquer sur **"Créer un Accès"**
3. Remplir :
   ```
   Utilisateur: Sélectionner dans la liste
   Date de début: 01/12/2025 08:00
   Date de fin: 05/12/2025 18:00
   ```
4. Cliquer sur **"Créer"**
5. ✅ L'utilisateur pourra accéder aux documents pendant cette période

**Exemple de scénario** :

```
📅 Créer accès pour consultant externe
   • Utilisateur: jean@external.com (rôle: USER)
   • Début: Lundi 9h
   • Fin: Vendredi 17h
   → Jean peut consulter les docs uniquement cette semaine
```

### 7.4. Changer le Rôle d'un Utilisateur

1. Admin → Utilisateurs → Cliquer sur un utilisateur
2. Sélectionner nouveau rôle :
   - USER → CONSULTANT (accès permanent)
   - CONSULTANT → ADMIN (droits admin)
3. Cliquer sur **"Changer Rôle"**
4. ✅ Changement immédiat

**Protections** :
- ❌ Impossible de supprimer le dernier admin
- ❌ Impossible de se révoquer soi-même

### 7.5. Surveillance et Logs

**Via Docker** :

```bash
# Voir tous les logs
docker-compose logs -f

# Logs backend uniquement
docker-compose logs -f backend

# Logs d'analyse IA
docker-compose logs -f mayanconnect-ollama

# Dernières 100 lignes
docker-compose logs --tail=100 backend
```

**Logs importants à surveiller** :

```
✅ Welcome email sent: { id: '...' }
✅ Document uploaded successfully: doc-123
✅ Analysis cached for document: 456
⚠️ OCR not ready for document: 789
❌ Failed to analyze document: Network error
```

---

## 8. Dépannage

### Problème 1 : Les conteneurs ne démarrent pas

**Symptôme** : `docker-compose ps` montre des conteneurs "Exited"

**Solutions** :

```bash
# 1. Nettoyer complètement
docker-compose down -v
docker system prune -a

# 2. Relancer
docker-compose up -d

# 3. Vérifier les logs
docker-compose logs backend
```

### Problème 2 : Mayan EDMS ne répond pas

**Symptôme** : Timeout lors de l'upload de documents

**Solution** :

```bash
# Mayan peut prendre 2-3 minutes au démarrage
docker-compose logs -f mayan-edms

# Attendre de voir :
# "Booting worker with pid: 123"
# "Application startup complete"
```

### Problème 3 : L'IA ne génère pas de résumé

**Symptôme** : Bouton "Analyser" ne fait rien

**Vérifications** :

```bash
# 1. Vérifier qu'Ollama fonctionne
curl http://localhost:11434/api/tags

# 2. Vérifier que le modèle est téléchargé
docker exec -it mayanconnect-ollama ollama list

# Doit afficher : llama3.2:3b

# 3. Si absent, télécharger
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b
```

### Problème 4 : OCR bloqué

**Symptôme** : "3/5 pages" ne progresse plus

**Solution** :

```bash
# 1. Vérifier les logs Mayan
docker-compose logs -f mayan-edms

# 2. Redémarrer Mayan
docker-compose restart mayan-edms

# 3. Re-upload le document si nécessaire
```

### Problème 5 : Emails ne partent pas

**Symptôme** : Pas d'email reçu après invitation

**Vérifications** :

```bash
# 1. Vérifier la clé API Resend dans .env
cat .env | grep RESEND_API_KEY

# 2. Vérifier les logs backend
docker-compose logs backend | grep email

# 3. Tester manuellement
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Problème 6 : Accès réseau bloqué

**Symptôme** : Application accessible en localhost mais pas depuis autre machine

**Solution** :

```bash
# 1. Re-détecter l'IP
./get-host-ip.sh

# 2. Rebuild frontend
docker-compose up -d --build frontend

# 3. Vérifier le firewall
# macOS
sudo pfctl -d  # Désactiver temporairement

# Linux
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 8080/tcp
```

### Problème 7 : "Token Mayan invalide"

**Symptôme** : Erreur 401 lors de l'upload

**Solution** :

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

# Copier le token affiché et le mettre dans .env
# MAYAN_API_TOKEN=nouveau-token-ici

# Redémarrer backend
docker-compose restart backend
```

---

## 🎯 Résumé Rapide

### Installation en 5 Commandes

```bash
# 1. Cloner
git clone https://github.com/votre-repo/nuitinfo.git && cd nuitinfo

# 2. Configurer IP
./get-host-ip.sh

# 3. Démarrer tout
docker-compose up -d --build

# 4. Télécharger modèle IA
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b

# 5. Ouvrir l'application
open http://localhost  # ou http://votre-ip
```

### Workflow Utilisateur Typique

```
1. Login (email/password ou SSO)
   ↓
2. Dashboard → Voir statut d'accès
   ↓
3. Documents → Consulter la liste
   ↓
4. Cliquer sur document → Visualiser PDF
   ↓
5. Attendre OCR terminé (✅)
   ↓
6. Cliquer "Analyser" → Voir résumé + mots-clés
   ↓
7. Télécharger si besoin
```

### Workflow Admin Typique

```
1. Admin Panel → Inviter utilisateur
   ↓
2. Email envoyé automatiquement
   ↓
3. Créer fenêtre d'accès temporaire
   ↓
4. Documents → Upload nouveau document
   ↓
5. Surveiller traitement OCR
   ↓
6. Gérer les rôles si besoin
```

---

## 📚 Ressources Complémentaires

- **README.md** : Vue d'ensemble du projet
- **KEYCLOAK_SETUP.md** : Configuration détaillée SSO
- **docker-compose.yml** : Architecture complète
- **API Documentation** : Section dans README.md

---

**🎉 Vous êtes maintenant prêt à utiliser MayanConnect !**

Pour toute question : consultez les logs ou le dépannage ci-dessus.

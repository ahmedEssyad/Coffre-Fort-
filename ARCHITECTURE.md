# 🏗️ Architecture Coffre-Fort

## Schéma des Interactions Détaillées

### 1️⃣ Flux d'Authentification et Accès

```
┌──────────┐
│  CLIENT  │
│ (React)  │
└────┬─────┘
     │
     │ 1. POST /api/auth/login
     │    {email, password}
     ↓
┌─────────────────┐
│     BACKEND     │
│   (Port 3000)   │
│                 │
│ • Vérifie       │
│   credentials   │
│ • Génère JWT    │
│ • Retourne      │
│   token + user  │
└─────────────────┘
     │
     │ 2. Token JWT stocké
     │    dans localStorage
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Token:   │
│ eyJhbG... │
└──────────┘
```

---

### 2️⃣ Flux de Gestion des Documents (Upload)

```
┌──────────┐
│  CLIENT  │
└────┬─────┘
     │
     │ 1. GET /api/auth/mayan-config
     │    Headers: Authorization: Bearer <JWT>
     ↓
┌─────────────────┐
│     BACKEND     │
│                 │
│ Middleware:     │
│ • authenticate  │
│ • checkTemporal │
│   Access        │
│                 │
│ ✅ Accès OK     │
│ → Retourne      │
│   credentials   │
│   Mayan         │
└─────────────────┘
     │
     │ 2. Credentials Mayan
     │    {apiUrl, token}
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Stocke   │
│ token    │
│ Mayan    │
└────┬─────┘
     │
     │ 3. POST /api/v4/documents/
     │    Headers: Authorization: Token <MAYAN_TOKEN>
     │    Body: FormData (file)
     ↓
┌─────────────────┐
│   MAYAN EDMS    │
│  (Port 8000)    │
│                 │
│ • Reçoit file   │
│ • Créé document │
│ • Lance OCR     │
│   (Tesseract)   │
│ • Extrait texte │
│ • Index search  │
└─────────────────┘
     │
     │ 4. Document créé
     │    {id: 123, label: "doc.pdf"}
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Affiche  │
│ document │
│ dans la  │
│ liste    │
└──────────┘
```

---

### 3️⃣ Flux d'Analyse IA (Résumé + Mots-clés)

```
┌──────────┐
│  CLIENT  │
│          │
│ Utilisateur    │
│ clique sur     │
│ "Analyser"     │
└────┬──────────┘
     │
     │ 1. POST /api/ai/analyze
     │    Headers: Authorization: Bearer <JWT>
     │    Body: {documentId: 123}
     ↓
┌─────────────────┐
│     BACKEND     │
│  (Port 3000)    │
│                 │
│ Middleware:     │
│ • authenticate  │
│ • checkTemporal │
│   Access        │
└────┬────────────┘
     │
     │ 2. GET /api/v4/documents/123/file/
     │    Headers: Authorization: Token <MAYAN_TOKEN>
     ↓
┌─────────────────┐
│   MAYAN EDMS    │
│  (Port 8000)    │
│                 │
│ Retourne:       │
│ • Contenu OCR   │
│   du document   │
└─────────────────┘
     │
     │ 3. Contenu OCR (texte)
     ↓
┌─────────────────┐
│     BACKEND     │
│                 │
│ Prépare prompt: │
│ "Résume ce      │
│  document et    │
│  extrais les    │
│  mots-clés..."  │
└────┬────────────┘
     │
     │ 4. POST /api/generate
     │    Body: {
     │      model: "llama3.2:3b",
     │      prompt: "Résume...",
     │      stream: false
     │    }
     ↓
┌─────────────────┐
│   OLLAMA AI     │
│ (Port 11434)    │
│                 │
│ Llama 3.2 3B:   │
│ • Analyse texte │
│ • Génère résumé │
│ • Extrait       │
│   mots-clés     │
│                 │
│ ⏱️ ~30-60s      │
└─────────────────┘
     │
     │ 5. Réponse IA
     │    {response: "Résumé: ...\nMots-clés: ..."}
     ↓
┌─────────────────┐
│     BACKEND     │
│                 │
│ Parse réponse:  │
│ • Extrait       │
│   résumé        │
│ • Extrait       │
│   mots-clés     │
└────┬────────────┘
     │
     │ 6. JSON structuré
     │    {
     │      documentId: 123,
     │      summary: "Ce document traite de...",
     │      keywords: ["mot1", "mot2", "mot3"]
     │    }
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Affiche: │
│ • Résumé │
│ • Badges │
│   mots-  │
│   clés   │
└──────────┘
```

---

### 4️⃣ Flux de Contrôle d'Accès Temporaire

```
┌──────────┐
│  CLIENT  │
│ (USER)   │
└────┬─────┘
     │
     │ 1. GET /api/auth/mayan-config
     │    Headers: Authorization: Bearer <JWT>
     ↓
┌─────────────────────────────────────────┐
│            BACKEND                      │
│                                         │
│  Middleware: checkTemporaryAccess       │
│                                         │
│  1. Décode JWT → user.role              │
│                                         │
│  2. Si role = CONSULTANT ou ADMIN:      │
│     ✅ BYPASS → Accès permanent         │
│                                         │
│  3. Si role = USER:                     │
│     a. Query DB TemporaryAccess:        │
│        WHERE userId = user.id           │
│          AND isActive = true            │
│                                         │
│     b. Vérifie fenêtre:                 │
│        NOW() >= startDate               │
│        AND NOW() <= endDate             │
│                                         │
│     c. Si ✅ dans fenêtre:              │
│        → Accès autorisé                 │
│                                         │
│     d. Si ❌ hors fenêtre:              │
│        → 403 Forbidden                  │
│           "Accès expiré ou non actif"   │
└─────────────────────────────────────────┘
     │
     │ Si ✅ Accès OK
     │ 2. Retourne credentials Mayan
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Peut     │
│ accéder  │
│ documents│
└──────────┘

     │ Si ❌ Accès refusé
     │ 2. HTTP 403
     ↓
┌──────────┐
│  CLIENT  │
│          │
│ Message: │
│ "Accès   │
│ refusé"  │
└──────────┘
```

---

## 🔑 Points Clés de l'Architecture

### 1. Séparation Auth/Data
- **Backend** = Authentification + Contrôle d'accès
- **Mayan** = Stockage documents + OCR
- **Client** accède directement à Mayan APRÈS autorisation

### 2. Sécurité Multi-Niveaux
- **JWT** pour l'authentification
- **Middleware `checkTemporaryAccess`** pour les accès temporels
- **Token Mayan séparé** pour accéder aux documents

### 3. IA 100% Locale
- Backend récupère le contenu OCR de Mayan
- Backend envoie à Ollama pour analyse
- **Aucune donnée ne sort du serveur**

### 4. Performance
- Client ↔ Mayan : Communication directe (pas de proxy)
- OCR asynchrone (ne bloque pas l'upload)
- Cache Redis pour Mayan

---

## 📊 Diagramme de Séquence Global

```
CLIENT          BACKEND         MAYAN           OLLAMA
  │               │               │               │
  │─Login────────>│               │               │
  │<─JWT──────────│               │               │
  │               │               │               │
  │─Get Config───>│               │               │
  │  (JWT)        │               │               │
  │               │─Check Access  │               │
  │               │  (Middleware) │               │
  │<─Mayan Token──│               │               │
  │               │               │               │
  │─Upload────────────────────────>│               │
  │  (Mayan Token)                │               │
  │                               │─OCR Process   │
  │<─Document Created─────────────│               │
  │               │               │               │
  │─Analyze──────>│               │               │
  │  (JWT)        │               │               │
  │               │─Get Content──>│               │
  │               │<─OCR Text─────│               │
  │               │                               │
  │               │─Generate─────────────────────>│
  │               │  (Prompt)                     │
  │               │                               │ ⏱️ 30-60s
  │               │                               │
  │               │<─AI Response──────────────────│
  │<─Summary──────│               │               │
  │  + Keywords   │               │               │
  │               │               │               │
```

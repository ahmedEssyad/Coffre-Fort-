# 📧 Resend Integration - Setup Guide

## ✅ Ce qui a été implémenté

### Backend
1. **Package Resend** ajouté dans `package.json`
2. **Modèle Prisma** `PasswordResetToken` avec token, expiration, etc.
3. **Services créés :**
   - `emailService.ts` - Envoi d'emails avec templates HTML
   - `tokenService.ts` - Génération et validation de tokens
4. **Controllers mis à jour :**
   - `POST /api/auth/register` - Crée user + envoie email
   - `POST /api/auth/set-password` - Définit password avec token
   - `POST /api/auth/forgot-password` - Reset password
5. **Routes ajoutées** dans `authRoutes.ts`

### Frontend
1. **Page SetPassword** créée avec formulaire
2. **React Router** intégré
3. **Validation** côté client
4. **UX** professionnelle avec messages d'erreur/succès

---

## 🚀 Installation & Configuration

### Étape 1: Obtenir une clé API Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte (gratuit jusqu'à 3,000 emails/mois)
3. Créer une API key dans le dashboard
4. Copier la clé (format: `re_xxxxx`)

### Étape 2: Configurer les variables d'environnement

Créer/modifier `.env` dans `backend/` :

```bash
# Email (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@yourdomain.com  # ou onboarding@resend.dev pour test
FRONTEND_URL=http://localhost
```

**Important :**
- Pour tester, utilisez `onboarding@resend.dev` comme FROM_EMAIL
- En production, configurez votre propre domaine dans Resend

### Étape 3: Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Étape 4: Générer Prisma Client

```bash
cd backend
npx prisma generate
npx prisma db push
```

---

## 🧪 Tester le Flow Complet

### Test 1: Créer un utilisateur et envoyer l'email

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "sendEmail": true
  }'
```

**Résultat attendu :**
- Utilisateur créé dans la DB
- Email envoyé à `test@example.com`
- Réponse JSON : `{ "message": "User registered successfully. Welcome email sent." }`

### Test 2: Vérifier l'email

1. Aller dans votre boîte mail `test@example.com`
2. Ouvrir l'email "Welcome to MayanConnect"
3. Cliquer sur le bouton "Set My Password"
4. OU copier le lien (format: `http://localhost/set-password?token=abc123`)

### Test 3: Définir le password

1. Page `/set-password` s'ouvre avec le token dans l'URL
2. Entrer un nouveau password (min 6 caractères)
3. Confirmer le password
4. Cliquer "Set Password"
5. Redirection automatique vers `/login` après 3 secondes

### Test 4: Se connecter

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "votre_nouveau_password"
  }'
```

**Résultat attendu :**
- Réponse avec JWT token
- Login réussi

---

## 📋 Use Cases Supportés

### UC1: Admin crée un consultant et envoie invitation

```javascript
// Admin crée le compte
POST /api/auth/register
{
  "email": "consultant@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "sendEmail": true  // <-- Email automatique
}

// Flow:
// 1. User créé avec password temporaire
// 2. Token généré (expire 24h)
// 3. Email envoyé avec lien set-password
// 4. Consultant clique lien
// 5. Consultant définit son password
// 6. Consultant peut se connecter
```

### UC2: Utilisateur oublie son password

```javascript
// User demande reset
POST /api/auth/forgot-password
{
  "email": "consultant@example.com"
}

// Flow identique:
// 1. Token généré
// 2. Email "Reset Password" envoyé
// 3. User clique lien
// 4. User définit nouveau password
```

### UC3: Mode manuel (sans email)

```javascript
// Admin crée user sans envoyer email
POST /api/auth/register
{
  "email": "user@example.com",
  "firstName": "John",
  "sendEmail": false  // <-- Pas d'email
}

// Réponse inclut password temporaire:
{
  "message": "User registered successfully.",
  "user": {...},
  "tempPassword": "abc12345"  // <-- Admin peut copier/coller
}
```

---

## 🎨 Templates Email

### Template Welcome Email

- **Subject:** 🎉 Welcome to MayanConnect - Set Your Password
- **Design:** Gradient header, CTA button, security warning
- **Content:**
  - Greeting personnalisé
  - Instructions claires
  - Bouton "Set My Password"
  - Lien en fallback
  - Info sur expiration (24h)
  - Liste features MayanConnect

### Template Password Reset

- **Subject:** 🔐 Reset Your MayanConnect Password
- **Design:** Identique
- **Content:**
  - Demande de reset confirmée
  - Bouton "Reset My Password"
  - Note si non demandé

---

## 🔒 Sécurité

### Tokens
- ✅ Générés avec `crypto.randomBytes(32)` (256 bits)
- ✅ Stockés dans DB avec expiration
- ✅ Usage unique (marqués `used: true`)
- ✅ Expirent après 24h
- ✅ Invalidés après utilisation

### Emails
- ✅ Pas de passwords en clair
- ✅ Tokens one-time use
- ✅ Liens expirables
- ✅ Messages génériques (ne révèle pas si email existe)

### Frontend
- ✅ Validation côté client
- ✅ Messages d'erreur clairs
- ✅ Disabled state pendant loading
- ✅ Redirect après succès

---

## 🐛 Troubleshooting

### Email ne s'envoie pas

**Vérifier :**
```bash
# Logs backend
docker-compose logs backend

# Chercher:
# ✅ Welcome email sent: { id: '...' }
# OU
# ❌ Error sending welcome email: ...
```

**Solutions :**
1. Vérifier `RESEND_API_KEY` dans `.env`
2. Vérifier `FROM_EMAIL` (utiliser `onboarding@resend.dev` pour test)
3. Vérifier logs Resend dashboard

### Token invalide/expiré

**Vérifier token dans DB :**
```sql
SELECT * FROM password_reset_tokens
WHERE token = 'votre_token'
ORDER BY created_at DESC;
```

**Vérifier :**
- `expiresAt` > maintenant
- `used` = false

### Page set-password ne charge pas

**Vérifier :**
1. React Router installé : `npm list react-router-dom`
2. Token dans URL : `?token=xxx`
3. Frontend build : `npm run build`

---

## 📊 Monitoring

### Nettoyer tokens expirés (optionnel)

Ajouter dans cron ou script :

```typescript
import tokenService from './services/tokenService';

// Cleanup expired tokens
tokenService.cleanupExpiredTokens();
```

### Stats emails envoyés

Aller sur Resend Dashboard :
- Emails envoyés
- Taux d'ouverture
- Taux de clic
- Bounces/Errors

---

## 🚀 Production Checklist

Avant de déployer :

- [ ] Obtenir domaine vérifié dans Resend
- [ ] Configurer `FROM_EMAIL` avec votre domaine
- [ ] Changer `FRONTEND_URL` vers domaine production
- [ ] Tester flow complet en staging
- [ ] Setup monitoring Resend
- [ ] Configurer rate limiting (anti-spam)
- [ ] Ajouter cron cleanup tokens
- [ ] Logger tous les envois d'emails

---

## 🎓 Prochaines Améliorations

1. **Templates personnalisables** dans DB
2. **Multi-langue** (FR/EN)
3. **Email preview** avant envoi (admin)
4. **Stats dashboard** (combien d'invitations envoyées)
5. **Resend d'invitation** si non ouvert
6. **Custom branding** (logo, couleurs)

---

## 📚 Documentation Utile

- [Resend Docs](https://resend.com/docs)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs)
- [Email Best Practices](https://resend.com/docs/dashboard/emails/best-practices)

---

**✅ Setup complet ! Le consultant peut maintenant recevoir ses credentials par email automatiquement.**

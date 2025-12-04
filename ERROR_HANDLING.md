# 🛡️ Guide de Gestion des Erreurs - MayanConnect

## Vue d'Ensemble

MayanConnect implémente un système **centralisé** de gestion des erreurs avec **tous les messages en français** pour une meilleure expérience utilisateur.

---

## 🔧 Backend - Gestion des Erreurs

### Architecture

```
┌─────────────┐
│  Controller │
│   (throw)   │
└──────┬──────┘
       │
       ↓
┌──────────────┐
│  AppError    │ ← Classes d'erreurs personnalisées
│  (utils/     │
│   errors.ts) │
└──────┬───────┘
       │
       ↓
┌─────────────────┐
│ Error Middleware│ ← Middleware global
│ (errorHandler)  │
└──────┬──────────┘
       │
       ↓
┌─────────────────┐
│  JSON Response  │ ← { success: false, error: "..." }
└─────────────────┘
```

### Classes d'Erreurs Disponibles

#### Authentification (401)
```typescript
throw new UnauthorizedError(); // "Non autorisé..."
throw new InvalidCredentialsError(); // "Email ou mot de passe incorrect"
throw new TokenExpiredError(); // "Session expirée..."
throw new InvalidTokenError(); // "Token invalide..."
```

#### Permission (403)
```typescript
throw new ForbiddenError();
throw new AdminOnlyError(); // "Privilèges administrateur requis"
throw new TemporaryAccessDeniedError(); // "Pas de fenêtre d'accès"
```

#### Ressource non trouvée (404)
```typescript
throw new UserNotFoundError(); // "Utilisateur non trouvé"
throw new DocumentNotFoundError(); // "Document non trouvé"
throw new AccessNotFoundError(); // "Fenêtre d'accès non trouvée"
```

#### Validation (400)
```typescript
throw new ValidationError("Message personnalisé");
throw new InvalidEmailError();
throw new WeakPasswordError();
throw new UserAlreadyExistsError();
throw new InvalidDateRangeError();
```

#### Conflit (409)
```typescript
throw new CannotDeleteSelfError();
throw new CannotDemoteSelfError();
throw new LastAdminError();
```

#### Service externe (503)
```typescript
throw new MayanServiceError();
throw new AIServiceError();
throw new EmailServiceError();
```

#### Erreur interne (500)
```typescript
throw new InternalServerError();
throw new DatabaseError();
```

### Utilisation dans un Controller

**❌ Avant (Mauvais)** :
```typescript
async deleteUser(req: Request, res: Response) {
  try {
    // ...
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // ...
  } catch (error) {
    return res.status(500).json({ error: 'Failed' });
  }
}
```

**✅ Après (Bon)** :
```typescript
import { UserNotFoundError, CannotDeleteSelfError } from '../utils/errors';
import { asyncHandler } from '../middleware/errorHandler';

async deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const currentUserId = req.user?.userId;

  // Le asyncHandler capture automatiquement les erreurs
  if (id === currentUserId) {
    throw new CannotDeleteSelfError(); // ✅ Message français automatique
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new UserNotFoundError(); // ✅ "Utilisateur non trouvé."
  }

  await prisma.user.delete({ where: { id } });

  return res.json({
    success: true,
    message: SuccessMessages.USER_DELETED, // ✅ "Utilisateur supprimé avec succès."
  });
}
```

### Enregistrer la Route avec asyncHandler

```typescript
import { asyncHandler } from '../middleware/errorHandler';
import adminController from '../controllers/adminController';

router.delete('/users/:id', asyncHandler(adminController.deleteUser));
```

### Messages de Succès

Utilisez les constantes dans `utils/errors.ts` :

```typescript
import { SuccessMessages } from '../utils/errors';

res.json({
  success: true,
  message: SuccessMessages.USER_CREATED,
  data: user,
});
```

---

## 🎨 Frontend - Gestion des Erreurs

### Architecture

```
┌──────────────┐
│  API Call    │
│  (try/catch) │
└──────┬───────┘
       │
       ↓
┌──────────────────┐
│ extractError     │ ← Extraire message d'erreur
│ Message()        │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ showToast.error()│ ← Toast notification
└──────────────────┘
```

### Toast Notifications

Import :
```typescript
import { showToast, extractErrorMessage, SuccessMessages, ErrorMessages } from '../utils/toast';
```

#### Succès
```typescript
showToast.success('Opération réussie !');
// ou
showToast.success(SuccessMessages.DOCUMENT_UPLOADED);
```

#### Erreur
```typescript
try {
  await api.someAction();
  showToast.success('Succès !');
} catch (err) {
  const errorMessage = extractErrorMessage(err);
  showToast.error(errorMessage);
}
```

#### Avertissement
```typescript
showToast.warning('Cette action est irréversible.');
```

#### Information
```typescript
showToast.info('Le traitement peut prendre quelques minutes.');
```

#### Chargement avec Promesse
```typescript
const uploadPromise = uploadDocument(file);

showToast.promise(uploadPromise, {
  loading: 'Téléversement en cours...',
  success: 'Document téléversé avec succès !',
  error: 'Échec du téléversement.',
});
```

### Exemple Complet (Page Login)

```typescript
import { useState } from 'react';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';

const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showToast.warning('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);

    try {
      await authService.login({ email, password });
      showToast.success(SuccessMessages.LOGIN_SUCCESS);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
    </form>
  );
};
```

### Extraction de Messages d'Erreur

La fonction `extractErrorMessage()` gère automatiquement :

✅ Erreurs API (axios)
```json
{
  "success": false,
  "error": "Utilisateur non trouvé.",
  "statusCode": 404
}
```
→ Affiche : "Utilisateur non trouvé."

✅ Erreurs de validation
```json
{
  "errors": [
    { "msg": "Email invalide" },
    { "msg": "Mot de passe trop court" }
  ]
}
```
→ Affiche : "Email invalide, Mot de passe trop court"

✅ Erreurs réseau
```
Network Error
```
→ Affiche : "Erreur de connexion. Vérifiez votre connexion internet."

✅ Status HTTP
- 401 → "Session expirée. Veuillez vous reconnecter."
- 403 → "Accès refusé..."
- 404 → "Ressource non trouvée."
- 500+ → "Erreur serveur..."

---

## 📋 Checklist d'Implémentation

### Backend

- [ ] Importer les classes d'erreurs dans les controllers
- [ ] Remplacer `res.status().json()` par `throw new XxxError()`
- [ ] Utiliser `asyncHandler()` sur les routes async
- [ ] Utiliser `SuccessMessages` pour les réponses de succès
- [ ] Tester avec Postman/curl

### Frontend

- [ ] Importer `showToast` dans les composants
- [ ] Wrap les appels API avec try/catch
- [ ] Utiliser `extractErrorMessage()` pour les erreurs
- [ ] Utiliser `SuccessMessages` pour les succès
- [ ] Tester dans le navigateur

---

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours utiliser les classes d'erreurs** au lieu de messages bruts
2. **Utiliser extractErrorMessage()** côté frontend
3. **Messages en français** pour l'utilisateur final
4. **Logger les erreurs** en développement (console.error)
5. **Ne jamais exposer les stack traces** en production

### ❌ À ÉVITER

1. ~~`throw new Error("User not found")`~~ → ❌ Anglais
2. ~~`res.status(404).json({ error: "..." })`~~ → ❌ Pas de throw
3. ~~`alert("Erreur !")`~~ → ❌ Utiliser showToast
4. ~~Messages techniques exposés à l'utilisateur~~ → ❌ Masquer en prod

---

## 🧪 Exemples de Tests

### Test Backend (Jest)

```typescript
describe('AuthController', () => {
  it('should throw InvalidCredentialsError on wrong password', async () => {
    const req = { body: { email: 'test@example.com', password: 'wrong' } };
    const res = {};

    await expect(authController.login(req, res))
      .rejects
      .toThrow(InvalidCredentialsError);
  });
});
```

### Test Frontend (React Testing Library)

```typescript
describe('Login', () => {
  it('should show error toast on invalid credentials', async () => {
    render(<Login />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Mot de passe'), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByText('Se connecter'));

    await waitFor(() => {
      expect(screen.getByText(/Email ou mot de passe incorrect/i)).toBeInTheDocument();
    });
  });
});
```

---

## 📊 Messages d'Erreur par Catégorie

### Auth
- ✅ "Non autorisé. Veuillez vous connecter."
- ✅ "Email ou mot de passe incorrect."
- ✅ "Votre session a expiré. Veuillez vous reconnecter."
- ✅ "Token invalide. Veuillez vous reconnecter."

### Users
- ✅ "Utilisateur non trouvé."
- ✅ "Un utilisateur avec cet email existe déjà."
- ✅ "Vous ne pouvez pas supprimer votre propre compte."
- ✅ "Impossible de supprimer le dernier administrateur."

### Documents
- ✅ "Document non trouvé."
- ✅ "Échec du téléversement du document."
- ✅ "Document téléversé avec succès."

### AI
- ✅ "Le service d'intelligence artificielle est temporairement indisponible."
- ✅ "Analyse terminée avec succès."

### Access
- ✅ "Accès refusé. Vous n'avez pas de fenêtre d'accès active."
- ✅ "Fenêtre d'accès créée avec succès."
- ✅ "La date de fin doit être après la date de début."

---

## 🚀 Migration Progressive

Pas besoin de tout refactoriser d'un coup !

**Phase 1** : Nouvelles fonctionnalités
- Utiliser le nouveau système pour tout nouveau code

**Phase 2** : Controllers critiques
- Refactoriser authController
- Refactoriser adminController
- Refactoriser documentController

**Phase 3** : Reste du code
- Refactoriser au fil des bugs/modifications

---

**🎯 Objectif** : Expérience utilisateur professionnelle avec des messages clairs en français !

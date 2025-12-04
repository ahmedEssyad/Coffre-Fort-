# 🧪 Guide de Test MayanConnect

## État du Système

✅ **Architecture refactorisée** : Frontend accède directement à Mayan API
✅ **Backend simplifié** : Auth + Accès temporaires + Proxy IA seulement
✅ **Documents disponibles** : 4 PDFs valides (IDs: 2, 3, 4, 5)
✅ **Services actifs** : Mayan, Backend, Frontend, Ollama, Keycloak

## Accès Réseau

- **Frontend** : http://10.17.14.203
- **Backend API** : http://10.17.14.203:3001
- **Mayan EDMS** : http://10.17.14.203:8000
- **Keycloak** : http://localhost:8080 (HTTPS requis pour IP)

---

## 🔐 Test 1 : Authentification

### Objectif
Vérifier que l'authentification JWT fonctionne avec accès réseau.

### Étapes
1. Ouvrir http://10.17.14.203 dans le navigateur
2. Login avec :
   - **Email** : `admin@mayanconnect.com`
   - **Password** : `admin123`
3. Vérifier redirection vers Dashboard

### Résultat Attendu
- ✅ Token JWT stocké dans localStorage
- ✅ Dashboard chargé avec statistiques
- ✅ Nom utilisateur affiché en haut

### Test Réseau
- Tester depuis **autre machine** sur même réseau
- Login doit fonctionner depuis n'importe quel device

---

## 📄 Test 2 : Visualisation Documents

### Objectif
Vérifier que les documents existants sont accessibles.

### Étapes
1. Aller dans **Documents** (menu gauche)
2. Vérifier la liste affiche 4 documents :
   - `20250415 Data privacy statement_consent form_vf 2.pdf`
   - `API SMS ALHILAL.pdf`
   - `correyo_pitch.pdf`
   - `API SMS ALHILAL.pdf` (duplicate)
3. Cliquer sur un document
4. Vérifier aperçu PDF s'affiche

### Résultat Attendu
- ✅ 4 documents listés
- ✅ Aperçu fonctionne
- ✅ Métadonnées affichées (date, type, etc.)

---

## ⬆️ Test 3 : Upload Document (CRITIQUE)

### Objectif
Tester le nouvel endpoint `/documents/upload/` avec accès direct.

### Étapes
1. Préparer **un fichier PDF** (PAS .docx!)
2. Cliquer **Upload Document**
3. Sélectionner le PDF
4. Choisir **Document Type** : General Document
5. Ajouter description (optionnel)
6. Soumettre

### Résultat Attendu
- ✅ Upload réussit (200 OK)
- ✅ Document apparaît dans la liste
- ✅ Document a une version valide (pas stub)
- ✅ Aperçu PDF disponible immédiatement

### Debug si échec
```bash
# Vérifier logs Mayan
docker-compose logs --tail=50 mayan | grep -i upload

# Vérifier Celery workers
docker-compose logs --tail=50 mayan | grep -i celery

# Vérifier document créé
curl -X GET "http://10.17.14.203:8000/api/v4/documents/{id}/versions/" \
  -H "Authorization: Token 9de3a9516fa002927cf01629ab173b2eb88a78f2"
```

---

## 🔍 Test 4 : OCR et Recherche

### Objectif
Vérifier que l'OCR Mayan fonctionne et permet la recherche.

### Documents Test
Les documents 2-5 devraient déjà avoir l'OCR (traité automatiquement).

### Étapes
1. Ouvrir un document
2. Vérifier onglet **OCR Content** ou texte extrait
3. Utiliser barre de recherche
4. Chercher mot présent dans un PDF (ex: "privacy", "API")
5. Vérifier résultats

### Résultat Attendu
- ✅ OCR content visible
- ✅ Recherche retourne documents pertinents
- ✅ Texte surligné dans résultats

### Vérifier OCR via API
```bash
# Check OCR status
curl -X GET "http://10.17.14.203:8000/api/v4/documents/2/versions/" \
  -H "Authorization: Token 9de3a9516fa002927cf01629ab173b2eb88a78f2"

# Get OCR content
curl -X GET "http://10.17.14.203:8000/api/v4/document_version_pages/{page_id}/ocr_content/" \
  -H "Authorization: Token 9de3a9516fa002927cf01629ab173b2eb88a78f2"
```

---

## 🤖 Test 5 : Analyse IA Locale

### Objectif
Vérifier que Ollama analyse les documents et génère résumés/mots-clés.

### Étapes
1. Ouvrir un document (ex: ID 2 - Data Privacy)
2. Cliquer **Analyser avec IA** ou bouton similaire
3. Attendre traitement (peut prendre 30s-2min)
4. Vérifier affichage :
   - **Résumé** : 2-3 phrases
   - **Mots-clés** : Liste de tags pertinents

### Résultat Attendu
- ✅ Résumé généré en français/anglais
- ✅ Mots-clés extraits
- ✅ Résultats stockés (cache)
- ✅ Réanalyse ne refait pas le travail si doc inchangé

### Test Cache
1. Analyser document
2. Fermer et rouvrir document
3. Résumé/mots-clés doivent s'afficher instantanément (depuis cache)

### Debug si échec
```bash
# Vérifier Ollama actif
docker-compose ps ollama

# Check modèle chargé
curl http://10.17.14.203:11434/api/tags

# Test direct Ollama
curl -X POST http://10.17.14.203:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"llama3.2","prompt":"Résume en 2 phrases: Test document","stream":false}'

# Vérifier logs backend
docker-compose logs --tail=100 backend | grep -i "ai\|ollama"
```

---

## ⏰ Test 6 : Accès Temporaire (CŒUR DU DÉFI)

### Objectif
Vérifier que les fenêtres temporelles contrôlent l'accès des utilisateurs.

### Prérequis
1. Créer utilisateur USER role :
```bash
# Via interface admin ou API
POST http://10.17.14.203:3001/api/admin/users
{
  "email": "user@test.com",
  "firstName": "Test",
  "lastName": "User",
  "role": "USER"
}
```

### Étapes

#### 6.1 Vérifier Accès Refusé par Défaut
1. Logout admin
2. Login avec `user@test.com` (utiliser lien reset password)
3. Tenter accéder Documents
4. **Résultat** : ❌ Erreur 403 "You do not have access at this time"

#### 6.2 Créer Fenêtre Temporaire
1. Relogin admin
2. Aller **Admin Panel** → **Temporary Access**
3. Créer accès pour `user@test.com` :
   - **Start Date** : maintenant
   - **End Date** : +2 heures
   - **Is Active** : ✅
4. Sauvegarder

#### 6.3 Vérifier Accès Accordé
1. Relogin user@test.com
2. Accéder Documents
3. **Résultat** : ✅ Liste documents visible
4. Vérifier Dashboard affiche **Access Status: Active**

#### 6.4 Vérifier Expiration
1. Modifier End Date → passé (ex: il y a 1h)
2. Relogin user
3. **Résultat** : ❌ Accès refusé
4. Dashboard affiche **Access Status: Expired**

### Résultat Attendu
- ✅ USER sans fenêtre = pas d'accès
- ✅ USER avec fenêtre active = accès complet
- ✅ USER avec fenêtre expirée = pas d'accès
- ✅ ADMIN/CONSULTANT = bypass (toujours accès)

### Vérifier via API
```bash
# Get user accesses
TOKEN=$(curl -X POST http://10.17.14.203:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}' | jq -r '.token')

curl -X GET http://10.17.14.203:3001/api/access/my-accesses \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📧 Test 7 : Emails avec Liens IP

### Objectif
Vérifier que les emails générés contiennent liens avec IP réseau.

### Étapes
1. Déclencher email (ex: Forgot Password)
2. Vérifier console backend (pas d'envoi réel en dev)
3. Vérifier template contient `http://10.17.14.203`

### Debug
```bash
# Check email service config
docker-compose logs backend | grep -i email

# Vérifier .env
grep FRONTEND_URL .env
# Doit afficher: FRONTEND_URL=http://10.17.14.203
```

---

## 🎯 Test 8 : SSO Keycloak (BONUS)

### Limitation Connue
⚠️ **SSO ne fonctionne PAS avec IP** à cause de crypto.subtle (HTTPS requis)

### Test Localhost Seulement
1. Accéder http://localhost (pas IP)
2. Cliquer **Login with Keycloak**
3. Redirection vers Keycloak
4. Login : `admin` / `admin`
5. Redirection retour

### Pour IP : Ignorer SSO
Le défi est réalisable sans SSO. Se concentrer sur :
- ✅ Auth JWT classique
- ✅ Gestion rôles
- ✅ Accès temporaires

---

## 📊 Checklist Validation Défi

### Infrastructure ✅
- [x] docker-compose.yml unique
- [x] Tous services conteneurisés
- [x] Lancement en 1 commande

### Gestion Utilisateurs ✅
- [x] Backend gère auth (JWT)
- [x] 3 rôles : ADMIN, CONSULTANT, USER
- [x] Fenêtres temporelles fonctionnelles

### IA Locale ✅
- [x] Ollama auto-hébergé
- [x] Résumés automatiques
- [x] Extraction mots-clés
- [x] Privacy-first (aucune donnée ne sort)

### Interface ✅
- [x] Client web (React)
- [x] Upload documents
- [x] Recherche OCR
- [x] Portail admin
- [x] Affichage résultats IA

### Bonus SSO ⚠️
- [ ] OIDC (fonctionne localhost seulement)
- [ ] Raison : crypto.subtle + IP = incompatible

---

## 🎬 Préparation Vidéo Démo (3-5 min)

### Séquence Recommandée

**00:00 - 00:30** : Installation
```bash
git clone <repo>
cd mayanconnect
./get-host-ip.sh
docker-compose up -d
```

**00:30 - 01:00** : Architecture
- Montrer docker-compose.yml
- Schéma des services
- Expliquer séparation responsabilités

**01:00 - 02:00** : Démo Utilisateur
- Login admin
- Upload PDF
- Recherche OCR
- Analyse IA (résumé + mots-clés)

**02:00 - 03:30** : Démo Accès Temporaire
- Créer USER
- Montrer accès refusé
- Créer fenêtre temporelle
- Montrer accès accordé

**03:30 - 04:00** : Portail Admin
- Gestion utilisateurs
- Gestion accès
- Dashboard stats

**04:00 - 05:00** : Privacy-First
- Montrer Ollama local
- Expliquer aucune donnée externe
- Conclusion

---

## 🐛 Troubleshooting

### Uploads deviennent stubs
```bash
# Vérifier Celery workers Mayan
docker-compose logs mayan | grep -i celery

# Check Redis
docker-compose ps redis

# Utiliser /documents/upload/ pas /documents/
```

### OCR ne fonctionne pas
```bash
# Redémarrer Mayan
docker-compose restart mayan

# Vérifier workers
docker-compose logs mayan | grep worker
```

### IA ne répond pas
```bash
# Check Ollama
curl http://10.17.14.203:11434/api/tags

# Télécharger modèle si absent
docker exec mayanconnect-ollama ollama pull llama3.2
```

### Accès temporaire ne marche pas
```bash
# Vérifier middleware
docker-compose logs backend | grep "temporary access"

# Check base de données
docker exec backend-postgres psql -U backend -d mayanconnect \
  -c "SELECT * FROM temporary_accesses;"
```

---

## ✅ Validation Finale

Avant soumission, vérifier :

- [ ] `docker-compose up -d` démarre tout
- [ ] Login fonctionne depuis autre machine (IP)
- [ ] Upload PDF crée document avec version valide
- [ ] OCR permet recherche
- [ ] IA génère résumé pertinent
- [ ] Accès temporaire bloque/autorise correctement
- [ ] Vidéo 3-5min enregistrée
- [ ] README.md explique installation
- [ ] Schéma architecture présent

---

## 🚀 Commande Rapide Tout Tester

```bash
# 1. Reset complet
docker-compose down -v
./get-host-ip.sh
docker-compose up -d

# 2. Attendre services (2-3 min)
sleep 180

# 3. Vérifier tout OK
curl http://10.17.14.203:3001/health
curl http://10.17.14.203:8000/api/v4/ -H "Authorization: Token 9de3a9516fa002927cf01629ab173b2eb88a78f2"
curl http://10.17.14.203:11434/api/tags

# 4. Login admin et tester interface
open http://10.17.14.203
```

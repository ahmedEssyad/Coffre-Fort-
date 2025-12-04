# 📹 Script de Démonstration MayanConnect

**Durée totale : 3-5 minutes**

---

## 🎬 Préparation Avant l'Enregistrement

### Étape 1 : Nettoyage complet
```bash
# Arrêter tous les conteneurs
docker-compose down -v

# Nettoyer les images Docker
docker system prune -a -f

# Vérifier que les ports sont libres
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :8000
```

### Étape 2 : Préparer le terminal
```bash
# Terminal propre, police lisible (16-18pt)
# Fond sombre recommandé
# Désactiver les notifications

# Naviguer vers le projet
cd /Users/admin/Desktop/nuitinfo
```

### Étape 3 : Préparer des documents de test
```bash
# Avoir 2-3 PDFs prêts à upload
# Exemple : facture.pdf, contrat.pdf, rapport.pdf
# Minimum 1 page de texte pour démonstration OCR et IA
```

### Étape 4 : Ouvrir les onglets navigateur
```
- Onglet 1 : http://localhost (Frontend - à rafraîchir après démarrage)
- Onglet 2 : Terminal pour commandes Docker
```

---

## 🎥 Script de la Vidéo (3-5 minutes)

### [0:00 - 0:30] INTRODUCTION (30 secondes)

**À DIRE** :
> "Bonjour ! Je vous présente MayanConnect, une architecture documentaire sécurisée, développée pour la Nuit de l'Informatique 2025.
>
> MayanConnect c'est :
> - Une architecture 100% conteneurisée avec Docker
> - Une séparation claire entre authentification et gestion documentaire
> - Une intelligence artificielle locale pour analyser les documents
> - Et un principe fondamental : Privacy-First, toutes vos données restent sur votre infrastructure."

**À MONTRER** :
- Écran du terminal avec le dossier nuitinfo ouvert
- Rapidement montrer la structure du projet (ls)

```bash
ls -la
# Montrer : docker-compose.yml, backend/, frontend/, README.md
```

---

### [0:30 - 1:15] INSTALLATION (45 secondes)

**À DIRE** :
> "L'installation est ultra-simple. Une seule commande suffit pour démarrer tous les services : frontend React, backend Node.js, Mayan EDMS pour la gestion documentaire, et Ollama avec le modèle Llama 3.2 pour l'intelligence artificielle."

**À FAIRE** :
```bash
# Lancer la commande (en time-lapse si trop long)
docker-compose up -d

# Attendre 10-15 secondes puis vérifier l'état
docker-compose ps

# Montrer que tous les services sont UP (7 conteneurs)
```

**À DIRE pendant que ça démarre** :
> "Le système déploie 7 services :
> - Le frontend en React
> - Notre backend custom avec Express et TypeScript
> - Mayan EDMS pour les documents
> - Ollama pour l'IA locale
> - 2 bases PostgreSQL séparées
> - Et Redis pour le cache."

**À MONTRER** :
```bash
# Vérifier que tout est UP
docker-compose ps

# Affichage attendu :
# ✅ mayanconnect-frontend   ... Up (healthy)
# ✅ mayanconnect-backend    ... Up (healthy)
# ✅ mayan-edms              ... Up (healthy)
# ✅ mayanconnect-ollama     ... Up
# ✅ backend-postgres        ... Up (healthy)
# ✅ mayan-postgres          ... Up (healthy)
# ✅ mayan-redis             ... Up (healthy)
```

**IMPORTANT** : Si ce n'est pas déjà fait, télécharger le modèle IA (à faire AVANT l'enregistrement) :
```bash
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b
```

---

### [1:15 - 2:30] DÉMO CLIENT & UPLOAD (1min15)

**À DIRE** :
> "Ouvrons maintenant l'application. L'interface est entièrement en français, moderne et responsive."

**À FAIRE** :
1. **Ouvrir http://localhost dans le navigateur**

2. **Créer un compte ADMIN** (si pas encore fait) :
   - Cliquer sur "S'inscrire" (ou utiliser API curl si montré avant)
   - Email : `admin@mayanconnect.com`
   - Prénom : Admin
   - Nom : User
   - Mot de passe : `Admin123!`
   - **OU** via curl (montrer dans terminal) :

   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Admin123!",
       "firstName": "Admin",
       "lastName": "User"
     }'
   ```

3. **Se connecter**
   - Email : `admin@example.com`
   - Mot de passe : `Admin123!`

**À DIRE** :
> "Nous voici sur le tableau de bord. On peut voir les statistiques : nombre de documents, documents analysés par l'IA, et mon statut d'accès."

4. **Navigation vers Documents**
   - Cliquer sur "Documents" dans le menu

**À DIRE** :
> "Maintenant, téléversons un document PDF."

5. **Upload un document**
   - Cliquer sur "Téléverser un Document"
   - Sélectionner un PDF (ex: facture.pdf, contrat.pdf)
   - Attendre l'upload (barre de progression)

**À DIRE pendant l'upload** :
> "Le document est automatiquement envoyé à Mayan EDMS qui lance l'OCR - la reconnaissance optique de caractères - pour rendre tout le texte consultable."

6. **Voir le document dans la liste**
   - Le document apparaît dans la liste
   - Badge "En cours de traitement OCR" ou "Prêt"

---

### [2:30 - 3:45] DÉMO IA (1min15)

**À DIRE** :
> "Maintenant, la fonctionnalité phare : l'analyse par intelligence artificielle. Cliquons sur notre document."

**À FAIRE** :
1. **Cliquer sur le document uploadé**
   - Le viewer PDF s'affiche avec le contenu

2. **Cliquer sur "Analyser"**

**À DIRE** :
> "En cliquant sur Analyser, le document est envoyé à notre modèle Llama 3.2, qui tourne localement dans un conteneur Docker. C'est capital : aucune donnée ne sort de notre serveur. Tout est traité sur l'infrastructure locale."

3. **Attendre l'analyse** (10-30 secondes)
   - L'icône de chargement apparaît

4. **Résultat de l'analyse s'affiche**
   - Résumé du document
   - Liste de mots-clés

**À DIRE** :
> "Et voilà ! Le modèle a généré un résumé intelligent du document et extrait les mots-clés principaux. Tout ça en quelques secondes, 100% local, sans API externe, sans abonnement OpenAI. Privacy-first !"

**À MONTRER (Bonus si temps)** :
- Faire une recherche OCR :
  ```
  Rechercher un mot du document → Résultats instantanés
  ```

---

### [3:45 - 4:45] DÉMO ADMIN & GESTION DES ACCÈS (1 minute)

**À DIRE** :
> "Passons maintenant à la partie administration. MayanConnect implémente un système de gestion des accès temporaires avec 3 rôles distincts."

**À FAIRE** :
1. **Naviguer vers "Administration"**
   - Cliquer sur "Administration" dans le menu

2. **Montrer la liste des utilisateurs**

**À DIRE** :
> "Nous avons 3 types de rôles :
> - USER : Accès temporaire aux documents, via des fenêtres horaires
> - CONSULTANT : Accès permanent aux documents
> - ADMIN : Contrôle total du système."

3. **Inviter un utilisateur**
   - Cliquer sur "Inviter un Utilisateur"
   - Remplir :
     - Email : `consultant@example.com`
     - Prénom : Jean
     - Nom : Dupont
     - **Rôle : CONSULTANT**
   - Envoyer l'invitation

**À DIRE** :
> "L'utilisateur reçoit automatiquement un email en français avec un lien pour définir son mot de passe."

4. **Créer une fenêtre d'accès temporaire**
   - Sélectionner un utilisateur USER (en créer un si nécessaire)
   - Cliquer sur "Gérer l'Accès"
   - Définir :
     - **Date de début** : Aujourd'hui 08:00
     - **Date de fin** : Dans 7 jours 18:00
   - Cliquer sur "Créer l'Accès"

**À DIRE** :
> "Voilà ! Cet utilisateur pourra accéder aux documents uniquement pendant cette fenêtre de temps. En dehors, l'accès est automatiquement bloqué par notre backend."

5. **Montrer les badges de statut**
   - Badge "Actif" (vert)
   - Badge "Programmé" (bleu)
   - Badge "Expiré" (rouge)

**À DIRE** :
> "Les badges de statut permettent de voir en un coup d'œil qui a accès actuellement."

6. **Changer le rôle d'un utilisateur (BONUS)**
   - Cliquer sur l'icône "Edit" (crayon)
   - Changer USER → CONSULTANT
   - Valider

**À DIRE** :
> "Et on peut facilement changer les rôles. Ici, je transforme un utilisateur standard en consultant, ce qui lui donne un accès permanent."

---

### [4:45 - 5:00] CONCLUSION (15 secondes)

**À DIRE** :
> "Et voilà ! En résumé, MayanConnect c'est :
> - Une architecture micro-services complète orchestrée par Docker
> - Une séparation stricte entre authentification et gestion documentaire
> - Une intelligence artificielle locale pour analyser vos documents sans compromettre la confidentialité
> - Et un système de gestion d'accès granulaire avec des fenêtres temporelles.
>
> Merci pour la Nuit de l'Informatique 2025 !"

**À MONTRER** :
- Écran final sur le dashboard avec les stats
- Ou retour au terminal avec `docker-compose ps` montrant tous les services UP

---

## 📊 Checklist Post-Vidéo

Après l'enregistrement, vérifier que la vidéo montre bien :

- [x] Installation en une commande (`docker-compose up -d`)
- [x] Tous les services UP (`docker-compose ps`)
- [x] Interface en français
- [x] Upload d'un document
- [x] OCR automatique (badge "Traitement" → "Prêt")
- [x] Analyse IA (bouton "Analyser")
- [x] Résumé + Mots-clés générés
- [x] Panneau admin
- [x] 3 rôles (USER, CONSULTANT, ADMIN)
- [x] Création d'une fenêtre d'accès temporaire
- [x] Badges de statut
- [x] Changement de rôle (bonus)

---

## 🎤 Conseils d'Enregistrement

### Audio
- ✅ Utiliser un micro de qualité
- ✅ Environnement calme sans écho
- ✅ Parler clairement, à un rythme normal (ni trop rapide, ni trop lent)
- ✅ Faire des pauses entre les sections

### Vidéo
- ✅ Résolution : Minimum 1080p (1920x1080)
- ✅ FPS : 30 ou 60
- ✅ Logiciel : OBS Studio, QuickTime (macOS), ou Loom
- ✅ Zoom sur le terminal quand nécessaire
- ✅ Pointer avec la souris les éléments importants

### Montage
- ✅ Accélérer (time-lapse) les parties longues :
  - `docker-compose up -d` (si > 30 sec)
  - Téléchargement du modèle IA
  - Traitement OCR
- ✅ Ajouter des annotations textuelles si besoin
- ✅ Music de fond (optionnel, volume faible)

### Durée
- ⏱️ **Minimum** : 3 minutes
- ⏱️ **Maximum** : 5 minutes
- ⏱️ **Idéal** : 4 minutes

---

## 🐛 Si Problème Pendant la Démo

### Le service ne démarre pas
```bash
docker-compose down
docker-compose up -d
# Attendre 2-3 minutes
```

### L'IA ne répond pas
```bash
# Vérifier le modèle
docker exec -it mayanconnect-ollama ollama list

# Le télécharger si absent
docker exec -it mayanconnect-ollama ollama pull llama3.2:3b
```

### OCR bloqué
```bash
# Redémarrer Mayan
docker-compose restart mayan-edms
```

### Token Mayan expiré
```bash
# Régénérer le token (voir README section Configuration)
docker exec -it mayan-edms python manage.py shell << EOF
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model
user = get_user_model().objects.get(username='admin')
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")
EOF

# Mettre à jour .env
# Redémarrer backend
docker-compose restart backend
```

---

## 📤 Export & Upload Vidéo

### Format recommandé
- **Format** : MP4 (H.264)
- **Résolution** : 1920x1080 (Full HD)
- **Bitrate** : 5-10 Mbps
- **Audio** : AAC, 192 kbps

### Plateformes de partage
- YouTube (Unlisted ou Public)
- Google Drive
- Dropbox
- Vimeo

### Dans le README du dépôt Git
Ajouter le lien vers la vidéo :
```markdown
## 📹 Vidéo de Démonstration

[Voir la démo complète (4min)](https://youtube.com/...)
```

---

**Bonne chance pour votre démonstration ! 🎬🚀**

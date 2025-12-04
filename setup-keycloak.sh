#!/bin/bash

# Script de configuration automatique Keycloak pour MayanConnect
# Compatible avec accès local et réseau

set -e

echo "🔐 Configuration Keycloak pour MayanConnect"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Charger HOST_IP depuis .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep HOST_IP | xargs)
fi

HOST_IP=${HOST_IP:-localhost}
KEYCLOAK_URL="http://${HOST_IP}:8080"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"
REALM="mayanconnect"

echo "📍 Configuration pour : $KEYCLOAK_URL"
echo ""

# Vérifier que Keycloak est démarré
echo "⏳ Vérification que Keycloak est accessible..."
for i in {1..30}; do
    if curl -s "$KEYCLOAK_URL" > /dev/null 2>&1; then
        echo "✅ Keycloak est accessible"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Erreur: Keycloak n'est pas accessible après 30 secondes"
        echo "💡 Vérifiez avec: docker-compose logs keycloak"
        exit 1
    fi
    sleep 1
done

echo ""
echo "📋 Étapes manuelles requises :"
echo ""
echo "1️⃣  Ouvrir Keycloak Admin Console"
echo "   → $KEYCLOAK_URL"
echo "   → Login: $ADMIN_USER / $ADMIN_PASSWORD"
echo ""
echo "2️⃣  Créer le Realm 'mayanconnect'"
echo "   → Menu déroulant 'Master' → Create Realm"
echo "   → Name: mayanconnect"
echo ""
echo "3️⃣  Créer le client 'frontend-app' (Public)"
echo "   → Clients → Create client"
echo "   → Client ID: frontend-app"
echo "   → Client authentication: OFF"
echo "   → Standard flow: ON"
echo "   → Direct access grants: ON"
echo "   → Valid redirect URIs:"
echo "       • http://localhost/*"
echo "       • http://$HOST_IP/*"
echo "   → Web origins:"
echo "       • http://localhost"
echo "       • http://$HOST_IP"
echo ""
echo "4️⃣  Créer le client 'backend-service' (Confidential)"
echo "   → Clients → Create client"
echo "   → Client ID: backend-service"
echo "   → Client authentication: ON"
echo "   → Standard flow: ON"
echo "   → Service accounts roles: ON"
echo "   → Valid redirect URIs: http://localhost:3001/*"
echo "   → COPIER LE CLIENT SECRET depuis l'onglet Credentials"
echo ""
echo "5️⃣  Créer les Realm Roles"
echo "   → Realm roles → Create role"
echo "   → Créer: admin, consultant, user"
echo ""
echo "6️⃣  Créer un utilisateur de test"
echo "   → Users → Add user"
echo "   → Username: admin@mayanconnect.com"
echo "   → Email verified: ON"
echo "   → Credentials → Set password: admin123 (Temporary: OFF)"
echo "   → Role mapping → Assign role: admin"
echo ""
echo "7️⃣  Mettre à jour .env avec le Client Secret"
echo "   → KEYCLOAK_CLIENT_SECRET=<coller_le_secret>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📖 Pour des instructions détaillées, consultez:"
echo "   → KEYCLOAK_SETUP.md"
echo ""
echo "🚀 Après configuration, redémarrez le backend:"
echo "   docker-compose restart backend"
echo ""

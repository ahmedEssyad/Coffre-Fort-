#!/bin/bash

# Script pour configurer HTTPS avec certificat auto-signé
# Compatible macOS et Linux

set -e

echo "🔒 Configuration HTTPS pour Coffre-Fort"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Charger HOST_IP depuis .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep HOST_IP | xargs)
fi

HOST_IP=${HOST_IP:-localhost}

echo "📍 IP détectée: $HOST_IP"
echo ""

# Créer le dossier ssl s'il n'existe pas
mkdir -p ssl

# Vérifier si les certificats existent déjà
if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
    echo "⚠️  Certificats SSL existants détectés"
    read -p "Voulez-vous les régénérer ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Utilisation des certificats existants"
        SKIP_CERT=true
    fi
fi

if [ "$SKIP_CERT" != "true" ]; then
    echo "🔑 Génération du certificat SSL auto-signé..."

    # Générer le certificat SSL auto-signé valide pour 365 jours
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=FR/ST=France/L=Paris/O=Coffre-Fort/OU=Dev/CN=$HOST_IP" \
        -addext "subjectAltName=IP:$HOST_IP,DNS:localhost,DNS:*.localhost" \
        2>/dev/null

    echo "✅ Certificat SSL généré avec succès"
    echo "   📄 Certificat: ssl/cert.pem"
    echo "   🔑 Clé privée: ssl/key.pem"
    echo ""
fi

# Mettre à jour .env avec HTTPS URLs
echo "📝 Mise à jour du fichier .env avec HTTPS..."

if [ -f .env ]; then
    # Backup
    cp .env .env.backup
    echo "📦 Backup créé: .env.backup"

    # Détecter l'OS pour sed
    OS="$(uname -s)"

    # Remplacer HTTP par HTTPS dans les URLs publiques
    if [[ "$OS" == "Darwin"* ]]; then
        sed -i '' "s|^MAYAN_API_URL_PUBLIC=http://|MAYAN_API_URL_PUBLIC=https://|" .env
        sed -i '' "s|^BACKEND_API_URL_PUBLIC=http://|BACKEND_API_URL_PUBLIC=https://|" .env
        sed -i '' "s|^FRONTEND_URL=http://|FRONTEND_URL=https://|" .env
    else
        sed -i "s|^MAYAN_API_URL_PUBLIC=http://|MAYAN_API_URL_PUBLIC=https://|" .env
        sed -i "s|^BACKEND_API_URL_PUBLIC=http://|BACKEND_API_URL_PUBLIC=https://|" .env
        sed -i "s|^FRONTEND_URL=http://|FRONTEND_URL=https://|" .env
    fi

    echo "✅ URLs mises à jour vers HTTPS"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Configuration HTTPS terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo ""
echo "1️⃣  Rebuild et redémarrer les services:"
echo "   docker-compose up -d --build"
echo ""
echo "2️⃣  Configurer Keycloak:"
echo "   • Ouvrir https://$HOST_IP:8443"
echo "   • Accepter le certificat auto-signé (warning)"
echo "   • Realm Settings → Frontend URL: https://$HOST_IP"
echo "   • Client frontend-app → Web origins: ajouter https://$HOST_IP"
echo "   • Client frontend-app → Valid redirect URIs: ajouter https://$HOST_IP/*"
echo ""
echo "3️⃣  Accéder à l'application:"
echo "   🌐 https://$HOST_IP"
echo ""
echo "⚠️  Note: Vous devrez accepter le certificat auto-signé"
echo "   dans votre navigateur (cliquer sur 'Avancé' → 'Continuer')"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

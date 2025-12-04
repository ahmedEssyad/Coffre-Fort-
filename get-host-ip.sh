#!/bin/bash

# Script pour détecter automatiquement l'IP de la machine hôte
# Compatible macOS et Linux

echo "🔍 Détection de l'adresse IP de la machine hôte..."

# Détecter l'OS
OS="$(uname -s)"

case "${OS}" in
    Linux*)
        # Linux: utiliser hostname -I ou ip route
        if command -v hostname &> /dev/null; then
            HOST_IP=$(hostname -I | awk '{print $1}')
        elif command -v ip &> /dev/null; then
            HOST_IP=$(ip route get 1 | awk '{print $7; exit}')
        else
            echo "❌ Erreur: Impossible de détecter l'IP sur Linux"
            exit 1
        fi
        ;;
    Darwin*)
        # macOS: utiliser ipconfig getifaddr
        # Essayer en0 (Ethernet/WiFi principal)
        if command -v ipconfig &> /dev/null; then
            HOST_IP=$(ipconfig getifaddr en0 2>/dev/null)
            # Si en0 n'existe pas, essayer en1 (WiFi sur certains Macs)
            if [ -z "$HOST_IP" ]; then
                HOST_IP=$(ipconfig getifaddr en1 2>/dev/null)
            fi
            # Si toujours rien, fallback sur ifconfig
            if [ -z "$HOST_IP" ]; then
                HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
            fi
        else
            echo "❌ Erreur: Impossible de détecter l'IP sur macOS"
            exit 1
        fi
        ;;
    *)
        echo "❌ Système d'exploitation non supporté: ${OS}"
        exit 1
        ;;
esac

# Vérifier que l'IP a été détectée
if [ -z "$HOST_IP" ]; then
    echo "❌ Erreur: Impossible de détecter l'adresse IP"
    echo "💡 Définissez manuellement avec: export HOST_IP=<votre_ip>"
    exit 1
fi

# Valider le format IP (IPv4)
if [[ ! $HOST_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "⚠️  Avertissement: IP détectée ne semble pas être une IPv4 valide: $HOST_IP"
fi

# Afficher l'IP détectée
echo "✅ IP détectée: $HOST_IP"

# Exporter la variable d'environnement
export HOST_IP=$HOST_IP

# Créer/mettre à jour le fichier .env
if [ -f .env ]; then
    # Backup du .env existant
    cp .env .env.backup
    echo "📦 Backup créé: .env.backup"

    # Remplacer ou ajouter HOST_IP
    if grep -q "^HOST_IP=" .env; then
        # Remplacer la ligne existante (macOS et Linux compatible)
        if [[ "$OS" == "Darwin"* ]]; then
            sed -i '' "s|^HOST_IP=.*|HOST_IP=$HOST_IP|" .env
        else
            sed -i "s|^HOST_IP=.*|HOST_IP=$HOST_IP|" .env
        fi
        echo "🔄 HOST_IP mis à jour dans .env"
    else
        # Ajouter la variable
        echo "HOST_IP=$HOST_IP" >> .env
        echo "➕ HOST_IP ajouté dans .env"
    fi

    # Mettre à jour les URLs publiques qui utilisent ${HOST_IP}
    if [[ "$OS" == "Darwin"* ]]; then
        sed -i '' "s|^MAYAN_API_URL_PUBLIC=.*|MAYAN_API_URL_PUBLIC=http://$HOST_IP:8000/api/v4|" .env
        sed -i '' "s|^BACKEND_API_URL_PUBLIC=.*|BACKEND_API_URL_PUBLIC=http://$HOST_IP:3001|" .env
        sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=http://$HOST_IP|" .env
    else
        sed -i "s|^MAYAN_API_URL_PUBLIC=.*|MAYAN_API_URL_PUBLIC=http://$HOST_IP:8000/api/v4|" .env
        sed -i "s|^BACKEND_API_URL_PUBLIC=.*|BACKEND_API_URL_PUBLIC=http://$HOST_IP:3001|" .env
        sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=http://$HOST_IP|" .env
    fi
    echo "🔄 URLs publiques mises à jour avec l'IP réseau"
else
    # Créer nouveau fichier .env
    echo "HOST_IP=$HOST_IP" > .env
    echo "📝 Fichier .env créé avec HOST_IP=$HOST_IP"
fi

echo ""
echo "🎯 Configuration terminée !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Adresse IP du serveur: $HOST_IP"
echo ""
echo "🚀 Lancez maintenant :"
echo "   docker-compose up -d --build"
echo ""
echo "🌐 L'application sera accessible sur :"
echo "   http://$HOST_IP         (Frontend)"
echo "   http://$HOST_IP:8080    (Keycloak)"
echo "   http://$HOST_IP:8000    (Mayan EDMS)"
echo "   http://$HOST_IP:3001    (Backend API)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

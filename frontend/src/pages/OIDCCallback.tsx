import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import keycloakService from '../services/keycloakService';
import { showToast } from '../utils/toast';
import { useAuthStore } from '../store/authStore';
import '../theme.css';

const OIDCCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const user = await keycloakService.handleCallback();

      if (user) {
        // Sauvegarder le token pour les autres services (mayanService, axios)
        if (user.access_token) {
          localStorage.setItem('auth_token', user.access_token);
        }

        // Extraire les infos utilisateur du token
        const userInfo = await keycloakService.getUserInfo();

        if (userInfo) {
          // Mettre à jour le store avec les infos utilisateur
          setUser({
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.firstName || '',
            lastName: userInfo.lastName || '',
            role: userInfo.roles?.includes('admin') ? 'ADMIN' :
                  userInfo.roles?.includes('consultant') ? 'CONSULTANT' : 'USER',
            isActive: true,
            createdAt: new Date().toISOString(),
          });

          showToast.success('Connexion réussie via SSO');
          navigate('/dashboard');
        } else {
          throw new Error('Impossible de récupérer les informations utilisateur');
        }
      } else {
        throw new Error('Échec de l\'authentification SSO');
      }
    } catch (err) {
      console.error('Erreur callback SSO:', err);
      setError(true);
      showToast.error('Échec de la connexion SSO. Veuillez réessayer.');

      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header" style={{ textAlign: 'center' }}>
          {error ? (
            <>
              <h1 className="login-title" style={{ color: 'var(--color-error)' }}>
                Échec de la connexion
              </h1>
              <p className="login-subtitle">
                Redirection vers la page de connexion...
              </p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Loader2 size={48} className="spin" style={{ color: 'var(--color-primary)' }} />
              </div>
              <h1 className="login-title">Connexion en cours...</h1>
              <p className="login-subtitle">
                Veuillez patienter pendant que nous finalisons votre authentification SSO.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OIDCCallback;

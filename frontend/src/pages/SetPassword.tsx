import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import authService from '../services/authService';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './SetPassword.css';

function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');

    if (!tokenParam) {
      setError('Jeton invalide ou manquant');
    } else {
      setToken(tokenParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      const errorMsg = 'Le mot de passe doit contenir au moins 6 caractères';
      setError(errorMsg);
      showToast.warning(errorMsg);
      return;
    }

    if (password !== confirmPassword) {
      const errorMsg = 'Les mots de passe ne correspondent pas';
      setError(errorMsg);
      showToast.warning(errorMsg);
      return;
    }

    setLoading(true);

    try {
      await authService.setPassword(token, password);
      setSuccess(true);
      showToast.success(SuccessMessages.PASSWORD_CHANGED);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="set-password-container">
        <div className="set-password-card card">
          <p className="text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="set-password-container">
        <div className="set-password-card card text-center">
          <div className="success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="success-title">Mot de Passe Défini avec Succès !</h1>
          <p className="text-secondary">Votre mot de passe a été défini. Vous pouvez maintenant vous connecter avec vos nouveaux identifiants.</p>
          <p className="redirect-message text-secondary">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="set-password-container">
      <div className="set-password-card card">
        <div className="header">
          <h1 className="set-password-title">Définir Votre Mot de Passe</h1>
          <p className="set-password-subtitle text-secondary">Créez un mot de passe sécurisé pour votre compte MayanConnect</p>
        </div>

        {error && (
          <div className="error-message text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="set-password-form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">Nouveau Mot de Passe</label>
            <input
              type="password"
              id="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              disabled={loading || !token}
              required
            />
            <small className="text-secondary">Doit contenir au moins 6 caractères</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirmer le Mot de Passe</label>
            <input
              type="password"
              id="confirmPassword"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre mot de passe"
              disabled={loading || !token}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-button"
            disabled={loading || !token}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Définition du mot de passe...
              </>
            ) : (
              'Définir le Mot de Passe'
            )}
          </button>
        </form>

        <div className="back-to-login mt-lg text-center">
          <Link to="/login" className="forgot-link">Retour à la Connexion</Link>
        </div>
      </div>
    </div>
  );
}

export default SetPassword;

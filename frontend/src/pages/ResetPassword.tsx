import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Jeton de réinitialisation invalide ou manquant. Veuillez demander un nouveau lien de réinitialisation.');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      const errorMsg = 'Jeton de réinitialisation invalide';
      setError(errorMsg);
      showToast.error(errorMsg);
      return;
    }

    if (!password) {
      const errorMsg = 'Veuillez entrer un nouveau mot de passe';
      setError(errorMsg);
      showToast.warning(errorMsg);
      return;
    }

    if (password.length < 8) {
      const errorMsg = 'Le mot de passe doit contenir au moins 8 caractères';
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
      await authApi.setPassword({ token, password });
      setSuccess(true);
      showToast.success(SuccessMessages.PASSWORD_CHANGED);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card card">
          <div className="error-content">
            <div className="error-icon-large">
              <AlertCircle size={48} />
            </div>
            <h1 className="error-title">Lien de Réinitialisation Invalide</h1>
            <p className="error-message-text">
              Ce lien de réinitialisation de mot de passe est invalide ou a expiré.
            </p>
            <Link to="/forgot-password" className="btn btn-primary">
              Demander un Nouveau Lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card card">
          <div className="success-content">
            <div className="success-icon">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="success-title">Réinitialisation Réussie !</h1>
            <p className="success-message">
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <p className="redirect-message">
              Redirection vers la connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card card">
        <div className="header">
          <h1 className="reset-password-title">Définir un Nouveau Mot de Passe</h1>
          <p className="reset-password-subtitle">
            Entrez votre nouveau mot de passe ci-dessous.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message text-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Nouveau Mot de Passe
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />
            <small className="text-muted">Doit contenir au moins 8 caractères</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirmer le Mot de Passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Réinitialisation...
              </>
            ) : (
              'Réinitialiser le Mot de Passe'
            )}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="back-link">
              Retour à la Connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import { showToast, extractErrorMessage } from '../utils/toast';
import '../theme.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      const errorMsg = 'Veuillez entrer votre adresse email';
      setError(errorMsg);
      showToast.warning(errorMsg);
      return;
    }

    setLoading(true);

    try {
      await authApi.forgotPassword(email);
      setSuccess(true);
      showToast.success('Email de réinitialisation envoyé avec succès');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card card">
          <div className="success-content">
            <div className="success-icon">
              <CheckCircle2 size={48} />
            </div>
            <h1 className="success-title">Vérifiez Votre Email</h1>
            <p className="success-message">
              Si un compte existe avec <strong>{email}</strong>, vous recevrez un lien de
              réinitialisation de mot de passe sous peu.
            </p>
            <p className="success-note">
              Veuillez vérifier votre boîte de réception et votre dossier spam. Le lien expirera dans 1 heure.
            </p>
            <Link to="/login" className="btn btn-primary back-to-login-btn">
              <ArrowLeft size={18} />
              Retour à la Connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card card">
        <div className="header">
          <h1 className="forgot-password-title">Réinitialiser le Mot de Passe</h1>
          <p className="forgot-password-subtitle">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="error-message text-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Adresse Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              required
              autoFocus
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
                Envoi du lien de réinitialisation...
              </>
            ) : (
              'Envoyer le Lien de Réinitialisation'
            )}
          </button>

          <div className="back-to-login">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              Retour à la Connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

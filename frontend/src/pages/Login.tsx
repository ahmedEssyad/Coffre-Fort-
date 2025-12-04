import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, KeyRound } from 'lucide-react';
import authService from '../services/authService';
import keycloakService from '../services/keycloakService';
import { useAuthStore } from '../store/authStore';
import { showToast, extractErrorMessage, SuccessMessages } from '../utils/toast';
import '../theme.css';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

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
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = async () => {
    try {
      await keycloakService.login();
    } catch (err) {
      showToast.error('Échec de la connexion SSO. Veuillez réessayer.');
      console.error('SSO login error:', err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <h1 className="login-title">MayanConnect</h1>
          <p className="login-subtitle">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message text-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
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

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>

          <div className="login-footer">
            <Link to="/forgot-password" className="forgot-link">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>

        <div className="login-divider">
          <span>OU</span>
        </div>

        <button
          type="button"
          className="btn btn-sso"
          onClick={handleSSOLogin}
        >
          <KeyRound size={18} />
          Se connecter avec SSO
        </button>
      </div>
    </div>
  );
};

export default Login;

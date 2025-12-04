import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import authService from '../services/authService';
import { useAuthStore } from '../store/authStore';
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
      return;
    }

    setLoading(true);

    try {
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by authService and stored in authStore
      console.error('Login error:', err);
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
};

export default Login;

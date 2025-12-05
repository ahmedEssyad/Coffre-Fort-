import { useAuthStore } from '../../store/authStore';
import authService from '../../services/authService';
import '../../theme.css';
import './Header.css';

const Header = () => {
  const { user } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-logo">Coffre-Fort</h1>
        </div>

        <div className="header-right">
          {user && (
            <div className="user-menu">
              <span className="user-name">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

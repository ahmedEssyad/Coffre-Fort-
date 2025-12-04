import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import '../../theme.css';
import './Sidebar.css';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requireAdmin?: boolean;
}

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: 'Tableau de Bord', icon: '📊' },
    { path: '/documents', label: 'Documents', icon: '📄' },
    { path: '/admin', label: 'Administration', icon: '⚙️', requireAdmin: true },
  ];

  const isActive = (path: string) => {
    if (path === '/documents') {
      return location.pathname.startsWith('/documents');
    }
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems
          .filter((item) => !item.requireAdmin || user?.role === 'ADMIN')
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

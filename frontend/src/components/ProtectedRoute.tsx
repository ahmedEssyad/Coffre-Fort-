import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user, setUser } = useAuthStore();

  useEffect(() => {
    // Load user info if authenticated but user not loaded
    if (isAuthenticated && !user) {
      authService.loadUser().catch(() => {
        // If loading user fails, will redirect to login
      });
    }
  }, [isAuthenticated, user, setUser]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

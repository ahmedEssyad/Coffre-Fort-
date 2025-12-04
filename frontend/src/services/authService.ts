import { authApi, LoginRequest } from './api';
import { useAuthStore } from '../store/authStore';

class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<void> {
    const { setLoading, setError, login } = useAuthStore.getState();

    try {
      setLoading(true);
      setError(null);

      const response = await authApi.login(credentials);
      login(response.user, response.token);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Logout user
  logout(): void {
    const { logout } = useAuthStore.getState();
    logout();
  }

  // Load current user info
  async loadUser(): Promise<void> {
    const { setUser, setError, logout } = useAuthStore.getState();

    try {
      const response = await authApi.me();
      setUser(response.user);
    } catch (error: any) {
      // If token is invalid, logout
      if (error.response?.status === 401) {
        logout();
      }
      setError('Failed to load user');
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const { isAuthenticated } = useAuthStore.getState();
    return isAuthenticated;
  }

  // Get current user
  getCurrentUser() {
    const { user } = useAuthStore.getState();
    return user;
  }

  // Set password (from email link)
  async setPassword(token: string, password: string): Promise<void> {
    try {
      await authApi.setPassword({ token, password });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to set password';
      throw new Error(errorMessage);
    }
  }

  // Request password reset
  async forgotPassword(email: string): Promise<void> {
    try {
      await authApi.forgotPassword(email);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to send password reset email';
      throw new Error(errorMessage);
    }
  }
}

export default new AuthService();

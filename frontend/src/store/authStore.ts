import { create } from 'zustand';
import { User } from '../services/api';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage
  const storedToken = localStorage.getItem('auth_token');
  const storedUser = localStorage.getItem('auth_user');

  return {
    // Initial state
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    isLoading: false,
    error: null,

    // Actions
    setUser: (user) => {
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user });
    },

    setToken: (token) => {
      localStorage.setItem('auth_token', token);
      set({ token, isAuthenticated: true });
    },

    setError: (error) => set({ error }),

    setLoading: (loading) => set({ isLoading: loading }),

    login: (user, token) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        error: null,
      });
    },

    logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    },

    clearError: () => set({ error: null }),
  };
});

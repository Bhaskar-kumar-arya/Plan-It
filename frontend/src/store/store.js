import { create } from 'zustand';
import { setAuthToken } from '../api';

export const useAuthStore = create((set) => ({
  // State
  user: null,
  token: localStorage.getItem('token') || null,
  isAuth: !!localStorage.getItem('token'),

  // Actions
  login: (userData, token) => {
    // 1. Set token in localStorage
    localStorage.setItem('token', token);
    // 2. Set default auth header for axios
    setAuthToken(token);
    // 3. Update state
    set({ user: userData, token, isAuth: true });
  },

  logout: () => {
    // 1. Remove token from localStorage
    localStorage.removeItem('token');
    // 2. Remove auth header
    setAuthToken(null);
    // 3. Update state
    set({ user: null, token: null, isAuth: false });
  },

  // Action to initialize state from localStorage on app load
  init: () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      // You might want to add a 'GET /api/auth/me' endpoint
      // to fetch user data here and verify the token.
      // For now, we just set the auth header.
    }
  },
}));

// Initialize the auth state on app load
useAuthStore.getState().init();
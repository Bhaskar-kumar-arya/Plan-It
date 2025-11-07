import { create } from 'zustand';
import { setAuthToken } from '../api';

export const useAuthStore = create((set) => ({
  // State
  user: null, // We'll load this from localStorage in init
  token: localStorage.getItem('token') || null,
  isAuth: !!localStorage.getItem('token'),

  // Actions
  login: (userData, token) => {
    // 1. Set items in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData)); // <-- ADD THIS

    // 2. Set default auth header for axios
    setAuthToken(token);
    // 3. Update state
    set({ user: userData, token, isAuth: true });
  },

  logout: () => {
    // 1. Remove items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // <-- ADD THIS

    // 2. Remove auth header
    setAuthToken(null);
    // 3. Update state
    set({ user: null, token: null, isAuth: false });
  },

  // Action to initialize state from localStorage on app load
  init: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user'); // <-- GET USER

    if (token && user) {
      setAuthToken(token);
      // Re-hydrate the full auth state
      set({
        user: JSON.parse(user), // <-- SET USER
        token: token,
        isAuth: true,
      });
    } else {
      // Ensure we're logged out if data is partial/missing
      set({ user: null, token: null, isAuth: false });
    }
  },
}));

// Initialize the auth state on app load
useAuthStore.getState().init();
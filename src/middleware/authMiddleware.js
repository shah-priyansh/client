import { store } from '../store';
import { checkAuthStatus, logoutUser } from '../store/slices/authSlice';

// Auth middleware class
class AuthMiddleware {
  constructor() {
    this.isInitialized = false;
    this.authCheckPromise = null;
  }

  // Initialize the middleware
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.checkAuthStatus();
      this.isInitialized = true;
    } catch (error) {
      console.error('Auth middleware initialization failed:', error);
    }
  }

  // Check authentication status
  async checkAuthStatus() {
    if (this.authCheckPromise) {
      return this.authCheckPromise;
    }

    this.authCheckPromise = store.dispatch(checkAuthStatus());
    
    try {
      await this.authCheckPromise;
    } finally {
      this.authCheckPromise = null;
    }
  }

  // Get current auth state
  getAuthState() {
    const state = store.getState();
    return {
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
      loading: state.auth.loading,
      token: state.auth.token
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const state = store.getState();
    return state.auth.isAuthenticated;
  }




  // Logout user
  async logout() {
    try {
      await store.dispatch(logoutUser());
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('sales-management-token');
  }

  // Set token in localStorage
  setToken(token) {
    if (token) {
      localStorage.setItem('sales-management-token', token);
    } else {
      localStorage.removeItem('sales-management-token');
    }
  }

  // Clear all auth data
  clearAuth() {
    localStorage.removeItem('sales-management-token');
    this.setToken(null);
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

export default authMiddleware;

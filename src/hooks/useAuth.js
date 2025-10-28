import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { 
  selectIsAuthenticated, 
  selectUser, 
  selectAuthLoading, 
  selectAuthError,
  selectIsAdmin,
  selectIsSalesman
} from '../store/slices/authSlice';
import { loginUser, logoutUser, checkAuthStatus } from '../store/slices/authSlice';
import authMiddleware from '../middleware/authMiddleware';

export const useAuth = () => {
  const dispatch = useDispatch();
  
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const isAdmin = useSelector(selectIsAdmin);
  const isSalesman = useSelector(selectIsSalesman);

  // Auth methods
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials));
      return {
        success: result.meta.requestStatus === 'fulfilled',
        error: result.meta.requestStatus === 'rejected' ? result.payload : null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser());
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    try {
      await dispatch(checkAuthStatus());
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  // Role checking methods
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  // Middleware methods
  const getAuthState = useCallback(() => {
    return authMiddleware.getAuthState();
  }, []);

  const getToken = useCallback(() => {
    return authMiddleware.getToken();
  }, []);

  const clearAuth = useCallback(() => {
    authMiddleware.clearAuth();
  }, []);

  return {
    // State
    isAuthenticated,
    user,
    loading,
    error,
    isAdmin,
    isSalesman,
    
    // Methods
    login,
    logout,
    checkAuth,
    hasRole,
    hasAnyRole,
    getAuthState,
    getToken,
    clearAuth
  };
};

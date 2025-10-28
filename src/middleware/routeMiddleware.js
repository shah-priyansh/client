import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authMiddleware from './authMiddleware';


const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);


export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authMiddleware.checkAuthStatus();
        const authState = authMiddleware.getAuthState();
        
        if (authState.isAuthenticated) {
          setShouldRedirect(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (shouldRedirect) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};


export const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login',
  requireAuth = true 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState(redirectTo);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authMiddleware.checkAuthStatus();
        const authState = authMiddleware.getAuthState();
        
        if (requireAuth && !authState.isAuthenticated) {
          setShouldRedirect(true);
          setRedirectPath('/login');
        } 
      } catch (error) {
        console.error('Auth check failed:', error);
        if (requireAuth) {
          setShouldRedirect(true);
          setRedirectPath('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles, requireAuth]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (shouldRedirect) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }

  return children;
};

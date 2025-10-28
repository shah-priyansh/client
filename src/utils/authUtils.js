import authMiddleware from '../middleware/authMiddleware';

// Check if user is authenticated
export const isAuthenticated = () => {
  return authMiddleware.isAuthenticated();
};

// Check if user has specific role
export const hasRole = (role) => {
  return authMiddleware.hasRole(role);
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  return authMiddleware.hasAnyRole(roles);
};

// Get current user
export const getCurrentUser = () => {
  const state = authMiddleware.getAuthState();
  return state.user;
};

// Get user token
export const getToken = () => {
  return authMiddleware.getToken();
};

// Check if token exists and is valid
export const hasValidToken = () => {
  const token = getToken();
  return !!token;
};

// Clear all authentication data
export const clearAuth = () => {
  authMiddleware.clearAuth();
};

// Format user display name
export const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.username) {
    return user.username;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
};

// Get user initials for avatar
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  if (user.username) {
    return user.username[0].toUpperCase();
  }
  
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  
  return 'U';
};

// Check if user can access a specific feature
export const canAccessFeature = (feature, user) => {
  const currentUser = user || getCurrentUser();
  
  if (!currentUser) return false;
  
  // Define feature permissions
  const featurePermissions = {
    'users': ['admin'],
    'clients': ['admin'],
    'areas': ['admin'],
    'dashboard': ['admin', 'salesman'],
    'reports': ['admin'],
    'settings': ['admin']
  };
  
  const requiredRoles = featurePermissions[feature] || [];
  
  if (requiredRoles.length === 0) return true;
  
  return hasAnyRole(requiredRoles);
};

// Validate token format (basic validation)
export const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  // Basic JWT token format validation
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  return jwtRegex.test(token);
};

// Check if token is expired (basic check)
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};


// Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
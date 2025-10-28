import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import apiClient from '../../utils/axiosConfig';
// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data;

      // Store token in localStorage
      localStorage.setItem('sales-management-token', token);

      return { token, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Remove token from localStorage
      localStorage.removeItem('sales-management-token');

      // Remove auth header
      delete apiClient.defaults.headers.common['Authorization'];

      return null;
    } catch (error) {
      return rejectWithValue('Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('sales-management-token');
      if (!token) {
        // No token found - user is not logged in, this is not an error
        return rejectWithValue('NO_TOKEN');
      }

      // Set auth header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      return token;
    } catch (error) {
      // Check if it's a network error or server error
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          // Unauthorized - token is invalid
          localStorage.removeItem('sales-management-token');
          delete apiClient.defaults.headers.common['Authorization'];
          return rejectWithValue('INVALID_TOKEN');
        } else if (error.response.status >= 500) {
          // Server error
          return rejectWithValue('SERVER_ERROR');
        } else {
          // Other client errors
          return rejectWithValue('AUTH_ERROR');
        }
      } else if (error.request) {
        // Network error
        return rejectWithValue('NETWORK_ERROR');
      } else {
        // Other errors
        localStorage.removeItem('sales-management-token');
        delete apiClient.defaults.headers.common['Authorization'];
        return rejectWithValue('UNKNOWN_ERROR');
      }
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
        await apiClient.post('/auth/change-password', passwordData);
      return 'Password changed successfully';
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('sales-management-token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        toast.success('Login successful!');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        toast.success('Logged out successfully');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
        toast.error(action.payload);
      })

      // Check auth status
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        
        // Only show error messages for actual errors, not for normal cases
        const errorType = action.payload;
        if (errorType === 'NO_TOKEN') {
          // No token - user is not logged in, this is normal
          state.error = null;
        } else if (errorType === 'INVALID_TOKEN') {
          // Invalid token - show error
          state.error = 'Session expired. Please login again.';
          toast.error('Session expired. Please login again.');
        } else if (errorType === 'SERVER_ERROR') {
          // Server error
          state.error = 'Server error. Please try again later.';
          toast.error('Server error. Please try again later.');
        } else if (errorType === 'NETWORK_ERROR') {
          // Network error
          state.error = 'Network error. Please check your connection.';
          toast.error('Network error. Please check your connection.');
        } else {
          // Other errors
          state.error = 'Authentication failed. Please login again.';
          toast.error('Authentication failed. Please login again.');
        }
      })

      // Change password
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        toast.success(action.payload);
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { clearError, setLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';
export const selectIsSalesman = (state) => state.auth.user?.role === 'salesman';

export default authSlice.reducer;

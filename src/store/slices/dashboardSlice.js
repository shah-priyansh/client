import apiClient from '../../utils/axiosConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard data';
      return rejectWithValue(message);
    }
  }
);

export const fetchSalesmenDashboard = createAsyncThunk(
  'dashboard/fetchSalesmenDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/salesmen/dashboard');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard data';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  stats: {
    totalSalesmen: 0,
    totalClients: 0,
    totalAreas: 0,
    totalInquiries: 0,
  },
  recentSalesmen: [],
  recentClients: [],
  recentInquiries: [],
  salesmenStats: {
    totalClients: 0,
    statusCounts: {},
  },
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDashboard: (state) => {
      state.stats = {
        totalSalesmen: 0,
        totalClients: 0,
        totalAreas: 0,
        totalInquiries: 0,
      };
      state.recentSalesmen = [];
      state.recentClients = [];
      state.recentInquiries = [];
      state.salesmenStats = {
        totalClients: 0,
        statusCounts: {},
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin dashboard
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentSalesmen = action.payload.recentSalesmen;
        state.recentClients = action.payload.recentClients;
        state.recentInquiries = action.payload.recentInquiries;
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Fetch salesmen dashboard
      .addCase(fetchSalesmenDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesmenDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.salesmenStats = action.payload.stats;
        state.recentClients = action.payload.recentClients;
        state.error = null;
      })
      .addCase(fetchSalesmenDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { clearError, clearDashboard } = dashboardSlice.actions;

// Selectors
export const selectDashboard = (state) => state.dashboard;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectRecentSalesmen = (state) => state.dashboard.recentSalesmen;
export const selectRecentClients = (state) => state.dashboard.recentClients;
export const selectRecentInquiries = (state) => state.dashboard.recentInquiries;
export const selectSalesmenStats = (state) => state.dashboard.salesmenStats;

export default dashboardSlice.reducer;

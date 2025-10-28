import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/axiosConfig';


// Async thunks
export const fetchAreas = createAsyncThunk('areas/fetchAreas', async (params = {}, { rejectWithValue }) => {
  try {
    const { page = 1, limit = 20, search = '', city = '', isActive = '' } = params;
    const response = await apiClient.get('/areas', {
      params: { page, limit, search, city, isActive }
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch areas');
  }
});

export const addAreaFetch = createAsyncThunk('areas/addAreaFetch', async (area, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/areas', area);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add area');
  }
});

export const deleteAreaFetch = createAsyncThunk('areas/deleteAreaFetch', async (areaId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/areas/${areaId}`);
    return areaId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete area');
  }
});

export const toggleAreaStatusFetch = createAsyncThunk('areas/toggleAreaStatusFetch', async (areaId, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(`/areas/${areaId}/toggle-status`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle area status');
  }
});

export const updateAreaFetch = createAsyncThunk('areas/updateAreaFetch', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put(`/areas/${id}`, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update area');
  }
});

const initialState = {
  areas: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  },
  loading: false,
  error: null
};

const areaSlice = createSlice({
  name: 'areas',
  initialState,
  reducers: {
    addArea: (state, action) => {
      const newArea = {
        ...action.payload,
        _id: action.payload._id || Date.now().toString(),
        createdAt: action.payload.createdAt || new Date().toISOString().split('T')[0],
        isActive: action.payload.isActive === 'true' || action.payload.isActive === true
      };
      state.areas.push(newArea);
    },
    deleteArea: (state, action) => {
      state.areas = state.areas.filter(area => area._id !== action.payload);
    },
    toggleAreaStatus: (state, action) => {
      const area = state.areas.find(a => a._id === action.payload);
      if (area) {
        area.isActive = !area.isActive;
      }
    },
    updateArea: (state, action) => {
      const index = state.areas.findIndex(area => area._id === action.payload._id);
      if (index !== -1) {
        state.areas[index] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch areas
      .addCase(fetchAreas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAreas.fulfilled, (state, action) => {
        state.loading = false;
        state.areas = action.payload.areas;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAreas.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add area fetch
      .addCase(addAreaFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAreaFetch.fulfilled, (state, action) => {
        state.loading = false;
        state.areas.push(action.payload.data);
      })
      .addCase(addAreaFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete area fetch
      .addCase(deleteAreaFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAreaFetch.fulfilled, (state, action) => {
        state.loading = false;
        state.areas = state.areas.filter(area => area._id !== action.payload);
      })
      .addCase(deleteAreaFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Toggle area status fetch
      .addCase(toggleAreaStatusFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleAreaStatusFetch.fulfilled, (state, action) => {
        state.loading = false;
        const updatedArea = action.payload.data;
        const areaIndex = state.areas.findIndex(a => a._id === updatedArea._id);
        if (areaIndex !== -1) {
          state.areas[areaIndex] = updatedArea;
        }
      })
      .addCase(toggleAreaStatusFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update area fetch
      .addCase(updateAreaFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAreaFetch.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.areas.findIndex(area => area._id === action.payload.data._id);
        if (index !== -1) {
          state.areas[index] = action.payload.data;
        }
      })
      .addCase(updateAreaFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { addArea, deleteArea, toggleAreaStatus, updateArea, clearError } = areaSlice.actions;
export const selectAreas = (state) => state?.area?.areas || [];
export const selectAreasLoading = (state) => state?.area?.loading || false;
export const selectAreasError = (state) => state?.area?.error || null;
export const selectAreasPagination = (state) => state?.area?.pagination || {
  currentPage: 1,
  totalPages: 1,
  total: 0,
  limit: 20
};

export default areaSlice.reducer;

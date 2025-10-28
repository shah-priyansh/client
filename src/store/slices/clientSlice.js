import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/axiosConfig';

// Async thunks for API calls
export const fetchClients = createAsyncThunk('clients/fetchClients', async (params = {}, { rejectWithValue }) => {
  try {
    const { page = 1, search = '', area = '', status = '', limit = 20 } = params;
    let url = `/clients?page=${page}&search=${search}&limit=${limit}`;
    if (area) {
      url += `&area=${area}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch clients');
  }
});

export const deleteClientFetch = createAsyncThunk('clients/deleteClientFetch', async (clientId, { rejectWithValue }) => {
  try {
    await apiClient.delete(`/clients/${clientId}`);
    return clientId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete client');
  }
});

export const toggleClientStatusFetch = createAsyncThunk('clients/toggleClientStatusFetch', async (clientId, { rejectWithValue }) => {
  try {
    const response = await apiClient.patch(`/clients/${clientId}/toggle-status`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle client status');
  }
});

export const createClientFetch = createAsyncThunk('clients/createClientFetch', async (clientData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/clients', clientData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create client');
  }
});

export const updateClientFetch = createAsyncThunk('clients/updateClientFetch', async ({ clientId, clientData }, { rejectWithValue }) => {
  try {
    const response = await apiClient.put(`/clients/${clientId}`, clientData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update client');
  }
});

export const fetchSalesmenByCity = createAsyncThunk('clients/fetchSalesmenByCity', async (city, { rejectWithValue }) => {
  try {
    const response = await apiClient.get(`/clients/salesmen/by-city?city=${encodeURIComponent(city)}`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch salesmen');
  }
});

export const fetchAreasBySalesmanCity = createAsyncThunk('clients/fetchAreasBySalesmanCity', async (_, { rejectWithValue }) => {
  try {
    const response = await apiClient.get('/clients/salesman/areas');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch areas');
  }
});

const initialState = {
  clients: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 20
  },
  salesmen: [],
  salesmenLoading: false,
  salesmenError: null,
  salesmanAreas: [],
  salesmanAreasLoading: false,
  salesmanAreasError: null,
  salesmanArea: null,
  loading: false,
  error: null
};

const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    addClient: (state, action) => {
      state.clients.push(action.payload);
    },
    deleteClient: (state, action) => {
      state.clients = state.clients.filter(client => client._id !== action.payload);
    },
    toggleClientStatus: (state, action) => {
      const client = state.clients.find(c => c._id === action.payload);
      if (client) {
        client.isActive = !client.isActive;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSalesmen: (state) => {
      state.salesmen = [];
      state.salesmenError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch clients
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload.clients;
        state.pagination = {
          currentPage: action.payload.currentPage,
          totalPages: action.payload.totalPages,
          total: action.payload.total,
          limit: 20
        };
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete client fetch
      .addCase(deleteClientFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteClientFetch.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = state.clients.filter(client => client._id !== action.payload);
      })
      .addCase(deleteClientFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle client status fetch
      .addCase(toggleClientStatusFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleClientStatusFetch.fulfilled, (state, action) => {
        state.loading = false;
        const client = state.clients.find(c => c._id === action.payload.data._id);
        if (client) {
          client.isActive = action.payload.data.isActive;
        }
      })
      .addCase(toggleClientStatusFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create client fetch
      .addCase(createClientFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClientFetch.fulfilled, (state, action) => {
        state.loading = false;
        state.clients.push(action.payload);
        state.pagination.total++;
      })
      .addCase(createClientFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update client fetch
      .addCase(updateClientFetch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientFetch.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
      })
      .addCase(updateClientFetch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch salesmen by city
      .addCase(fetchSalesmenByCity.pending, (state) => {
        state.salesmenLoading = true;
        state.salesmenError = null;
      })
      .addCase(fetchSalesmenByCity.fulfilled, (state, action) => {
        state.salesmenLoading = false;
        state.salesmen = action.payload;
      })
      .addCase(fetchSalesmenByCity.rejected, (state, action) => {
        state.salesmenLoading = false;
        state.salesmenError = action.payload;
      })
      // Fetch areas by salesman city
      .addCase(fetchAreasBySalesmanCity.pending, (state) => {
        state.salesmanAreasLoading = true;
        state.salesmanAreasError = null;
      })
      .addCase(fetchAreasBySalesmanCity.fulfilled, (state, action) => {
        state.salesmanAreasLoading = false;
        state.salesmanAreas = action.payload.areas;
        state.salesmanArea = action.payload.salesmanArea;
      })
      .addCase(fetchAreasBySalesmanCity.rejected, (state, action) => {
        state.salesmanAreasLoading = false;
        state.salesmanAreasError = action.payload;
      });
  }
});

export const { addClient, deleteClient, toggleClientStatus, clearError, clearSalesmen } = clientSlice.actions;
export const selectClients = (state) => state?.client?.clients || [];
export const selectClientsLoading = (state) => state?.client?.loading || false;
export const selectClientsError = (state) => state?.client?.error || null;
export const selectClientsPagination = (state) => state?.client?.pagination || {};
export const selectSalesmen = (state) => state?.client?.salesmen || [];
export const selectSalesmenLoading = (state) => state?.client?.salesmenLoading || false;
export const selectSalesmenError = (state) => state?.client?.salesmenError || null;
export const selectSalesmanAreas = (state) => state?.client?.salesmanAreas || [];
export const selectSalesmanAreasLoading = (state) => state?.client?.salesmanAreasLoading || false;
export const selectSalesmanAreasError = (state) => state?.client?.salesmanAreasError || null;
export const selectSalesmanArea = (state) => state?.client?.salesmanArea || null;
export default clientSlice.reducer;
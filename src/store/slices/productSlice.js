import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/axiosConfig';

const initialState = {
    products: [],
    loading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },
    stats: {
        totalProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0
    }
};

// Async thunks
export const fetchProducts = createAsyncThunk('products/fetchProducts', async (params = {}, { rejectWithValue }) => {
    try {
        const { page = 1, limit = 10, search = '', isActive } = params;
        const response = await apiClient.get('/products', {
            params: { page, limit, search, isActive }
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
});

export const fetchProductById = createAsyncThunk('products/fetchProductById', async (productId, { rejectWithValue }) => {
    try {
        const response = await apiClient.get(`/products/${productId}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
});

export const createProduct = createAsyncThunk('products/createProduct', async (productData, { rejectWithValue }) => {
    try {
        const response = await apiClient.post('/products', productData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create product');
    }
});

export const updateProduct = createAsyncThunk('products/updateProduct', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await apiClient.put(`/products/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
});

export const deleteProduct = createAsyncThunk('products/deleteProduct', async (productId, { rejectWithValue }) => {
    try {
        await apiClient.delete(`/products/${productId}`);
        return productId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
});

export const fetchProductStats = createAsyncThunk('products/fetchProductStats', async (_, { rejectWithValue }) => {
    try {
        const response = await apiClient.get('/products/stats');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch product statistics');
    }
});

export const toggleProductStatus = createAsyncThunk('products/toggleProductStatus', async (productId, { rejectWithValue }) => {
    try {
        const response = await apiClient.patch(`/products/${productId}/toggle-status`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle product status');
    }
});

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setCurrentPage: (state, action) => {
            state.pagination.currentPage = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch products
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload.data.products;
                state.pagination = action.payload.data.pagination;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch product by ID
            .addCase(fetchProductById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductById.fulfilled, (state, action) => {
                state.loading = false;
                // Update the product in the products array if it exists
                const index = state.products.findIndex(product => product._id === action.payload.data._id);
                if (index !== -1) {
                    state.products[index] = action.payload.data;
                }
            })
            .addCase(fetchProductById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create product
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products.unshift(action.payload.data);
                state.pagination.totalItems += 1;
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update product
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.products.findIndex(product => product._id === action.payload.data._id);
                if (index !== -1) {
                    state.products[index] = action.payload.data;
                }
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete product
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = state.products.filter(product => product._id !== action.payload);
                state.pagination.totalItems -= 1;
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch product stats
            .addCase(fetchProductStats.fulfilled, (state, action) => {
                state.stats = action.payload.data;
            })
            // Toggle product status
            .addCase(toggleProductStatus.fulfilled, (state, action) => {
                const index = state.products.findIndex(product => product._id === action.payload.data._id);
                if (index !== -1) {
                    state.products[index] = action.payload.data;
                }
            });
    }
});

export const { clearError, setCurrentPage } = productSlice.actions;

// Selectors
export const selectProducts = (state) => state.products.products;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductStats = (state) => state.products.stats;

export default productSlice.reducer;

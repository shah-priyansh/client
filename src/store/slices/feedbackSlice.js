import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/axiosConfig';

const initialState = {
    feedbacks: [],
    loading: false,
    audioLoading: false,
    error: null,
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },
    signedUrl: null,
    uploadSuccess: false
};

export const fetchFeedbacks = createAsyncThunk('feedbacks/fetchFeedbacks', async (params = {}, { rejectWithValue }) => {
    try {
        const { page = 1, limit = 10, search = '' } = params;
        const response = await apiClient.get('/feedback', {
            params: { page, limit, search }
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to fetch feedbacks');
    }
});

export const addFeedbackFetch = createAsyncThunk('feedbacks/addFeedback', async (feedbackData, { rejectWithValue }) => {
    try {
        const response = await apiClient.post('/feedback', feedbackData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create feedback');
    }
});

export const updateFeedbackFetch = createAsyncThunk('feedbacks/updateFeedback', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await apiClient.put(`/feedback/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update feedback');
    }
});

export const deleteFeedback = createAsyncThunk('feedbacks/deleteFeedback', async (feedbackId, { rejectWithValue }) => {
    try {
        await apiClient.delete(`/feedback/${feedbackId}`);
        return feedbackId;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete feedback');
    }
});

export const generateSignedUrlFetch = createAsyncThunk('feedbacks/generateSignedUrl', async (data, { rejectWithValue }) => {
    try {
        const response = await apiClient.post('/feedback/signed-url', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to generate signed URL');
    }
});

export const uploadAudioToS3 = createAsyncThunk('feedbacks/uploadAudioToS3', async ({ file, signedUrl }, { rejectWithValue }) => {
    try {
        // Use fetch instead of apiClient to avoid adding Authorization header
        const response = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed with status: ${response.status}`);
        }
        
        return { success: true, status: response.status };
    } catch (error) {
        return rejectWithValue(error.message || 'Failed to upload audio to S3');
    }
});

export const generateAudioPlaybackUrl = createAsyncThunk('feedbacks/generateAudioPlaybackUrl', async (feedbackId, { rejectWithValue }) => {
    try {
        const response = await apiClient.get(`/feedback/${feedbackId}/audio-url`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to generate audio playback URL');
    }
});

const feedbackSlice = createSlice({
    name: 'feedbacks',
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
            .addCase(fetchFeedbacks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeedbacks.fulfilled, (state, action) => {
                state.loading = false;
                if (Array.isArray(action.payload)) {
                    state.feedbacks = action.payload;
                } else {
                    state.feedbacks = action.payload.feedback || action.payload.data || [];
                    if (action.payload.pagination) {
                        state.pagination = action.payload.pagination;
                    }
                }
            })
            .addCase(fetchFeedbacks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addFeedbackFetch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addFeedbackFetch.fulfilled, (state, action) => {
                state.loading = false;
                state.feedbacks.unshift(action.payload);
            })
            .addCase(addFeedbackFetch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateFeedbackFetch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateFeedbackFetch.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.feedbacks.findIndex(feedback => feedback._id === action.payload._id);
                if (index !== -1) {
                    state.feedbacks[index] = action.payload;
                }
            })
            .addCase(updateFeedbackFetch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteFeedback.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFeedback.fulfilled, (state, action) => {
                state.loading = false;
                state.feedbacks = state.feedbacks.filter(feedback => feedback._id !== action.payload);
            })
            .addCase(deleteFeedback.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(generateAudioPlaybackUrl.pending, (state) => {
                state.audioLoading = true;
                state.error = null;
            })
            .addCase(generateAudioPlaybackUrl.fulfilled, (state, action) => {
                state.audioLoading = false;
                state.audioUrl = action.payload;
            })
            .addCase(generateAudioPlaybackUrl.rejected, (state, action) => {
                state.audioLoading = false;
                state.error = action.payload;
            })
            .addCase(generateSignedUrlFetch.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(generateSignedUrlFetch.fulfilled, (state, action) => {
                state.loading = false;
                state.signedUrl = action.payload;
            })
            .addCase(generateSignedUrlFetch.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(uploadAudioToS3.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadAudioToS3.fulfilled, (state, action) => {
                state.loading = false;
                state.uploadSuccess = true;
            })
            .addCase(uploadAudioToS3.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.uploadSuccess = false;
            })
    }
});

export const { clearError, setCurrentPage } = feedbackSlice.actions;

// Selectors
export const selectFeedbacks = (state) => state.feedback.feedbacks;
export const selectFeedbacksLoading = (state) => state.feedback.loading;
export const selectAudioLoading = (state) => state.feedback.audioLoading;
export const selectFeedbacksError = (state) => state.feedback.error;
export const selectFeedbacksPagination = (state) => state.feedback.pagination;
export const selectSignedUrl = (state) => state.feedback.signedUrl;
export const selectUploadSuccess = (state) => state.feedback.uploadSuccess;

export default feedbackSlice.reducer;
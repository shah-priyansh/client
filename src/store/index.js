import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import clientReducer from './slices/clientSlice';
import areaReducer from './slices/areaSlice';
import dashboardReducer from './slices/dashboardSlice';
import authReducer from './slices/authSlice';
import stateReducer from './slices/stateSlice';
import cityReducer from './slices/citySlice';
import feedbackReducer from './slices/feedbackSlice';
import productReducer from './slices/productSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    client: clientReducer,
    area: areaReducer,
    dashboard: dashboardReducer,
    states: stateReducer,
    cities: cityReducer,
    feedback: feedbackReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

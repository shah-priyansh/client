import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Provider, useDispatch } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AreaManagement } from './components/Area';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import EmployeeManagement from './components/Employee/EmployeeManagement';
import Layout from './components/layout/Layout';
import { ProductManagement } from './components/Product';
import {
  ProtectedRoute,
  PublicRoute,
} from './middleware';
import { store } from './store';
import { logoutUser } from './store/slices/authSlice';
import './utils/axiosConfig'; // Initialize axios interceptors
import ClientManagement from './components/Client/ClientManagement';
import { FeedbackManagement } from './components/Feedback';

// Component to handle auth events
const AuthEventHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuthLogout = (event) => {
      if (event.detail?.reason === '401_unauthorized') {
        dispatch(logoutUser());
      }
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [dispatch]);

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <AuthEventHandler />
      <Routes>
      <Route 
        path="/login" 
        element={
          <PublicRoute redirectTo="/dashboard">
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="clients"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClientManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="areas"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AreaManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />
         <Route
          path="inquiries"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FeedbackManagement />
            </ProtectedRoute>
          }
        />
      </Route>
      
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        }
      />
     
    </Routes>
    </>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </Router>
    </Provider>
  );
};

export default App;

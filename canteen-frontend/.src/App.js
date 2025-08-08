import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Shared/ProtectedRoute';
import Login from './pages/Auth/Login';
import MenuPage from './pages/Employee/MenuPage';
import OrdersPage from './pages/Employee/OrdersPage';
import ProfilePage from './pages/Employee/ProfilePage';
import OrderManagement from './pages/Staff/OrderManagement';
import MenuManagement from './pages/Staff/MenuManaggement';
import Dashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import TokenManagement from './pages/Admin/TokenManagement';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Employee Routes */}
            <Route path="/employee/menu" element={
              <ProtectedRoute roles={['employee']}>
                <MenuPage />
              </ProtectedRoute>
            } />
            <Route path="/employee/orders" element={
              <ProtectedRoute roles={['employee']}>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute roles={['employee']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            {/* Staff Routes */}
            <Route path="/staff/orders" element={
              <ProtectedRoute roles={['staff']}>
                <OrderManagement />
              </ProtectedRoute>
            } />
            <Route path="/staff/menu" element={
              <ProtectedRoute roles={['staff']}>
                <MenuManagement />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute roles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/tokens" element={
              <ProtectedRoute roles={['admin']}>
                <TokenManagement />
              </ProtectedRoute>
            } />
            
            {/* Default redirect based on role */}
            <Route path="/" element={
              <ProtectedRoute>
                {({ user }) => {
                  if (user.role === 'admin') return <Dashboard />;
                  if (user.role === 'staff') return <OrderManagement />;
                  return <MenuPage />;
                }}
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
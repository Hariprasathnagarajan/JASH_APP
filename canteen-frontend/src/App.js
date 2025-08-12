import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Employee Pages
import EmployeeMenu from './pages/Employee/Menu';
import EmployeeOrders from './pages/Employee/Orders';
import EmployeeProfile from './pages/Employee/Profile';

//Guest Pages
import GuestMenu from '.pages/Guest/Menu';
import GuestOrders from './pages/Guest/Orders';
import GuestProfile from '/pages/Guest/profile';


// Staff Pages
import StaffOrders from './pages/Staff/Orders';
import StaffMenu from './pages/Staff/Menu';

// Admin Pages
import AdminUsers from './pages/Admin/Users';
import AdminTokens from './pages/Admin/Tokens';

// App Routes Component
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Login />
      } />
      
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Employee Routes */}
      <Route path="/employee/menu" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeMenu />
        </ProtectedRoute>
      } />
      <Route path="/employee/orders" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeOrders />
        </ProtectedRoute>
      } />
      <Route path="/employee/profile" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeProfile />
        </ProtectedRoute>
      } />
       {/* Guest Routes */}
      <Route path="/guest/menu" element={
        <ProtectedRoute allowedRoles={['guest']}>
          <EmployeeMenu />
        </ProtectedRoute>
      } />
      <Route path="/guest/orders" element={
        <ProtectedRoute allowedRoles={['guest']}>
          <EmployeeOrders />
        </ProtectedRoute>
      } />
      <Route path="/guest/profile" element={
        <ProtectedRoute allowedRoles={['guest']}>
          <EmployeeProfile />
        </ProtectedRoute>
      } />

      {/* Staff Routes */}
      <Route path="/staff/orders" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffOrders />
        </ProtectedRoute>
      } />
      <Route path="/staff/menu" element={
        <ProtectedRoute allowedRoles={['staff']}>
          <StaffMenu />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/tokens" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminTokens />
        </ProtectedRoute>
      } />

      {/* Default redirect based on role */}
      <Route path="/" element={
        user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Navigate to="/login" replace />
      } />
      
      {/* Catch all route */}
      <Route path="*" element={
        user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

// Helper function to get default route based on role
const getDefaultRoute = (role) => {
  switch (role) {
    case 'admin':
      return '/admin/users';
    case 'staff':
      return '/staff/orders';
    case 'employee':
      return '/employee/menu';
      case 'guest':
      return '/guest/menu';
    default:
      return '/login';
  }
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import './styles/global.css';

// Employee Pages
import EmployeeMenu from './pages/employee/Menu';
import EmployeeOrders from './pages/employee/OrderHistory';
import EmployeeProfile from './pages/employee/Profile';

// Staff Pages
import StaffManageMenu from './pages/staff/ManageMenu';
import StaffManageOrders from './pages/staff/ManageOrders';

// Admin Pages
import AdminManageUsers from './pages/admin/ManageUsers';
import AdminManageTokens from './pages/admin/ManageTokens';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Employee Routes */}
            <Route
              path="/employee/menu"
              element={
                <PrivateRoute allowedRoles={['employee']}>
                  <>
                    <Navbar />
                    <EmployeeMenu />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee/orders"
              element={
                <PrivateRoute allowedRoles={['employee']}>
                  <>
                    <Navbar />
                    <EmployeeOrders />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/employee/profile"
              element={
                <PrivateRoute allowedRoles={['employee']}>
                  <>
                    <Navbar />
                    <EmployeeProfile />
                  </>
                </PrivateRoute>
              }
            />
            
            {/* Staff Routes */}
            <Route
              path="/staff/menu"
              element={
                <PrivateRoute allowedRoles={['staff', 'admin']}>
                  <>
                    <Navbar />
                    <StaffManageMenu />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/staff/orders"
              element={
                <PrivateRoute allowedRoles={['staff', 'admin']}>
                  <>
                    <Navbar />
                    <StaffManageOrders />
                  </>
                </PrivateRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <>
                    <Navbar />
                    <AdminManageUsers />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/tokens"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <>
                    <Navbar />
                    <AdminManageTokens />
                  </>
                </PrivateRoute>
              }
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';

// Employee Pages
import EmployeeMenu from './pages/Employee/Menu';
import EmployeeOrders from './pages/Employee/Orders';
import EmployeeProfile from './pages/Employee/Profile';

//Guest Pages
import GuestMenu from './pages/Guest/Menu';
import GuestOrders from './pages/Guest/Orders';
import GuestProfile from './pages/Guest/Profile';


// Staff Pages
import StaffOrders from './pages/Staff/Orders';
import StaffMenu from './pages/Staff/Menu';
import StaffProfile from './pages/Staff/Profile';

// Admin Pages
import AdminUsers from './pages/Admin/Users';
import AdminTokens from './pages/Admin/Tokens';
import AdminProfile from './pages/Admin/Profile';

// Loading component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
    <p className="text-gray-600">Loading...</p>
  </div>
);

// Layout component that includes the Navbar
const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar />}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

// Helper function to get default route based on role
export const getDefaultRoute = (role) => {
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
const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <ToastContainer 
            position="top-right"
            autoClose={1600}
            pauseOnHover={false}
            pauseOnFocusLoss={false}
            hideProgressBar
            closeOnClick
            newestOnTop
            limit={1}
          />
          <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              <Route path="/unauthorized" element={
                <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">403 - Unauthorized</h1>
                    <p className="text-xl text-gray-600 mb-6">You don't have permission to access this page</p>
                    <Link 
                      to="/" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Go back home
                    </Link>
                  </div>
                </Layout>
              } />
              
              {/* Employee Routes */}
              <Route path="/employee/menu" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Layout>
                    <EmployeeMenu />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/employee/orders" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Layout>
                    <EmployeeOrders />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/employee/profile" element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <Layout>
                    <EmployeeProfile />
                  </Layout>
                </ProtectedRoute>
              } />
               {/* Guest Routes */}
              <Route path="/guest/menu" element={
                <ProtectedRoute allowedRoles={['guest']}>
                  <Layout>
                    <GuestMenu />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/guest/orders" element={
                <ProtectedRoute allowedRoles={['guest']}>
                  <Layout>
                    <GuestOrders />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/guest/profile" element={
                <ProtectedRoute allowedRoles={['guest']}>
                  <Layout>
                    <GuestProfile />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Staff Routes */}
              <Route path="/staff/orders" element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <Layout>
                    <StaffOrders />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/staff/menu" element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <Layout>
                    <StaffMenu />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/staff/profile" element={
                <ProtectedRoute allowedRoles={['staff', 'admin']}>
                  <Layout>
                    <StaffProfile />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminUsers />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/tokens" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminTokens />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/admin/profile" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminProfile />
                  </Layout>
                </ProtectedRoute>
              } />

              {/* Default redirect based on role */}
              <Route path="/" element={
                <ProtectedRoute showLoading={false}>
                  {({ user }) => (
                    <Navigate to={user ? getDefaultRoute(user.role) : '/login'} replace />
                  )}
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={
                <ProtectedRoute>
                  <Layout>
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-6">Page not found</p>
                    <Link 
                      to="/" 
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Go back home
                    </Link>
                  </div>
                  </Layout>
                </ProtectedRoute>
              } />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
};

export default App;

import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // While checking authentication, show a loading spinner.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If not authenticated, redirect to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has the required role.
  const isAuthorized = user && allowedRoles.length > 0 ? allowedRoles.includes(user.role) : true;

  // If not authorized, redirect to the unauthorized page.
  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and authorized, render the child components.
  return children;
};

export default ProtectedRoute;

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ 
  children, 
  allowedRoles = [],
  showLoading = true,
  redirectTo = null,
  customUnauthorized = null
}) => {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // If no user is authenticated, no need to check further
        if (!isAuthenticated) {
          setIsAuthorized(false);
          return;
        }

        // If no specific roles are required, allow access
        if (allowedRoles.length === 0) {
          setIsAuthorized(true);
          return;
        }

        // Check if user has one of the allowed roles
        const hasRequiredRole = allowedRoles.some(role => user.role === role);
        
        if (!hasRequiredRole) {
          toast.error('You do not have permission to access this page');
        }
        
        setIsAuthorized(hasRequiredRole);
      } catch (error) {
        console.error('Authorization check failed:', error);
        toast.error('An error occurred while checking permissions');
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthorization();
  }, [isAuthenticated, user, allowedRoles]);

  // Show loading state if needed
  if (loading || isChecking) {
    if (!showLoading) return null;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store the attempted URL for redirecting after login
    const redirectPath = location.pathname + location.search;
    return <Navigate to="/login" state={{ from: redirectPath }} replace />;
  }

  // Handle unauthorized access
  if (!isAuthorized) {
    // Use custom unauthorized component if provided
    if (customUnauthorized) return customUnauthorized;
    
    // Redirect to specified path or unauthorized page
    return <Navigate to={redirectTo || "/unauthorized"} replace />;
  }

  // Render children if authorized
  if (typeof children === 'function') {
    return children({ user, isAuthenticated, isAuthorized });
  }
  return children;
};

export default ProtectedRoute;

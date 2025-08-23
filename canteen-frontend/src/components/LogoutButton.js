import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const LogoutButton = ({ className = '', variant = 'ghost', size = 'default', showLabel = true }) => {
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout(); // Handles navigation and toast centrally
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const buttonClasses = `
    ${variant === 'ghost' 
      ? 'text-gray-700 hover:bg-gray-100' 
      : 'bg-red-600 text-white hover:bg-red-700'}
    ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}
    inline-flex items-center rounded-md border border-transparent font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
    transition-colors duration-200 ${className}
  `;

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={buttonClasses}
      aria-label="Log out"
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {showLabel && 'Logging out...'}
        </>
      ) : (
        <>
          <LogOut className={`${showLabel ? 'mr-2' : ''} h-4 w-4`} />
          {showLabel && 'Log out'}
        </>
      )}
    </button>
  );
};

export default LogoutButton;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Users, ShoppingCart, Coffee, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNavigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { to: '/admin/users', icon: Users, label: 'Users' },
        { to: '/admin/tokens', icon: CreditCard, label: 'Tokens' },
      ];
    } else if (user?.role === 'staff') {
      return [
        { to: '/staff/orders', icon: ShoppingCart, label: 'Orders' },
        { to: '/staff/menu', icon: Coffee, label: 'Menu' },

      ];
    }
    return [];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Canteen {user?.role?.charAt(0)?.toUpperCase() + user?.role?.slice(1)}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary bg-blue-50'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;


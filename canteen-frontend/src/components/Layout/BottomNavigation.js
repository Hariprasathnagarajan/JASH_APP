import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomNavigation = () => {
  const { user } = useAuth();

  const getNavItems = () => {
    if (user?.role === 'employee') {
      return [
        { to: '/employee/menu', icon: Home, label: 'Menu' },
        { to: '/employee/orders', icon: ClipboardList, label: 'Orders' },
        { to: '/employee/profile', icon: User, label: 'Profile' },
      ];
    } else if (user?.role === 'guest') {
      return [
        { to: '/guest/menu', icon: Home, label: 'Menu' },
        { to: '/guest/orders', icon: ClipboardList, label: 'Orders' },
        { to: '/guest/profile', icon: User, label: 'Profile' },
      ];
    }
    return []; // Return empty array for unknown roles or unauthenticated users
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary bg-blue-50'
                  : 'text-gray-500 hover:text-primary'
              }`
            }
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
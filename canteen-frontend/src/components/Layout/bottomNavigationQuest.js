import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, ClipboardList } from 'lucide-react';

const BottomNavigation = () => {
  const navItems = [
    { to: '/guest/menu', icon: Home, label: 'Menu' },
    { to: '/guest/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/guest/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex items-center justify-around py-2">
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
            <span className="mt-1 text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;


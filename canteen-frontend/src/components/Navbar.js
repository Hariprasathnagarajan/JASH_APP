import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUtensils, FaHistory, FaUser, FaSignOutAlt, FaUsers, FaListAlt } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      {user.role === 'employee' && (
        <>
          <Link to="/employee/menu" className="nav-link">
            <FaUtensils />
            <span>Menu</span>
          </Link>
          <Link to="/employee/orders" className="nav-link">
            <FaHistory />
            <span>Orders</span>
          </Link>
          <Link to="/employee/profile" className="nav-link">
            <FaUser />
            <span>Profile</span>
          </Link>
        </>
      )}
      {user.role === 'staff' && (
        <>
          <Link to="/staff/orders" className="nav-link">
            <FaListAlt />
            <span>Orders</span>
          </Link>
          <Link to="/staff/menu" className="nav-link">
            <FaUtensils />
            <span>Menu</span>
          </Link>
        </>
      )}
      {user.role === 'admin' && (
        <>
          <Link to="/admin/users" className="nav-link">
            <FaUsers />
            <span>Users</span>
          </Link>
          <Link to="/admin/tokens" className="nav-link">
            <FaListAlt />
            <span>Tokens</span>
          </Link>
        </>
      )}
      <button onClick={handleLogout} className="nav-link">
        <FaSignOutAlt />
        <span>Logout</span>
      </button>
    </nav>
  );
};

export default Navbar;
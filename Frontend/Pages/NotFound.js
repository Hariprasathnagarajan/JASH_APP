import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/global.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/login" className="home-link">
          Go to Login Page
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
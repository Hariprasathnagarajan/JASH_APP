import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/employee.css';

const Profile = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    setCurrentMonth(months[now.getMonth()]);
  }, []);

  if (!user) return null;

  return (
    <div className="employee-container">
      <div className="profile-header">
        <h2>Your Profile</h2>
      </div>

      <div className="profile-card">
        <div className="profile-info">
          <div className="info-row">
            <span className="label">User ID:</span>
            <span className="value">{user.user_id}</span>
          </div>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{user.first_name} {user.last_name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Role:</span>
            <span className="value">{user.role}</span>
          </div>
        </div>

        <div className="tokens-card">
          <h3>Token Information</h3>
          <div className="tokens-info">
            <span className="label">Tokens available for {currentMonth}:</span>
            <span className="value">{user.tokens}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
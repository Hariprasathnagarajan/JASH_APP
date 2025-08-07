import React, { useState } from 'react';
import { refreshTokens } from '../../api/users';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/admin.css';

const ManageTokens = () => {
  const [tokenCount, setTokenCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRefreshTokens = async () => {
    if (!window.confirm(`Are you sure you want to refresh all tokens to ${tokenCount} for this month?`)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await refreshTokens(tokenCount);
      setSuccess(`All user tokens have been refreshed to ${tokenCount} for this month!`);
    } catch (err) {
      setError(err.message || 'Failed to refresh tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h2>Manage Monthly Tokens</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="tokens-form">
        <div className="form-group">
          <label htmlFor="tokenCount">Tokens per User</label>
          <input
            type="number"
            id="tokenCount"
            value={tokenCount}
            onChange={(e) => setTokenCount(parseInt(e.target.value) || 0)}
            min="1"
          />
        </div>
        <button
          onClick={handleRefreshTokens}
          disabled={loading}
          className="refresh-btn"
        >
          {loading ? <LoadingSpinner /> : 'Refresh All Tokens'}
        </button>
      </div>

      <div className="tokens-info">
        <h3>Instructions</h3>
        <p>
          Use this page to refresh tokens for all users at the beginning of each month.
          This will replace any existing tokens for the current month with the new amount.
        </p>
        <p>
          <strong>Note:</strong> This action cannot be undone. Make sure you've entered
          the correct number of tokens before proceeding.
        </p>
      </div>
    </div>
  );
};

export default ManageTokens;
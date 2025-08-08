import React, { useState } from 'react';
import { Box, Container, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '../../AuthContext';
import api from 'api/tokens';

const TokenManagement = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRefreshTokens = async () => {
    setLoading(true);
    setSuccess(false);
    setError('');
    
    try {
      await api.refreshTokens();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h5" component="h1" sx={{ my: 2 }}>
        Token Management
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3 }}>
        Click the button below to refresh tokens for all users. This will replace any existing tokens
        with new allocations for the current month.
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Tokens refreshed successfully for all users!
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        onClick={handleRefreshTokens}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Refresh All Tokens'}
      </Button>
    </Container>
  );
};

export default TokenManagement;
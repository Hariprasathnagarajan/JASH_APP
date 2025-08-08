import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Avatar, Box } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/auth';
import EmployeeBottomNav from '../../components/Layout/BottomNav';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.getProfile();
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) return <div>Loading...</div>;

  return (
    <Container maxWidth="md" sx={{ pb: 7 }}>
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5">
            {user.first_name} {user.last_name}
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Username:</strong> {user.username}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Employee ID:</strong> {profile.employee_id || 'N/A'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Role:</strong> {profile.role}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Tokens Remaining:</strong> {profile.tokens_remaining}
        </Typography>
      </Paper>

      <EmployeeBottomNav />
    </Container>
  );
};

export default ProfilePage;
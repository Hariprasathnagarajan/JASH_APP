import React from 'react';
import { Card, CardContent, Avatar, Typography, Box } from '@mui/material';
import { Person, Badge, Category, Star } from '@mui/icons-material';

const ProfileCard = ({ profile }) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
            {profile.username.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5">
            {profile.first_name} {profile.last_name}
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Person color="action" sx={{ mr: 1 }} />
          <Typography>Username: {profile.username}</Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Badge color="action" sx={{ mr: 1 }} />
          <Typography>Employee ID: {profile.employee_id || 'N/A'}</Typography>
        </Box>
        
        <Box display="flex" alignItems="center" mb={1}>
          <Category color="action" sx={{ mr: 1 }} />
          <Typography>Role: {profile.role}</Typography>
        </Box>
        
        <Box display="flex" alignItems="center">
          <Star color="action" sx={{ mr: 1 }} />
          <Typography>Tokens Remaining: {profile.tokens_remaining}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
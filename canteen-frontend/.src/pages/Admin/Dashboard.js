import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { People, Fastfood, AttachMoney, History } from '@mui/icons-material';

const Dashboard = () => {
  // These would normally come from API calls
  const stats = [
    { title: 'Total Users', value: 124, icon: <People fontSize="large" /> },
    { title: 'Menu Items', value: 28, icon: <Fastfood fontSize="large" /> },
    { title: 'Today\'s Orders', value: 56, icon: <AttachMoney fontSize="large" /> },
    { title: 'Pending Orders', value: 12, icon: <History fontSize="large" /> },
  ];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">{stat.title}</Typography>
                  <Typography variant="h4">{stat.value}</Typography>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  {stat.icon}
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Dashboard;
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from 'contexts/AuthContext';

const CustomAppBar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Canteen System
        </Typography>
        {user && (
          <Typography variant="subtitle1">
            {user.first_name} {user.last_name}
          </Typography>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;

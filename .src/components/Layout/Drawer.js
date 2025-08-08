import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, RestaurantMenu, History, People, 
  Settings, ExitToApp 
} from '@mui/icons-material';
import { useAuth } from 'contexts/AuthContext';

const CustomDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/', roles: ['admin', 'staff', 'employee'] },
    { text: 'Menu', icon: <RestaurantMenu />, path: '/employee/menu', roles: ['employee'] },
    { text: 'Orders', icon: <History />, path: '/employee/orders', roles: ['employee'] },
    { text: 'Order Management', icon: <History />, path: '/staff/orders', roles: ['staff'] },
    { text: 'Menu Management', icon: <RestaurantMenu />, path: '/staff/menu', roles: ['staff'] },
    { text: 'User Management', icon: <People />, path: '/admin/users', roles: ['admin'] },
    { text: 'Token Management', icon: <Settings />, path: '/admin/tokens', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <Drawer open={open} onClose={onClose}>
      <List sx={{ width: 250 }}>
        {filteredItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              onClose();
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <ListItem button onClick={logout}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default CustomDrawer;
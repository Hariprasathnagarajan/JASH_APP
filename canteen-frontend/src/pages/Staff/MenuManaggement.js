import React, { useEffect, useState } from 'react';
import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Add } from '@mui/icons-material';
import api from 'api/menu';
import MenuList from 'components/Menu/MenuList';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.getMenu();
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const handleAddItem = () => {
    // Implement add new menu item functionality
    console.log('Add new menu item');
  };

  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Menu Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddItem}
        >
          Add Item
        </Button>
      </Box>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <MenuList 
          items={menuItems} 
          editable 
          onEdit={item => console.log('Edit:', item)}
          onDelete={item => console.log('Delete:', item)}
        />
      )}
    </Container>
  );
};

export default MenuManagement;
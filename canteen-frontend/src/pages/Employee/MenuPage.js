import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Card, CardContent, CardMedia, Button } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api/menu';
import EmployeeBottomNav from '../../components/Layout/BottomNav';
import MenuItem from '../../components/Menu/MenuItem';

const MenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [tokens, setTokens] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await api.getMenu();
        setMenuItems(response.data);
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };

    const fetchTokens = async () => {
      try {
        const response = await api.getProfile();
        setTokens(response.data.tokens_remaining);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchMenu();
    fetchTokens();
  }, []);

  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const placeOrder = async () => {
    try {
      const orderItems = cart.map(item => ({
        id: item.id,
        quantity: 1 // Assuming quantity 1 for simplicity
      }));
      
      await api.placeOrder({ items: orderItems });
      setCart([]);
      // Refresh tokens
      const response = await api.getProfile();
      setTokens(response.data.tokens_remaining);
      alert('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error.response?.data?.detail || 'Failed to place order');
    }
  };

  return (
    <Container maxWidth="md" sx={{ pb: 7 }}>
      <Typography variant="h5" component="h1" sx={{ my: 2 }}>
        Today's Menu
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Tokens remaining: {tokens}
      </Typography>
      
      <Grid container spacing={2}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} key={item.id}>
            <MenuItem 
              item={item} 
              onAdd={addToCart} 
              onRemove={removeFromCart} 
              inCart={cart.some(cartItem => cartItem.id === item.id)}
            />
          </Grid>
        ))}
      </Grid>
      
      {cart.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 56, left: 0, right: 0, p: 2, bgcolor: 'background.paper' }}>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={placeOrder}
            disabled={cart.length === 0}
          >
            Place Order ({cart.length} items)
          </Button>
        </Box>
      )}
      
      <EmployeeBottomNav />
    </Container>
  );
};

export default MenuPage;
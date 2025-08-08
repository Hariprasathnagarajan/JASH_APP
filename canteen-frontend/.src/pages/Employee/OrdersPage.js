import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useAuth } from 'contexts/AuthContext';
import api from 'api/orders';
import OrderList from 'components/Orders/OrderList';
import EmployeeBottomNav from 'components/Layout/BottomNav';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.getOrders();
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <Container maxWidth="md" sx={{ pb: 7 }}>
      <Typography variant="h5" component="h1" sx={{ my: 2 }}>
        My Orders
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <OrderList orders={orders} />
      )}
      
      <EmployeeBottomNav />
    </Container>
  );
};

export default OrdersPage;
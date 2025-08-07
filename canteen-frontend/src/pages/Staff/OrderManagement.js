import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, TextField, List, Button, Paper } from '@mui/material';
import api from '../../../api/orders';
import OrderCard from '../../components/Orders/OrderCard';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.getOrders();
        setOrders(response.data);
        setFilteredOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(order =>
        order.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.user.employee_id && order.user.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.id.toString().includes(searchTerm)
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const handleApprove = async (orderId) => {
    try {
      await api.approveOrder(orderId);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'approved' } : order
      ));
    } catch (error) {
      console.error('Error approving order:', error);
    }
  };

  const handleDecline = async (orderId) => {
    try {
      await api.declineOrder(orderId);
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'declined' } : order
      ));
    } catch (error) {
      console.error('Error declining order:', error);
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h5" component="h1" sx={{ my: 2 }}>
        Order Management
      </Typography>
      
      <TextField
        label="Search by username, ID, or order #"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2 }}
      />
      
      <List>
        {filteredOrders.map((order) => (
          <Paper key={order.id} sx={{ mb: 2, p: 2 }}>
            <OrderCard order={order} />
            
            {order.status === 'pending' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  color="error"
                  onClick={() => handleDecline(order.id)}
                  sx={{ mr: 1 }}
                >
                  Decline
                </Button>
                <Button
                  color="success"
                  onClick={() => handleApprove(order.id)}
                >
                  Approve
                </Button>
              </Box>
            )}
          </Paper>
        ))}
      </List>
    </Container>
  );
};

export default OrderManagement;
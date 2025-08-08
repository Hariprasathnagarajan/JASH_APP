import React from 'react';
import { Box, Typography, Divider, Chip, Paper } from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const OrderDetails = ({ order }) => {
  const getStatusIcon = () => {
    switch (order.status) {
      case 'approved':
        return <CheckCircle color="success" />;
      case 'declined':
        return <Cancel color="error" />;
      default:
        return <AccessTime color="warning" />;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Order #{order.id}</Typography>
        <Chip
          label={order.status}
          icon={getStatusIcon()}
          variant="outlined"
        />
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Ordered on: {new Date(order.created_at).toLocaleString()}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Items:
      </Typography>
      
      {order.items.map((item, index) => (
        <Box key={index} display="flex" justifyContent="space-between" mb={1}>
          <Typography>
            {item.quantity} × {item.menu_item.name}
          </Typography>
          <Typography>
            {item.menu_item.price * item.quantity} tokens
          </Typography>
        </Box>
      ))}
      
      <Divider sx={{ my: 2 }} />
      
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6">Total:</Typography>
        <Typography variant="h6">
          {order.items.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0)} tokens
        </Typography>
      </Box>
    </Paper>
  );
};

export default OrderDetails;
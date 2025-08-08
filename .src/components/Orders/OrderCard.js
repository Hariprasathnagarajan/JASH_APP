import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const OrderCard = ({ order }) => {
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
    <Card>
      <CardContent>
        <Typography variant="h6" component="div">
          Order #{order.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(order.created_at).toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1" sx={{ mr: 1 }}>
            Status:
          </Typography>
          <Chip
            label={order.status}
            icon={getStatusIcon()}
            variant="outlined"
          />
        </Box>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Items: {order.items.length}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
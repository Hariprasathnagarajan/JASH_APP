import React from 'react';
import { List } from '@mui/material';
import OrderCard from './OrderCard';

const OrderList = ({ orders }) => {
  return (
    <List>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </List>
  );
};

export default OrderList;
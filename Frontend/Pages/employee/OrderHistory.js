import React, { useState, useEffect } from 'react';
import { getEmployeeOrders } from '../../api/orders';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/employee.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState({ today_orders: [], past_orders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getEmployeeOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'declined':
        return 'status-declined';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="employee-container">
      <h2>Your Orders</h2>
      {error && <div className="error-message">{error}</div>}

      <div className="orders-section">
        <h3>Today's Orders</h3>
        {orders.today_orders.length === 0 ? (
          <p>No orders today</p>
        ) : (
          <div className="orders-list">
            {orders.today_orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <span>Total Tokens: {order.total_tokens}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="order-items">
                  <h4>Items:</h4>
                  {order.order_items.map((item) => (
                    <div key={item.id} className="order-item">
                      <span>{item.menu_item.name} × {item.quantity}</span>
                      <span>{item.tokens_per_item * item.quantity} tokens</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="orders-section">
        <h3>Past Orders</h3>
        {orders.past_orders.length === 0 ? (
          <p>No past orders</p>
        ) : (
          <div className="orders-list">
            {orders.past_orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className={`order-status ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <span>Total Tokens: {order.total_tokens}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
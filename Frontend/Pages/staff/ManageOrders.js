import React, { useState, useEffect } from 'react';
import { getAllOrders, updateOrderStatus } from '../../api/orders';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/staff.css';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders(searchTerm);
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [searchTerm]);

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

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this order's status to ${newStatus}?`)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateOrderStatus(orderId, newStatus);
      setSuccess('Order status updated successfully!');
      const data = await getAllOrders(searchTerm);
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="staff-container">
      <h2>Manage Orders</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by username, user ID, or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="orders-list">
        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <span className="order-id">Order #{order.id}</span>
                  <span className="user-info">
                    {order.user_details.username} ({order.user_details.user_id})
                  </span>
                </div>
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
              <div className="order-actions">
                {order.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'approved')}
                    className="approve-btn"
                  >
                    Approve
                  </button>
                )}
                {order.status !== 'declined' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'declined')}
                    className="decline-btn"
                  >
                    Decline
                  </button>
                )}
                {order.status === 'approved' && (
                  <button
                    onClick={() => handleStatusChange(order.id, 'completed')}
                    className="complete-btn"
                  >
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
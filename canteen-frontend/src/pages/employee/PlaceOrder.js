import React, { useState } from 'react';
import { placeOrder } from '../../api/orders';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import '../../styles/employee.css';

const PlaceOrder = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError('Please add items to your order');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await placeOrder(items);
      setSuccess('Order placed successfully!');
      setItems([]);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (item) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(i => i.menu_item_id === item.id);
      if (existingItem) {
        return prevItems.map(i =>
          i.menu_item_id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prevItems, { menu_item_id: item.id, quantity: 1 }];
    });
  };

  const removeItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.menu_item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.menu_item_id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const calculateTotalTokens = () => {
    // In a real app, you would fetch menu items to calculate the total
    // For simplicity, we'll assume each item costs 1 token
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="employee-container">
      <h2>Place Your Order</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="token-info">
        Available Tokens: <span>{user?.tokens || 0}</span>
      </div>

      {/* In a real app, you would list menu items here */}
      <div className="menu-placeholder">
        <p>Menu items would be listed here</p>
        <button onClick={() => addItem({ id: 1, name: 'Sample Item' })}>
          Add Sample Item
        </button>
      </div>

      {items.length > 0 && (
        <div className="order-summary">
          <h3>Your Order</h3>
          <ul className="order-items">
            {items.map(item => (
              <li key={item.menu_item_id} className="order-item">
                <span>Item #{item.menu_item_id}</span>
                <div className="item-controls">
                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}>
                    +
                  </button>
                  <button 
                    onClick={() => removeItem(item.menu_item_id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="order-total">
            Total Tokens: {calculateTotalTokens()}
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading || calculateTotalTokens() > (user?.tokens || 0)}
            className="place-order-btn"
          >
            {loading ? <LoadingSpinner /> : 'Place Order'}
          </button>
          {calculateTotalTokens() > (user?.tokens || 0) && (
            <p className="insufficient-tokens">
              Insufficient tokens for this order
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;
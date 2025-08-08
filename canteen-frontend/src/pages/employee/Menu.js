import React, { useState, useEffect } from 'react';
import { getMenuItems } from '../../api/menu';
import { placeOrder } from '../../api/orders';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import '../../styles/employee.css';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getMenuItems();
        setMenuItems(data);
      } catch (err) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.menu_item_id === item.id);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { menu_item_id: item.id, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item.menu_item_id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.menu_item_id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Please add items to your cart');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await placeOrder(cart);
      setSuccess('Order placed successfully!');
      setCart([]);
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalTokens = () => {
    return cart.reduce((total, cartItem) => {
      const menuItem = menuItems.find((item) => item.id === cartItem.menu_item_id);
      return total + (menuItem ? menuItem.price * cartItem.quantity : 0);
    }, 0);
  };

  if (loading && menuItems.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="employee-container">
      <div className="menu-header">
        <h2>Today's Menu</h2>
        <div className="token-info">
          Available Tokens: <span>{user?.tokens || 0}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="menu-items">
        {menuItems.map((item) => (
          <div key={item.id} className="menu-item">
            <div className="item-image">
              {item.image && (
                <img src={`http://localhost:8000${item.image}`} alt={item.name} />
              )}
            </div>
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="item-footer">
                <span className="price">{item.price} tokens</span>
                <button
                  onClick={() => addToCart(item)}
                  className="add-to-cart"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="cart-container">
          <h3>Your Order</h3>
          <div className="cart-items">
            {cart.map((cartItem) => {
              const menuItem = menuItems.find((item) => item.id === cartItem.menu_item_id);
              if (!menuItem) return null;
              
              return (
                <div key={cartItem.menu_item_id} className="cart-item">
                  <div className="cart-item-details">
                    <span>{menuItem.name}</span>
                    <span>{menuItem.price} tokens × {cartItem.quantity}</span>
                    <span>{menuItem.price * cartItem.quantity} tokens</span>
                  </div>
                  <div className="cart-item-actions">
                    <button
                      onClick={() => updateQuantity(cartItem.menu_item_id, cartItem.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{cartItem.quantity}</span>
                    <button
                      onClick={() => updateQuantity(cartItem.menu_item_id, cartItem.quantity + 1)}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(cartItem.menu_item_id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-total">
            <span>Total Tokens:</span>
            <span>{calculateTotalTokens()}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="place-order-btn"
          >
            {loading ? <LoadingSpinner /> : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Menu;
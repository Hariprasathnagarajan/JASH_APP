import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { guestAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BottomNavigation from '../../components/Layout/bottomNavigationQuest';

const GuestMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();
  const menuContainerRef = useRef(null);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await guestAPI.getMenu();
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMessage('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Add to cart with animation
  const addToCart = (item) => {
    if (!item.is_available) return;
    
    const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menu_item_id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        menu_item_id: item.id, 
        quantity: 1, 
        item,
        price: item.price 
      }]);
    }
    
    // Scroll to bottom if cart is not visible
    setTimeout(() => {
      if (menuContainerRef.current) {
        menuContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  const removeFromCart = (itemId) => {
    const existingItem = cart.find(cartItem => cartItem.menu_item_id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.menu_item_id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.menu_item_id !== itemId));
    }
  };

  const getCartItemQuantity = (itemId) => {
    const cartItem = cart.find(item => item.menu_item_id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getTotalTokens = () => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.price * cartItem.quantity);
    }, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    if (getTotalTokens() > (user?.tokens || 0)) {
      setMessage('Insufficient tokens available');
      return;
    }

    setPlacing(true);
    setMessage('');

    try {
      const orderData = {
        items: cart.map(({ menu_item_id, quantity }) => ({
          menu_item_id,
          quantity
        }))
      };

      // Submit order
      const response = await guestAPI.placeOrder(orderData);
      
      if (response.status === 200 || response.status === 201) {
        // Update tokens locally
        if (user) {
          updateUser({
            ...user,
            tokens: user.tokens - getTotalTokens()
          });
        }
        
        setCart([]);
        setMessage('Order placed successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      setMessage(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gray-50"> {/* Increased padding-bottom */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
            <div className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-green-800 bg-green-100 rounded-full">
              <ShoppingCart size={16} className="mr-1" />
              {user?.tokens || 0} tokens available
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mx-4 mt-4 p-3 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div 
        className="p-4 pb-24" // Added padding-bottom to prevent cart overlay
        ref={menuContainerRef}
        style={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="grid gap-4">
          {menuItems.filter(item => item.is_available).map((item) => (
            <div key={item.id} className="overflow-hidden bg-white shadow-sm rounded-xl">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="object-cover w-full h-32"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-lg">
                    {item.price} tokens
                  </span>
                </div>
                <p className="mb-4 text-sm text-gray-600">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={getCartItemQuantity(item.id) === 0}
                      className="flex items-center justify-center w-8 h-8 text-red-600 bg-red-100 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 font-medium text-center">
                      {getCartItemQuantity(item.id)}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={!item.is_available}
                      className="flex items-center justify-center w-8 h-8 text-green-600 bg-green-100 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  {getCartItemQuantity(item.id) > 0 && (
                    <span className="text-sm text-gray-500">
                      {item.price * getCartItemQuantity(item.id)} tokens
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4">
          <div className="p-4 bg-white border shadow-lg rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Cart Total:</span>
              <span className="text-lg font-bold text-primary">
                {getTotalTokens()} tokens
              </span>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing || getTotalTokens() > (user?.tokens || 0)}
              className="w-full px-4 py-3 font-semibold text-white transition-colors rounded-lg bg-primary hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placing ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Placing Order...
                </div>
              ) : (
                `Place Order (${cart.reduce((acc, item) => acc + item.quantity, 0)} items)`
              )}
            </button>
            {getTotalTokens() > (user?.tokens || 0) && (
              <p className="mt-2 text-sm text-center text-red-600">
                Insufficient tokens available
              </p>
            )}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default GuestMenu;
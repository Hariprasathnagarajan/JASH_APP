import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { employeeAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BottomNavigation from '../../components/Layout/BottomNavigation';

const EmployeeMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');
  const { user, updateUser } = useAuth();

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await employeeAPI.getMenu();
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMessage('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.menu_item_id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menu_item_id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { menu_item_id: item.id, quantity: 1, item }]);
    }
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
      return total + (cartItem.item.price * cartItem.quantity);
    }, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;

    setPlacing(true);
    setMessage('');

    try {
      const orderData = {
        items: cart.map(({ menu_item_id, quantity }) => ({
          menu_item_id,
          quantity
        }))
      };

      await employeeAPI.placeOrder(orderData);
      
      // Update user tokens
      const newTokenCount = user.tokens - getTotalTokens();
      updateUser({ ...user, tokens: newTokenCount });
      
      setCart([]);
      setMessage('Order placed successfully!');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to place order';
      setMessage(errorMessage);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
            <div className="mt-2 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
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

      <div className="p-4">
        <div className="grid gap-4">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-medium">
                    {item.price} tokens
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={getCartItemQuantity(item.id) === 0}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {getCartItemQuantity(item.id)}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center"
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

        {cart.length > 0 && (
          <div className="fixed bottom-20 left-4 right-4 z-40">
            <div className="bg-white rounded-xl shadow-lg border p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-900">Cart Total:</span>
                <span className="text-lg font-bold text-primary">{getTotalTokens()} tokens</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={placing || getTotalTokens() > (user?.tokens || 0)}
                className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Placing Order...
                  </div>
                ) : (
                  `Place Order (${cart.length} items)`
                )}
              </button>
              {getTotalTokens() > (user?.tokens || 0) && (
                <p className="text-red-600 text-sm mt-2 text-center">
                  Insufficient tokens available
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default EmployeeMenu;

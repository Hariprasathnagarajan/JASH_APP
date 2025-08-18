import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, ShoppingCart, Search, X, Key } from 'lucide-react';
import { employeeAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import BottomNavigation from '../../components/Layout/BottomNavigation';
import PasswordResetModal from '../../components/PasswordResetModal';

const POLLING_INTERVAL = 30000; // 30 seconds

const EmployeeMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { user, updateUser } = useAuth();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const menuContainerRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  const searchInputRef = useRef(null);

  const showMessage = (text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Filter menu items based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(menuItems);
    } else {
      const filtered = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, menuItems]);

  const fetchMenu = async () => {
    try {
      const response = await employeeAPI.getMenu();
      return response.data;
    } catch (error) {
      console.error('Menu fetch error:', error);
      throw new Error('Failed to fetch menu');
    }
  };

  const fetchUserData = async () => {
    if (!user?.id) return null;
    try {
      const response = await employeeAPI.getUserProfile();
      return response.data;
    } catch (error) {
      console.error('User fetch error:', error);
      throw new Error('Failed to fetch user data');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [menuData, userData] = await Promise.all([
        fetchMenu().catch(() => menuItems),
        fetchUserData().catch(() => null)
      ]);

      if (menuData) {
        setMenuItems(menuData);
        if (searchTerm === '') {
          setFilteredItems(menuData);
        }
      }
      if (userData) {
        updateUser(userData);
        // Check if user is using default password (username as password)
        if (userData.requires_password_change) {
          setShowPasswordReset(true);
        }
      }

    } catch (error) {
      console.error('Data loading error:', error);
      if (menuItems.length === 0) {
        showMessage('Failed to load initial data. Please refresh.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    refreshIntervalRef.current = setInterval(() => {
      loadData();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(refreshIntervalRef.current);
    };
  }, [user?.id]);

  const addToCart = (item) => {
    if (!item.is_available) return;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menu_item_id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.menu_item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { 
        menu_item_id: item.id, 
        quantity: 1, 
        item,
        price: item.price 
      }];
    });

    setTimeout(() => {
      menuContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.menu_item_id === itemId);
      if (existingItem?.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.menu_item_id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prevCart.filter(cartItem => cartItem.menu_item_id !== itemId);
    });
  };

  const getCartItemQuantity = (itemId) => {
    return cart.find(item => item.menu_item_id === itemId)?.quantity || 0;
  };

  const getTotalTokens = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    const totalTokens = getTotalTokens();
    if (totalTokens > (user?.tokens || 0)) {
      showMessage('Insufficient tokens available', 'error');
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        items: cart.map(({ menu_item_id, quantity }) => ({
          menu_item_id,
          quantity
        }))
      };

      const response = await employeeAPI.placeOrder(orderData);
      
      if (response.status === 200 || response.status === 201) {
        await loadData();
        setCart([]);
        showMessage('Order placed successfully!', 'success');
      } else {
        throw new Error(response.data?.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      showMessage(error.message || 'Failed to place order. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (loading && menuItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-gray-50">
      {/* Password Reset Modal */}
      <PasswordResetModal 
        show={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
        username={user?.username}
      />

      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-grow">
              <h1 className="text-2xl font-bold text-gray-900">Today's Menu</h1>
              <div className="inline-flex items-center px-3 py-1 mt-2 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                <ShoppingCart size={16} className="mr-1" />
                {user?.tokens || 0} tokens available
              </div>
            </div>
            <button 
              onClick={() => setShowPasswordReset(true)}
              className="flex items-center px-3 py-1 space-x-1 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
              title="Change Password"
            >
              <Key size={16} />
              <span className="hidden sm:inline">Password</span>
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative mt-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              ref={searchInputRef}
              className="w-full py-2 pl-10 pr-4 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mx-4 mt-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div 
        className="p-4 pb-24"
        ref={menuContainerRef}
        style={{
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 200px)',
          scrollBehavior: 'smooth'
        }}
      >
        {filteredItems.length === 0 && searchTerm ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-12 h-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
            <p className="text-gray-500">Try a different search term</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 text-sm font-medium text-primary hover:text-primary-dark"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.filter(item => item.is_available).map((item) => (
              <div key={item.id} className="overflow-hidden bg-white shadow-sm rounded-xl">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="object-cover w-full h-32"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
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
        )}
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

export default EmployeeMenu;
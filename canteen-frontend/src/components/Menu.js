import React, { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { employeeAPI, guestAPI } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Menu = ({ role = 'employee' }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  
  // Use our custom hook to handle the API call
  const { loading, error, callApi } = useApi();
  
  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenu = async () => {
      const api = role === 'employee' ? employeeAPI : guestAPI;
      const { data } = await callApi(api.getMenu);
      if (data) {
        setMenuItems(Array.isArray(data) ? data : []);
      }
    };
    
    fetchMenu();
  }, [role, callApi]);
  
  // Handle item selection
  const handleSelectItem = (item) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: (i.quantity || 1) + 1 } 
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  
  // Handle order submission
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    
    try {
      const api = role === 'employee' ? employeeAPI : guestAPI;
      const orderData = {
        items: selectedItems.map(item => ({
          menu_item: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        notes: orderNotes,
        total: selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
      
      const result = await callApi(api.placeOrder, orderData);
      
      if (result?.data) {
        toast.success('Order placed successfully!');
        setSelectedItems([]);
        setOrderNotes('');
      } else {
        const errorMessage = result?.error?.message || 'Failed to place order';
        toast.error(errorMessage);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    }
  };
  
  if (loading && menuItems.length === 0) {
    return <div className="text-center py-8">Loading menu...</div>;
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Error loading menu: {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Menu</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Menu Items */}
        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <div 
                key={item.id} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectItem(item)}
              >
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-bold">₹{item.price.toFixed(2)}</span>
                  {item.is_vegetarian && (
                    <span className="text-green-600 text-sm">Veg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-4 rounded-lg sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Your Order</h3>
            
            {selectedItems.length === 0 ? (
              <p className="text-gray-500">No items selected</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItems(prev => 
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold mb-4">
                    <span>Total:</span>
                    <span>
                      ₹{selectedItems
                        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full border rounded p-2 text-sm"
                      rows="2"
                      placeholder="Any special requests?"
                    />
                  </div>
                  
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading || selectedItems.length === 0}
                    className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      loading || selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;

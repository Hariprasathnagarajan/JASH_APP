import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { staffAPI } from '../../utils/api';
import TopNavigation from '../../components/Layout/TopNavigation';

const MenuForm = ({ editingItem, formData, setFormData, handleSubmit, resetForm }) => (
  <div className="p-4 mb-4 bg-white shadow-sm rounded-xl">
    <h3 className="mb-4 text-lg font-semibold">
      {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
    </h3>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Item Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={3}
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Price (Tokens)
        </label>
        <input
          type="number"
          required
          min="1"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div className="flex items-center">
        <button
          type="button"
          role="switch"
          aria-checked={formData.is_available}
          onClick={() =>
            setFormData({ ...formData, is_available: !formData.is_available })
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            formData.is_available ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              formData.is_available ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
          Available for ordering
        </label>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors rounded-lg bg-primary hover:bg-blue-700"
        >
          <Save size={16} />
          <span>{editingItem ? 'Update' : 'Add'} Item</span>
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-gray-500 rounded-lg hover:bg-gray-600"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>
    </form>
  </div>
);

const StaffMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await staffAPI.getMenu();
      setMenuItems(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price)
      };

      if (editingItem) {
        await staffAPI.updateMenuItem(editingItem.id, payload);
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? { ...item, ...payload } : item
        ));
        setEditingItem(null);
      } else {
        const response = await staffAPI.createMenuItem(payload);
        setMenuItems([response.data, ...menuItems]);
        setShowAddForm(false);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      is_available: item.is_available
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await staffAPI.deleteMenuItem(id);
        setMenuItems(menuItems.filter(item => item.id !== id));
      } catch (error) {
        console.error('Error deleting menu item:', error);
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      is_available: true
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const toggleAvailability = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      // Find the complete menu item
      const itemToUpdate = menuItems.find(item => item.id === id);
      if (!itemToUpdate) return;

      // Prepare the update payload with all required fields
      const updatePayload = {
        name: itemToUpdate.name,
        description: itemToUpdate.description,
        price: Number(itemToUpdate.price),
        is_available: newStatus
      };

      await staffAPI.updateMenuItem(id, updatePayload);
      
      // Update local state
      setMenuItems(menuItems.map(item =>
        item.id === id ? { ...item, is_available: newStatus } : item
      ));
    } catch (error) {
      console.error('Error updating availability:', error);
      // Revert UI if API call fails
      setMenuItems(menuItems.map(item =>
        item.id === id ? { ...item, is_available: currentStatus } : item
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          {!showAddForm && !editingItem && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white transition-colors rounded-lg bg-primary hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          )}
        </div>

        {(showAddForm || editingItem) && (
          <MenuForm
            editingItem={editingItem}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {menuItems.map((item) => (
              <div key={item.id} className="overflow-hidden bg-white shadow-sm rounded-xl">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.is_available}
                        onClick={() => toggleAvailability(item.id, item.is_available)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          item.is_available ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_available ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                      <span className="px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-lg">
                        {item.price} tokens
                      </span>
                    </div>
                  </div>
                  
                  <p className="mb-4 text-sm text-gray-600">{item.description}</p>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center px-3 py-1 space-x-1 text-blue-600 transition-colors rounded-lg hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex items-center px-3 py-1 space-x-1 text-red-600 transition-colors rounded-lg hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffMenu;
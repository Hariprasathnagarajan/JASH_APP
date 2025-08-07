import React, { useState, useEffect } from 'react';
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../../api/menu';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../../styles/staff.css';

const ManageMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    is_available: true,
    image: null
  });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const data = await getAllMenuItems();
        setMenuItems(data);
      } catch (err) {
        setError(err.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('is_available', formData.is_available);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, formDataToSend);
        setSuccess('Menu item updated successfully!');
      } else {
        await createMenuItem(formDataToSend);
        setSuccess('Menu item added successfully!');
      }

      const data = await getAllMenuItems();
      setMenuItems(data);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      is_available: item.is_available,
      image: null
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteMenuItem(id);
      setSuccess('Menu item deleted successfully!');
      const data = await getAllMenuItems();
      setMenuItems(data);
    } catch (err) {
      setError(err.message || 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      is_available: true,
      image: null
    });
  };

  if (loading && menuItems.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="staff-container">
      <h2>Manage Menu</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="menu-form-container">
        <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
        <form onSubmit={handleSubmit} className="menu-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price (tokens)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="1"
              required
            />
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="is_available"
              name="is_available"
              checked={formData.is_available}
              onChange={handleInputChange}
            />
            <label htmlFor="is_available">Available</label>
          </div>
          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : (editingItem ? 'Update' : 'Add')}
            </button>
            {editingItem && (
              <button type="button" onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="menu-items-list">
        <h3>Current Menu Items</h3>
        {menuItems.length === 0 ? (
          <p>No menu items found</p>
        ) : (
          <div className="items-grid">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-item-card">
                <div className="item-image">
                  {item.image && (
                    <img src={`http://localhost:8000${item.image}`} alt={item.name} />
                  )}
                </div>
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>{item.description}</p>
                  <div className="item-meta">
                    <span className="price">{item.price} tokens</span>
                    <span className={`availability ${item.is_available ? 'available' : 'unavailable'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(item)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMenu;
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Save, X, UserCheck, Search, CreditCard } from 'lucide-react';
import { adminAPI } from '../../utils/api';

const UserForm = ({ formData, setFormData, handleSubmit, resetForm, editingUser }) => (
  <div className="p-4 mb-4 bg-white shadow-sm rounded-xl">
    <h3 className="mb-4 text-lg font-semibold">
      {editingUser ? 'Edit User' : 'Add New User'}
    </h3>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            User ID
          </label>
          <input
            type="text"
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">First Name</label>
          <input
            type="text"
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Last Name</label>
          <input
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Work Shift</label>
        <select
          defaultValue="day"
          value={formData.work_shift}
          onChange={(e) => setFormData({ ...formData, work_shift: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="day">Day</option>
          <option value="mid">Mid</option>
          <option value="night">Night</option>
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Role</label>
        <select
          defaultValue="employee"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="employee">Employee</option>
          <option value="staff">Staff</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="flex space-x-2">
        <button
          type="submit"
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors rounded-lg bg-primary hover:bg-blue-700"
        >
          <Save size={16} />
          <span>{editingUser ? 'Update' : 'Add'} User</span>
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    username: '',
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'employee',
    work_shift: 'day'
  });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingUser) {
      const updateData = { ...formData };

      await adminAPI.updateUser(editingUser.id, updateData);
      setUsers(users.map(user =>
        user.id === editingUser.id ? { ...user, ...updateData } : user
      ));

      setEditingUser(null);
    } else {
      const response = await adminAPI.createUser(formData);
      setUsers([response.data, ...users]);
      setShowAddForm(false);
    }

    resetForm();

  } catch (error) {
    console.error('Error in handleSubmit:', error);
    if (error.response) {
      alert(`Error ${error.response.status}: ${error.response.data.detail || JSON.stringify(error.response.data)}`);
    } else {
      alert('Error saving user. Please check the details and try again.');
    }
  }
};

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      work_shift: user.work_shift,
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminAPI.deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      user_id: '',
      first_name: '',
      last_name: '',
      email: '',
      role: 'employee',
      work_shift: 'day'
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      case 'guest': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filtered list based on search term
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      (user.first_name && user.first_name.toLowerCase().includes(term)) ||
      (user.last_name && user.last_name.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });
  const [activeTab, setActiveTab] = useState('all');

  const getFilteredByRole = (users, role) => {
    if (role === 'all') return users;
    return users.filter((user) => user.role === role);
  };

  const displayedUsers = getFilteredByRole(filteredUsers, activeTab);



  return (
    <div className="flex flex-col h-full">
   <div className="p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex flex-1 gap-2 md:flex-none">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Search className="absolute w-5 h-5 text-gray-400 left-3 top-2.5" />
          </div>
          {!showAddForm && !editingUser && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white transition-colors rounded-lg bg-primary hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {(showAddForm || editingUser) && (
        <UserForm
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSubmit}
          resetForm={resetForm}
          editingUser={editingUser}
        />
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['all', 'staff', 'employee', 'guest'].map((role) => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`relative px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === role ? 'text-primary' : 'text-gray-600'
            }`}
          >
            {role}
            {activeTab === role && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-all duration-300"></span>
            )}
          </button>
        ))}
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedUsers.length > 0 ? (
            displayedUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col p-3 space-y-3 transition-shadow bg-white border rounded-lg hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
              >
                {/* Left: Avatar + Name + Username */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full">
                    <UserCheck className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`} />
                  </div>
                  <div className="group">
                    <p className="text-sm w-100 font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-gray-500 group-hover:underline" title={`@${user.username}`}>
                      @{user.username}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                    title={`Role: ${user.role}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>

                  {user.role !== 'staff' && (
                    <span
                      className="inline-flex items-center px-3 py-1 space-x-1 font-medium text-green-700 bg-green-100 rounded-full"
                      title={`Tokens: ${user.tokens || 0}`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{user.tokens || 0}</span>
                    </span>
                  )}
                  </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">

                  <span
                    className="text-gray-500 truncate max-w-[150px]"
                    title={user.email || 'Email not provided'}
                  >
                    {user.email || 'No email'}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex justify-between items-center space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="text-blue-500 transition-colors hover:text-blue-700"
                    title="Edit user"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-red-500 transition-colors hover:text-red-700"
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">No users found.</div>
          )}
        </div>
      )}
    </div>
    </div>
  );
};
export default AdminUsers;
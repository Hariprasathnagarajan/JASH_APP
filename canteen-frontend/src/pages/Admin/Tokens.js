import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const AdminTokens = () => {
  const [tokenData, setTokenData] = useState({
    day_shift: { users: [], total_tokens: 0 },
    mid_shift: { users: [], total_tokens: 0 },
    night_shift: { users: [], total_tokens: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const fetchTokenSummary = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTokenSummary();
      setTokenData(response.data);
    } catch (error) {
      console.error('Error fetching token summary:', error);
      toast.error('Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenSummary();
  }, []);

  const handleAssignTokens = async (shift) => {
    if (!window.confirm(`Assign tokens to all ${shift} shift users?`)) return;
    
    try {
      setAssigning(true);
      const response = await adminAPI.assignTokens(shift);
      toast.success(`Assigned ${response.data.tokens_assigned} tokens to ${response.data.updated} users`);
      fetchTokenSummary();
    } catch (error) {
      console.error('Error assigning tokens:', error);
      toast.error(error.response?.data?.error || 'Failed to assign tokens');
    } finally {
      setAssigning(false);
    }
  };

  const renderShiftSection = (shift, title) => (
    <div key={shift} className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {title} Shift
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {tokenData[shift].users.length} Users
          </span>
        </h2>
        <button
          onClick={() => handleAssignTokens(shift)}
          disabled={assigning}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            assigning ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {assigning ? 'Assigning...' : 'Assign Tokens'}
        </button>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {tokenData[shift].users.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    @{user.username} • {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0 flex">
                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {user.tokens} Tokens
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {tokenData[shift].users.length === 0 && (
          <div className="px-4 py-5 text-center text-gray-500 text-sm">
            No users found in this shift
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Token Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage monthly token allocations for all users
          </p>
        </div>
        
        <div className="space-y-8">
          {renderShiftSection('day_shift', 'Day')}
          {renderShiftSection('mid_shift', 'Mid')}
          {renderShiftSection('night_shift', 'Night')}
        </div>
      </div>
    </div>
  );
};

export default AdminTokens;
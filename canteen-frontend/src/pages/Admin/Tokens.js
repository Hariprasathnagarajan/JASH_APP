import React, { useState } from 'react';
import { RefreshCw, CreditCard, Users } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import TopNavigation from '../../components/Layout/TopNavigation';

const AdminTokens = () => {
  const [tokenCount, setTokenCount] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const handleRefreshTokens = async () => {
    setRefreshing(true);
    setMessage('');

    try {
      const response = await adminAPI.refreshTokens(tokenCount);
      setMessage(response.data.message || 'Tokens refreshed successfully!');
    } catch (error) {
      setMessage('Failed to refresh tokens. Please try again.');
      console.error('Error refreshing tokens:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Token Management</h1>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Monthly Token Refresh</h2>
              <p className="text-gray-600 mt-2">
                Set the number of tokens to assign to all users for this month
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Count per User
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tokenCount}
                  onChange={(e) => setTokenCount(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-semibold"
                />
                <p className="text-sm text-gray-500 mt-1 text-center">
                  Each user will receive {tokenCount} tokens
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Important:</p>
                    <p>This action will replace all existing tokens for all users with the new amount.</p>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-lg ${
                  message.includes('success') || message.includes('refreshed')
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <button
                onClick={handleRefreshTokens}
                disabled={refreshing}
                className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Refreshing Tokens...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} className="mr-2" />
                    Refresh All User Tokens
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTokens;

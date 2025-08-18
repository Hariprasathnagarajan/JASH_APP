import React from 'react';
import { User, CreditCard, Badge, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BottomNavigation from '../../components/Layout/BottomNavigation';

const GuestProfile = () => {
  const { user, logout } = useAuth();  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-6">
          <h1 className="flex-grow text-2xl font-bold text-center text-gray-900">Guest Profile</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden bg-white shadow-sm rounded-xl">
          <div className="px-6 py-8 bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full">
                <User className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
                <p className="text-blue-100">@{user?.username}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center p-4 space-x-3 rounded-lg bg-gray-50">
                <Badge className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-semibold text-gray-900">{user?.user_id}</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-3 rounded-lg bg-gray-50">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                </div>
              </div>

              <div className="flex items-center p-4 space-x-3 rounded-lg bg-gray-50">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Available Tokens</p>
                  <p className="text-lg font-semibold text-green-600">{user?.tokens || 0}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="mb-2 font-semibold text-blue-900">Token Information</h3>
              <p className="text-sm text-blue-700">
                Tokens are refreshed monthly by the admin. Use them to place orders for delicious meals!
              </p>
            </div>
            <div className="flex justify-center">
            <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-2 space-x-2 text-white bg-red-500 rounded-md hover:bg-red-600"
            type="button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default GuestProfile;

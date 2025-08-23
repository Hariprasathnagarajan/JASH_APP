import React from 'react';
import { User, CreditCard, Badge, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
 
const EmployeeProfile = () => {
  const { user, logout } = useAuth();  
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 text-center flex-grow">Employee Profile</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
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
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Badge className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-semibold text-gray-900">{user?.user_id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold text-gray-900">{user?.first_name} {user?.last_name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Available Tokens</p>
                  <p className="font-semibold text-green-600 text-lg">{user?.tokens || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Token Information</h3>
              <p className="text-blue-700 text-sm">
                Tokens are refreshed monthly by the admin. Use them to place orders for delicious meals!
              </p>
            </div>
            <div className="flex justify-center">
            <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            type="button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmployeeProfile;

import { useState, useEffect, useCallback } from 'react';
import { Users, Utensils, Loader2, Clock, UserCheck, Calendar, Users as UsersIcon, User } from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { 
      name: 'Total Staff', 
      value: '0', 
      icon: UserCheck, 
      change: '0', 
      changeType: 'neutral' 
    },
    { 
      name: 'Menu Items', 
      value: '0', 
      icon: Utensils, 
      change: '0', 
      changeType: 'neutral' 
    },
    { 
      name: 'Total Employees', 
      value: '0', 
      icon: Users, 
      change: '0', 
      changeType: 'neutral' 
    },
    { 
      name: 'Total Guests', 
      value: '0', 
      icon: User, 
      change: '0', 
      changeType: 'neutral' 
    }
  ]);
  
  const [shiftData, setShiftData] = useState({
    employees: { day: 0, mid: 0, night: 0, total: 0 },
    guests: { day: 0, mid: 0, night: 0, total: 0 }
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Fetching dashboard stats from:', `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/admin/dashboard-stats/`);
      
      const statsRes = await adminAPI.getDashboardStats().catch(err => {
        console.error('Detailed error info:', {
          message: err.message,
          response: err.response ? {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          } : 'No response',
          config: {
            url: err.config?.url,
            method: err.config?.method,
            headers: err.config?.headers
          }
        });
        throw new Error(`Failed to load dashboard statistics: ${err.message}`);
      });
      
      console.log('Dashboard stats response:', statsRes);

      // Process shift data - handle both object and array responses
      const processShiftData = (data) => {
        const shifts = { day: 0, mid: 0, night: 0 };
        let total = 0;
        
        if (data) {
          // Handle both array and object responses
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item.work_shift) {
                shifts[item.work_shift] = item.count || 0;
                total += item.count || 0;
              }
            });
          } else if (typeof data === 'object') {
            Object.entries(data).forEach(([shift, count]) => {
              shifts[shift] = count || 0;
              total += count || 0;
            });
          }
        }
        
        return { ...shifts, total };
      };
      
      // Get shift data from response
      const shiftData = statsRes.shiftData || {};
      const employeeShifts = processShiftData(shiftData.employees || []);
      const guestShifts = processShiftData(shiftData.guests || []);
      
      // Update shift data state
      setShiftData({
        employees: employeeShifts,
        guests: guestShifts
      });

      // Update stats with all data
      setStats([
        { 
          name: 'Total Staff', 
          value: statsRes.totalStaff?.toString() || '0', 
          icon: UserCheck, 
          change: '0', 
          changeType: 'neutral'
        },
        { 
          name: 'Menu Items', 
          value: statsRes.totalMenuItems?.toString() || '0', 
          icon: Utensils, 
          change: '0', 
          changeType: 'neutral'
        },
        { 
          name: 'Total Employees', 
          value: employeeShifts.total.toString() || '0',
          icon: Users, 
          change: '0', 
          changeType: 'neutral'
        },
        { 
          name: 'Total Guests', 
          value: guestShifts.total.toString() || '0',
          icon: User, 
          change: '0', 
          changeType: 'neutral'
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load dashboard data';
      toast.error(errorMessage, { autoClose: 5000 });
      
      // Set default/empty states to prevent UI breakage
      setStats([
        { name: 'Total Staff', value: 'N/A', icon: UserCheck, change: '0', changeType: 'neutral' },
        { name: 'Menu Items', value: 'N/A', icon: Utensils, change: '0', changeType: 'neutral' },
        { name: 'Total Employees', value: 'N/A', icon: Users, change: '0', changeType: 'neutral' },
        { name: 'Total Guests', value: 'N/A', icon: User, change: '0', changeType: 'neutral' }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.name || 'Admin'}! Here's what's happening today.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                        {stat.change && (
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-500">
                            <span>{stat.change}</span>
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Shift-wise Data Section */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <UsersIcon className="h-5 w-5 mr-2 text-blue-500" />
                Shift-wise Distribution
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day Shift
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mid Shift
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Night Shift
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-2 text-blue-500" />
                      Employees
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.employees.day}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.employees.mid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.employees.night}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {shiftData.employees.total}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-2 text-green-500" />
                      Guests
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.guests.day}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.guests.mid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {shiftData.guests.night}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      {shiftData.guests.total}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

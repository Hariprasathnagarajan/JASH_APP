import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, CheckCircle, XCircle, Package, Filter } from 'lucide-react';
import { staffAPI } from '../../utils/api';
import { toast } from 'react-toastify';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await staffAPI.getOrders(searchTerm);
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {    
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, status) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await staffAPI.updateOrderStatus(orderId, status);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
      toast.success(`Order ${status === 'approved' ? 'approved' : status === 'declined' ? 'declined' : 'updated'}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'completed':
        return <Package className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.status === statusFilter;
  });

  const OrderCard = ({ order }) => (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(order.status)}
            <span className="font-semibold text-gray-900">Order #{order.id}</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        <div className="mb-3">
          <p className="text-sm text-gray-600">Customer: {order.user_details?.first_name} {order.user_details?.last_name}</p>
          <p className="text-sm text-gray-600">User ID: {order.user_details?.user_id}</p>
        </div>

        <div className="mb-4 space-y-2">
          {order.order_items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.menu_item.name} x {item.quantity}
              </span>
              <span className="text-gray-500">
                Qty: {item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 mb-4 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {formatDate(order.created_at)}
          </span>
          <span className="font-semibold text-primary">
            Order #{order.id}
          </span>
        </div>

        {order.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => updateOrderStatus(order.id, 'approved')}
              disabled={updating[order.id]}
              className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {updating[order.id] ? 'Updating...' : 'Approve'}
            </button>
            <button
              onClick={() => updateOrderStatus(order.id, 'declined')}
              disabled={updating[order.id]}
              className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {updating[order.id] ? 'Updating...' : 'Decline'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="p-4 space-y-4">
        {/* Search and Filter */}
        <div className="p-4 bg-white shadow-sm rounded-xl">
          <div className="relative mb-4">
            <Search className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search by username, user ID, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchOrders(); }}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="flex items-center justify-end mt-2 space-x-2">
              <button
                onClick={fetchOrders}
                className="px-3 py-2 text-sm font-medium text-white rounded-lg bg-primary hover:bg-blue-700"
              >
                Search
              </button>
              <button
                onClick={() => { setSearchTerm(''); fetchOrders(); }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-xl">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffOrders;

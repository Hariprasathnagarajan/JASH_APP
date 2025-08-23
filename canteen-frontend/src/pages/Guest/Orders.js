import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { guestAPI } from '../../utils/api';

const GuestOrders = () => {
  const [orders, setOrders] = useState({ today_orders: [], past_orders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await guestAPI.getOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

        <div className="mb-4 space-y-2">
          {order.order_items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">
                {item.menu_item.name} x {item.quantity}
              </span>
              <span className="text-gray-500">
                {item.tokens_per_item * item.quantity} tokens
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-sm text-gray-500">
            {formatDate(order.created_at)}
          </span>
          <span className="font-semibold text-primary">
            Total: {order.total_tokens} tokens
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-center text-gray-900">My Orders</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Today's Orders */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Today's Orders</h2>
          {orders.today_orders.length > 0 ? (
            <div className="space-y-3">
              {orders.today_orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No orders placed today</p>
            </div>
          )}
        </div>

        {/* Past Orders */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Order History</h2>
          {orders.past_orders.length > 0 ? (
            <div className="space-y-3">
              {orders.past_orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No previous orders</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default GuestOrders;

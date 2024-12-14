import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatPrice, formatDate } from '../../utils/format';
import CancellationRequestHandler from '../../components/CancellationRequestHandler';

export default function CancellationRequests() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showRequestHandler, setShowRequestHandler] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/seller/orders', { withCredentials: true });
      // Filter only cancellation pending orders
      const cancellationRequests = response.data.orders.filter(
        order => order.status === 'cancellation_pending'
      );
      setOrders(cancellationRequests);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load cancellation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = (order) => {
    setSelectedOrder(order);
    setShowRequestHandler(true);
  };

  const onRequestHandled = () => {
    fetchOrders(); // Refresh the list
    setShowRequestHandler(false);
    setSelectedOrder(null);
  };

  const closeHandler = () => {
    setShowRequestHandler(false);
    setSelectedOrder(null);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Cancellation Requests</h1>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No cancellation requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.order_uuid}
                  className="border rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order ID: {order.order_uuid}
                      </p>
                      <p className="text-sm text-gray-500">
                        Placed on: {formatDate(order.created_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Cancellation requested: {formatDate(order.cancellation_requested_at)}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleRequest(order)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Handle Request
                      </button>
                    </div>
                  </div>

                  {/* Cancellation Reason */}
                  <div className="mt-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Customer's Reason for Cancellation:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {order.cancellation_reason || 'No reason provided'}
                    </p>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4 mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Order Items:</h4>
                    {order.items.map((item) => (
                      <div key={item.item_uuid} className="flex space-x-4">
                        <img
                          src={item.product.main_image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-yellow-600">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping:</span>
                      <span>{formatPrice(order.shipping_fee)}</span>
                    </div>
                    <div className="flex justify-between text-base font-medium mt-2">
                      <span>Total:</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Request Handler Dialog */}
      {showRequestHandler && selectedOrder && (
        <CancellationRequestHandler
          order={selectedOrder}
          onClose={closeHandler}
          onRequestHandled={onRequestHandled}
        />
      )}
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2, Package, Truck, CheckCircle, XCircle, Ban } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [processingOrder, setProcessingOrder] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Predefined cancellation reasons
  const cancellationReasons = [
    'Out of stock',
    'Product discontinued',
    'Shipping restrictions',
    'Price error',
    'Other'
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/seller/orders', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setOrders(response.data.orders);
      } else {
        toast.error('Failed to load orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '₱0.00';
    return `₱${parseFloat(price).toFixed(2)}`;
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(order => 
          !order.shipped_at && !order.cancelled_at && order.payment_status === 'completed'
        );
      case 'shipped':
        return orders.filter(order => 
          order.shipped_at && !order.delivered_at && !order.cancelled_at
        );
      case 'completed':
        return orders.filter(order => 
          order.delivered_at && order.status === 'completed' && !order.cancelled_at
        );
      case 'cancelled':
        return orders.filter(order => 
          order.cancelled_at && order.status === 'cancelled'
        );
      default:
        return orders;
    }
  };

  const handleUpdateStatus = async (orderUuid, newStatus) => {
    if (processingOrder) return;
    
    setProcessingOrder(orderUuid);
    try {
      const response = await axios.post(
        `/api/seller/orders/${orderUuid}/update-status`,
        { status: newStatus },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        toast.success(response.data.message);
        fetchOrders(); // Refresh orders after update
      } else {
        toast.error(response.data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder || !cancelReason) return;
    
    setProcessingOrder(selectedOrder.order_uuid);
    try {
      const response = await axios.post(
        `/api/seller/orders/${selectedOrder.order_uuid}/cancel`,
        { reason: cancelReason },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        toast.success('Order cancelled successfully');
        fetchOrders(); // Refresh orders
        setShowCancelDialog(false);
        setSelectedOrder(null);
        setCancelReason('');
      } else {
        toast.error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setProcessingOrder(null);
    }
  };

  const openCancelDialog = (order) => {
    setSelectedOrder(order);
    setShowCancelDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
      </div>

      {/* Order Status Tabs */}
      <div className="flex space-x-4 border-b mb-6">
        <button
          className={`pb-2 px-4 flex items-center space-x-2 ${
            activeTab === 'all'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('all')}
        >
          <span>All Orders</span>
        </button>
        <button
          className={`pb-2 px-4 flex items-center space-x-2 ${
            activeTab === 'pending'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          <Package className="w-4 h-4" />
          <span>Pending</span>
        </button>
        <button
          className={`pb-2 px-4 flex items-center space-x-2 ${
            activeTab === 'shipped'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('shipped')}
        >
          <Truck className="w-4 h-4" />
          <span>Shipped</span>
        </button>
        <button
          className={`pb-2 px-4 flex items-center space-x-2 ${
            activeTab === 'completed'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </button>
        <button
          className={`pb-2 px-4 flex items-center space-x-2 ${
            activeTab === 'cancelled'
              ? 'border-b-2 border-yellow-500 text-yellow-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('cancelled')}
        >
          <Ban className="w-4 h-4" />
          <span>Cancelled</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : getFilteredOrders().length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          getFilteredOrders().map((order) => (
            <div
              key={order.order_uuid}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID: {order.order_uuid}
                  </p>
                  <p className="text-sm text-gray-500">
                    Placed on: {formatDate(order.created_at)}
                  </p>
                  {order.cancelled_at && (
                    <p className="text-sm text-red-500">
                      Cancelled on: {formatDate(order.cancelled_at)}
                      {order.cancellation_reason && (
                        <span className="block">
                          Reason: {order.cancellation_reason}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.status === 'cancelled' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Customer Details</h3>
                <p className="text-sm text-gray-600">
                  Name: {order.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {order.customer_email}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {order.customer_phone}
                </p>
              </div>

              {/* Shipping Details */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Shipping Details</h3>
                <p className="text-sm text-gray-600">
                  {order.shipping_address.complete_address}
                </p>
                <p className="text-sm text-gray-600">
                  {order.shipping_address.city}, {order.shipping_address.province}
                </p>
                <p className="text-sm text-gray-600">
                  Contact: {order.shipping_address.phone_number}
                </p>
              </div>

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-medium mb-2">Order Items</h3>
                {order.items.map((item) => (
                  <div key={item.item_uuid} className="flex space-x-4 bg-gray-50 p-4 rounded-lg">
                    <img
                      src={item.product.main_image}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.product.name}</h4>
                      {item.variation_uuid && item.selected_option && (
                        <div className="mt-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Variation: </span>
                            {item.selected_option.name}: {item.selected_option.value}
                          </p>
                          {item.selected_option.sku && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">SKU: </span>
                              {item.selected_option.sku}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Quantity: </span>
                          {item.quantity}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Unit Price: </span>
                          {formatPrice(item.unit_price)}
                        </p>
                        <p className="text-sm font-medium text-yellow-600">
                          <span className="font-medium">Subtotal: </span>
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
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

              {/* Action Buttons */}
              <div className="mt-4 flex justify-end space-x-2">
                {!order.shipped_at && order.payment_status === 'completed' && !order.cancelled_at && (
                  <>
                    <button
                      onClick={() => openCancelDialog(order)}
                      disabled={processingOrder === order.order_uuid}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {processingOrder === order.order_uuid ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          <span>Cancel Order</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(order.order_uuid, 'shipped')}
                      disabled={processingOrder === order.order_uuid}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {processingOrder === order.order_uuid ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          <span>Mark as Shipped</span>
                        </>
                      )}
                    </button>
                  </>
                )}
                {order.shipped_at && !order.delivered_at && !order.cancelled_at && (
                  <button
                    onClick={() => handleUpdateStatus(order.order_uuid, 'delivered')}
                    disabled={processingOrder === order.order_uuid}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {processingOrder === order.order_uuid ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark as Delivered</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Order Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-4">Please select a reason for cancellation:</p>
            
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 border rounded-lg mb-4"
            >
              <option value="">Select a reason</option>
              {cancellationReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {cancelReason === 'Other' && (
              <textarea
                placeholder="Please specify the reason"
                value={cancelReason === 'Other' ? '' : cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
                rows={3}
              />
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setSelectedOrder(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={!cancelReason}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
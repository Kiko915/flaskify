import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import UserCard from '../../../components/user/UserCard';
import { X, AlertTriangle } from 'lucide-react';
import CancellationDialog from '../../../components/CancellationDialog';
import ReviewDialog from '../../../components/ReviewDialog';
import { formatPrice } from '../../../utils/format';
import { Star } from 'lucide-react';

export default function Purchase() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [productToReview, setProductToReview] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
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

  const getFilteredOrders = () => {
    return orders.filter(order => {
      switch (activeTab) {
        case 'to-pay':
          return order.status === 'pending';
        case 'to-ship':
          return order.status === 'paid';
        case 'to-receive':
          return order.status === 'shipped' || order.status === 'to_ship';
        case 'completed':
          return order.status === 'delivered' || order.status === 'completed';
        case 'cancelled':
          return order.status === 'cancelled';
        case 'cancellation-pending':
          return order.status === 'cancellation_pending';
        default:
          return true;
      }
    });
  };

  const shouldShowPayNowButton = (order) => {
    
    // For To Receive tab with COD
    if (activeTab === 'to-receive') {
      return order.payment_method === 'cod' && order.shipped_at && !order.delivered_at;
    }
    
    return false;
  };

  const handlePayNow = (order) => {
    if (order.payment_method === 'cod') {
      // For COD orders, mark as paid directly
      handleCODPayment(order);
    } else {
      // For card/PayPal orders, redirect to payment page
      navigate(`/payment/${order.payment_method}`, {
        state: {
          order_uuid: order.order_uuid,
          amount: order.total,
          payment_method: order.payment_method
        }
      });
    }
  };

  const handleCODPayment = async (order) => {
    try {
      const response = await axios.post('/api/checkout/process-payment', {
        order_uuid: order.order_uuid,
        payment_method_uuid: order.payment_method,
        amount: order.total,
        status: 'completed'
      }, {
        withCredentials: true
      });

      if (response.data.status === 'success') {
        toast.success('Payment confirmed');
        fetchOrders(); // Refresh orders list
      }
    } catch (error) {
      console.error('Error processing COD payment:', error);
      toast.error('Failed to process payment');
    }
  };

  const handleReceiveOrder = async (order) => {
    if (!window.confirm('Are you sure you want to mark this order as received? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post(
        `/api/orders/${order.order_uuid}/receive`,
        {},
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        toast.success('Order marked as received successfully');
        if (order.payment_method === 'cod') {
          toast.success('Payment completed for Cash on Delivery');
        }
        fetchOrders(); // Refresh orders list
      }
    } catch (error) {
      console.error('Error receiving order:', error);
      toast.error(error.response?.data?.message || 'Failed to mark order as received');
    }
  };

  const handleCancelOrder = (order) => {
    setOrderToCancel(order);
    setShowCancelConfirm(true);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'to_ship':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'cancellation_pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'to_ship':
        return 'To Ship';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'cancellation_pending':
        return 'Cancellation Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleReviewProduct = (item) => {
    setProductToReview(item.product);
    setShowReviewDialog(true);
  };

  return (
    <UserCard>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Purchases</h1>

        {/* Order Status Tabs */}
        <div className="flex space-x-4 border-b">
          <button
            className={`pb-2 px-4 ${activeTab === 'all' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'to-pay' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('to-pay')}
          >
            To Pay
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'to-ship' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('to-ship')}
          >
            To Ship
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'to-receive' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('to-receive')}
          >
            To Receive
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'completed' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'cancellation-pending' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('cancellation-pending')}
          >
            Cancellation Requests
          </button>
          <button
            className={`pb-2 px-4 ${activeTab === 'cancelled' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {/* Orders List */}
        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : getFilteredOrders().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredOrders().map((order) => (
                <div
                  key={order.order_uuid}
                  className="bg-white rounded-lg shadow-sm border p-4"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Order ID: {order.order_uuid}
                      </p>
                      <p className="text-sm text-gray-500">
                        Placed on: {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(order.status)}`}>
                        {getDisplayStatus(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.item_uuid} className="flex space-x-4">
                        <img
                          src={item.product.main_image}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{item.product.name}</h4>
                          {item.variation && (
                            <p className="text-sm text-gray-600 mt-1">
                              {item.variation.name}: {item.variation.value}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-1">
                            Quantity: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-yellow-600 mt-1">
                            {formatPrice(item.subtotal)}
                          </p>
                          {/* Add Review Button for completed orders */}
                          {order.status === 'completed' && (
                            <button
                              onClick={() => handleReviewProduct(item)}
                              className="mt-2 px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-1"
                            >
                              <Star className="w-4 h-4" />
                              Write a Review
                            </button>
                          )}
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
                    {shouldShowPayNowButton(order) && (
                      <button 
                        onClick={() => handlePayNow(order)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Pay Now
                      </button>
                    )}
                    
                    {/* Show Receive Order button for shipped orders */}
                    {order.shipped_at && !order.delivered_at && (
                      <button 
                        onClick={() => handleReceiveOrder(order)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Receive Order
                      </button>
                    )}
                    
                    {/* Show Cancel Order button for pending orders */}
                    {!order.cancelled && !order.shipped_at && 
                     order.status !== 'completed' && 
                     order.status !== 'cancelled' && 
                     order.status !== 'cancellation_pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order)}
                        className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelConfirm && orderToCancel && (
        <CancellationDialog
          order={orderToCancel}
          onClose={() => {
            setShowCancelConfirm(false);
            setOrderToCancel(null);
          }}
          onCancellationRequested={() => {
            fetchOrders(); // Refresh orders list
            toast.success('Cancellation request submitted successfully');
          }}
        />
      )}

      {/* Review Dialog */}
      {showReviewDialog && productToReview && (
        <ReviewDialog
          product={productToReview}
          onClose={() => {
            setShowReviewDialog(false);
            setProductToReview(null);
          }}
          onReviewSubmitted={() => {
            fetchOrders(); // Refresh orders list if needed
          }}
        />
      )}
    </UserCard>
  );
}

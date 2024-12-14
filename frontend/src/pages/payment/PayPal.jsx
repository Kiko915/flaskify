import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const PayPal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { order_uuid, amount, payment_method } = location.state || {};

  useEffect(() => {
    if (!order_uuid || !amount || !payment_method) {
      navigate('/cart');
    }
  }, [order_uuid, amount, payment_method, navigate]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Here you would integrate with PayPal SDK
      // For now, we'll simulate a successful payment
      const response = await axios.post('/api/checkout/process-payment', {
        order_uuid,
        payment_method_uuid: payment_method.payment_uuid,
        amount,
        status: 'completed'
      }, {
        withCredentials: true
      });

      if (response.data.status === 'success') {
        toast.success('Payment successful!');
        navigate('/user/purchases');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      // Cancel the pending order
      const response = await axios.post('http://localhost:5555/api/checkout/cancel-order', {
        order_uuid: order_uuid,
        reason: 'Payment cancelled by user'
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        toast.success('Order cancelled');
        // Get the selected items from the order
        const selectedItems = response.data.order.items.map(item => item.product_uuid);
        // Navigate back to checkout with the selected items
        navigate('/checkout', { 
          state: { 
            selectedItems: selectedItems
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-8">
          <img 
            src="https://pngimg.com/d/paypal_PNG7.png" 
            alt="PayPal" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-900">PayPal Payment</h2>
          <p className="text-gray-600 mt-2">Complete your payment with PayPal</p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-medium">{order_uuid}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">₱{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">PayPal Email:</span>
            <span className="font-medium">{payment_method.paypal_email}</span>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || cancelling}
          className="w-full mt-8 bg-[#0070ba] text-white py-3 rounded-lg font-medium hover:bg-[#003087] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Processing...
            </div>
          ) : (
            'Pay with PayPal'
          )}
        </button>

        <button
          onClick={handleCancel}
          disabled={loading || cancelling}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {cancelling ? (
            <div className="flex items-center justify-center">
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Cancelling...
            </div>
          ) : (
            'Cancel and return to checkout'
          )}
        </button>
      </div>
    </div>
  );
};

export default PayPal; 
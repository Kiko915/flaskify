import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatPrice, formatDate } from '../utils/format';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function CancellationRequestHandler({ order, onClose, onRequestHandled }) {
  const [action, setAction] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/seller/orders/${order.order_uuid}/handle-cancellation`,
        {
          action,
          rejection_reason: action === 'reject' ? rejectionReason : undefined
        },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        toast.success(`Cancellation request ${action}d successfully`);
        onRequestHandled();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to handle cancellation request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-4">
          Handle Cancellation Request
        </h3>

        {/* Order Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order ID:</span> {order.order_uuid}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Amount:</span> {formatPrice(order.total)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Requested on:</span> {formatDate(order.cancellation_requested_at)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Customer's Reason:</span>
              <div className="mt-1 p-2 bg-white rounded border text-gray-700">
                {order.cancellation_reason}
              </div>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <div className="space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-yellow-500"
                  name="action"
                  value="approve"
                  checked={action === 'approve'}
                  onChange={(e) => setAction(e.target.value)}
                />
                <span className="ml-2">Approve Cancellation</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-red-500"
                  name="action"
                  value="reject"
                  checked={action === 'reject'}
                  onChange={(e) => setAction(e.target.value)}
                />
                <span className="ml-2">Reject Cancellation</span>
              </label>
            </div>
          </div>

          {action === 'reject' && (
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
                rows="3"
                maxLength="200"
                placeholder="Please explain why you are rejecting this cancellation request..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {rejectionReason.length}/200 characters
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg ${
                action === 'approve' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50`}
              disabled={loading || (action === 'reject' && !rejectionReason.trim())}
            >
              {loading ? 'Processing...' : action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
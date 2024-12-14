import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function CancellationDialog({ order, onClose, onCancellationRequested }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_uuid: order.order_uuid,
          reason: reason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit cancellation request');
      }

      onCancellationRequested();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-4">
          Request Order Cancellation
        </h3>

        {/* Order Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order ID:</span> {order.order_uuid}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total Amount:</span> ₱{parseFloat(order.total).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Status:</span> {order.status}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Cancellation Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Cancellation *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
              rows="3"
              maxLength="200"
              placeholder="Please explain why you want to cancel this order..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {reason.length}/200 characters
            </p>
          </div>

          {/* Info Alert */}
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
            Your cancellation request will be reviewed by the seller. You will be notified once they approve or reject the request.
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
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
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              disabled={loading || !reason.trim()}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
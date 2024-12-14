import React, { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { Star, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReviewReplyDialog from '@/components/ReviewReplyDialog';
import toast from 'react-hot-toast';

const ProductReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    try {
      console.log('Fetching reviews...');
      const response = await fetch('http://localhost:5555/api/seller/reviews', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Reviews data:', data);
        setReviews(data.reviews || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch reviews:', errorData);
        toast.error(errorData.message || 'Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyToReview = (reviewUuid) => {
    setSelectedReviewId(reviewUuid);
    setShowReplyDialog(true);
  };

  const handleReplySubmitted = () => {
    fetchReviews();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Reviews</h1>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <div key={review.review_uuid} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              {/* Product Info */}
              <div className="flex-shrink-0">
                <img
                  src={review.product.main_image}
                  alt={review.product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              </div>

              <div className="flex-1">
                {/* Product Name and Review Date */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{review.product.name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Customer Info and Rating */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={review.user.profile_image_url || '/default-avatar.jpg'}
                      alt={review.user.first_name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.jpg';
                      }}
                    />
                    <span className="font-medium">
                      {review.user.first_name} {review.user.last_name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < review.rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                {/* Seller Reply */}
                {review.seller_reply ? (
                  <div className="mt-4 pl-4 border-l-4 border-yellow-200">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">Your Response</span>
                        <span className="text-sm text-gray-500">
                          {new Date(review.seller_reply_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.seller_reply}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleReplyToReview(review.review_uuid)}
                    className="text-yellow-600 hover:text-yellow-700 flex items-center gap-1"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Reply to Review
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Reviews Yet</h3>
            <p className="text-gray-500">When customers review your products, they'll appear here.</p>
          </div>
        )}
      </div>

      <ReviewReplyDialog
        isOpen={showReplyDialog}
        onClose={() => setShowReplyDialog(false)}
        reviewUuid={selectedReviewId}
        onReplySubmitted={handleReplySubmitted}
      />
    </div>
  );
};

export default ProductReviews; 
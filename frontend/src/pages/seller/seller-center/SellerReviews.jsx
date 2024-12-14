import React, { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ReviewReplyDialog from '@/components/ReviewReplyDialog';

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('http://localhost:5555/api/seller/reviews', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
      } else {
        toast.error('Failed to fetch reviews');
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
    fetchReviews(); // Refresh the reviews list
    setShowReplyDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Product Reviews</h1>
      
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-3">
            <MessageCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Reviews Yet</h3>
          <p className="text-gray-500">Your products haven't received any reviews yet</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <div key={review.review_uuid} className="bg-white rounded-lg shadow p-6">
              {/* Product Info */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b">
                <img
                  src={review.product?.main_image || '/placeholder-product.png'}
                  alt={review.product?.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-medium text-gray-900">{review.product?.name}</h3>
                  <p className="text-sm text-gray-500">Product ID: {review.product?.product_uuid}</p>
                </div>
              </div>

              {/* Review Content */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={review.user?.profile_image_url || '/default-avatar.jpg'}
                        alt={`${review.user?.first_name} ${review.user?.last_name}`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          {`${review.user?.first_name} ${review.user?.last_name}`}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!review.seller_reply && (
                    <button
                      onClick={() => handleReplyToReview(review.review_uuid)}
                      className="text-yellow-500 hover:text-yellow-600 transition-colors"
                      title="Reply to Review"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <p className="text-gray-700">{review.comment}</p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-3 mt-4 flex-wrap">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Seller Reply */}
                {review.seller_reply && (
                  <div className="mt-4 pl-4 border-l-4 border-yellow-200">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">Seller's Reply</h5>
                          <span className="text-xs text-gray-500">
                            {review.seller_reply_at ? new Date(review.seller_reply_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.seller_reply}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Dialog */}
      {showReplyDialog && (
        <ReviewReplyDialog
          isOpen={showReplyDialog}
          onClose={() => setShowReplyDialog(false)}
          reviewUuid={selectedReviewId}
          onReplySubmitted={handleReplySubmitted}
        />
      )}
    </div>
  );
};

export default SellerReviews; 
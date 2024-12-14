import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthContext';
import toast from 'react-hot-toast';
import ProductView from '@/components/ProductView/ProductView';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import api from '@/lib/api';

const ProductPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product');
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleAddToWishlist = async (productId) => {
    try {
      if (!user) {
        toast('Please sign in to add items to wishlist', {
          icon: '⚠️',
        });
        navigate('/signin', { state: { from: `/product/${productId}` } });
        return;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item to wishlist');
    }
  };

  const handleBuyNow = async (productId, quantity, variation) => {
    if (!user) {
      toast('Please sign in to proceed with purchase', {
        icon: '⚠️',
      });
      navigate('/signin', { state: { from: `/product/${productId}` } });
      return;
    }
    // Buy now functionality will be added later
    toast('Buy now functionality coming soon!');
  };

  const handleChatNow = async (shopId) => {
    try {
      if (!user) {
        toast('Please sign in to chat with seller', {
          icon: '⚠️',
        });
        navigate('/signin', { state: { from: `/product/${productId}` } });
        return;
      }

      const response = await api.post(`/shops/${shopId}/chat`);
      navigate(`/messages/${response.data.chatRoomId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const handleWriteReview = () => {
    if (!user) {
      toast('Please sign in to write a review', {
        icon: '⚠️',
      });
      navigate('/signin', { state: { from: `/product/${productId}` } });
      return;
    }

    // Open review modal or navigate to review page
    navigate(`/product/${productId}/review`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorDisplay
          message={error}
          action={{
            label: 'Go Back',
            onClick: () => navigate(-1)
          }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorDisplay
          message="Product not found"
          action={{
            label: 'Go Back',
            onClick: () => navigate(-1)
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductView
        product={product}
        onBuyNow={handleBuyNow}
        onChatNow={handleChatNow}
        onWriteReview={handleWriteReview}
      />
    </div>
  );
};

export default ProductPage; 
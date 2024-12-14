import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, MapPin, MessageCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/utils/AuthContext';
import ChatDialog from '@/components/chat/ChatDialog';

const Shop = () => {
  const { shopId } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);

  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const response = await api.get(`/shop/${shopId}`);
        setShop(response.data);
      } catch (error) {
        console.error('Error fetching shop details:', error);
        setError(error.response?.data?.message || 'Failed to load shop details');
        toast.error('Failed to load shop details');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchShopDetails();
    }
  }, [shopId]);

  const handleChatNow = async () => {
    if (!user) {
      toast.error('Please sign in to chat with seller');
      navigate('/signin', { state: { from: window.location.pathname } });
      return;
    }

    try {
      const response = await api.post(`/api/shops/${shopId}/chat`);
      setChatRoomId(response.data.room_uuid);
      setIsChatOpen(true);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat with seller');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h2>
          <p className="text-gray-600">The shop you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Shop Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={shop.shop_logo || '/placeholder-shop.png'}
              alt={shop.business_name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{shop.business_name}</h1>
              <div className="flex items-center gap-4 mt-2 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.business_city}, {shop.business_province}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{shop.avg_rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleChatNow}
            className="flex items-center gap-2 px-6 py-2 bg-brand-yellow text-white rounded-md hover:bg-brand-yellow/90 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat Now
          </button>
        </div>

        {/* Shop Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{shop.total_products}</div>
            <div className="text-sm text-gray-600">Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{shop.total_sales}</div>
            <div className="text-sm text-gray-600">Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{shop.avg_rating.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {new Date(shop.date_created).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <div className="text-sm text-gray-600">Joined</div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shop.products.map((product) => (
          <a
            key={product.product_uuid}
            href={`/product/${product.product_uuid}`}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="aspect-square">
              <img
                src={product.main_image || '/placeholder-product.png'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-brand-yellow">
                  ₱{product.price.toLocaleString()}
                </span>
                {product.compare_at_price && (
                  <span className="text-sm line-through text-gray-400">
                    ₱{product.compare_at_price.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {product.total_sales} sold
              </div>
            </div>
          </a>
        ))}
      </div>

      <ChatDialog 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        roomId={chatRoomId} 
      />
    </div>
  );
};

export default Shop; 
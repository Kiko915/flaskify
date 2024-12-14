import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const WishlistView = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchWishlistItems();
    }
  }, [user]);

  const fetchWishlistItems = async () => {
    try {
      const response = await fetch('http://localhost:5555/api/wishlist', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setWishlistItems(data);
      } else if (response.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5555/api/wishlist/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setWishlistItems(items => items.filter(item => item.product.product_uuid !== productId));
      } else if (response.status === 401) {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const addToCart = async (productId) => {
    try {
      const response = await fetch('http://localhost:5555/api/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_uuid: productId,
          quantity: 1
        })
      });
      if (response.ok) {
        // Optionally remove from wishlist after adding to cart
        await removeFromWishlist(productId);
      } else if (response.status === 401) {
        window.location.href = '/auth/login';
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleProductClick = (productUuid) => {
    navigate(`/product/${productUuid}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>
      
      {wishlistItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Your wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden group">
              <div 
                className="cursor-pointer"
                onClick={() => handleProductClick(item.product.product_uuid)}
              >
                <div className="relative aspect-square">
                  <img
                    src={item.product.main_image}
                    alt={item.product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation when clicking remove button
                      removeFromWishlist(item.product.product_uuid);
                    }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {item.product.name}
                  </h3>
                  <p className="text-lg font-bold text-[#F15B41] mb-4">
                    ₱{item.product.price.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate(`/product/${item.product.product_uuid}`)}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistView; 
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/app/CartContext';
import { useAuth } from '@/utils/AuthContext';

export function CartIcon() {
  const { cart, loading } = useCart();
  const { user } = useAuth();
  const [showPreview, setShowPreview] = useState(false);

  // Get first 5 items for preview
  const previewItems = cart?.items?.slice(0, 5) || [];
  const hasMoreItems = (cart?.items?.length || 0) > 5;
  const itemCount = cart?.items?.length || 0;

  // Format price with 2 decimal places
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '₱0.00';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Don't show preview if loading or no user
  const shouldShowPreview = showPreview && itemCount > 0 && !loading && user;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <Link to='/cart' className='hover:text-[#062a51] transition-colors relative inline-block'>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <ShoppingCart size={26} strokeWidth={1.5} />
            {itemCount > 0 && user && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </>
        )}
      </Link>

      {/* Cart Preview Dropdown */}
      {shouldShowPreview && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <div className="text-sm font-medium text-gray-900 mb-3">
              {itemCount} items in cart
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {previewItems.map((item) => (
                <div key={item.item_uuid} className="flex items-center gap-3">
                  <img 
                    src={item.product?.main_image || '/placeholder.png'} 
                    alt={item.product?.name || 'Product'}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name || 'Product'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.selected_option?.price || item.product?.price)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
              
              {hasMoreItems && (
                <div className="text-sm text-gray-500 text-center pt-2">
                  and {cart.items.length - 5} more items...
                </div>
              )}
            </div>

            <Link 
              to="/cart"
              className="mt-4 block w-full bg-[#062a51] text-white text-center py-2 rounded-md hover:bg-[#062a51]/90 transition-colors"
            >
              View Shopping Cart
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, MessageCircle, Heart, ShoppingCart, TrendingUp, Clock, Users, Truck, X, ChevronLeft, ChevronRight, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../../utils/AuthContext';
import { useCart } from '../../app/CartContext';
import toast from 'react-hot-toast';
import ReviewDialog from '../ReviewDialog';
import ReviewReplyDialog from '../ReviewReplyDialog';
import api from '@/lib/api';
import ChatDialog from '@/components/chat/ChatDialog';

const ProductView = ({
  product,
  onBuyNow,
  onClose,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  
  console.log('Current User Data:', user);
  console.log('Product Data:', product);
  console.log('Shop Data:', product?.shop);
  console.log('User UUID:', user?.user_uuid);
  console.log('Shop Seller User ID:', product?.shop?.seller_user_id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [variationOptions, setVariationOptions] = useState([]);
  const [groupedVariationOptions, setGroupedVariationOptions] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!user || !product) return;
      
      console.log('Checking wishlist status for product:', product.product_uuid);
      try {
        const response = await fetch(`http://localhost:5555/api/wishlist/check/${product.product_uuid}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Wishlist check response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Wishlist check response data:', data);
          setIsInWishlist(data.inWishlist);
          console.log('Updated wishlist state:', data.inWishlist);
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };

    checkWishlistStatus();
  }, [user, product]);

  const handleWishlistClick = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    console.log('Toggling wishlist. Current state:', isInWishlist);
    try {
      const method = isInWishlist ? 'DELETE' : 'POST';
      const url = `http://localhost:5555/api/wishlist${isInWishlist ? `/${product.product_uuid}` : ''}`;
      
      console.log('Making wishlist request:', method, url);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: !isInWishlist ? JSON.stringify({ product_uuid: product.product_uuid }) : undefined
      });

      console.log('Wishlist toggle response status:', response.status);
      if (response.ok) {
        const newState = !isInWishlist;
        setIsInWishlist(newState);
        console.log('Updated wishlist state to:', newState);
        toast.success(isInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
      } else {
        if (response.status === 401) {
          window.location.href = '/auth/login';
        }
        toast.error('Failed to update wishlist');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  // Format price with currency symbol
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Get current price based on selected variation
  const getCurrentPrice = () => {
    if (selectedOption) {
      return selectedOption.price;
    }
    return product.price;
  };

  // Get all product images
  const allImages = [
    product.main_image,
    ...(product.additional_images || [])
  ].filter(Boolean);

  // Handle keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, allImages.length]);

  // Get the current available quantity based on selected variation or main product
  const getAvailableQuantity = () => {
    if (selectedOption) {
      // Find the variation that matches the selected option
      const variation = product.variations?.find(v => 
        v.options && 
        v.options[0] && 
        v.options[0].name === selectedOption.name && 
        v.options[0].value === selectedOption.value
      );
      if (variation && variation.options[0]) {
        return variation.options[0].stock;
      }
    }
    return product.quantity || 0;
  };

  // Reset quantity when variation changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedOption]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={cn(
              "w-4 h-4",
              index < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  // Get variation options in a consistent format
  const getVariationOptions = useCallback(() => {
    if (!product.variations?.length) return [];

    // Normalize variations to a consistent format
    return product.variations.flatMap(variation => {
      // Handle array of options (Add Product format)
      if (Array.isArray(variation.options)) {
        return variation.options.map(opt => ({
          name: opt.name,
          value: opt.value,
          price: opt.price || variation.price,
          stock: opt.stock,
          variation_uuid: variation.variation_uuid,
          option_uuid: opt.option_uuid
        }));
      }
      
      // Handle single option object (Bulk Upload format)
      if (variation.options && typeof variation.options === 'object') {
        return [{
          name: variation.options.name,
          value: variation.options.value,
          price: variation.options.price || variation.price,
          stock: variation.options.stock,
          variation_uuid: variation.variation_uuid,
          option_uuid: variation.options.option_uuid
        }];
      }

      return [];
    });
  }, [product.variations]);

  // Set up variation options
  useEffect(() => {
    if (product.variations?.length > 0) {
      const options = getVariationOptions();
      setVariationOptions(options);
      
      // Group options by name for the select component
      const groupedOptions = options.reduce((acc, opt) => {
        if (!acc[opt.name]) {
          acc[opt.name] = [];
        }
        acc[opt.name].push(opt);
        return acc;
      }, {});
      
      setGroupedVariationOptions(groupedOptions);
    }
  }, [product.variations, getVariationOptions]);

  // Update handleAddToCart to handle variations properly
  const handleAddToCart = async () => {
    console.log('handleAddToCart called with user:', user);
    console.log('Current auth state:', { user, loading: false });

    if (!user?.user_uuid) {
      console.log('No user_uuid found, redirecting to login');
      toast.error('Please log in to add items to cart');
      navigate('/auth/login', { state: { from: window.location.pathname } });
      return;
    }

    // Validate variation selection if product has variations
    if (product.variations?.length > 0 && !selectedOption) {
      toast.error('Please select a variation');
      return;
    }

    try {
      console.log('Selected option:', selectedOption);
      if (selectedOption) {
        // Find the variation that contains the selected option
        const variation = product.variations.find(v => 
          v.options && (
            (Array.isArray(v.options) && v.options.some(opt => opt.option_uuid === selectedOption.option_uuid)) ||
            (v.options.option_uuid === selectedOption.option_uuid)
          )
        );

        console.log('Found variation:', variation);

        // Create a clean option object with only the necessary data
        const selectedOptionData = {
          name: selectedOption.name,
          value: selectedOption.value,
          price: selectedOption.price,
          stock: selectedOption.stock,
          option_uuid: selectedOption.option_uuid,
          sku: selectedOption.sku || `${product.sku}-${selectedOption.value.toUpperCase().replace(/\s+/g, '')}`
        };

        console.log('Selected option data:', selectedOptionData);
        console.log('Sending to cart:', {
          product_uuid: product.product_uuid,
          variation_uuid: variation?.variation_uuid,
          quantity,
          selectedOptionData
        });

        // Pass the variation_uuid and selected option details
        const success = await addToCart(
          product.product_uuid,
          variation?.variation_uuid,
          quantity,
          selectedOptionData
        );

        if (success) {
          toast.success('Item added to cart successfully');
          // Reset quantity after successful add
          setQuantity(1);
        }
      } else {
        // For products without variations
        console.log('Adding product without variations:', {
          product_uuid: product.product_uuid,
          quantity
        });

        const success = await addToCart(
          product.product_uuid,
          null,
          quantity,
          null
        );

        if (success) {
          toast.success('Item added to cart successfully');
          // Reset quantity after successful add
          setQuantity(1);
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleShopClick = (e) => {
    e.preventDefault();
    if (!product.shop?.shop_uuid) {
      toast.error('Shop information not available');
      return;
    }
    navigate(`/shop/${product.shop.shop_uuid}`);
  };

  const handleBuyNow = async () => {
    if (!user?.user_uuid) {
      toast.error('Please log in to proceed with purchase');
      navigate('/auth/login', { state: { from: window.location.pathname } });
      return;
    }

    // Validate variation selection if product has variations
    if (product.variations?.length > 0 && !selectedOption) {
      toast.error('Please select a variation');
      return;
    }

    try {
      let itemUuid;
      if (selectedOption) {
        // Find the variation that contains the selected option
        const variation = product.variations.find(v => 
          v.options && (
            (Array.isArray(v.options) && v.options.some(opt => opt.option_uuid === selectedOption.option_uuid)) ||
            (v.options.option_uuid === selectedOption.option_uuid)
          )
        );

        // Create a clean option object with only the necessary data
        const selectedOptionData = {
          name: selectedOption.name,
          value: selectedOption.value,
          price: selectedOption.price,
          stock: selectedOption.stock,
          option_uuid: selectedOption.option_uuid,
          sku: selectedOption.sku || `${product.sku}-${selectedOption.value.toUpperCase().replace(/\s+/g, '')}`
        };

        itemUuid = await addToCart(
          product.product_uuid,
          variation?.variation_uuid,
          quantity,
          selectedOptionData,
          true
        );
      } else {
        itemUuid = await addToCart(
          product.product_uuid,
          null,
          quantity,
          null,
          true
        );
      }

      if (itemUuid) {
        navigate('/cart', { state: { fromBuyNow: true, itemUuid } });
      }
    } catch (error) {
      console.error('Error processing buy now:', error);
      toast.error('Failed to process buy now request');
    }
  };

  const handleWriteReview = () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      navigate('/auth/signin', { state: { from: `/product/${product.product_uuid}` } });
      return;
    }
    setShowReviewDialog(true);
  };

  const handleReplyToReview = (reviewUuid) => {
    setSelectedReviewId(reviewUuid);
    setShowReplyDialog(true);
  };

  const handleReplySubmitted = () => {
    // Refresh the page to show the new reply
    window.location.reload();
  };

  const handleChatNow = async () => {
    if (!user) {
      toast.error('Please sign in to chat with seller');
      navigate('/signin', { state: { from: window.location.pathname } });
      return;
    }

    if (!product.shop?.shop_uuid) {
      toast.error('Shop information not available');
      return;
    }

    try {
      const response = await api.post(`/api/shops/${product.shop.shop_uuid}/chat`);
      setChatRoomId(response.data.room_uuid);
      setIsChatOpen(true);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat with seller');
    }
  };

  if (!product) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Section 1: Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div 
            className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
            onClick={() => setIsModalOpen(true)}
          >
            {allImages.length > 0 ? (
              <img
                src={allImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                  }}
                  className={cn(
                    "aspect-square rounded-md overflow-hidden",
                    currentImageIndex === index ? "ring-2 ring-yellow-500" : ""
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Product Title */}
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating and Sold Count with Total Sales */}
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-5 h-5",
                    i < (product.rating || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-200"
                  )}
                />
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {product.rating || 0}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{product.total_sales || 0} sold</span>
              
            </div>
          </div>

          {/* Price and Discount Section */}
          <div className={`space-y-2 ${selectedOption?.compare_at_price || product.compare_at_price ? 'bg-orange-100' : ''}`}>
            {/* Discount Banner */}
            {(selectedOption?.compare_at_price || product.compare_at_price) && (
              <div className="bg-orange-600 w-full text-white px-3 py-1 inline-block">
                <span className="text-sm font-medium">
                  {product.discount_name || "On Discount!"}
                </span>
              </div>
            )}
            
            {/* Price Display */}
            <div className={`flex items-baseline gap-2 ${selectedOption?.compare_at_price || product.compare_at_price ? 'p-2' : ''}`}>
              <span className="text-3xl font-bold text-[#F15B41]">
                {selectedOption
                  ? formatPrice(selectedOption.price)
                  : formatPrice(product.price)}
              </span>
              {(selectedOption?.compare_at_price || product.compare_at_price) && (
                <span className="text-lg line-through text-gray-400">
                  {formatPrice(selectedOption?.compare_at_price || product.compare_at_price)}
                </span>
              )}
            </div>
          </div>

          {/* Shipping Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-5 h-5" />
              <span>Ships to Nationwide</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                Shipping Fee: ₱{parseFloat(product?.shipping_fee).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Variations */}
          {product.variations && product.variations.length > 0 && (
            <div className="space-y-6 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Product Options</h3>

              {/* Group variations by type */}
              {Object.entries(
                product.variations.reduce((acc, variation) => {
                  if (variation.options && variation.options.length > 0) {
                    const type = variation.options[0].name;
                    if (!acc[type]) {
                      acc[type] = [];
                    }
                    acc[type].push(...variation.options);
                  } else if (variation.options && typeof variation.options === 'object') {
                    const type = variation.options.name;
                    if (!acc[type]) {
                      acc[type] = [];
                    }
                    acc[type].push(variation.options);
                  }
                  return acc;
                }, {})
              ).map(([variationType, options]) => (
                <div key={variationType} className="space-y-3">
                  {/* Variation Type Label */}
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-medium text-gray-700">
                      {variationType}
                    </span>
                    {selectedOption && selectedOption.name === variationType && (
                      <span className="text-sm text-gray-500">
                        Selected: {selectedOption.value}
                      </span>
                    )}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {options.map((option) => (
                      <button
                        key={option.option_uuid}
                        onClick={() => setSelectedOption(option)}
                        disabled={option.stock <= 0}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-lg border transition-all duration-200",
                          selectedOption?.option_uuid === option.option_uuid
                            ? "border-yellow-500 bg-yellow-50"
                            : option.stock <= 0
                            ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {/* Option Value */}
                        <span className={cn(
                          "text-base",
                          selectedOption?.option_uuid === option.option_uuid
                            ? "font-medium text-yellow-700"
                            : option.stock <= 0
                            ? "text-gray-400"
                            : "text-gray-700"
                        )}>
                          {option.value}
                        </span>

                        {/* Price */}
                        <span className="text-sm text-gray-500 mt-1">
                          {formatPrice(option.price)}
                        </span>

                        {/* Stock Badge */}
                        {option.stock <= 10 && option.stock > 0 && (
                          <span className="absolute -top-2 -right-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            {option.stock} left
                          </span>
                        )}

                        {/* Out of Stock Badge */}
                        {option.stock <= 0 && (
                          <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Selected Configuration Summary */}
              {selectedOption && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Configuration</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{selectedOption.name}:</span>
                      <span className="font-medium text-gray-900">{selectedOption.value}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">{formatPrice(selectedOption.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span className={cn(
                        "font-medium",
                        selectedOption.stock > 10
                          ? "text-green-600"
                          : selectedOption.stock > 0
                          ? "text-yellow-600"
                          : "text-red-600"
                      )}>
                        {selectedOption.stock} available
                      </span>
                    </div>
                    {selectedOption.sku && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">SKU:</span>
                        <span className="font-medium text-gray-900">{selectedOption.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(prev => prev + 1)}
                disabled={quantity >= (selectedOption?.stock || product.quantity)}
              >
                +
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {selectedOption ? `${selectedOption.stock} pieces available` : `${product.quantity} pieces available`}
            </p>
          </div>

          {/* Section 4: Product Actions */}
          <div className="flex flex-col gap-4">
            {user?.seller?.seller_id === product?.seller_id ? (
              <button
                onClick={() => navigate(`/seller/seller-center/shop/${product.shop?.id}/products/${product.product_uuid}`)}
                className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 px-6 rounded-md hover:bg-yellow-600 transition-colors"
              >
                <Settings className="w-5 h-5" />
                Manage Product
              </button>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white py-3 px-6 rounded-md hover:bg-yellow-600 transition-colors"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                  </div>
                  <button
                    onClick={handleWishlistClick}
                    className={cn(
                      "p-3 border rounded-md hover:bg-gray-50 transition-colors",
                      isInWishlist ? "border-red-500 text-red-500" : "border-gray-300"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isInWishlist && "fill-current")} />
                  </button>
                </div>
                <button
                  onClick={handleBuyNow}
                  className="w-full flex items-center justify-center gap-2 border border-yellow-500 text-yellow-500 py-3 px-6 rounded-md hover:bg-yellow-50 transition-colors"
                >
                  Buy Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Shop Information */}
      <div 
        className="bg-white p-6 rounded-lg shadow-sm mb-8 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleShopClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={product.shop?.logo || '/placeholder-shop.png'}
              alt={product.shop?.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-lg">{product.shop?.name}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{product?.shop?.business_city}, {product?.shop?.business_province}</span>
                </div>
                <span>{product.shop?.otherProducts?.length || 0} Products</span>
              </div>
            </div>
          </div>
          {user?.seller?.seller_id === product?.seller_id ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/seller/seller-center/shop/info');
              }}
              className="flex items-center gap-2 px-6 py-2 border border-yellow-500 text-yellow-500 rounded-md hover:bg-yellow-50"
            >
              <Settings className="w-5 h-5" />
              Manage Shop
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleChatNow();
              }}
              className="flex items-center gap-2 px-6 py-2 border border-yellow-500 text-yellow-500 rounded-md hover:bg-yellow-50"
            >
              <MessageCircle className="w-5 h-5" />
              Chat Now
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Star className="w-4 h-4" />
              <span className="font-medium">{product.shop?.rating?.toFixed(1) || 0}</span>
            </div>
            <span className="text-sm text-gray-500">Shop Rating</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{product.shop?.responseTime || '< 24h'}</span>
            </div>
            <span className="text-sm text-gray-500">Response Time</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">{product.shop?.responseRate || 98}%</span>
            </div>
            <span className="text-sm text-gray-500">Response Rate</span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="font-medium">{product.shop?.joinDate || 'New Shop'}</span>
            </div>
            <span className="text-sm text-gray-500">Joined</span>
          </div>
        </div>
      </div>

      {/* Section 3: Product Specifications */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Product Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex">
              <span className="w-1/3 text-gray-500">Category</span>
              <span className="w-2/3">{(product.category_path || product.category?.name || product.category_name || 'Uncategorized')}</span>
            </div>
            {product.specifications && (
              Array.isArray(product.specifications)
                ? product.specifications.map((spec) => (
                    <div key={spec.key} className="flex">
                      <span className="w-1/3 text-gray-500">{spec.key}</span>
                      <span className="w-2/3">{spec.value}</span>
                    </div>
                  ))
                : typeof product.specifications === 'object' &&
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="w-1/3 text-gray-500">{key}</span>
                      <span className="w-2/3">{String(value)}</span>
                    </div>
                  ))
            )}
          </div>
          <div className="space-y-4">
            <h3 className="font-medium">Description</h3>
            <p className="text-gray-600 whitespace-pre-line">
              {product.description || 'No description available'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Ratings and Reviews */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Ratings & Reviews</h2>
          {user && user?.seller?.seller_id !== product?.seller_id && (
            <button
              onClick={handleWriteReview}
              className="px-4 py-2 text-yellow-500 border border-yellow-500 rounded-md hover:bg-yellow-50"
            >
              Write a Review
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-500 mb-2">
              {product.rating?.toFixed(1) || "0.0"}
              <span className="text-lg text-gray-500">/5</span>
            </div>
            <div className="flex justify-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-5 h-5",
                    i < (product.rating || 0)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-200"
                  )}
                />
              ))}
            </div>
            <p className="text-gray-500 mt-2">{product.reviews?.length || 0} Reviews</p>
          </div>

          {/* Reviews List */}
          <div className="mt-8 space-y-6">
            {(product.reviews || []).map((review) => {
              // Debug logs
              console.log('Review Data:', review);
              console.log('Current User:', user);
              console.log('User UUID Match?', user?.user_uuid === review.user_uuid);
              
              return (
                <div key={review.review_uuid} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <img
                          src={review.user?.profile_image_url || '/default-avatar.jpg'}
                          alt={`${review.user?.first_name} ${review.user?.last_name}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.jpg';
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1">
                          <Star className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {`${review.user?.first_name} ${review.user?.last_name}`}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
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
                          <span className="text-sm font-medium text-yellow-600">
                            {review.rating}.0
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Delete Button */}
                      {user && user.user_uuid === review.user_uuid && (
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this review?')) {
                              try {
                                const response = await fetch(`http://localhost:5555/api/reviews/${review.review_uuid}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });

                                if (response.ok) {
                                  toast.success('Review deleted successfully');
                                  window.location.reload();
                                } else {
                                  const data = await response.json();
                                  toast.error(data.message || 'Failed to delete review');
                                }
                              } catch (error) {
                                console.error('Error deleting review:', error);
                                toast.error('Failed to delete review');
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      {/* Reply Button for Seller */}
                      {user?.seller?.seller_id === product?.seller_id && !review.seller_reply && (
                        <button
                          onClick={() => handleReplyToReview(review.review_uuid)}
                          className="text-yellow-500 hover:text-yellow-600 transition-colors"
                          title="Reply to Review"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700 leading-relaxed">{review.comment}</p>
                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-3 mt-4 flex-wrap">
                      {review.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setIsModalOpen(true);
                          }}
                        >
                          <img
                            src={image}
                            alt={`Review ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Seller Reply */}
                  {review.seller_reply && (
                    <div className="mt-4 pl-4 border-l-4 border-yellow-200">
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={product.shop?.logo || '/default-shop-logo.jpg'}
                            alt={product.shop?.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <h5 className="font-medium text-gray-900">{product.shop?.name}</h5>
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      {showReviewDialog && (
        <ReviewDialog
          product={product}
          onClose={() => setShowReviewDialog(false)}
          onReviewSubmitted={() => {
            setShowReviewDialog(false);
            window.location.reload();
          }}
          maxImages={5}
        />
      )}

      {/* Review Reply Dialog */}
      <ReviewReplyDialog
        isOpen={showReplyDialog}
        onClose={() => setShowReplyDialog(false)}
        reviewUuid={selectedReviewId}
        onReplySubmitted={handleReplySubmitted}
      />

      <ChatDialog 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        roomId={chatRoomId} 
      />

      {/* Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl mx-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={allImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-[500px] object-contain"
              />
              
              {/* Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? allImages.length - 1 : prev - 1
                    )}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === allImages.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-75"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 px-4">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-12 h-12 rounded-lg overflow-hidden",
                      currentImageIndex === index ? "ring-2 ring-yellow-500" : ""
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductView; 
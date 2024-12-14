import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Tag, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProductCard = ({
  id,
  title,
  price,
  // Optional props for detailed view
  rating,
  reviews,
  itemsSold,
  location,
  shipping_fee,
  shipping_provider_details,
  shipping_rate_details,
  hasDiscount,
  discountPercentage,
  discountVoucher,
  discountName,
  className,
  variant = 'basic',
  imageUrl,
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={cn(
              "w-3 h-3",
              index < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "fill-gray-200 text-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  // Determine shipping display
  const getShippingDisplay = () => {
    // If shipping_fee is explicitly set, use it
    if (shipping_fee !== undefined && shipping_fee !== null) {
      const fee = parseFloat(shipping_fee);
      // Check if fee is a valid number and greater than 0
      if (!isNaN(fee) && fee > 0) {
        return {
          text: `${formatPrice(fee)} Shipping`,
          bgColor: "bg-blue-600",
          detailedText: shipping_provider_details
            ? `${shipping_provider_details.name} • ${formatPrice(fee)} Shipping`
            : `${formatPrice(fee)} Shipping`
        };
      }
    }

    // Case 1: Has shipping provider and rate
    if (shipping_provider_details && shipping_rate_details) {
      const baseRate = parseFloat(shipping_rate_details.base_rate) || 0;
      return {
        text: baseRate > 0 ? `From ${formatPrice(baseRate)}` : "FREE SHIPPING",
        bgColor: baseRate > 0 ? "bg-blue-600" : "bg-yellow-500",
        detailedText: `${shipping_provider_details.name} • ${shipping_rate_details.name}${
          shipping_rate_details.estimated_days 
            ? ` (${shipping_rate_details.estimated_days} days)`
            : ''
        }`
      };
    }

    // Case 2: Has only shipping provider
    if (shipping_provider_details) {
      return {
        text: "Shipping Available",
        bgColor: "bg-blue-600",
        detailedText: shipping_provider_details.name
      };
    }

    // Default case (No shipping info)
    return {
      text: "FREE SHIPPING",
      bgColor: "bg-yellow-500",
      detailedText: "Free Shipping"
    };
  };

  const shippingDisplay = getShippingDisplay();

  const cardContent = (
    <div className={cn(
      "bg-white shadow-sm hover:shadow-md transition-shadow duration-200",
      "flex flex-col",
      className
    )}>
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        {/* Badges Container */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {/* Discount Badge */}
          {hasDiscount && discountPercentage && (
            <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
              <span>{discountPercentage}% OFF</span>
            </div>
          )}
          {/* Shipping Badge */}
          <div className={`${shippingDisplay.bgColor} text-white text-xs px-2 py-1 rounded flex items-center gap-1`}>
            <Truck className="w-3 h-3" />
            {shippingDisplay.text}
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col gap-2">
        {/* Title */}
        <h3 className="font-normal text-gray-900 line-clamp-2 text-sm h-10 overflow-hidden">
          {title}
        </h3>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-yellow-500">
            {formatPrice(price)}
          </span>
          {hasDiscount && discountPercentage && (
            <span className="text-orange-500 text-sm font-medium">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Original Price if Discounted */}
        {hasDiscount && discountPercentage && (
          <span className="text-sm line-through text-gray-400">
            {formatPrice(price * (100 / (100 - discountPercentage)))}
          </span>
        )}

        {/* Detailed View Elements */}
        {variant === 'detailed' && (
          <div className="space-y-1.5 mt-1">
            {/* Rating and Reviews */}
            <div className="flex items-center gap-2">
              {rating && (
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 font-medium">{rating}</span>
                  {renderStars(rating)}
                </div>
              )}
              {reviews > 0 && (
                <span className="text-xs text-gray-500">
                  {reviews} reviews
                </span>
              )}
            </div>

            {/* Items Sold */}
            {itemsSold > 0 && (
              <p className="text-xs text-gray-500">
                {itemsSold.toLocaleString()}+ sold
              </p>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            )}

            {/* Shipping Info */}
            {(shipping_provider_details || shipping_fee !== null) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Truck className="w-3 h-3" />
                <span>{shippingDisplay.detailedText}</span>
              </div>
            )}

            {/* Sulit Deal Tag */}
            {hasDiscount && (
              <div className="mt-2">
                <span className="text-orange-500 text-xs border border-orange-500 px-3 py-1 rounded-sm">
                  {discountName || "On Discount!"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return id ? (
    <Link 
      to={`/product/${id}`}
      className="block"
    >
      {cardContent}
    </Link>
  ) : cardContent;
};

export default ProductCard; 
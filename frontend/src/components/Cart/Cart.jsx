import React, { useState, useEffect } from 'react';
import { useCart } from '@/app/CartContext';
import { Trash2, Minus, Plus, Store } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/utils/AuthContext';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';

export function Cart() {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart } = useCart();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const location = useLocation();
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Add console logs to check cart data
  useEffect(() => {
    if (cart?.items) {
      console.log('Cart Items:', cart.items);
      cart.items.forEach(item => {
        console.log('Item:', item.item_uuid, {
          product: item.product,
          selected_option: item.selected_option,
          price: item.product.price,
          compare_at_price: item.product.compare_at_price,
          discount_percentage: item.product.discount_percentage,
          discount_name: item.product.discount_name
        });
      });
    }
  }, [cart?.items]);

  // Check for items that should be auto-selected (from buy now)
  useEffect(() => {
    if (location.state?.fromBuyNow && location.state?.itemUuid && cart?.items) {
      setSelectedItems(new Set([location.state.itemUuid]));
    }
  }, [location.state?.fromBuyNow, location.state?.itemUuid, cart?.items]);

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

  // Handle quantity update
  const handleQuantityUpdate = async (itemUuid, currentQuantity, action) => {
    const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
    if (newQuantity < 1) return;
    await updateCartItem(itemUuid, newQuantity);
  };

  // Handle item removal
  const handleRemoveItem = async (itemUuid) => {
    await removeFromCart(itemUuid);
  };

  // Handle checkbox changes
  const handleItemSelect = (itemUuid) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemUuid)) {
        newSet.delete(itemUuid);
      } else {
        newSet.add(itemUuid);
      }
      return newSet;
    });
  };

  // Handle shop selection
  const handleShopSelect = (shopItems) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      const itemUuids = shopItems.map(item => item.item_uuid);
      const allSelected = itemUuids.every(uuid => newSet.has(uuid));
      
      if (allSelected) {
        // Deselect all items from this shop
        itemUuids.forEach(uuid => newSet.delete(uuid));
      } else {
        // Select all items from this shop
        itemUuids.forEach(uuid => newSet.add(uuid));
      }
      
      return newSet;
    });
  };

  // Add helper function to check if discount is active
  const isDiscountActive = (item) => {
    if (!item.product.discount_percentage) return false;
    
    const now = new Date();
    const startDate = item.product.discount_start_date ? new Date(item.product.discount_start_date) : null;
    const endDate = item.product.discount_end_date ? new Date(item.product.discount_end_date) : null;
    
    return startDate && endDate && now >= startDate && now <= endDate;
  };

  // Add helper function to get current price
  const getCurrentPrice = (item) => {
    const basePrice = item.selected_option?.price || item.product.price;
    if (isDiscountActive(item)) {
      const discountMultiplier = 1 - (item.product.discount_percentage / 100);
      return basePrice * discountMultiplier;
    }
    return basePrice;
  };

  // Add helper function to get original price
  const getOriginalPrice = (item) => {
    return item.selected_option?.compare_at_price || item.product.compare_at_price || item.selected_option?.price || item.product.price;
  };

  // Modify calculateSelectedTotal to use discounted prices
  const calculateSelectedTotal = () => {
    if (!cart?.items) return 0;
    return cart.items
      .filter(item => selectedItems.has(item.item_uuid))
      .reduce((total, item) => {
        return total + (getCurrentPrice(item) * item.quantity);
      }, 0);
  };

  // Group items by shop
  const groupByShop = () => {
    if (!cart?.items) return {};
    return cart.items.reduce((shops, item) => {
      const shopId = item.product.shop?.shop_uuid || 'default';
      if (!shops[shopId]) {
        shops[shopId] = {
          shopInfo: item.product.shop || {
            business_name: "Kiko's Stuff Toy",
            business_city: 'Default City',
            business_province: 'Default Province',
            shop_logo: null
          },
          items: []
        };
      }
      shops[shopId].items.push(item);
      return shops;
    }, {});
  };

  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      toast.error('Please select items to checkout');
      return;
    }

    setProcessingCheckout(true);

    try {
      // Get selected items details
      const checkoutItems = cart.items.map(item => ({
        ...item,
        is_selected: selectedItems.has(item.item_uuid)
      }));
      
      // Navigate to checkout page with selected items
      navigate('/checkout', {
        state: {
          items: checkoutItems,
          selectedItems: Array.from(selectedItems),
          subtotal: calculateSelectedTotal()
        }
      });
    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error('Failed to process checkout');
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Shopping Cart</h2>
          <p className="text-gray-600 mb-4">Please log in to view your cart</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart to see them here</p>
          <Link to="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shopGroups = groupByShop();

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Shopping Cart</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {Object.entries(shopGroups).map(([shopId, { shopInfo, items }]) => (
              <div key={shopId} className="bg-white rounded-lg shadow p-6">
                {/* Shop Header */}
                <div className="flex items-center gap-4 mb-6">
                  <Checkbox
                    checked={items.every(item => selectedItems.has(item.item_uuid))}
                    onCheckedChange={() => handleShopSelect(items)}
                  />
                  {shopInfo.shop_logo ? (
                    <img
                      src={shopInfo.shop_logo}
                      alt={shopInfo.business_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Store className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{shopInfo.business_name}</h3>
                    <p className="text-sm text-gray-500">
                      {shopInfo.business_city}, {shopInfo.business_province}
                    </p>
                  </div>
                </div>

                {/* Shop Items */}
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.item_uuid} className="flex items-center gap-4 py-4 border-t first:border-t-0">
                      <Checkbox
                        checked={selectedItems.has(item.item_uuid)}
                        onCheckedChange={() => handleItemSelect(item.item_uuid)}
                      />
                      
                      <Link to={`/product/${item.product.product_uuid}`} className="shrink-0">
                        <img
                          src={item.product.main_image || '/placeholder.png'}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-md"
                        />
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product.product_uuid}`}>
                          <h4 className="font-medium text-gray-900 truncate">
                            {item.product.name}
                          </h4>
                        </Link>
                        
                        {/* Display all selected options */}
                        {item.selected_option && (
                          <div className="text-sm text-gray-500 mt-1">
                            <p>
                              {item.selected_option.name}: {item.selected_option.value}
                            </p>
                            {item.selected_option.sku && (
                              <p className="text-xs text-gray-400">
                                SKU: {item.selected_option.sku}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Price Display with Discount */}
                        <div className="mt-1">
                          {isDiscountActive(item) ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[#F15B41]">
                                  {formatPrice(getCurrentPrice(item))}
                                </p>
                                <p className="text-sm text-gray-500 line-through">
                                  {formatPrice(getOriginalPrice(item))}
                                </p>
                                <span className="text-xs text-[#F15B41]">
                                  -{item.product.discount_percentage}%
                                </span>
                              </div>
                              {item.product.discount_name && (
                                <p className="text-xs text-[#F15B41]">
                                  {item.product.discount_name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(getCurrentPrice(item))}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => handleQuantityUpdate(item.item_uuid, item.quantity, 'decrease')}
                            className="p-1 rounded-md hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityUpdate(item.item_uuid, item.quantity, 'increase')}
                            className="p-1 rounded-md hover:bg-gray-100"
                            disabled={item.quantity >= (item.selected_option?.stock || item.product.quantity)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        {isDiscountActive(item) ? (
                          <div className="space-y-1">
                            <p className="font-medium text-[#F15B41]">
                              {formatPrice(getCurrentPrice(item) * item.quantity)}
                            </p>
                            <p className="text-sm text-gray-500 line-through">
                              {formatPrice(getOriginalPrice(item) * item.quantity)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-medium">
                            {formatPrice(getCurrentPrice(item) * item.quantity)}
                          </p>
                        )}
                        <button
                          onClick={() => handleRemoveItem(item.item_uuid)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Selected Items ({selectedItems.size})</span>
                <span>{formatPrice(calculateSelectedTotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(calculateSelectedTotal())}</span>
              </div>
            </div>

            <Button 
              className="w-full mt-6" 
              size="lg"
              disabled={selectedItems.size === 0 || processingCheckout}
              onClick={handleCheckout}
            >
              {processingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Checkout (${selectedItems.size} items)`
              )}
            </Button>
            
            <Link to="/">
              <Button variant="outline" className="w-full mt-2" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../app/CartContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  MapPin, 
  ShoppingBag, 
  Wallet, 
  Ticket, 
  Loader2,
  ChevronLeft,
  AlertTriangle,
  CreditCard,
  Plus
} from 'lucide-react';

// Envelope Header Component
const EnvelopeHeader = ({ icon: Icon, title, color = "yellow" }) => {
  const baseColor = color === "yellow" ? "bg-yellow-500" : "bg-gray-500";
  const darkColor = color === "yellow" ? "border-yellow-600" : "border-gray-600";
  
  return (
    <div className={`${baseColor} p-4 relative`}>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className={`absolute top-0 left-0 w-0 h-0 border-t-[25px] ${darkColor} border-r-[25px] border-r-transparent`}></div>
        <div className={`absolute top-0 right-0 w-0 h-0 border-t-[25px] ${darkColor} border-l-[25px] border-l-transparent`}></div>
      </div>
      <div className="flex items-center justify-center relative z-10">
        <Icon className="text-white mr-2 h-6 w-6" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Get selected items from location state
  const selectedItemUuids = location.state?.selectedItems || [];
  const selectedItems = cart?.items?.filter(item => selectedItemUuids.includes(item.item_uuid)) || [];

  // Format price with 2 decimal places
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '₱0.00';
    return `₱${price.toFixed(2)}`;
  };

  // Get current price for an item
  const getCurrentPrice = (item) => {
    const basePrice = item.selected_option?.price || item.product?.price || 0;
    if (item.product?.discount_percentage) {
      const discountMultiplier = 1 - (item.product.discount_percentage / 100);
      return basePrice * discountMultiplier;
    }
    return basePrice;
  };

  // Calculate total from selected items
  const calculateTotal = () => {
    if (!selectedItems || selectedItems.length === 0) return 0;
    return selectedItems.reduce((sum, item) => {
      const price = getCurrentPrice(item);
      return sum + (price * item.quantity);
    }, 0);
  };

  // Calculate shipping fee from selected items
  const calculateShippingFee = () => {
    if (!selectedItems || selectedItems.length === 0) return 0;
    return selectedItems.reduce((sum, item) => {
      return sum + (item.product?.shipping_fee || 0);
    }, 0);
  };

  const total = calculateTotal();
  const shippingFee = calculateShippingFee();

  // Redirect if no selected items
  useEffect(() => {
    if (cart && (!selectedItems || selectedItems.length === 0)) {
      toast.error('No items selected for checkout');
      navigate('/cart');
      return;
    }
  }, [cart, navigate, selectedItems]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setPaymentLoading(true);
      try {
        const response = await axios.get('http://localhost:5555/api/payment-methods', {
          withCredentials: true
        });
        setPaymentMethods(response.data);
        // Set first payment method as default if available
        if (response.data.length > 0) {
          setPaymentMethod(response.data[0].payment_uuid);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment methods');
      } finally {
        setPaymentLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    // Fetch user's default address
    const fetchAddress = async () => {
      setAddressLoading(true);
      try {
        // Get all addresses
        const response = await axios.get('http://localhost:5555/api/addresses', {
          withCredentials: true
        });
        
        const addresses = response.data;
        if (addresses && addresses.length > 0) {
          // First try to get default shipping address
          let selectedAddress = addresses.find(addr => addr.is_default_shipping);
          
          // If no default shipping address, try active address
          if (!selectedAddress) {
            selectedAddress = addresses.find(addr => addr.is_active);
          }
          
          // If still no address, use the first one
          if (!selectedAddress) {
            selectedAddress = addresses[0];
          }
          
          setAddress(selectedAddress);
        } else {
          setAddress(null);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
        setAddress(null);
      } finally {
        setAddressLoading(false);
      }
    };
    fetchAddress();
  }, [cart, navigate]);

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error('Please add a delivery address');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!selectedItems || selectedItems.length === 0) {
      toast.error('No items selected for checkout');
      return;
    }

    setLoading(true);
    try {
      // Get the selected payment method details
      const selectedPaymentMethod = paymentMethods.find(method => method.payment_uuid === paymentMethod);
      
      // If payment method is not COD, redirect to payment page
      if (selectedPaymentMethod.type !== 'cod') {
        // Create pending order first
        const orderResponse = await axios.post('/api/checkout/process', {
          items: selectedItems.map(item => ({
            product_uuid: item.product_uuid,
            quantity: item.quantity,
            variation: item.variation
          })),
          shipping_address: address,
          payment_method_uuid: paymentMethod,
          message,
          shipping_fee: shippingFee,
          payment_status: 'pending'
        }, {
          withCredentials: true
        });

        if (orderResponse.data.status === 'success') {
          // Redirect to payment page based on payment method
          if (selectedPaymentMethod.type === 'credit_card') {
            navigate('/payment/card', {
              state: {
                order_uuid: orderResponse.data.order.order_uuid,
                amount: total + shippingFee,
                payment_method: selectedPaymentMethod
              }
            });
          } else if (selectedPaymentMethod.type === 'paypal') {
            navigate('/payment/paypal', {
              state: {
                order_uuid: orderResponse.data.order.order_uuid,
                amount: total + shippingFee,
                payment_method: selectedPaymentMethod
              }
            });
          }
        }
      } else {
        // For COD, process the order directly
        const response = await axios.post('/api/checkout/process', {
          items: selectedItems.map(item => ({
            product_uuid: item.product_uuid,
            quantity: item.quantity,
            variation: item.variation
          })),
          shipping_address: address,
          payment_method_uuid: paymentMethod,
          message,
          shipping_fee: shippingFee,
          payment_status: 'pending',
          status: 'processing'
        }, {
          withCredentials: true
        });

        if (response.data.status === 'success') {
          toast.success('Order placed successfully!');
          navigate('/user/purchases');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while cart is being fetched
  if (!cart) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Checkout Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center h-16">
            <button 
              onClick={() => navigate('/cart')}
              className="flex items-center text-gray-600 hover:text-yellow-500 transition-colors mr-4"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Back to Cart</span>
            </button>
            <div className="flex-1 flex items-center justify-center">
              <img 
                src="assets/flaskify-primary.png" 
                alt="Flaskify" 
                className="h-8"
              />
              <div className="h-6 w-px bg-gray-300 mx-4"></div>
              <span className="text-xl font-semibold text-gray-800">Secure Checkout</span>
            </div>
            <div className="w-24"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <EnvelopeHeader icon={MapPin} title="Delivery Address" />
          {/* Address Content */}
          <div className="p-6">
            {addressLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin h-5 w-5 text-yellow-500 mr-2" />
                <span>Loading address...</span>
              </div>
            ) : address ? (
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">{address.address_name}</h3>
                    {address.is_default_shipping && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Default Shipping</span>
                    )}
                    {address.is_default_billing && (
                      <span className="px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded">Default Billing</span>
                    )}
                    {address.is_active && (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">Active</span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.recipient_name}</p>
                  <p className="text-gray-600">{address.complete_address}</p>
                  <p className="text-gray-600">{address.phone_number}</p>
                  {address.additional_info && (
                    <p className="text-gray-500 text-sm">Note: {address.additional_info}</p>
                  )}
                </div>
                <button 
                  onClick={() => navigate('/user/account/addresses')}
                  className="text-yellow-500 hover:text-yellow-600 font-medium flex items-center"
                >
                  Change
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center p-4 mb-4 text-yellow-800 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  <div>
                    <p className="font-medium">No delivery address found</p>
                    <p className="text-sm">Please add a delivery address to continue with your order.</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/user/account/addresses')}
                  className="w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  Add New Address
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <EnvelopeHeader icon={ShoppingBag} title="Products Ordered" />
          <div className="p-6">
            {selectedItems && selectedItems.length > 0 ? (
              <>
                {selectedItems.map((item, index) => {
                  // Safely get price from item or default to 0
                  const price = item.product?.price || 0;
                  const quantity = item.quantity || 0;
                  const subtotal = price * quantity;
                  
                  return (
                    <div key={index} className="flex items-center py-4 border-b last:border-b-0">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img 
                          src={item.product?.main_image || 'assets/placeholder.png'} 
                          alt={item.product?.name || 'Product'} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="ml-4 flex-grow">
                        <h3 className="font-medium text-gray-900">{item.product?.name || 'Product Name Unavailable'}</h3>
                        {item.variation && (
                          <p className="text-sm text-gray-600">
                            Variation: {item.variation.name} - {item.variation.value}
                          </p>
                        )}
                        <div className="mt-1 flex justify-between items-center">
                          <div className="text-sm">
                            <span className="text-gray-600">Price: </span>
                            <span className="font-medium text-gray-900">₱{price.toFixed(2)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Quantity: </span>
                            <span className="font-medium text-gray-900">{quantity}</span>
                          </div>
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="text-gray-600">Subtotal: </span>
                          <span className="font-medium text-yellow-600">₱{subtotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4">
                  <textarea
                    placeholder="Message to seller (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    rows="2"
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items selected for checkout
              </div>
            )}
          </div>
        </div>

        {/* Vouchers */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <EnvelopeHeader icon={Ticket} title="Flaskify Voucher" />
          <div className="p-6">
            <div className="flex items-center justify-between">
              <button className="text-yellow-500 hover:text-yellow-600 font-medium">
                Select Voucher
              </button>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <EnvelopeHeader icon={Wallet} title="Payment Method" />
          <div className="p-6">
            {paymentLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin h-5 w-5 text-yellow-500 mr-2" />
                <span>Loading payment methods...</span>
              </div>
            ) : paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.payment_uuid}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      paymentMethod === method.payment_uuid
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setPaymentMethod(method.payment_uuid)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="font-medium">
                          {method.type === 'credit_card'
                            ? `${method.card_type} •••• ${method.last_four}`
                            : method.type === 'paypal'
                            ? `PayPal (${method.paypal_email})`
                            : method.type === 'cod'
                            ? 'Cash on Delivery'
                            : 'Unknown Payment Method'}
                        </p>
                        {method.type === 'credit_card' && (
                          <p className="text-sm text-gray-500">
                            Expires {method.expiry_month}/{method.expiry_year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('/user/account/payment-methods')}
                  className="text-yellow-500 hover:text-yellow-600 font-medium text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New Payment Method
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">No Payment Methods Found</h3>
                  <p className="text-gray-500 text-sm mb-4">Please add a payment method to continue with checkout</p>
                  <button
                    onClick={() => navigate('/user/account/payment-methods')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <EnvelopeHeader icon={ShoppingBag} title="Order Summary" />
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Merchandise Subtotal:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping Total:</span>
                <span>{formatPrice(shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-semibold">Total Payment:</span>
                <span className="text-xl font-bold text-primary">{formatPrice(total + shippingFee)}</span>
              </div>
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={loading || !address || addressLoading}
              className="w-full mt-6 bg-yellow-500 text-white py-3 rounded-lg font-medium hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Processing...
                </div>
              ) : !address ? (
                'Add Delivery Address to Continue'
              ) : (
                'Place Order'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 

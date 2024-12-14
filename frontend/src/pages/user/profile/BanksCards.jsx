import { useState, useEffect } from 'react';
import { Plus, Trash, CreditCard } from 'lucide-react';
import UserCard from '../../../components/user/UserCard';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5555';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default function BanksCards() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    paymentType: '',
    details: {
      card_number: '',
      expiry_date: '',
      card_holder_name: '',
      cvv: '',
      paypal_email: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await axios.get('/api/payment-methods');
        setPaymentMethods(response.data);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (newPayment.paymentType === 'credit_card') {
      if (!/^\d{16}$/.test(newPayment.details.card_number)) {
        newErrors.card_number = 'Card number must be 16 digits';
      }
      if (!/^\d{2}\/\d{2}$/.test(newPayment.details.expiry_date)) {
        newErrors.expiry_date = 'Expiry date must be in MM/YY format';
      }
      if (!newPayment.details.card_holder_name) {
        newErrors.card_holder_name = 'Cardholder name is required';
      }
      if (!/^\d{3,4}$/.test(newPayment.details.cvv)) {
        newErrors.cvv = 'CVV must be 3 or 4 digits';
      }
    } else if (newPayment.paymentType === 'paypal') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPayment.details.paypal_email)) {
        newErrors.paypal_email = 'Invalid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPaymentMethod = async () => {
    setSaving(true);

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      let paymentData;
      if (newPayment.paymentType === 'credit_card') {
        const [month, year] = newPayment.details.expiry_date.split('/');
        paymentData = {
          type: 'credit_card',
          card_type: 'visa',
          card_holder_name: newPayment.details.card_holder_name,
          card_number: newPayment.details.card_number,
          expiry_month: month,
          expiry_year: '20' + year,
          cvv: newPayment.details.cvv,
          is_default: false
        };
      } else if (newPayment.paymentType === 'paypal') {
        paymentData = {
          type: 'paypal',
          paypal_email: newPayment.details.paypal_email,
          is_default: false
        };
      } else if (newPayment.paymentType === 'cod') {
        paymentData = {
          type: 'cod',
          is_default: false
        };
      }

      console.log('Sending payment data:', paymentData);

      const response = await axios.post('/api/payment-methods', paymentData);
      console.log('Response:', response.data);
      
      setPaymentMethods([...paymentMethods, response.data]);
      setDialogOpen(false);
      setNewPayment({ paymentType: '', details: {} });
      setErrors({});
      toast.success('Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      let errorMessage = 'Failed to add payment method';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        errorMessage = error.response.data.error || errorMessage;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        errorMessage = 'No response from server';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
      }
      
      toast.error(errorMessage);
      setErrors({ api: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentUuid) => {
    if (!paymentUuid) return;
    
    try {
      await axios.delete(`/api/payment-methods/${paymentUuid}`);
      setPaymentMethods(paymentMethods.filter(pm => pm.payment_uuid !== paymentUuid));
      toast.success('Payment method deleted successfully');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const handleInputChange = (field, value) => {
    setNewPayment(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value
      }
    }));
  };

  const renderPaymentDetails = () => {
    switch (newPayment.paymentType) {
      case 'credit_card':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card_number">Card Number</Label>
              <Input
                id="card_number"
                type="text"
                maxLength="16"
                placeholder="1234 5678 9012 3456"
                value={newPayment.details.card_number}
                onChange={(e) => handleInputChange('card_number', e.target.value)}
                className={errors.card_number ? 'border-red-500' : ''}
              />
              {errors.card_number && (
                <p className="text-sm text-red-500">{errors.card_number}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="text"
                  placeholder="MM/YY"
                  maxLength="5"
                  value={newPayment.details.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  className={errors.expiry_date ? 'border-red-500' : ''}
                />
                {errors.expiry_date && (
                  <p className="text-sm text-red-500">{errors.expiry_date}</p>
                )}
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="text"
                  maxLength="4"
                  placeholder="123"
                  value={newPayment.details.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className={errors.cvv ? 'border-red-500' : ''}
                />
                {errors.cvv && (
                  <p className="text-sm text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="card_holder_name">Cardholder Name</Label>
              <Input
                id="card_holder_name"
                type="text"
                placeholder="John Doe"
                value={newPayment.details.card_holder_name}
                onChange={(e) => handleInputChange('card_holder_name', e.target.value)}
                className={errors.card_holder_name ? 'border-red-500' : ''}
              />
              {errors.card_holder_name && (
                <p className="text-sm text-red-500">{errors.card_holder_name}</p>
              )}
            </div>
          </div>
        );
      case 'paypal':
        return (
          <div>
            <Label htmlFor="paypal_email">PayPal Email</Label>
            <Input
              id="paypal_email"
              type="email"
              placeholder="example@email.com"
              value={newPayment.details.paypal_email}
              onChange={(e) => handleInputChange('paypal_email', e.target.value)}
              className={errors.paypal_email ? 'border-red-500' : ''}
            />
            {errors.paypal_email && (
              <p className="text-sm text-red-500">{errors.paypal_email}</p>
            )}
          </div>
        );
      case 'cod':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 text-gray-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <h3 className="font-medium text-gray-900">Cash on Delivery</h3>
                <p className="text-sm text-gray-500">Pay with cash when your order arrives</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPaymentMethod = (method) => {
    if (method.type === 'credit_card') {
      return (
        <>
          <h3 className="font-medium">
            {`${method.card_type} •••• ${method.last_four}`}
          </h3>
          <p className="text-sm text-gray-500">
            Expires {method.expiry_month}/{method.expiry_year}
          </p>
        </>
      );
    } else if (method.type === 'paypal') {
      return (
        <h3 className="font-medium">
          PayPal ({method.paypal_email})
        </h3>
      );
    } else if (method.type === 'cod') {
      return (
        <h3 className="font-medium">Cash on Delivery</h3>
      );
    } else {
      return (
        <h3 className="font-medium">Unknown Payment Method</h3>
      );
    }
  };

  return (
    <UserCard
      title="My Payment Methods"
      short_description="Manage your payment methods"
      hasAction={true}
      actionName="Add Payment Method"
      ActionIcon={Plus}
      onAction={() => setDialogOpen(true)}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : paymentMethods.length > 0 ? (
          paymentMethods.map((method) => (
            <div
              key={method.payment_uuid}
              className="flex items-center justify-between p-4 bg-white rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                {method.type === 'cod' ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ) : (
                  <CreditCard className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  {renderPaymentMethod(method)}
                </div>
              </div>
              <button
                onClick={() => handleDeletePaymentMethod(method.payment_uuid)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No payment methods added yet
          </div>
        )}
      </div>

      {/* Add Payment Method Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select
                value={newPayment.paymentType}
                onValueChange={(value) =>
                  setNewPayment({
                    paymentType: value,
                    details: {
                      card_number: '',
                      expiry_date: '',
                      card_holder_name: '',
                      cvv: '',
                      paypal_email: ''
                    }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderPaymentDetails()}

            {errors.api && (
              <p className="text-sm text-red-500 mt-2">{errors.api}</p>
            )}

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setNewPayment({ paymentType: '', details: {} });
                  setErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                disabled={saving}
                className="bg-yellow-500 text-white hover:bg-yellow-600"
              >
                {saving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </div>
                ) : (
                  'Add Payment Method'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UserCard>
  );
}
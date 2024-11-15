import { useState, useEffect } from 'react';
import { Plus, Trash, CreditCard } from 'lucide-react';
import UserCard from '../../../components/user/UserCard';
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
        const response = await fetch('http://localhost:5555/api/payment-methods', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setPaymentMethods(data);
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (newPayment.paymentType === 'card') {
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
    setSaving(true)

    if (!validateForm()) return;

    try {
      const response = await fetch('http://localhost:5555/api/payment-methods', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_type: newPayment.paymentType,
          ...newPayment.details
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods([...paymentMethods, data]);
        setDialogOpen(false);
        setNewPayment({ paymentType: '', details: {} });
        setErrors({});
        toast.success('Payment method added successfully');
      } else {
        const errorData = await response.json();
        setErrors({ api: errorData.error });
        toast.error('Failed to add payment method');
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
      setErrors({ api: 'Failed to add payment method' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      const response = await fetch(`http://localhost:5555/api/payment-methods/${id}`, { method: 'DELETE', credentials: 'include' });
      if (response.ok) {
        setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
        toast.success('Payment method deleted successfully');
      }
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
      case 'card':
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
          <div className="text-sm text-gray-500">
            <p>Cash on Delivery will be available at checkout.</p>
          </div>
        );
      default:
        return null;
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
        {loading ? <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div> : paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 bg-gray-100 rounded-md"
          >
            <div className="flex items-center space-x-3">
              {method.payment_type === 'card' ? (
                <CreditCard className="w-5 h-5 text-gray-600" />
              ) : method.payment_type === 'paypal' ? (
                <svg fill="none" height="25" viewBox="0 0 60 25" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M55.4706 6.32361H53.9517C53.9509 6.32361 53.95 6.32389 53.9495 6.32389L53.9486 6.32361C53.6009 6.32361 53.2481 6.58933 53.1496 6.92739C53.1456 6.94107 53.1388 6.95417 53.1356 6.96841C53.1356 6.96841 53.0994 7.13331 53.0366 7.4184L50.9502 16.854C50.9019 17.0673 50.8697 17.2063 50.86 17.2425L50.864 17.2476C50.7918 17.5774 50.9904 17.8502 51.3167 17.8807L51.321 17.887H52.8976C53.243 17.887 53.5935 17.6238 53.6951 17.29C53.7 17.2738 53.7077 17.2587 53.7114 17.2425L55.9873 6.96784L55.9839 6.9667C56.0612 6.61525 55.8343 6.32361 55.4706 6.32361ZM47.6798 15.5971C47.4691 15.7295 47.2465 15.8428 47.0133 15.9394C46.6999 16.0656 46.4027 16.1316 46.1278 16.1316C45.7059 16.1316 45.3816 16.0721 45.1624 15.9448C44.9429 15.824 44.8278 15.6141 44.8316 15.3137C44.8316 14.9668 44.9118 14.6976 45.0779 14.4866C45.2452 14.2835 45.4938 14.1201 45.8021 13.9982C46.1087 13.8945 46.4858 13.8091 46.9211 13.7478C47.3082 13.6991 48.0735 13.6111 48.1714 13.6105C48.2693 13.6097 48.3344 13.5559 48.2907 13.8162C48.2713 13.9292 48.0503 14.8344 47.949 15.2459C47.9196 15.3692 47.7552 15.5489 47.6798 15.5971C47.6798 15.5971 47.7552 15.5489 47.6798 15.5971ZM50.6834 9.23565C50.0388 8.8768 49.0306 8.69538 47.651 8.69538C46.9688 8.69538 46.2831 8.75006 45.5951 8.85658C45.0902 8.93376 45.0382 8.94658 44.7245 9.01465C44.0791 9.15477 43.9795 9.79957 43.9795 9.79957L43.7722 10.65C43.6546 11.194 43.9652 11.1715 44.1036 11.1293C44.3854 11.0445 44.5381 10.9601 45.113 10.8303C45.6625 10.7058 46.2431 10.6127 46.7064 10.6164C47.3858 10.6164 47.9025 10.6907 48.2459 10.8337C48.5896 10.9832 48.7597 11.2378 48.7597 11.6021C48.7608 11.6887 48.7631 11.7704 48.7317 11.8419C48.7035 11.9085 48.6492 11.9729 48.4868 11.9948C47.5171 12.0524 46.8212 12.1407 45.9831 12.2626C45.1561 12.3788 44.4325 12.5778 43.8276 12.8535C43.1828 13.1389 42.7004 13.5208 42.3678 14.0047C42.0441 14.4909 41.8814 15.0796 41.8805 15.7731C41.8805 16.4284 42.1166 16.963 42.5733 17.3779C43.0355 17.7875 43.6366 17.9903 44.364 17.9903C44.8184 17.9871 45.1741 17.9544 45.429 17.8909C45.6814 17.8274 45.9565 17.7371 46.2471 17.6115C46.4644 17.5209 46.6987 17.3899 46.9462 17.2256C47.194 17.0607 47.3655 16.9436 47.5856 16.7998L47.5936 16.8135L47.5317 17.086C47.5314 17.0886 47.5277 17.09 47.5277 17.0926L47.5297 17.0977C47.4589 17.4261 47.6567 17.6992 47.9827 17.7314L47.9867 17.7371H48.0155L48.0167 17.7385C48.233 17.7385 48.9758 17.7382 49.3229 17.7371H49.5652C49.5812 17.7371 49.5829 17.7322 49.5892 17.7285C49.9221 17.6878 50.2412 17.4172 50.3163 17.0926L51.556 11.7539C51.5845 11.6283 51.6071 11.4833 51.6205 11.3164C51.6359 11.1478 51.6542 11.0091 51.6488 10.9089C51.6516 10.1533 51.3262 9.59479 50.6834 9.23565ZM43.2181 8.01962C43.0066 7.60893 42.6872 7.27827 42.2832 7.02081C41.869 6.76392 41.3769 6.58477 40.8072 6.48025C40.2437 6.38171 39.5737 6.32532 38.8104 6.32361L35.2588 6.32532C34.8931 6.33158 34.5343 6.6181 34.4498 6.97097L32.062 17.3384C31.9749 17.6907 32.2124 17.9844 32.5715 17.9824L34.2757 17.9793C34.6371 17.9824 35.0053 17.6907 35.0906 17.3384L35.6667 14.8225C35.7475 14.4699 36.1149 14.1745 36.4822 14.1797H36.9667C39.0453 14.1797 40.657 13.7536 41.8111 12.9055C42.9623 12.053 43.5418 10.9349 43.5418 9.54418C43.5381 8.93698 43.4345 8.42547 43.2181 8.01962ZM39.554 11.4105C39.0453 11.7796 38.3314 11.9647 37.4128 11.9647H36.9903C36.625 11.969 36.3889 11.6742 36.4757 11.3208L36.9849 9.12039C37.0609 8.77236 37.4317 8.47616 37.7919 8.47901L38.35 8.47616C39.0014 8.47901 39.4886 8.58781 39.8252 8.80398C40.156 9.02271 40.3165 9.36191 40.319 9.81389C40.3205 10.5028 40.065 11.0329 39.554 11.4105Z" fill="black" /><path d="M31.1788 8.69152C30.8558 8.69152 30.4322 8.95378 30.2316 9.27073C30.2316 9.27073 28.0712 12.9872 27.859 13.3585C27.7437 13.5582 27.6268 13.4313 27.6073 13.357C27.5916 13.2667 26.9378 9.29515 26.9378 9.29515C26.8643 8.9754 26.5314 8.70093 26.1151 8.7022L24.768 8.70424C24.4432 8.70424 24.2407 8.96523 24.3129 9.28065C24.3129 9.28065 25.3427 15.1374 25.5435 16.5148C25.6436 17.2767 25.5331 17.4118 25.5331 17.4118L24.1981 19.7474C24.0026 20.0641 24.1096 20.3236 24.4328 20.3236L25.994 20.3223C26.3172 20.3223 26.7454 20.0641 26.9378 19.7469L32.9434 9.55487C32.9434 9.55487 33.5179 8.68414 32.9881 8.69152C32.6268 8.69661 31.1788 8.69152 31.1788 8.69152ZM19.9034 15.5818C19.693 15.714 19.471 15.8266 19.2381 15.9233C18.925 16.0487 18.6268 16.1152 18.3532 16.1152C17.9329 16.1152 17.6082 16.0555 17.389 15.929C17.1701 15.8081 17.0546 15.5986 17.0583 15.2983C17.0583 14.9528 17.1393 14.6833 17.3049 14.4729C17.4723 14.2699 17.7194 14.1064 18.0273 13.985C18.3343 13.8809 18.7121 13.7967 19.1454 13.7356C19.532 13.687 20.2971 13.5994 20.3946 13.598C20.4916 13.5977 20.5568 13.5434 20.5132 13.8033C20.4944 13.9161 20.2735 14.8203 20.1723 15.2309C20.1418 15.3546 19.9776 15.534 19.9034 15.5818C19.9034 15.5818 19.9776 15.534 19.9034 15.5818ZM22.9031 9.23057C22.2593 8.87231 21.2527 8.69147 19.8749 8.69147C19.1933 8.69147 18.5088 8.7455 17.8215 8.85212C17.3163 8.92861 17.2656 8.94169 16.952 9.00964C16.3071 9.15011 16.2079 9.79327 16.2079 9.79327L16.001 10.6429C15.8838 11.1857 16.1942 11.1632 16.3319 11.1211C16.6127 11.0364 16.7661 10.9525 17.3403 10.8223C17.8882 10.6986 18.4689 10.6059 18.931 10.609C19.6101 10.609 20.1255 10.683 20.4685 10.8257C20.812 10.975 20.981 11.2297 20.981 11.5931C20.9833 11.6796 20.985 11.7614 20.9545 11.8322C20.9257 11.8994 20.871 11.9633 20.7088 11.9849C19.7415 12.0432 19.0468 12.1311 18.2083 12.2528C17.3825 12.3688 16.6601 12.5675 16.0557 12.8425C15.4117 13.1274 14.9305 13.5093 14.5989 13.9921C14.2745 14.4771 14.1123 15.0649 14.1117 15.7575C14.1117 16.4115 14.3478 16.9455 14.8033 17.3595C15.2652 17.7683 15.865 17.9711 16.5914 17.9711C17.0455 17.9679 17.4004 17.9347 17.6558 17.8718C17.9076 17.8079 18.1827 17.7183 18.4718 17.5929C18.6896 17.5025 18.923 17.3711 19.1705 17.2073C19.4174 17.043 19.5896 16.9261 19.8102 16.7825L19.8171 16.7959L19.7552 17.0677C19.7546 17.0703 19.7512 17.072 19.7512 17.0751L19.7538 17.0794C19.6831 17.4081 19.8801 17.6805 20.2059 17.712L20.2099 17.7183H20.2384L20.2393 17.7203C20.4559 17.7203 21.198 17.7191 21.5438 17.7183H21.7861C21.8024 17.7183 21.8046 17.7129 21.8098 17.7095C22.143 17.6677 22.4606 17.3981 22.5364 17.0751L23.7746 11.7447C23.8025 11.6196 23.8253 11.4748 23.8378 11.3085C23.8544 11.1393 23.8723 11.0014 23.8675 10.9016C23.8703 10.1467 23.5448 9.58912 22.9031 9.23057ZM15.1586 8.01683C14.9474 7.60682 14.6283 7.2767 14.225 7.01966C13.8113 6.76319 13.3198 6.58434 12.7508 6.47999C12.188 6.38161 11.519 6.32531 10.7567 6.32361L7.20967 6.32531C6.84448 6.33157 6.48613 6.61761 6.40175 6.9699L4.01704 17.3203C3.93009 17.672 4.16728 17.9652 4.52591 17.9632L6.22785 17.9601C6.58876 17.9632 6.95652 17.672 7.04176 17.3203L7.61705 14.8085C7.69773 14.4565 8.06463 14.1616 8.43153 14.1667H8.91531C10.9913 14.1667 12.6008 13.7414 13.7534 12.8946C14.9032 12.0436 15.4819 10.9273 15.4819 9.53888C15.4782 8.93267 15.3747 8.42201 15.1586 8.01683ZM11.4993 11.4021C10.9913 11.7706 10.2783 11.9554 9.36089 11.9554H8.93897C8.57407 11.9597 8.33831 11.6654 8.42497 11.3126L8.93356 9.11579C9.00939 8.76833 9.37971 8.47262 9.73948 8.47546L10.2968 8.47262C10.9474 8.47546 11.434 8.58408 11.7701 8.79989C12.1005 9.01826 12.2607 9.3569 12.2633 9.80814C12.2647 10.496 12.0096 11.0251 11.4993 11.4021Z" fill="black" /></svg>
              ) : null}
              <div>
                <p className="font-semibold">{method.payment_type}</p>
                <p className="text-sm text-gray-500">
                  {method.payment_type === 'card'
                    ? `**** **** **** ${method.payment_details.card_number.slice(-4)}`
                    : method.payment_type === 'paypal'
                      ? method.payment_details.paypal_email
                      : 'Cash on Delivery'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-100"
              onClick={() => handleDeletePaymentMethod(method.id)}
            >
              <Trash className="w-5 h-5" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {errors.api && (
              <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{errors.api}</p>
            )}
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select
                value={newPayment.paymentType}
                onValueChange={(value) => {
                  setNewPayment({
                    paymentType: value,
                    details: {}
                  });
                  setErrors({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card (Visa/Mastercard)</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {renderPaymentDetails()}

            <div className="flex justify-end">
              <Button onClick={handleAddPaymentMethod} disabled={saving} className="bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed" >
                {saving ? "Adding..." : "Add Method"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UserCard>
  );
}
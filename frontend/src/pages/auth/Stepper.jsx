import { ArrowRight, CheckCircle2, MailCheck, User2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Alert from '../../components/Alert';

export default function Stepper() {
  const [currentStep, setCurrentStep] = useState(1);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = async () => {
    if (currentStep === 1) {
      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        setAlert({ type: 'danger', message: 'Please enter a valid 6-digit OTP.' });
        return;
      }
      const response = await verifyOtp(formData.email, otpCode);
      if (!response.success) {
        setAlert({ type: 'danger', message: response.message });
        return;
      }
    }
    if (currentStep === 2 && !validateForm()) {
      setAlert({ type: 'danger', message: 'Please fill out all fields correctly.' });
      return;
    }
    setAlert({ type: '', message: '' });
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const { fullname, phone, email, password, confirmPassword } = formData;
    if (!fullname || !phone || !email || !password || password !== confirmPassword) {
      return false;
    }
    return true;
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await fetch('/verify_otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, message: 'Failed to verify OTP' };
    }
  };

  const steps = [
    { id: 1, name: 'OTP', icon: MailCheck },
    { id: 2, name: 'Email', icon: User2 },
    { id: 3, name: 'Complete', icon: CheckCircle2 },
  ];

  return (
    <div className="p-4 max-w-md mx-auto my-12 bg-white rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <step.icon
                className={`w-6 h-6 ${currentStep >= step.id ? 'text-blue-500' : 'text-gray-400'}`}
              />
              <span className={`text-sm ${currentStep >= step.id ? 'text-blue-500' : 'text-gray-400'}`}>
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight
                className={`w-6 h-6 mx-2 ${currentStep > step.id ? 'text-blue-500' : 'text-gray-400'}`}
              />
            )}
          </div>
        ))}
      </div>
      {alert.message && <Alert type={alert.type} message={alert.message} />}
      {currentStep === 1 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Step 1: Enter OTP</h2>
          <form>
            <div className="mb-4 flex justify-between">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  name="otp"
                  maxLength="1"
                  className="w-12 h-12 text-center border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Next
            </button>
          </form>
        </div>
      )}
      {currentStep === 2 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Step 2: Personal Information</h2>
          <form>
            <div className="mb-4">
              <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your full name"
                value={formData.fullname}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              <div
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5 text-gray-500" /> : <Eye className="w-5 h-5 text-gray-500" />}
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirmPassword"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      )}
      {currentStep === 3 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Step 3: Complete</h2>
          <p className="mb-4">You have successfully completed the steps.</p>
          <button
            type="button"
            onClick={handlePrevious}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Previous
          </button>
        </div>
      )}
    </div>
  );
}
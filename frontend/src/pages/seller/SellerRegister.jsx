import FCarousel from "@/components/misc/FCarousel";
import { useAuth } from "@/utils/AuthContext";
import { MailCheckIcon } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";

export default function SellerRegister() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    phNum: user?.phone || '',
    address: '',
    pickupAddress: {
      country: '',
      province: '',
      city: '',
      completeAddress: ''
    },
    sellerType: 'Individual',
    hasTIN: false,
    tinNumber: '',
    birCertificate: null
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Debounced validation check
  const checkAvailability = async (field, value) => {
    try {
      const response = await fetch('http://localhost:5555/seller/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          [field === 'shopName' ? 'business_name' : 'email']: value
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setValidationErrors(prev => ({
          ...prev,
          [field]: data.message
        }));
        return false;
      }

      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
      return true;
    } catch (error) {
      console.error('Validation check failed:', error);
      return false;
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    if (name.startsWith("pickupAddress.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        pickupAddress: {
          ...prev.pickupAddress,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));

      // Check availability for business name and email
      if (name === 'shopName' || name === 'email') {
        if (value.length >= 3) { // Only check if value is long enough
          await checkAvailability(name, value);
        }
      }
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, birCertificate: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Check if there are any validation errors
    if (Object.values(validationErrors).some(error => error)) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Add basic fields
      formDataToSend.append('shopName', formData.shopName);
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phNum', formData.phNum);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('sellerType', formData.sellerType);
      formDataToSend.append('hasTIN', formData.hasTIN);

      // Add TIN number if available
      if (formData.hasTIN) {
        formDataToSend.append('tinNumber', formData.tinNumber);
      }

      // Add pickup address fields
      Object.entries(formData.pickupAddress).forEach(([key, value]) => {
        formDataToSend.append(`pickupAddress.${key}`, value);
      });

      // Add BIR certificate if available
      if (formData.birCertificate) {
        formDataToSend.append('birCertificate', formData.birCertificate);
      }

      const response = await fetch('http://localhost:5555/seller', {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register seller');
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      setSuccessMessage(
        "Seller Registration Complete - wait for the approval email; this will be reviewed by the admin."
      );
      toast.success("Submitted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to submit registration");
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };


  const resetForm = () => {
    setFormData({
      shopName: '',
      ownerName: '',
      email: '',
      phNum: user?.phone || '',
      address: '',
      pickupAddress: {
        country: '',
        province: '',
        city: '',
        completeAddress: ''
      },
      sellerType: 'Individual',
      hasTIN: false,
      tinNumber: '',
      birCertificate: null
    });
    setSuccessMessage('');
  };

  return (
    <>
      <Helmet>
        <title>Flaskify | Seller Registration</title>
        <meta name="description" content="Seller Registration" />
        <link rel="canonical" href="/seller/register" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="w-full lg:w-1/2 px-4 py-8 lg:px-12 xl:px-16">
            <div className="max-w-lg mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Selling on Flaskify</h1>
                <p className="text-gray-600">Be one of the successful sellers on our platform</p>
              </div>

              {successMessage && (
                <div className="my-8">
                  <div className="text-center">
                    <MailCheckIcon className="text-green-600 w-28 h-28 mx-auto" />
                    <h4 className="text-xl font-bold my-4">Registration Submitted Successfully!</h4>
                  </div>
                  <div className="mb-6 text-green-600 bg-green-100 p-4 rounded-md">
                    {successMessage}
                  </div>
                  <button onClick={resetForm} className="bg-yellow-500 hover:bg-yellow-600 mx-auto px-4 py-2 rounded font-medium w-full text-white">Submit Another Store</button>
                </div>
              )}
              {!successMessage && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="shopName">
                      Shop Name
                    </label>
                    <input
                      id="shopName"
                      name="shopName"
                      type="text"
                      required
                      value={formData.shopName}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-4 py-2 rounded-lg border ${validationErrors.shopName ? 'border-red-500' : 'border-gray-300'
                        } shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500`}
                    />
                    {validationErrors.shopName && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.shopName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="ownerName">Owner&apos;s Name</label>
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-4 py-2 rounded-lg border ${validationErrors.email ? 'border-red-500' : 'border-gray-300'
                        } shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="phNum">Phone Number</label>
                    <input
                      id="phNum"
                      name="phNum"
                      type="tel"
                      value={formData.phNum}
                      disabled
                      className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Pickup Address</h3>

                    <input
                      name="pickupAddress.country"
                      type="text"
                      placeholder="Country"
                      value={formData.pickupAddress.country}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                      name="pickupAddress.province"
                      type="text"
                      placeholder="Province"
                      value={formData.pickupAddress.province}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                      name="pickupAddress.city"
                      type="text"
                      placeholder="City"
                      value={formData.pickupAddress.city}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                    <input
                      name="pickupAddress.completeAddress"
                      type="text"
                      placeholder="Complete Address"
                      value={formData.pickupAddress.completeAddress}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Seller Type</label>
                    <select
                      name="sellerType"
                      required
                      value={formData.sellerType}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                    >
                      <option>Individual</option>
                      <option>Business</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="hasTIN"
                      checked={formData.hasTIN}
                      onChange={handleCheckboxChange}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500"
                    />
                    <label className="ml-2 block text-sm font-medium text-gray-900">
                      I have a TIN number
                    </label>
                  </div>

                  {formData.hasTIN && (
                    <div className="space-y-4">
                      <input
                        name="tinNumber"
                        type="text"
                        placeholder="TIN Number"
                        required
                        value={formData.tinNumber}
                        onChange={handleInputChange}
                        pattern="^\d{9,12}$"  // Regex pattern to allow only 9-12 digits
                        minLength={9}
                        maxLength={12}
                        title="TIN number must be 9 to 12 digits"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                        aria-describedby="tinNumberHelp"
                      />
                      <small id="tinNumberHelp" className="text-gray-500">
                        TIN number must be 9 to 12 digits.
                      </small>

                      <div className="mt-4">
                        <label htmlFor="birCertificate" className="block text-sm font-semibold text-gray-700 mb-1">
                          BIR Certificate Upload
                        </label>
                        <div className="relative">
                          <input
                            type="file"
                            id="birCertificate"
                            name="birCertificate"
                            required
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label
                            htmlFor="birCertificate"
                            className="block w-full px-4 py-2 text-center rounded-lg border border-gray-300 cursor-pointer bg-gray-100 hover:bg-gray-200 focus:bg-gray-200 focus:ring-2 focus:ring-yellow-500 text-gray-700"
                          >
                            Choose File
                          </label>
                          {formData.birCertificate && (
                            <p className="mt-2 text-gray-600">
                              Selected file: {formData.birCertificate.name}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Register as a Seller
                  </button>
                </form>
              )}
            </div>
          </div>


          {/* Image/Carousel Column */}
          <div className="hidden lg:block w-1/2 bg-yellow-500">
            <div className="h-full flex items-center justify-center relative">
              {/* Example static content - replace with your carousel/image */}
              <div className="text-center p-8">
                <div className="space-y-6 text-white">
                  <h2 className="text-3xl font-bold">Why Sell on Flaskify?</h2>
                  <FCarousel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

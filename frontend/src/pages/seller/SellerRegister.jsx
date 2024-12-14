import FCarousel from "@/components/misc/FCarousel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/utils/AuthContext";
import { MailCheckIcon, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useWindowSize } from "react-use";
import { regions, provinces, city_mun } from 'phil-reg-prov-mun-brgy';

export default function SellerRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Log user data
  useEffect(() => {
    console.log('User data:', user);
  }, [user]);

  // Log the imported data to verify it's loaded correctly
  console.log('Imported data:', { regions, provinces, city_mun });

  const [formData, setFormData] = useState({
    ownerName: user?.first_name + " " + user?.last_name || '',
    email: user?.email || '',
    phNum: user?.phone || '',
    sellerType: 'Individual',
    hasTIN: false,
    tinNumber: '',
    birCertificate: null,
    business_country: 'Philippines',
    business_region: '',
    business_province: '',
    business_city: '',
    business_address: ''
  });

  // Log initial form data
  useEffect(() => {
    console.log('Initial form data:', formData);
  }, [formData]);

  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [confettiActive, setConfettiActive] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [locationData, setLocationData] = useState({
    provinces: [],
    cities: []
  });
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (registrationStatus === "Approved") {
      setConfettiActive(true);
      const timer = setTimeout(() => {
        setConfettiActive(false);
      }, 5000); // confetti will show for 5 seconds
      return () => clearTimeout(timer);
    }

    // Fetch the user status from the backend if needed
    const fetchStatus = async () => {
      if (!shouldFetch) return;
      try {
        const response = await fetch(`http://localhost:5555/seller/status?email=${user.email}`, {
          credentials: "include",
        });
        if (response.ok) {
          const { status } = await response.json();
          setRegistrationStatus(status);
          console.log("Registration status:", status);
        }
      } catch (error) {
        console.error("Error fetching registration status:", error);
      } finally {
        setFetchingStatus(false);
      };
    };

    fetchStatus();
  }, [user, shouldFetch, registrationStatus]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      console.log('Updated form data:', newData);
      return newData;
    });

    // If changing city, update it directly
    if (name === 'business_city') {
      setFormData(prev => ({ ...prev, business_city: value }));
    }
  };

  // Update provinces when region changes
  const handleRegionChange = (e) => {
    const regionCode = e.target.value;
    console.log('Selected Region Code:', regionCode);
    
    const regionProvinces = provinces.filter(province => 
      province.reg_code === regionCode
    );
    console.log('Available Provinces:', regionProvinces);

    setLocationData(prev => ({
      ...prev,
      provinces: regionProvinces,
      cities: []
    }));
    
    setFormData(prev => ({
      ...prev,
      business_region: regionCode,
      business_province: '',
      business_city: ''
    }));
  };

  // Update cities when province changes
  const handleProvinceChange = (e) => {
    const provinceCode = e.target.value;
    console.log('Selected Province:', provinceCode);
    
    if (!city_mun || !Array.isArray(city_mun)) {
      console.error('City/Municipality data is not available');
      return;
    }
    
    const provinceCities = city_mun.filter(city => {
      console.log('Checking city:', city);
      return city && city.prov_code === provinceCode;
    });
    
    console.log('Available Cities:', provinceCities);

    setLocationData(prev => ({
      ...prev,
      cities: provinceCities || []
    }));
    
    setFormData(prev => ({
      ...prev,
      business_province: provinceCode,
      business_city: ''
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file);
      setFormData(prev => ({
        ...prev,
        birCertificate: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all required fields
    if (!formData.ownerName || !formData.email) {
      toast.error("Owner name and email are required");
      setIsLoading(false);
      return;
    }

    if (!formData.business_region || !formData.business_province || !formData.business_city || !formData.business_address) {
      toast.error("Please fill in all location fields");
      setIsLoading(false);
      return;
    }

    try {
      let birCertificateUrl = null;

      // Upload BIR certificate if exists
      if (formData.birCertificate instanceof File) {
        console.log('Uploading BIR certificate...');
        const certificateFormData = new FormData();
        certificateFormData.append('birCertificate', formData.birCertificate);

        const uploadResponse = await fetch('http://localhost:5555/upload/bir-certificate', {
          method: 'POST',
          credentials: 'include',
          body: certificateFormData
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload BIR certificate');
        }

        const uploadResult = await uploadResponse.json();
        birCertificateUrl = uploadResult.url;
        console.log('BIR certificate uploaded:', birCertificateUrl);
      }

      // Create JSON data for seller registration
      const jsonData = {
        owner_name: formData.ownerName,
        email: formData.email,
        phone: formData.phNum,
        business_name: formData.ownerName,
        business_type: formData.sellerType,
        business_country: 'Philippines',
        business_region: regions.find(r => r.reg_code === formData.business_region)?.name || formData.business_region,
        business_province: provinces.find(p => p.prov_code === formData.business_province)?.name || formData.business_province,
        business_city: city_mun.find(c => c.mun_code === formData.business_city)?.name || formData.business_city,
        business_address: formData.business_address,
        tax_id: formData.hasTIN ? formData.tinNumber : null,
        bir_certificate_url: birCertificateUrl
      };

      console.log('Submitting seller registration:', jsonData);

      const response = await fetch('http://localhost:5555/seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(jsonData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register seller');
      }

      const data = await response.json();
      console.log('Registration successful:', data);
      
      setConfettiActive(true);
      toast.success("Registration successful! Please wait for admin approval.");
      setShouldFetch(true);
      
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register seller");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ownerName: user?.first_name + " " + user?.last_name || '',
      email: user?.email || '',
      phNum: user?.phone || '',
      sellerType: 'Individual',
      hasTIN: false,
      tinNumber: '',
      birCertificate: null,
      business_country: 'Philippines',
      business_region: '',
      business_province: '',
      business_city: '',
      business_address: ''
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
              {fetchingStatus && (
                <div className="my-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                    <h4 className="text-xl font-bold my-4">Checking Registration Status</h4>
                  </div>
                </div>
              )}

              {registrationStatus === "Pending" && (
                <div className="my-8">
                  <MailCheckIcon className="text-yellow-600 w-28 h-28 mx-auto" />
                  <h4 className="text-xl font-bold my-4">
                    Registration Pending
                  </h4>
                  <p className="mb-6 text-yellow-600 bg-yellow-100 p-4 rounded-md">
                    Your registration is under review. We will notify you once approved.
                  </p>
                </div>
              )}

              {registrationStatus === "Approved" && (
                <>
                {confettiActive && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}
                <div className="my-8">
                  <UserCheck className="text-green-600 w-28 h-28 mx-auto motion-preset-confetti" />
                  <h4 className="text-xl font-bold my-4">Already a Seller!</h4>
                  <p className="text-green-600 bg-green-100 p-4 rounded-md">
                    Congratulations! You are approved as a seller on Flaskify.
                  </p>
                  <Button asChild className="w-full bg-yellow-500 hover:bg-yellow-600 text-center font-bold my-4 hover:motion-preset-confetti">
                    <Link to="/seller/seller-center" replace>Seller Dashboard</Link>
                  </Button>
                </div>
                </>

              )}

              {registrationStatus === "Rejected" && (
                <div className="my-8">
                  <MailCheckIcon className="text-red-600 w-28 h-28 mx-auto" />
                  <h4 className="text-xl font-bold my-4">Registration Rejected</h4>
                  <p className="mb-6 text-red-600 bg-red-100 p-4 rounded-md">
                    Your registration has been rejected. Please contact support for more information.
                  </p>
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 font-bold my-4" onClick={() => {
                    setRegistrationStatus(null);
                    setSuccessMessage('');
                    setShouldFetch(false);
                    resetForm();
                  }}>
                    Reapply
                  </Button>
                </div>
              )}

              {successMessage && (
                <div className="my-8">
                  <div className="text-center">
                    <MailCheckIcon className="text-green-600 w-28 h-28 mx-auto" />
                    <h4 className="text-xl font-bold my-4">Registration Submitted Successfully!</h4>
                  </div>
                  <div className="mb-6 text-green-600 bg-green-100 p-4 rounded-md">
                    {successMessage}
                  </div>
                </div>
              )}

              {!fetchingStatus && !successMessage && !registrationStatus && (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="ownerName">Owner's Name</label>
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
                      disabled
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full px-4 py-2 rounded-lg border shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500`}
                    />

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
                        type="text"
                        name="tinNumber"
                        placeholder="TIN Number"
                        required
                        value={formData.tinNumber}
                        onChange={handleInputChange}
                        pattern="^\d{9,12}$"
                        minLength={9}
                        maxLength={12}
                        title="TIN number must be 9 to 12 digits"
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          BIR Certificate
                        </label>
                        <input
                          type="file"
                          name="birCertificate"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          required
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-yellow-50 file:text-yellow-700
                            hover:file:bg-yellow-100"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Business Address</label>
                    <div className="space-y-4">
                      <input
                        name="business_country"
                        type="text"
                        value="Philippines"
                        disabled
                        className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 bg-gray-50"
                      />
                      
                      <select
                        name="business_region"
                        required
                        value={formData.business_region}
                        onChange={handleRegionChange}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select Region</option>
                        {regions.map(region => (
                          <option key={region.reg_code} value={region.reg_code}>
                            {region.name}
                          </option>
                        ))}
                      </select>

                      <select
                        name="business_province"
                        required
                        value={formData.business_province}
                        onChange={handleProvinceChange}
                        disabled={!formData.business_region}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select Province</option>
                        {locationData.provinces.map(province => (
                          <option key={province.prov_code} value={province.prov_code}>
                            {province.name}
                          </option>
                        ))}
                      </select>

                      <select
                        name="business_city"
                        required
                        value={formData.business_city}
                        onChange={handleInputChange}
                        disabled={!formData.business_province}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Select City/Municipality</option>
                        {locationData.cities.map(city => (
                          <option key={city.mun_code} value={city.mun_code}>
                            {city.name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        name="business_address"
                        placeholder="Street Address"
                        required
                        value={formData.business_address || ''}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewShop() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        business_name: '',
        business_country: '',
        business_province: '',
        business_city: '',
        business_address: '',
        business_registration_doc: null
    });
    const [ocrValidation, setOcrValidation] = useState({
        isValidating: false,
        error: null
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file?.type)) {
            toast.error('Please upload only JPG, JPEG, or PNG images');
            e.target.value = '';
            return;
        }

        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024;
        if (file?.size > maxSize) {
            toast.error('File size must be less than 5MB');
            e.target.value = '';
            return;
        }

        setFormData(prev => ({
            ...prev,
            business_registration_doc: file
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setOcrValidation({ isValidating: true, error: null });

        try {
            if (!user?.seller?.seller_id) {
                throw new Error('Seller ID not found');
            }

            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops`, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.error === 'Invalid BIR certificate') {
                    setOcrValidation({
                        isValidating: false,
                        error: data.details || 'BIR certificate validation failed'
                    });
                    toast.error(data.details || 'BIR certificate validation failed');
                } else {
                    toast.error(data.error || 'Failed to create shop');
                }
                setLoading(false);
                return;
            }

            toast.success('Shop created successfully!');
            navigate('/seller/seller-center/shop/info');
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while creating the shop');
        } finally {
            setLoading(false);
            setOcrValidation({ isValidating: false, error: null });
        }
    };

    if (!user?.seller?.seller_id || user?.seller?.status !== 'Approved') {
        return (
            <div className="text-center py-12">
                <p className="text-yellow-600">
                    {!user?.seller ? 
                        "Please complete your seller registration first." :
                        "Your seller account is pending approval. Please wait for admin verification."
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card className="p-6">
                <div className="flex items-center mb-6">
                    <Store className="w-8 h-8 text-gray-600 mr-3" />
                    <h1 className="text-2xl font-bold text-gray-800">Create New Shop</h1>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Business Name
                        </label>
                        <Input
                            type="text"
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter your business name"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                            </label>
                            <Input
                                type="text"
                                name="business_country"
                                value={formData.business_country}
                                onChange={handleInputChange}
                                required
                                placeholder="Country"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Province
                            </label>
                            <Input
                                type="text"
                                name="business_province"
                                value={formData.business_province}
                                onChange={handleInputChange}
                                required
                                placeholder="Province"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <Input
                                type="text"
                                name="business_city"
                                value={formData.business_city}
                                onChange={handleInputChange}
                                required
                                placeholder="City"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Complete Address
                        </label>
                        <Input
                            type="text"
                            name="business_address"
                            value={formData.business_address}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter complete address"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            BIR Certificate (Required)
                        </label>
                        <div className="mt-1 flex items-center">
                            <label className="cursor-pointer">
                                <Input
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/jpeg,image/jpg,image/png"
                                    required
                                />
                                <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">Upload Document</span>
                                </div>
                            </label>
                            {formData.business_registration_doc && (
                                <span className="ml-3 text-sm text-gray-500">
                                    {formData.business_registration_doc.name}
                                </span>
                            )}
                        </div>
                        {ocrValidation.error && (
                            <p className="text-red-500 text-xs italic mt-1">
                                {ocrValidation.error}
                            </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                            Max file size: 5MB. Supported formats: JPG, JPEG, PNG
                        </p>
                    </div>

                    <div className="flex justify-end space-x-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/seller/seller-center/shop/info')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Shop'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

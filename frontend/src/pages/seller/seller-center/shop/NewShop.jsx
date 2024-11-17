import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload, X } from 'lucide-react';
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
        shop_logo: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

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
            toast.error('Please upload only JPG, JPEG, or PNG images for shop logo');
            e.target.value = '';
            return;
        }

        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024;
        if (file?.size > maxSize) {
            toast.error('Shop logo file size must be less than 5MB');
            e.target.value = '';
            return;
        }

        setFormData(prev => ({
            ...prev,
            shop_logo: file
        }));

        // Create preview URL
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            shop_logo: null
        }));
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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
                if (data.error === 'Invalid shop logo image') {
                    toast.error(data.details || 'Invalid shop logo image');
                    setError(data.details || 'Invalid shop logo image');
                } else {
                    toast.error(data.error || 'Failed to create shop');
                    setError(data.error || 'Failed to create shop');
                }
                return;
            }

            // Only navigate if there are no errors
            if (!error) {
                toast.success('Shop created successfully!');
                navigate('/seller/seller-center/shop/info');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('An error occurred while creating the shop');
            setError('An error occurred while creating the shop');
        } finally {
            setLoading(false);
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
                            Shop Logo
                        </label>
                        <div className="mt-1 flex items-center gap-4">
                            {previewUrl ? (
                                <div className="relative">
                                    <img
                                        src={previewUrl}
                                        alt="Shop Logo Preview"
                                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="mt-1 text-xs text-gray-500">Upload Logo</div>
                                    </div>
                                </div>
                            )}
                            <Input
                                type="file"
                                name="shop_logo"
                                onChange={handleFileChange}
                                accept="image/jpeg,image/jpg,image/png"
                                className="max-w-[200px]"
                            />
                        </div>
                        <div className="mt-1 text-sm">
                            <p className="text-gray-500">Requirements:</p>
                            <ul className="list-disc list-inside text-gray-500 text-xs space-y-1">
                                <li>File types: JPG, JPEG, or PNG</li>
                                <li>Maximum file size: 5MB</li>
                                <li>Minimum dimensions: 150x150 pixels</li>
                            </ul>
                            {error && <p className="text-red-500 mt-1">{error}</p>}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating Shop...
                                </div>
                            ) : (
                                'Create Shop'
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditShop() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { shopId } = useParams();
    const [loading, setLoading] = useState(true);
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
    const [selectedFile, setSelectedFile] = useState(null);
    const [removeLogoFlag, setRemoveLogoFlag] = useState(false);
    const [existingLogoUrl, setExistingLogoUrl] = useState(null);

    useEffect(() => {
        if (!user?.seller?.seller_id) {
            navigate('/seller/seller-center/shop/info');
            return;
        }

        // Fetch shop details
        const fetchShopDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch shop details');
                }

                const data = await response.json();
                const shop = data.shops.find(s => s.shop_uuid === shopId);
                
                if (!shop) {
                    throw new Error('Shop not found');
                }

                setFormData({
                    business_name: shop.business_name,
                    business_country: shop.business_country,
                    business_province: shop.business_province,
                    business_city: shop.business_city,
                    business_address: shop.business_address,
                    shop_logo: null
                });
                setExistingLogoUrl(shop.shop_logo);
                setPreviewUrl(shop.shop_logo || null);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchShopDetails();
    }, [user, shopId, navigate]);

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

        setSelectedFile(file);
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
        setExistingLogoUrl(null);
        setSelectedFile(null);
        setRemoveLogoFlag(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const form = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    form.append(key, formData[key]);
                }
            });

            if (selectedFile) {
                form.append('shop_logo', selectedFile);
            } else if (removeLogoFlag) {
                form.append('remove_logo', 'true');
            }

            const response = await fetch(
                `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopId}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    body: form
                }
            );

            const data = await response.json();
            
            if (!response.ok) {
                if (data.error === 'Invalid shop logo image') {
                    toast.error(data.details || 'Invalid shop logo image');
                    setError(data.details || 'Invalid shop logo image');
                } else {
                    toast.error(data.error || 'Failed to update shop');
                    setError(data.error || 'Failed to update shop');
                }
                return;
            }

            // Only navigate if there are no errors
            if (!error) {
                toast.success('Shop updated successfully');
                navigate('/seller/seller-center/shop/info');
            }
        } catch (err) {
            console.error('Error:', err);
            toast.error('An error occurred while updating the shop');
            setError('An error occurred while updating the shop');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Store className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">Edit Shop Information</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Business Name</label>
                        <Input
                            type="text"
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter business name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Country</label>
                        <Input
                            type="text"
                            name="business_country"
                            value={formData.business_country}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter country"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Province</label>
                        <Input
                            type="text"
                            name="business_province"
                            value={formData.business_province}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter province"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <Input
                            type="text"
                            name="business_city"
                            value={formData.business_city}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter city"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Complete Address</label>
                        <Input
                            type="text"
                            name="business_address"
                            value={formData.business_address}
                            onChange={handleInputChange}
                            required
                            placeholder="Enter complete address"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium mb-1">Shop Logo</label>
                        <div className="flex flex-col items-start space-y-4">
                            {previewUrl && (
                                <div className="relative">
                                    <img 
                                        src={previewUrl} 
                                        alt="Shop Logo Preview" 
                                        className="w-32 h-32 object-cover rounded-lg"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-0 right-0 -mt-2 -mr-2"
                                        onClick={removeImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="flex items-center space-x-4">
                                <Input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={handleFileChange}
                                    className={previewUrl ? "hidden" : ""}
                                />
                                {previewUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            const fileInput = document.createElement('input');
                                            fileInput.type = 'file';
                                            fileInput.accept = 'image/jpeg,image/png';
                                            fileInput.onchange = handleFileChange;
                                            fileInput.click();
                                        }}
                                    >
                                        Change Logo
                                    </Button>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">
                                Supported formats: JPG, JPEG, PNG. Maximum size: 5MB. Minimum dimensions: 150x150 pixels.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/seller/seller-center/shop/info')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Updating Shop...
                                </div>
                            ) : (
                                'Update Shop'
                            )}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

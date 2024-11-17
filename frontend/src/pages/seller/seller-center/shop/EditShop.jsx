import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Upload } from 'lucide-react';
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
        business_registration_doc: null
    });

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
                    business_registration_doc: null
                });
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchShopDetails();
    }, [user, shopId, navigate]);

    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'business_registration_doc') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const form = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    form.append(key, formData[key]);
                }
            });

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
                throw new Error(data.error || 'Failed to update shop');
            }

            toast.success('Shop updated successfully');
            navigate('/seller/seller-center/shop/info');
        } catch (err) {
            toast.error(err.message);
            setError(err.message);
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

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Business Registration Document (Optional)
                        </label>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                name="business_registration_doc"
                                onChange={handleInputChange}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                className="flex-1"
                            />
                            <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600"
                        >
                            {loading ? 'Updating...' : 'Update Shop'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/seller/seller-center/shop/info')}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}

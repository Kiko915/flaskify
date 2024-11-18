import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Package, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddProduct() {
    const { shopUuid } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: '',
        status: 'draft',
        main_image: null
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, main_image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products`, {
                method: 'POST',
                credentials: 'include',
                body: formDataToSend
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const data = await response.json();
            toast.success('Product created successfully');
            navigate(`/seller/shops/${shopUuid}`);
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || 'Failed to create product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/detail`)}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Shop
                </Button>
                <h1 className="text-2xl font-bold">Add New Product</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
                <Card className="p-6">
                    <div className="space-y-4">
                        {/* Product Image */}
                        <div>
                            <Label>Product Image</Label>
                            <div className="mt-2">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                                <p className="mb-2 text-sm text-gray-500">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Product Name */}
                        <div>
                            <Label htmlFor="name">Product Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        {/* Product Description */}
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter product description"
                                required
                            />
                        </div>

                        {/* Price and Quantity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price">Price</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    min="0"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Category and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => handleSelectChange('category', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="electronics">Electronics</SelectItem>
                                        <SelectItem value="clothing">Clothing</SelectItem>
                                        <SelectItem value="books">Books</SelectItem>
                                        <SelectItem value="home">Home & Living</SelectItem>
                                        <SelectItem value="beauty">Beauty</SelectItem>
                                        <SelectItem value="sports">Sports</SelectItem>
                                        <SelectItem value="toys">Toys</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleSelectChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Product...
                            </>
                        ) : (
                            'Create Product'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}

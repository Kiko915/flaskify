import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, DollarSign, Star, Clock, Mail, Phone, Plus } from 'lucide-react';
import { useAuth } from "@/utils/AuthContext";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ShopDetail() {
    const { shopUuid } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchShopDetails = async () => {
            try {
                setLoading(true);
                // Fetch shop details
                const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error('Shop not found');
                        return;
                    }
                    throw new Error('Failed to fetch shop details');
                }

                const data = await response.json();
                setShop(data.shop);

                try {
                    // Fetch products for this shop
                    const productsResponse = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products`, {
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (productsResponse.ok) {
                        const productsData = await productsResponse.json();
                        setProducts(productsData.products || []);
                    } else if (productsResponse.status === 404) {
                        // If no products found, set empty array
                        setProducts([]);
                    } else {
                        throw new Error('Failed to fetch products');
                    }
                } catch (productError) {
                    console.error('Error fetching products:', productError);
                    toast.error('Failed to load products');
                    setProducts([]); // Set empty array on error
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error(error.message || 'Failed to load shop details');
            } finally {
                setLoading(false);
            }
        };

        if (user?.seller?.seller_id && shopUuid) {
            fetchShopDetails();
        }
    }, [user, shopUuid]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">Shop not found</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Shop Header */}
            <Card className="mb-8 p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        {shop.shop_logo ? (
                            <img 
                                src={shop.shop_logo} 
                                alt={shop.business_name} 
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold mb-2">{shop.business_name}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center">
                                        <Package className="w-4 h-4 mr-1" />
                                        <span>{shop.total_products} Products</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>Created {new Date(shop.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Add Product Button */}
                            <Button 
                                onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/new`)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Product
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>{shop.business_address}, {shop.business_city}, {shop.business_province}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>${shop.shop_sales.toFixed(2)} Total Sales</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Mail className="w-4 h-4 mr-2" />
                                <span>{shop.business_email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Phone className="w-4 h-4 mr-2" />
                                <span>{shop.business_phone}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs Section */}
            <Tabs defaultValue="products" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="about">About Shop</TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <Card 
                                    key={product.product_uuid} 
                                    className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                                    onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${product.product_uuid}`)}
                                >
                                    <div className="aspect-square bg-gray-100 relative">
                                        {product.main_image ? (
                                            <img 
                                                src={product.main_image} 
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                        {product.status !== 'active' && (
                                            <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                                {product.status}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-orange-600 font-bold">${Number(product.price).toFixed(2)}</span>
                                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                <span>Stock: {product.quantity}</span>
                                                <span>•</span>
                                                <span>Sold: {product.total_sales}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="p-12">
                            <div className="text-center">
                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                                <p className="text-gray-500 mb-6">Get started by adding your first product to your shop.</p>
                                <Button 
                                    onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/new`)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add First Product
                                </Button>
                            </div>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="about">
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">About {shop.business_name}</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Business Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Business Type</p>
                                        <p className="text-gray-700">{shop.business_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="text-gray-700">{new Date(shop.last_updated).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Contact Email</p>
                                        <p className="text-gray-700">{shop.business_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Contact Phone</p>
                                        <p className="text-gray-700">{shop.business_phone}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Shop Statistics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Total Products</p>
                                        <p className="text-xl font-semibold">{shop.total_products}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Total Sales</p>
                                        <p className="text-xl font-semibold">${shop.shop_sales.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            {shop.is_archived && (
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-yellow-800 mb-2">Archive Status</h3>
                                    <p className="text-yellow-700">
                                        This shop was archived on {new Date(shop.archived_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

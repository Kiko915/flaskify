import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Package, DollarSign, Star, Clock, Mail, Phone, Plus } from 'lucide-react';
import { useAuth } from "@/utils/AuthContext";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';

export default function ShopDetail() {
    const { shopUuid } = useParams();
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
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

                // Fetch products for this shop
                const productsResponse = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (productsResponse.ok) {
                    const productsData = await productsResponse.json();
                    const filteredProducts = productsData.products || [];
                    setProducts(filteredProducts);
                    setTotalProducts(filteredProducts.length);
                } else {
                    throw new Error('Failed to fetch products');
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
                                        <span>{totalProducts} Products</span>
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

            {/* Shop Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <Package className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Products</p>
                            <h3 className="text-2xl font-bold">{totalProducts}</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <DollarSign className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Revenue</p>
                            <h3 className="text-2xl font-bold">₱0.00</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <Star className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Rating</p>
                            <h3 className="text-2xl font-bold">0.0</h3>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-4">
                        <Clock className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-sm text-muted-foreground">Response Time</p>
                            <h3 className="text-2xl font-bold">0h</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="products" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="about">About Shop</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                    
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <Card 
                                key={product.product_uuid} 
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                                onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${product.product_uuid}`)}
                            >
                                <div className="aspect-square relative">
                                    <img
                                        src={product.main_image || '/placeholder.png'}
                                        alt={product.name}
                                        className="object-cover w-full h-full"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <Badge variant={product.status !== 'active' ? 'secondary' : 'default'} className={`${product.status !== 'active' ? 'secondary' : 'bg-green-100 text-green-800'}`}>
                                            {product.status !== 'active' ? 'Draft' : 'Active'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold mb-2">{product.name}</h3>
                                    <p className="text-muted-foreground text-sm mb-4">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium">₱{parseFloat(product.price).toFixed(2)}</p>
                                        {product.status !== 'active' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click when clicking the button
                                                    const publishProduct = async () => {
                                                        try {
                                                            const response = await fetch(
                                                                `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${product.product_uuid}/publish`,
                                                                {
                                                                    method: 'POST',
                                                                    credentials: 'include',
                                                                }
                                                            );
                                                            
                                                            if (!response.ok) {
                                                                throw new Error('Failed to publish product');
                                                            }
                                                            
                                                            // Update the product status in the local state
                                                            setProducts(products.map(p => 
                                                                p.product_uuid === product.product_uuid 
                                                                    ? { ...p, status: 'active' }
                                                                    : p
                                                            ));
                                                            
                                                            toast.success('Product published successfully');
                                                        } catch (error) {
                                                            console.error('Error publishing product:', error);
                                                            toast.error('Failed to publish product');
                                                        }
                                                    };
                                                    publishProduct();
                                                }}
                                            >
                                                Publish
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    
                    {products.length === 0 && (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                            <p className="text-muted-foreground mb-4">Start adding products to your shop</p>
                            <Link to={`/seller/seller-center/shop/${shopUuid}/products/new`}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Product
                                </Button>
                            </Link>
                        </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Total Products</p>
                                        <p className="text-xl font-semibold">{totalProducts}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Active Products</p>
                                        <p className="text-xl font-semibold">
                                            {products.filter(p => p.status === 'active').length}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-500">Draft Products</p>
                                        <p className="text-xl font-semibold">
                                            {products.filter(p => p.status !== 'active').length}
                                        </p>
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

import { useEffect, useState } from 'react';
import { Store, Plus, Settings, Package, DollarSign, MapPin, Archive } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/utils/AuthContext";
import toast from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from '@radix-ui/react-dropdown-menu';

export default function ShopInfo() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [archiveDialog, setArchiveDialog] = useState({
        isOpen: false,
        shopUuid: null,
        shopName: '',
        verificationString: '',
        userInput: '',
        isUnarchiving: false
    });

    // Function to generate a random string
    const generateRandomString = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const handleArchiveClick = (shop) => {
        setArchiveDialog({
            isOpen: true,
            shopUuid: shop.shop_uuid,
            shopName: shop.business_name,
            verificationString: generateRandomString(),
            userInput: '',
            isUnarchiving: shop.is_archived
        });
    };

    const handleArchiveInputChange = (e) => {
        setArchiveDialog(prev => ({
            ...prev,
            userInput: e.target.value
        }));
    };

    const handleArchiveConfirm = async () => {
        if (archiveDialog.userInput !== archiveDialog.verificationString) {
            toast.error('Verification code does not match');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${archiveDialog.shopUuid}/archive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to update shop archive status');
            }

            const data = await response.json();
            
            setShops(shops.map(shop => 
                shop.shop_uuid === archiveDialog.shopUuid 
                    ? { ...shop, is_archived: data.is_archived }
                    : shop
            ));

            toast.success(data.message);
            setArchiveDialog(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error('Error updating shop archive status:', err);
            toast.error('Failed to update shop archive status');
        }
    };

    useEffect(() => {
        if (!user) {
            return;
        }

        if (!user.seller) {
            navigate('/seller/register');
            return;
        }

        if (user.seller.status !== 'Approved') {
            setLoading(false);
            return;
        }

        const fetchShops = async () => {
            try {
                const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops?per_page=100`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.error || 'Failed to fetch shops');
                }

                const data = await response.json();
                console.log('Shops response:', data); // Debug log
                
                // Check if data has the expected structure
                if (!data || !data.shops) {
                    throw new Error('Invalid response format');
                }
                
                // Fetch product counts for each shop
                const shopsWithProducts = await Promise.all(data.shops.map(async (shop) => {
                    try {
                        const productResponse = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shop.shop_uuid}/products/count`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            credentials: 'include'
                        });
                        
                        if (productResponse.ok) {
                            const productData = await productResponse.json();
                            return { ...shop, total_products: productData.count };
                        }
                        return shop;
                    } catch (error) {
                        console.error(`Error fetching product count for shop ${shop.shop_uuid}:`, error);
                        return shop;
                    }
                }));
                
                setShops(shopsWithProducts || []);
            } catch (err) {
                console.error('Error fetching shops:', err); // Debug log
                setError(err.message);
                toast.error('Failed to load shops');
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, [user, navigate]);

    // Debug render log
    console.log('Render state:', { loading, error, shopsCount: shops?.length });

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
                <p className="text-red-500">Error loading shops: {error}</p>
            </div>
        );
    }

    if (!user?.seller) {
        return (
            <div className="text-center py-12">
                <p className="text-yellow-600">Please complete your seller registration first.</p>
            </div>
        );
    }

    if (user?.seller?.status !== 'Approved') {
        return (
            <div className="text-center py-12">
                <p className="text-yellow-600">Your seller account is pending approval. Please wait for admin verification.</p>
            </div>
        );
    }

    if (!shops || shops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
                <Store className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">No Shops Yet</h2>
                <p className="text-gray-500 mb-6 text-center max-w-md">
                    Start your selling journey by creating your first shop on Flaskify!
                </p>
                <Link to="/seller/seller-center/shop/new">
                    <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Your First Shop
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Shops</h1>
                <Link to="/seller/seller-center/shop/new">
                    <Button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600">
                        <Plus className="w-4 h-4 mr-2" /> Add New Shop
                    </Button>
                </Link>
            </div>

            <Dialog open={archiveDialog.isOpen} onOpenChange={(isOpen) => setArchiveDialog(prev => ({ ...prev, isOpen }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{archiveDialog.isUnarchiving ? 'Unarchive Shop Confirmation' : 'Archive Shop Confirmation'}</DialogTitle>
                        <DialogDescription>
                            {archiveDialog.shopName && (
                                <>
                                    <p className="mb-4">
                                        Are you sure you want to {archiveDialog.isUnarchiving ? 'unarchive' : 'archive'} <span className="font-semibold">{archiveDialog.shopName}</span>?
                                        {archiveDialog.isUnarchiving 
                                            ? ' This will make the shop visible to customers again.'
                                            : ' This will hide the shop from customers.'}
                                    </p>
                                    <p className="mb-2">To confirm, please type this code:</p>
                                    <code className="bg-gray-100 px-2 py-1 rounded text-lg font-mono">
                                        {archiveDialog.verificationString}
                                    </code>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Enter verification code"
                            value={archiveDialog.userInput}
                            onChange={handleArchiveInputChange}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setArchiveDialog(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant={archiveDialog.isUnarchiving ? "default" : "destructive"}
                            onClick={handleArchiveConfirm}
                            disabled={!archiveDialog.userInput}
                        >
                            {archiveDialog.isUnarchiving ? 'Unarchive Shop' : 'Archive Shop'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                    <Card key={shop.shop_uuid} className={`overflow-hidden ${shop.is_archived ? 'opacity-75' : ''}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-gray-900">{shop.business_name}</h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleArchiveClick(shop)}
                                        title={shop.is_archived ? 'Unarchive Shop' : 'Archive Shop'}
                                    >
                                        <Archive className={`w-4 h-4 ${shop.is_archived ? 'text-green-600' : 'text-red-500'}`} />
                                    </Button>
                                </div>
                            </div>
                            
                            {shop.is_archived && (
                                <div className="mb-4 p-2 bg-yellow-50 text-yellow-600 rounded-md text-sm">
                                    This shop is archived and not visible to customers
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{shop.business_address}, {shop.business_city}, {shop.business_province}, {shop.business_country}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Package className="w-4 h-4 mr-2" />
                                    <span className="text-sm">{shop.total_products} Products</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    <span className="text-sm">${shop.shop_sales.toFixed(2)} Sales</span>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <Link to={`/seller/seller-center/shop/${shop.shop_uuid}/edit`}>
                                    <Button variant="outline" className="w-full">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Shop
                                    </Button>
                                </Link>
                                <Link to={`/seller/seller-center/shop/${shop.shop_uuid}/detail`}>
                                    <Button variant="outline" className="w-full" disabled={shop.is_archived}>
                                        <Package className="w-4 h-4 mr-2" />
                                        Products ({shop.total_products})
                                    </Button>
                                </Link>
                                <Link to={`/seller/seller-center/shop/${shop.shop_uuid}/detail`}>
                                    <Button variant="outline" className="w-full">
                                        <Store className="w-4 h-4 mr-2" />
                                        View Shop
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
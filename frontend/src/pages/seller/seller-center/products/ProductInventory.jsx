import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/utils/AuthContext';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle, XCircle, ArrowLeft } from "lucide-react";

const StockAlert = ({ stock, lowStockAlert }) => {
    if (stock === 0) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                <XCircle className="h-4 w-4" />
                <span>Out of stock</span>
            </div>
        );
    }
    if (stock <= lowStockAlert) {
        return (
            <div className="flex items-center gap-2 text-yellow-500 text-sm mt-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Low stock alert</span>
            </div>
        );
    }
    return null;
};

const ProductInventory = () => {
    const { shopUuid: shop_uuid, productUuid: product_uuid } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [seller, setSeller] = useState(null);
    const [inventory, setInventory] = useState({
        quantity: 0,
        low_stock_alert: 5,
        sku: '',
        variations: []
    });
    const [productName, setProductName] = useState('');
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState([]);
    const [inputValues, setInputValues] = useState({});

    // Helper function to create composite IDs
    const createOptionId = (variation_uuid, option_uuid) => {
        return `${variation_uuid}___${option_uuid}`;
    };

    // Fetch seller info when component mounts and when user changes
    useEffect(() => {
        const fetchSellerInfo = async () => {
            if (!user) {
                console.log('No user available, skipping seller info fetch');
                return;
            }

            try {
                console.log('Fetching seller info...');
                const response = await fetch('http://localhost:5555/seller/current', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch seller info');
                }

                const data = await response.json();
                console.log('Received seller info:', data);
                setSeller(data);
            } catch (error) {
                console.error('Error fetching seller info:', error);
                toast.error('Failed to load seller information');
            }
        };

        fetchSellerInfo();
    }, [user]);

    // Fetch inventory data when seller info is available
    useEffect(() => {
        const fetchInventoryData = async () => {
            if (!seller?.seller_id || !shop_uuid || !product_uuid) {
                console.log('Missing required data for inventory fetch:', {
                    seller_id: seller?.seller_id,
                    shop_uuid,
                    product_uuid
                });
                return;
            }

            try {
                setLoading(true);
                console.log('Fetching inventory data...');
                const response = await fetch(`http://localhost:5555/seller/${seller.seller_id}/shops/${shop_uuid}/products/${product_uuid}/inventory`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch inventory data');
                }

                const data = await response.json();
                console.log('Received inventory data:', data);
                
                setInventory(data);
                setProductName(data.product_name);
                setPendingUpdates([]);
                setUnsavedChanges(false);
            } catch (error) {
                console.error('Error fetching inventory:', error);
                toast.error('Failed to load inventory data');
            } finally {
                setLoading(false);
            }
        };

        if (seller?.seller_id) {
            fetchInventoryData();
        }
    }, [seller, shop_uuid, product_uuid]);

    // Debug logging
    useEffect(() => {
        console.log('State update:', {
            loading,
            seller: seller?.seller_id,
            product_name: productName,
            shop_uuid,
            product_uuid
        });
    }, [loading, seller, productName, shop_uuid, product_uuid]);

    const handleStockChange = (id, value, field) => {
        console.log(`Stock change - ID: ${id}, Value: ${value}, Field: ${field}`);
        
        // Update input values state
        setInputValues(prev => ({
            ...prev,
            [`${id}-${field}`]: value
        }));
        
        // Update the local state based on whether it's the base product or a variation
        if (id === 'base') {
            console.log('Updating base product:', { field, value });
            setInventory(prev => ({
                ...prev,
                [field]: value === '' ? '' : parseInt(value) || 0
            }));
        } else {
            console.log('Updating variation:', { id, field, value });
            // Split ID into variation and option UUIDs using the custom separator
            const [variationId, optionId] = id.split('___');
            
            setInventory(prev => ({
                ...prev,
                variations: prev.variations.map(variation => {
                    if (variation.variation_uuid === variationId) {
                        return {
                            ...variation,
                            options: variation.options.map(option => {
                                if (option.option_uuid === optionId) {
                                    return { 
                                        ...option, 
                                        [field]: value === '' ? '' : parseInt(value) || 0 
                                    };
                                }
                                return option;
                            })
                        };
                    }
                    return variation;
                })
            }));
        }

        // Only track changes if we have a valid number
        if (value !== '') {
            // Track changes for batch update
            setPendingUpdates(prev => {
                const existingUpdateIndex = prev.findIndex(update => 
                    update.id === id && update.field === field
                );
                
                const parsedValue = parseInt(value);
                if (isNaN(parsedValue)) return prev;
                
                // Create the update object
                const newUpdate = {
                    id,
                    field,
                    value: parsedValue
                };
                
                console.log('Tracking update:', newUpdate);
                
                if (existingUpdateIndex !== -1) {
                    const updatedUpdates = [...prev];
                    updatedUpdates[existingUpdateIndex] = newUpdate;
                    return updatedUpdates;
                } else {
                    return [...prev, newUpdate];
                }
            });

            setUnsavedChanges(true);
        }
    };

    const saveChanges = async () => {
        try {
            console.log('Current pending updates:', pendingUpdates);
            
            // Validate updates before sending
            const validUpdates = pendingUpdates.map(update => {
                const { id, field, value } = update;
                
                // For base product
                if (id === 'base') {
                    return {
                        type: 'base',
                        field,
                        value: parseInt(value) || 0
                    };
                }
                
                // For variations, split the composite ID correctly using the custom separator
                const [variation_uuid, option_uuid] = id.split('___');
                console.log('Processing variation update:', {
                    full_id: id,
                    variation_uuid,
                    option_uuid,
                    field,
                    value
                });
                
                // Verify we have both UUIDs
                if (!variation_uuid || !option_uuid) {
                    console.error('Invalid variation/option ID:', id);
                    return null;
                }
                
                return {
                    type: 'variation',
                    variation_uuid,
                    option_uuid,
                    field,
                    value: parseInt(value) || 0
                };
            })
            .filter(update => update !== null && !isNaN(update.value)); // Filter out invalid updates
            
            if (validUpdates.length === 0) {
                console.log('No valid updates to send');
                return;
            }
            
            console.log('Sending validated updates:', validUpdates);
            
            const response = await fetch(`http://localhost:5555/seller/${seller.seller_id}/shops/${shop_uuid}/products/${product_uuid}/inventory`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updates: validUpdates })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Server error response:', errorData);
                throw new Error(`Failed to update inventory: ${errorData}`);
            }

            const data = await response.json();
            console.log('Update response:', data);
            
            // Update local state with server response
            setInventory(data);
            setPendingUpdates([]);
            setUnsavedChanges(false);
            setInputValues({}); // Reset input values
            toast.success('Inventory updated successfully');
        } catch (error) {
            console.error('Error saving inventory changes:', error);
            toast.error(error.message || 'Failed to update inventory');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container p-4 mx-auto">
            <div className="mb-6">
                <Button
                    variant="ghost"
                    className="gap-2"
                    onClick={() => navigate('/seller/seller-center/products/inventory')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Products
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-1.5">
                        <CardTitle>Inventory Management</CardTitle>
                        <CardDescription>Manage your product stock and low stock alerts</CardDescription>
                        <div className="mt-2">
                            {productName ? (
                                <h2 className="text-2xl font-bold">{productName}</h2>
                            ) : (
                                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Base Product */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Base Product</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="base-stock">Stock</Label>
                                <Input
                                    id="base-stock"
                                    type="number"
                                    min="0"
                                    value={inputValues['base-quantity'] ?? inventory.quantity}
                                    onChange={(e) => handleStockChange('base', e.target.value, 'quantity')}
                                    className={inventory.quantity === 0 ? 'border-red-500' : inventory.quantity <= inventory.low_stock_alert ? 'border-yellow-500' : ''}
                                />
                                <StockAlert stock={inventory.quantity} lowStockAlert={inventory.low_stock_alert} />
                            </div>
                            <div>
                                <Label htmlFor="base-low-stock">Low Stock Alert</Label>
                                <Input
                                    id="base-low-stock"
                                    type="number"
                                    min="0"
                                    value={inputValues['base-low_stock_alert'] ?? inventory.low_stock_alert}
                                    onChange={(e) => handleStockChange('base', e.target.value, 'low_stock_alert')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Variation Options */}
                    {inventory.variations && inventory.variations.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Variation Options</h3>
                            <div className="space-y-6">
                                {inventory.variations.map((variation) => (
                                    <div key={variation.variation_uuid} className="p-4 border rounded-lg space-y-4">
                                        {variation.options.map((option) => {
                                            const optionId = createOptionId(variation.variation_uuid, option.option_uuid);
                                            console.log('Creating option ID:', {
                                                variation_uuid: variation.variation_uuid,
                                                option_uuid: option.option_uuid,
                                                optionId
                                            });
                                            return (
                                                <div key={optionId} className="border-b last:border-b-0 pb-4 last:pb-0">
                                                    <h4 className="font-medium mb-3">{option.name}</h4>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor={`${optionId}-stock`}>Stock</Label>
                                                            <Input
                                                                id={`${optionId}-stock`}
                                                                type="number"
                                                                min="0"
                                                                value={inputValues[`${optionId}-stock`] ?? option.stock}
                                                                onChange={(e) => handleStockChange(optionId, e.target.value, 'stock')}
                                                                className={option.stock === 0 ? 'border-red-500' : option.stock <= option.low_stock_alert ? 'border-yellow-500' : ''}
                                                            />
                                                            <StockAlert stock={option.stock} lowStockAlert={option.low_stock_alert} />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`${optionId}-low-stock`}>Low Stock Alert</Label>
                                                            <Input
                                                                id={`${optionId}-low-stock`}
                                                                type="number"
                                                                min="0"
                                                                value={inputValues[`${optionId}-low_stock_alert`] ?? option.low_stock_alert}
                                                                onChange={(e) => handleStockChange(optionId, e.target.value, 'low_stock_alert')}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button 
                            onClick={saveChanges} 
                            disabled={!unsavedChanges || loading}
                            className="min-w-[120px]"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductInventory;

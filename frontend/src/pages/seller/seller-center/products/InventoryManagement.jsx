import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function InventoryManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.seller) {
      navigate('/seller/register');
      return;
    }

    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    try {
      // First get all shops for the seller
      const shopsResponse = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops`, {
        credentials: 'include'
      });
      
      if (!shopsResponse.ok) {
        throw new Error('Failed to fetch shops');
      }

      const shopsData = await shopsResponse.json();
      console.log('Shops data:', shopsData);
      
      // Check if shops data exists and has the expected structure
      if (!shopsData || !shopsData.shops || !Array.isArray(shopsData.shops)) {
        console.error('Invalid shops data:', shopsData);
        throw new Error('Invalid shops data format');
      }

      // Fetch products for each shop
      const allProducts = [];
      for (const shop of shopsData.shops) {
        console.log('Fetching products for shop:', shop);
        
        const productsResponse = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops/${shop.shop_uuid}/products`, {
          credentials: 'include'
        });
        
        if (!productsResponse.ok) {
          console.warn(`Failed to fetch products for shop ${shop.shop_uuid}`);
          continue; // Skip this shop but continue with others
        }

        const productsData = await productsResponse.json();
        console.log('Products data for shop', shop.shop_uuid, ':', productsData);
        
        // Check if products data is in the expected format and has products
        if (productsData && productsData.products && Array.isArray(productsData.products)) {
          // Add shop data to each product
          const productsWithShop = productsData.products.map(product => ({
            ...product,
            shop_uuid: shop.shop_uuid,
            shop_name: shop.business_name
          }));
          console.log('Processed products for shop', shop.shop_uuid, ':', productsWithShop);
          allProducts.push(...productsWithShop);
        } else {
          console.warn(`Invalid or empty products data for shop ${shop.shop_uuid}:`, productsData);
        }
      }

      console.log('Final products array:', allProducts);
      setProducts(allProducts);
      if (allProducts.length === 0) {
        toast('No products found. Add some products to manage inventory.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (product) => {
    const totalStock = product.quantity;
    const lowStockAlert = product.low_stock_alert || 0;

    if (totalStock <= 0) {
      return {
        status: 'out-of-stock',
        label: 'Out of Stock',
        color: 'bg-red-100 text-red-800',
        icon: <AlertCircle className="h-4 w-4 text-red-800" />
      };
    } else if (totalStock <= lowStockAlert) {
      return {
        status: 'low-stock',
        label: 'Low Stock',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="h-4 w-4 text-yellow-800" />
      };
    }
    return {
      status: 'in-stock',
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      icon: null
    };
  };

  const getTotalStock = (product) => {
    return product.quantity;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Manage stock levels for all your products</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">In Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Low Stock</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Out of Stock</span>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Shop</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const stockStatus = getStockStatus(product);
                const totalStock = getTotalStock(product);
                
                return (
                  <TableRow key={product.product_uuid}>
                    <TableCell>
                      <button
                        onClick={() => navigate(`/seller/seller-center/shop/${product.shop_uuid}/products/${product.product_uuid}`)}
                        className="text-left hover:text-yellow-600 hover:underline focus:outline-none"
                      >
                        {product.name}
                      </button>
                    </TableCell>
                    <TableCell>{product.shop_name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className={`${stockStatus.color} flex items-center gap-1`}>
                              {stockStatus.icon}
                              {stockStatus.label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {stockStatus.status === 'low-stock' 
                              ? 'One or more variations are below their alert threshold'
                              : stockStatus.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>{totalStock}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/seller/seller-center/shop/${product.shop_uuid}/products/${product.product_uuid}/inventory`)}
                      >
                        Manage Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

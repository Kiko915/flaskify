import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Image as ImageIcon, MoreVertical } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@/utils/AuthContext';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNavigate } from 'react-router-dom';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user.seller) {
      navigate('/seller/register');
      return;
    }

    // If user is a seller, fetch shops and categories
    console.log('Fetching shops and categories...', user);
    fetchShops();
    fetchCategories();
  }, [user]);

  useEffect(() => {
    if (shops.length > 0) {
      fetchProducts();
    }
  }, [shops]);

  const fetchShops = async () => {
    try {
      console.log('Fetching shops...');
      const response = await fetch(`http://localhost:5555/seller/${user.seller.seller_id}/shops`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }

      const data = await response.json();
      if (data && data.shops) {
        setShops(data.shops);
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
      setShops([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5555/categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setSelectedProduct(product);
    } else {
      setSelectedProduct(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchShops();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleStatusChange = async (productUuid, newStatus) => {
    const statusToast = toast.loading(`Updating product status...`);
    try {
      setStatusLoading(true);
      setSelectedProductId(productUuid);

      const product = products.find(p => p.product_uuid === productUuid);
      if (!product || !product.shop_uuid) {
        throw new Error('Product or shop information not found');
      }

      let response;
      
      if (newStatus === 'active') {
        response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/shops/${product.shop_uuid}/products/${productUuid}/publish`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
      } else if (newStatus === 'draft') {
        response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/shops/${product.shop_uuid}/products/${productUuid}/status`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              status: 'draft',
              visibility: false
            })
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to change product status to ${newStatus}`);
      }

      const data = await response.json();
      
      // Update the product in the local state immediately
      setProducts(prevProducts => 
        prevProducts.map(p => {
          if (p.product_uuid === productUuid) {
            const updatedProduct = {
              ...p,
              status: newStatus,
              visibility: newStatus === 'active'
            };

            // If we have product data in the response, merge it
            if (data.product) {
              return {
                ...updatedProduct,
                ...data.product,
                // Ensure we keep the shop information
                shop_name: p.shop_name,
                shop_uuid: p.shop_uuid
              };
            }

            return updatedProduct;
          }
          return p;
        })
      );

      toast.success(`Product ${newStatus === 'active' ? 'published' : 'moved to draft'} successfully`, {
        id: statusToast
      });

      // Fetch fresh data after a short delay
      setTimeout(() => {
        fetchProducts();
      }, 1000);
    } catch (error) {
      console.error('Error changing product status:', error);
      toast.error(error.message || `Failed to change product status to ${newStatus}`, {
        id: statusToast
      });
    } finally {
      setStatusLoading(false);
      setSelectedProductId(null);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const shopPromises = shops.map(async shop => {
        const response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shop.shop_uuid}/products`, 
          {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch products for shop ${shop.shop_uuid}`);
        }

        const data = await response.json();
        
        // Handle different response formats
        let productsArray = [];
        if (data.products) {
          productsArray = data.products;
        } else if (Array.isArray(data)) {
          productsArray = data;
        } else if (data.product) {
          productsArray = [data.product];
        }

        // Map the products with shop information
        return productsArray.map(product => ({
          ...product,
          shop_name: shop.business_name || 'Unknown Shop',
          shop_uuid: shop.shop_uuid
        }));
      });

      const productsData = await Promise.all(shopPromises);
      const allProducts = productsData.flat();
      
      setProducts(Array.isArray(allProducts) ? allProducts : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to refresh products list');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold">Products</CardTitle>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200"
                  onClick={() => navigate('/seller/seller-center/products/archived')}
                >
                  View Archived
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      Add Product
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Select Shop</h4>
                        <p className="text-sm text-muted-foreground">
                          Choose which shop to add the product to
                        </p>
                      </div>
                      <div className="grid gap-2">
                        {shops.map((shop) => (
                          <Button
                            key={shop.shop_uuid}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate(`/seller/seller-center/shop/${shop.shop_uuid}/products/new`)}
                          >
                            <div className="flex items-center gap-2">
                              {shop.shop_logo ? (
                                <img
                                  src={shop.shop_logo}
                                  alt={`${shop.business_name} logo`}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    {shop.business_name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span>{shop.business_name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow key="header-row">
                      <TableHead key="head-image">Image</TableHead>
                      <TableHead key="head-name">Name</TableHead>
                      <TableHead key="head-shop">Shop</TableHead>
                      <TableHead key="head-price">Price</TableHead>
                      <TableHead key="head-status">Status</TableHead>
                      <TableHead key="head-stock">Stock</TableHead>
                      <TableHead key="head-actions" className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={`row-${product.product_uuid}`}>
                        <TableCell key={`cell-image-${product.product_uuid}`}>
                          <div className="w-16 h-16 relative">
                            <img
                              src={product.main_image || '/placeholder.png'}
                              alt={product.name}
                              className="object-cover w-full h-full rounded-md"
                            />
                          </div>
                        </TableCell>
                        <TableCell key={`cell-name-${product.product_uuid}`}>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="text-sm text-muted-foreground max-w-[300px] truncate cursor-pointer hover:text-blue-500">
                                  {product.description}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent key={`popover-${product.product_uuid}`} className="w-[400px] p-4">
                                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {product.description}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell key={`cell-shop-${product.product_uuid}`}>{product.shop_name}</TableCell>
                        <TableCell key={`cell-price-${product.product_uuid}`}>₱{(product.price ? parseFloat(product.price) : 0).toFixed(2)}</TableCell>
                        <TableCell key={`cell-status-${product.product_uuid}`}>
                          <div className="flex items-center gap-2">
                            <Badge 
                              key={`badge-${product.product_uuid}`}
                              className={`capitalize ${product.status === 'active' ? 'bg-green-100 text-green-800' : product.status === 'archived' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                              {product.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  key={`dropdown-trigger-${product.product_uuid}`}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 p-0"
                                  disabled={statusLoading && selectedProductId === product.product_uuid}
                                >
                                  {statusLoading && selectedProductId === product.product_uuid ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {product.status !== 'active' && (
                                  <DropdownMenuItem 
                                    key={`menu-active-${product.product_uuid}`}
                                    onClick={() => handleStatusChange(product.product_uuid, 'active')}
                                    disabled={statusLoading}
                                  >
                                    Set as Active
                                  </DropdownMenuItem>
                                )}
                                {product.status !== 'draft' && (
                                  <DropdownMenuItem 
                                    key={`menu-draft-${product.product_uuid}`}
                                    onClick={() => handleStatusChange(product.product_uuid, 'draft')}
                                    disabled={statusLoading}
                                  >
                                    Move to Draft
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                        <TableCell key={`cell-stock-${product.product_uuid}`}>{product.quantity || 0}</TableCell>
                        <TableCell key={`cell-actions-${product.product_uuid}`}>
                          <div className="flex justify-end gap-2">
                            <Button
                              key={`view-${product.product_uuid}`}
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/seller/seller-center/shop/${product.shop_uuid}/products/${product.product_uuid}`}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-500 mb-6">Get started by adding your first product to one of your shops.</p>
                </div>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductManagement;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';
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

const ArchivedProducts = () => {
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellerInfo();
  }, []);

  const fetchSellerInfo = async () => {
    try {
      const response = await fetch('http://localhost:5555/seller/current', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seller info');
      }

      const data = await response.json();
      console.log('Seller data:', data);
      if (data && data.seller_id) {
        setSeller(data);
        await fetchShops(data.seller_id);  // Pass seller_id directly to fetchShops
      } else {
        console.error('No seller_id in response:', data);
      }
    } catch (error) {
      console.error('Error fetching seller info:', error);
      if (error.message.includes('401')) {
        window.location.href = '/login';
      }
    }
  };

  const fetchShops = async (sellerId) => {
    try {
      const response = await fetch(`http://localhost:5555/seller/${sellerId}/shops`, {
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
      console.log('Shops data:', data);
      if (data && data.shops) {
        setShops(data.shops);
        // Fetch products immediately after setting shops
        const shopsList = data.shops;
        setLoading(true);
        try {
          const productsPromises = shopsList.map(shop => 
            fetch(`http://localhost:5555/seller/${sellerId}/shops/${shop.shop_uuid}/products`, {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Accept': 'application/json'
              }
            }).then(res => res.json())
          );

          const results = await Promise.all(productsPromises);
          console.log('Products results:', results);
          
          const archivedProducts = results.flatMap(result => {
            if (!result || !result.products) return [];
            return result.products
              .filter(product => product.status === 'archived')  // Only show archived products
              .map(product => ({
                ...product,
                shop_name: shopsList.find(s => s.shop_uuid === product.shop_uuid)?.business_name || 'Unknown Shop'
              }));
          });

          console.log('Processed archived products:', archivedProducts);
          setProducts(archivedProducts);
        } catch (error) {
          console.error('Error fetching products:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setShops([]);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      setShops([]);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const handleProductClick = (product) => {
    navigate(`/seller/seller-center/shop/${product.shop_uuid}/products/${product.product_uuid}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Archived Products</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No archived products found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.product_uuid}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                          {product.main_image ? (
                            <img
                              src={product.main_image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.shop_name}</TableCell>
                    <TableCell>{formatPrice(product.price)}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-500 text-white">
                        Archived
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-gray-100 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleProductClick(product)}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArchivedProducts;

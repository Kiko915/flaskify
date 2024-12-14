import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/AuthContext';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, Share2, Heart, ShoppingCart, Package, Star, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import toast from 'react-hot-toast';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function ProductDetail() {
  const { shopUuid, productUuid } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("description");
  const [verificationCode, setVerificationCode] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showUnarchiveDialog, setShowUnarchiveDialog] = useState(false);
  const [archiveCode, setArchiveCode] = useState("");
  const [unarchiveCode, setUnarchiveCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('Fetching product with:', {
          sellerId: user?.seller?.seller_id,
          shopUuid,
          productUuid
        });
        
        const response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}`,
          {
            credentials: 'include',
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        const data = await response.json();
        console.log('Received product data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch product');
        }

        // If we have variations, fetch their options
        if (data.variations && data.variations.length > 0) {
          // Fetch inventory data which includes variation options
          const inventoryResponse = await fetch(
            `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/inventory`,
            {
              credentials: 'include',
              headers: {
                'Accept': 'application/json'
              }
            }
          );

          if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            // Merge variation options into the product data
            data.variations = data.variations.map(variation => {
              const inventoryVariation = inventoryData.variations?.find(
                v => v.variation_uuid === variation.variation_uuid
              );
              return {
                ...variation,
                options: inventoryVariation?.options || []
              };
            });
          }
        }

        // Set visibility to false if status is draft
        if (data.status === 'draft') {
          data.visibility = false;
          
          // Update visibility on the server
          await fetch(
            `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}`,
            {
              method: 'PATCH',
              credentials: 'include',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                visibility: false
              })
            }
          );
        }

        setProduct(data);  
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.seller?.seller_id && shopUuid && productUuid) {
      fetchProduct();
    }
  }, [user, shopUuid, productUuid]);

  const handlePublish = async () => {
    const publishToast = toast.loading('Publishing product...');
    try {
      setPublishing(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/publish`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'active',
            visibility: true
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to publish product');
      }

      const data = await response.json();
      
      // Update the product status and visibility in the local state
      setProduct(prev => ({ 
        ...prev, 
        status: 'active',
        visibility: true,
        published_at: new Date().toISOString() 
      }));
      
      // Make a separate request to ensure visibility is updated
      await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'active',
            visibility: true
          })
        }
      );

      toast.success('Product published successfully!', { id: publishToast });
    } catch (error) {
      console.error('Error publishing product:', error);
      toast.error(error.message || 'Failed to publish product', { id: publishToast });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnarchiveProduct = async () => {
    try {
      setIsUnarchiving(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/unarchive?code=${verificationCode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          credentials: 'include',
          body: JSON.stringify({ verification_code: verificationCode })
        }
      );

      let data;
      try {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          console.error('Response is not JSON:', textData);
          throw new Error('Invalid server response format');
        }
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unarchive product');
      }

      toast.success(data.message || 'Product unarchived successfully');
      setShowUnarchiveDialog(false);
      // Navigate back to listings page
      navigate('/seller/seller-center/products/listings');
    } catch (error) {
      console.error('Error unarchiving product:', error);
      toast.error(error.message || 'An error occurred while unarchiving the product');
    } finally {
      setIsUnarchiving(false);
      setVerificationCode("");
    }
  };

  const handleArchiveProduct = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/archive?code=${verificationCode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          credentials: 'include',
          body: JSON.stringify({ verification_code: verificationCode })
        }
      );

      let data;
      try {
        const textData = await response.text();
        try {
          data = JSON.parse(textData);
        } catch (e) {
          console.error('Response is not JSON:', textData);
          throw new Error('Invalid server response format');
        }
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to archive product');
      }

      toast.success(data.message || 'Product archived successfully');
      setShowArchiveDialog(false);
      // Navigate back to listings page
      navigate('/seller/seller-center/products/listings');
    } catch (error) {
      console.error('Error archiving product:', error);
      toast.error(error.message || 'An error occurred while archiving the product');
    } finally {
      setIsArchiving(false);
      setVerificationCode("");
    }
  };

  // Add function to fetch verification code
  const fetchVerificationCode = async (action) => {
    try {
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/verification-code?action=${action}`,
        {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification code');
      }

      const data = await response.json();
      if (action === 'archive') {
        setArchiveCode(data.code);
      } else {
        setUnarchiveCode(data.code);
      }
      setCodeExpiresAt(data.expires_at);
    } catch (error) {
      console.error('Error fetching verification code:', error);
      toast.error('Failed to fetch verification code');
    }
  };

  // Modify the dialog open handlers
  const handleShowArchiveDialog = async () => {
    await fetchVerificationCode('archive');
    setShowArchiveDialog(true);
  };

  const handleShowUnarchiveDialog = async () => {
    await fetchVerificationCode('unarchive');
    setShowUnarchiveDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button
              variant="outline"
              onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
        </div>
        {product.status === 'draft' && (
          <Button 
            onClick={handlePublish}
            disabled={publishing}
            className="bg-green-600 hover:bg-green-700"
          >
            <Globe className="h-4 w-4 mr-2" />
            {publishing ? 'Publishing...' : 'Publish Product'}
          </Button>
        )}
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow-sm">
        {/* Left Column - Image */}
        <div className="space-y-4">
          <div className="w-full">
            <Carousel className="w-full">
              <CarouselContent>
                <CarouselItem key="cover">
                  <div className="aspect-square w-full">
                    <img
                      src={product.main_image}
                      alt="Cover"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </CarouselItem>
                {product.additional_images?.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square w-full">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
            
            {/* Thumbnail Preview */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-yellow-500">
                <img
                  src={product.main_image}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
              {product.additional_images?.map((image, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden border hover:border-yellow-500"
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          <div>
            {product.status === 'active' ? (
              <Badge className="bg-green-500 hover:bg-green-600 mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Active
                </div>
              </Badge>
            ) : product.status === 'draft' ? (
              <Badge variant="secondary" className="mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Draft
                </div>
              </Badge>
            ) : (
              <Badge variant="destructive" className="mb-2">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  {product.status}
                </div>
              </Badge>
            )}
            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400" />
                4.9
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div>{product.sold || 0} Sold</div>
              <Separator orientation="vertical" className="h-4" />
              <div>{product.view_count || 0} Views</div>
            </div>
          </div>

          <div className="bg-yellow-50/50 p-4 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {product.variations && product.variations.length > 0 ? (() => {
                const prices = product.variations
                  .flatMap(v => {
                    if (!v || !Array.isArray(v.options)) return [];
                    return v.options
                      .filter(o => o && typeof o === 'object')
                      .map(o => o.price || product.price);
                  })
                  .filter(price => price !== null && price !== undefined);
                
                if (prices.length === 0) return formatPrice(product.price);
                
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                return minPrice === maxPrice ? 
                  formatPrice(minPrice) :
                  `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
              })() : formatPrice(product.price)}
            </div>
            {product.compare_at_price && (
              <div className="text-lg text-gray-500 line-through">
                {formatPrice(product.compare_at_price)}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Category */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24">Category:</span>
              <div className="flex items-center gap-1 text-gray-700">
                {product.category_path ? (
                  <span>{product.category_path}</span>
                ) : (
                  <span className="text-gray-400">Uncategorized</span>
                )}
              </div>
            </div>

            {/* Variations */}
            {product.variations && product.variations.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-500">Product Variations</div>
                <div className="grid grid-cols-1 gap-4">
                  {product.variations.map((variation, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:border-yellow-500 transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="font-medium">{variation.name}</div>
                        <div className="grid gap-2">
                          {variation.options && variation.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                  {option.name}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 mr-1">Price:</span>
                                  <span className="text-yellow-600 font-medium">
                                    {formatPrice(option.price || product.price)}
                                    {product.discount_percentage && (
                                      <span className="ml-1 text-xs text-red-500">(-{product.discount_percentage}%)</span>
                                    )}
                                  </span>
                                  {product.discount_percentage && option.compare_at_price && (
                                    <span className="ml-2 text-sm text-gray-400 line-through">
                                      {formatPrice(option.compare_at_price)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-gray-500 mr-1">Stock:</span>
                                  <span className={option.stock <= 5 ? "text-red-500 font-medium" : "text-gray-700"}>
                                    {option.stock}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No variations available</p>
                <p className="text-sm">This product doesn't have any variations.</p>
              </div>
            )}

            {/* Stock */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24">Stock:</span>
              <div className="flex items-center gap-2">
                <span>{product.quantity} units available</span>
                {product.quantity <= product.low_stock_alert && (
                  <Badge variant="destructive" className="animate-pulse">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      Low Stock
                    </div>
                  </Badge>
                )}
                {product.quantity === 0 && (
                  <Badge variant="destructive">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      Out of Stock
                    </div>
                  </Badge>
                )}
              </div>
            </div>

            {/* SKU */}
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24">SKU:</span>
              <span>{product.sku || 'Not set'}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              className={`flex-1 ${
                product.quantity <= product.low_stock_alert 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' 
                  : ''
              }`} 
              variant={product.quantity <= product.low_stock_alert ? 'destructive' : 'outline'}
              onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}/inventory`)}
            >
              <Package className="h-4 w-4 mr-2" />
              Manage Stock
              {product.quantity <= product.low_stock_alert && (
                <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">
                  !
                </span>
              )}
            </Button>
            <Button className="flex-1" variant="default" onClick={() => navigate(`/product/${product.product_uuid}`)}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              View in Store
            </Button>
          </div>
        </div>
      </div>

      {/* Product Variations */}
      {product.variations && product.variations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Product Variations</h3>
          <div className="space-y-4">
            {product.variations.map((variation) => (
              <div key={variation.variation_uuid} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-lg">Variation Details</h4>
                      {variation.has_individual_stock && (
                        <Badge variant="outline">Individual Stock</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-500">Base Price:</span>
                        <span className="ml-2 font-medium">{formatPrice(variation.price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Stock:</span>
                        <span className="ml-2 font-medium">{variation.quantity}</span>
                      </div>
                    </div>
                    {variation.options && variation.options.length > 0 ? (
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-700">Options</h5>
                        {variation.options.map((option) => (
                          <div key={option.option_uuid} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                {option.name}
                              </Badge>
                              {option.sku && (
                                <span className="text-sm text-gray-500">
                                  SKU: {option.sku}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-gray-500 mr-1">Price:</span>
                                <span className="text-yellow-600 font-medium">
                                  {formatPrice(option.price || variation.price)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 mr-1">Stock:</span>
                                <span className={option.stock <= (option.low_stock_alert || 5) ? "text-red-500 font-medium" : "text-gray-700"}>
                                  {option.stock}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                        <p>No options available for this variation</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Description */}
      <div className="mt-8">
        <Tabs defaultValue="description" className="bg-white rounded-lg shadow-sm">
          <TabsList className="w-full border-b">
            <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
            <TabsTrigger value="images" className="flex-1">Images</TabsTrigger>
            <TabsTrigger value="variations" className="flex-1">Variations</TabsTrigger>
            <TabsTrigger value="specifications" className="flex-1">Specifications</TabsTrigger>
            <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="description">
              <div className="prose max-w-none">
                {product.description}
              </div>
            </TabsContent>
            <TabsContent value="images">
              <div className="space-y-6">
                {/* Main Carousel */}
                <Carousel className="w-full max-w-3xl mx-auto">
                  <CarouselContent>
                    {/* Cover Photo First */}
                    {product.main_image && (
                      <CarouselItem key="cover">
                        <Card className="border-none">
                          <CardContent className="flex aspect-square items-center justify-center p-0">
                            <img
                              src={product.main_image}
                              alt="Cover"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    )}
                    {/* Additional Images */}
                    {product.additional_images && product.additional_images.map((image, index) => (
                      <CarouselItem key={index}>
                        <Card className="border-none">
                          <CardContent className="flex aspect-square items-center justify-center p-0">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>

                {/* Thumbnail Preview */}
                <div className="grid grid-cols-5 gap-4 mt-4">
                  {product.cover_photo && (
                    <div 
                      className="aspect-square rounded-lg overflow-hidden border-2 border-yellow-500 cursor-pointer"
                    >
                      <img
                        src={product.cover_photo}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {product.additional_images && product.additional_images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border hover:border-yellow-500 cursor-pointer"
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="variations">
              {product.variations && product.variations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Option</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.variations.flatMap(variation => {
                      if (!variation || !Array.isArray(variation.options)) return [];
                      return variation.options.map(option => {
                        if (!option) return null;
                        return (
                          <TableRow key={option.option_uuid}>
                            <TableCell>
                              <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                                {option.name}: {option.value}
                              </Badge>
                            </TableCell>
                            <TableCell>{option.sku || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{formatPrice(option.price || variation.price || product.price)}</span>
                                {product.discount_percentage && option.compare_at_price && (
                                  <>
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatPrice(option.compare_at_price)}
                                    </span>
                                    <span className="text-xs text-red-500">
                                      (-{product.discount_percentage}%)
                                    </span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className={option.stock <= option.low_stock_alert ? "text-red-500 font-medium" : ""}>
                                  {option.stock}
                                </span>
                                {option.stock <= option.low_stock_alert && (
                                  <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {option.stock > 0 ? (
                                <Badge variant="success" className="bg-green-100 text-green-800">In Stock</Badge>
                              ) : (
                                <Badge variant="destructive" className="bg-red-100 text-red-800">Out of Stock</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      }).filter(Boolean);
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No variations available</p>
                  <p className="text-sm">This product doesn't have any variations.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="specifications">
              {product.specifications ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    // Parse specifications if it's a string
                    let specs = product.specifications;
                    if (typeof specs === 'string') {
                      try {
                        specs = JSON.parse(specs);
                      } catch (e) {
                        console.error('Error parsing specifications:', e);
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-lg font-medium">Error displaying specifications</p>
                            <p className="text-sm">There was an error parsing the specifications data.</p>
                          </div>
                        );
                      }
                    }

                    // Handle array or object format
                    return Array.isArray(specs) ? (
                      // Handle array format
                      specs.map((spec, index) => (
                        <div key={index} className="flex flex-col p-4 border rounded-lg bg-gray-50 hover:border-yellow-500 transition-all">
                          <span className="text-sm font-medium text-gray-500 mb-1">{spec.key}</span>
                          <span className="text-base text-gray-900">{spec.value}</span>
                        </div>
                      ))
                    ) : (
                      // Handle object format
                      Object.entries(specs).map(([key, value], index) => (
                        <div key={index} className="flex flex-col p-4 border rounded-lg bg-gray-50 hover:border-yellow-500 transition-all">
                          <span className="text-sm font-medium text-gray-500 mb-1">{key}</span>
                          <span className="text-base text-gray-900">{value}</span>
                        </div>
                      ))
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No specifications available</p>
                  <p className="text-sm">This product doesn't have any specifications yet.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="shipping">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dimensions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-500">Length:</span>
                        <span className="ml-2">{product.shipping_length ? `${product.shipping_length} cm` : '0 cm'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Width:</span>
                        <span className="ml-2">{product.shipping_width ? `${product.shipping_width} cm` : '0 cm'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Height:</span>
                        <span className="ml-2">{product.shipping_height ? `${product.shipping_height} cm` : '0 cm'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <span className="ml-2">{product.shipping_weight ? `${product.shipping_weight} kg` : '0 kg'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Shipping Details</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <span className="text-gray-500">Provider:</span>
                        <span className="ml-2">
                          {product.shipping_provider_details ? (
                            <div className="flex items-center gap-2">
                              {product.shipping_provider_details.logo_url && (
                                <img 
                                  src={product.shipping_provider_details.logo_url} 
                                  alt={product.shipping_provider_details.name}
                                  className="w-6 h-6 object-contain"
                                />
                              )}
                              <span>{product.shipping_provider_details.name}</span>
                            </div>
                          ) : (
                            'Standard Shipping'
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rate Type:</span>
                        <span className="ml-2">
                          {product.shipping_rate_details ? (
                            <span>{product.shipping_rate_details.name}</span>
                          ) : (
                            'Standard Rate'
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fee:</span>
                        <span className="ml-2">
                          {product.shipping_fee !== null && product.shipping_fee !== undefined
                            ? formatPrice(product.shipping_fee)
                            : 'Free Shipping'}
                        </span>
                      </div>
                      {product.shipping_rate_details && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-500 mb-2">Rate Details:</div>
                          <div className="grid gap-1 text-sm">
                            <div className="flex justify-between">
                              <span>Base Rate:</span>
                              <span>{formatPrice(product.shipping_rate_details.base_rate)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Per kg Rate:</span>
                              <span>{formatPrice(product.shipping_rate_details.weight_rate)}/kg</span>
                            </div>
                            {product.shipping_rate_details.estimated_days && (
                              <div className="flex justify-between">
                                <span>Estimated Delivery:</span>
                                <span>{product.shipping_rate_details.estimated_days} days</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Archive/Unarchive Dialog */}
      <Dialog open={showArchiveDialog || showUnarchiveDialog} onOpenChange={() => {
        setShowArchiveDialog(false);
        setShowUnarchiveDialog(false);
        setVerificationCode("");
        setArchiveCode("");
        setUnarchiveCode("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showArchiveDialog ? 'Archive Product' : 'Unarchive Product'}</DialogTitle>
            <DialogDescription>
              {showArchiveDialog ? 
                'This action will hide the product from your shop. Enter verification code to continue.' :
                'This action will restore the product as a draft. Enter verification code to continue.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="verification-code"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <div className="text-sm text-gray-500">
                Verification Code: <span className="font-mono font-medium">
                  {showArchiveDialog ? archiveCode : unarchiveCode}
                </span>
                {codeExpiresAt && (
                  <div className="mt-1">
                    Code expires in 5 minutes
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowArchiveDialog(false);
                setShowUnarchiveDialog(false);
                setVerificationCode("");
                setArchiveCode("");
                setUnarchiveCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={showArchiveDialog ? handleArchiveProduct : handleUnarchiveProduct}
              disabled={!verificationCode || (showArchiveDialog ? isArchiving : isUnarchiving)}
            >
              {showArchiveDialog ? 
                (isArchiving ? 'Archiving...' : 'Archive') : 
                (isUnarchiving ? 'Unarchiving...' : 'Unarchive')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Actions */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Product
          </Button>
          <Button
            variant="outline"
            onClick={() => product.status === 'archived' ? handleShowUnarchiveDialog() : handleShowArchiveDialog()}
            className={product.status === 'archived' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}
          >
            {product.status === 'archived' ? 'Unarchive' : 'Archive'}
          </Button>
        </div>
      </div>
    </div>
  );
}

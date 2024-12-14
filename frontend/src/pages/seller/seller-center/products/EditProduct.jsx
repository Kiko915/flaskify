import React, { useState, useEffect, useCallback, memo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import toast from "react-hot-toast"
import { useAuth } from "@/utils/AuthContext"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Plus, Pencil, Trash2, X, Image as ImageIcon, Package } from "lucide-react"

const BasicInformationStep = memo(({ 
  formData, 
  onInputChange, 
  onImageUpload, 
  onRemoveImage, 
  onAddSpecification, 
  onRemoveSpecification, 
  onSpecificationChange,
  categories,
  onCategoryChange 
}) => (
  <div className="space-y-12">
    <div className="space-y-6">
      <Label className="text-lg font-semibold">Product Images</Label>
      <p className="text-sm text-muted-foreground mb-4">Upload up to 9 images. First image will be the cover.</p>
      <div className="grid grid-cols-3 gap-4">
        {formData.images.map((image, index) => (
          <div 
            key={image.id} 
            className={cn(
              "relative aspect-square rounded-lg border-2 overflow-hidden group",
              index === 0 ? "border-yellow-500" : "border-border"
            )}
          >
            <img 
              src={image.preview} 
              alt={`Product image ${index + 1}`}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemoveImage(image.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                Cover
              </div>
            )}
          </div>
        ))}
        {formData.images.length < 9 && (
          <label className="cursor-pointer">
            <div className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Add Image</span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onImageUpload(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>

    <div className="space-y-8">
      <div className="space-y-6">
        <Label className="text-lg font-semibold" htmlFor="name">Product Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="Enter product name"
        />
      </div>

      <div className="space-y-6">
        <Label className="text-lg font-semibold" htmlFor="category">Category</Label>
        <div className="space-y-2">
          <Select
            value={formData.category_uuid}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category">
                {formData.category_name || "Select a category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter(category => category && category.category_uuid)
                .map((category) => (
                  <SelectItem 
                    key={`category-${category.category_uuid}`}
                    value={category.category_uuid}
                  >
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-6">
        <Label className="text-lg font-semibold" htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onInputChange}
          placeholder="Enter product description"
          rows={5}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">Specifications</Label>
            <p className="text-sm text-muted-foreground">
              Add specifications like brand, material, etc.
            </p>
          </div>
          <Button
            type="button"
            onClick={onAddSpecification}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Specification
          </Button>
        </div>

        {formData.specifications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <div className="text-muted-foreground mb-2">
              No specifications added yet
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onAddSpecification}
            >
              <Plus className="w-4 h-4" />
              Add Your First Specification
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {formData.specifications.map((spec) => (
              <Card key={spec.id} className="p-4">
                <div className="grid grid-cols-[1fr,1fr,auto] gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <Input
                      placeholder="e.g., Brand"
                      value={spec.name}
                      onChange={(e) => onSpecificationChange(spec.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Value</Label>
                    <Input
                      placeholder="e.g., Samsung"
                      value={spec.value}
                      onChange={(e) => onSpecificationChange(spec.id, 'value', e.target.value)}
                    />
                  </div>
                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveSpecification(spec.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
))

BasicInformationStep.displayName = "BasicInformationStep"

const SalesInformationStep = memo(({ 
  formData, 
  variations, 
  onInputChange, 
  onVariationChange,
  onAddVariation,
  onRemoveVariation,
  onAddVariationOption,
  onRemoveVariationOption,
  onVariationOptionChange,
  shopUuid,
  productUuid
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-lg font-semibold" htmlFor="price">Base Price</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
              ₱
            </span>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={onInputChange}
              className="pl-8"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-semibold" htmlFor="stock">Base Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={onInputChange}
            placeholder="0"
          />
        </div>
      </div>

      {/* Variations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">Product Variations</Label>
            <p className="text-sm text-muted-foreground">
              Add variations like different colors, sizes, etc.
            </p>
          </div>
          <Button
            type="button"
            onClick={onAddVariation}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Variation
          </Button>
        </div>

        {variations.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <div className="text-muted-foreground mb-2">
              No variations added yet
            </div>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={onAddVariation}
            >
              <Plus className="w-4 h-4" />
              Add Your First Variation
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {variations.map((variation, index) => (
              <Card key={variation.id} className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-lg font-semibold">
                        Variation {index + 1}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {variation.options.length} options
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemoveVariation(variation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Variation Name</Label>
                      <Input
                        value={variation.name}
                        onChange={(e) => onVariationChange(variation.id, 'name', e.target.value)}
                        placeholder="e.g., Color, Size"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base Price</Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                          ₱
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variation.price || ''}
                          onChange={(e) => onVariationChange(variation.id, 'price', e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => onAddVariationOption(variation.id)}
                      >
                        <Plus className="w-4 h-4" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {variation.options.map((option) => (
                        <Card key={option.id} className="p-4">
                          <div className="grid grid-cols-[1fr,1fr,1fr,auto] gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Value</Label>
                              <Input
                                value={option.value}
                                onChange={(e) => onVariationOptionChange(variation.id, option.id, 'value', e.target.value)}
                                placeholder="e.g., Red, Large"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Price</Label>
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">
                                  ₱
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={option.price || ''}
                                  onChange={(e) => onVariationOptionChange(variation.id, option.id, 'price', e.target.value)}
                                  className="pl-8"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Stock</Label>
                              <Input
                                type="number"
                                min="0"
                                value={option.stock || ''}
                                onChange={(e) => onVariationOptionChange(variation.id, option.id, 'stock', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="pt-6">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => onRemoveVariationOption(variation.id, option.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

SalesInformationStep.displayName = "SalesInformationStep";

const EditProduct = () => {
  const { shopUuid, productUuid } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_uuid: '',
    category_name: '', 
    images: [],
    specifications: []
  })
  const [variations, setVariations] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchProductData()
    fetchCategories()
  }, [shopUuid, productUuid])

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}`,
        {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch product')
      }
      
      const data = await response.json()
      
      // Transform the data to match our form structure
      setFormData({
        name: data.name || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        stock: data.quantity?.toString() || '',
        category_uuid: data.category_uuid || '',
        category_name: data.category_name || '', 
        images: [
          ...(data.main_image ? [{
            id: uuidv4(),
            preview: data.main_image,
            url: data.main_image,
            isExisting: true
          }] : []),
          ...(Array.isArray(data.additional_images) ? data.additional_images.map(img => ({
            id: uuidv4(),
            preview: img,
            url: img,
            isExisting: true
          })) : [])
        ],
        specifications: Array.isArray(data.specifications) ? 
          // Handle array format
          data.specifications.map(spec => ({
            id: uuidv4(),
            name: spec.key,
            value: spec.value?.toString() || ''
          })) :
          // Handle object format
          Object.entries(data.specifications || {}).map(([key, value]) => ({
            id: uuidv4(),
            name: key,
            value: value?.toString() || ''
          }))
      })

      // Set variations if they exist
      if (data.variations?.length > 0) {
        setVariations(data.variations.map(variation => {
          // Create a default option for each variation if none exists
          const defaultOption = {
            id: uuidv4(),
            name: 'Size', // You can adjust this default name
            value: 'Regular', // You can adjust this default value
            price: variation.price?.toString() || data.price?.toString(),
            stock: variation.quantity?.toString() || '0',
            low_stock_alert: '5',
            sku: null
          };

          return {
            id: variation.variation_uuid,
            name: 'Size', // You can adjust this default name
            price: variation.price?.toString() || data.price?.toString(),
            compare_at_price: variation.compare_at_price?.toString() || '',
            has_individual_stock: variation.has_individual_stock || false,
            quantity: variation.quantity?.toString() || '0',
            options: variation.options?.length > 0 ? variation.options.map(option => ({
              id: option.option_uuid || uuidv4(),
              name: option.name || 'Size',
              value: option.value || 'Regular',
              price: option.price?.toString() || variation.price?.toString() || data.price?.toString(),
              stock: option.stock?.toString() || variation.quantity?.toString() || '0',
              low_stock_alert: option.low_stock_alert?.toString() || '5',
              sku: option.sku || null
            })) : [defaultOption]
          };
        }));
      } else {
        setVariations([]);
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product data')
      navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        'http://localhost:5555/categories',
        {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      // Filter out invalid categories before setting state
      const validCategories = Array.isArray(data) ? data.filter(category => 
        category && 
        typeof category === 'object' && 
        category.category_uuid && 
        category.name
      ) : [];
      setCategories(validCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = (files) => {
    const newImages = Array.from(files).map(file => ({
      id: uuidv4(),
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }))

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 9)
    }))
  }

  const handleRemoveImage = (imageId) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }))
  }

  const handleAddSpecification = () => {
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { id: uuidv4(), name: '', value: '' }]
    }))
  }

  const handleRemoveSpecification = (specId) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter(spec => spec.id !== specId)
    }))
  }

  const handleSpecificationChange = (specId, field, value) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map(spec =>
        spec.id === specId ? { ...spec, [field]: value } : spec
      )
    }))
  }

  const handleCategoryChange = (categoryUuid) => {
    const selectedCategory = categories.find(cat => cat.category_uuid === categoryUuid);
    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        category_uuid: categoryUuid,
        category_name: selectedCategory.name
      }));
    }
  }

  const handleAddVariation = useCallback(() => {
    setVariations(prev => [...prev, {
      id: uuidv4(),
      name: 'Size', // Default name
      price: formData.price?.toString() || '',
      has_individual_stock: true,
      quantity: '0',
      options: [{
        id: uuidv4(),
        name: 'Size',
        value: 'Regular',
        price: formData.price?.toString() || '',
        stock: '0',
        low_stock_alert: '5',
        sku: null
      }]
    }]);
  }, [formData.price]);

  const handleRemoveVariation = (index) => {
    setVariations(prev => prev.filter((_, i) => i !== index))
  }

  const handleVariationChange = (index, field, value) => {
    setVariations(prev => prev.map((variation, i) =>
      i === index ? { ...variation, [field]: value } : variation
    ))
  }

  const handleAddVariationOption = useCallback((variationId) => {
    setVariations(prev => {
      const newVariations = [...prev];
      const variationIndex = newVariations.findIndex(v => v.id === variationId);
      if (variationIndex !== -1) {
        const variation = { ...newVariations[variationIndex] };
        variation.options = [...variation.options, {
          id: uuidv4(),
          name: variation.name,
          value: '',
          price: variation.price || formData.price?.toString() || '',
          stock: '0',
          low_stock_alert: '5',
          sku: null
        }];
        newVariations[variationIndex] = variation;
      }
      return newVariations;
    });
  }, [formData.price]);

  const handleRemoveVariationOption = (variationIndex, optionIndex) => {
    setVariations(prev => prev.map((variation, index) =>
      index === variationIndex
        ? {
          ...variation,
          options: variation.options.filter((_, i) => i !== optionIndex)
        }
        : variation
    ))
  }

  const handleVariationOptionChange = (variationIndex, optionIndex, field, value) => {
    setVariations(variations.map((variation, vIndex) =>
      vIndex === variationIndex
        ? {
          ...variation,
          options: variation.options.map((option, oIndex) =>
            oIndex === optionIndex
              ? { ...option, [field]: value }
              : option
          )
        }
        : variation
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append basic information
      formData.append('name', formData.name)
      formData.append('description', formData.description)
      formData.append('price', formData.price)
      formData.append('quantity', formData.stock)
      formData.append('category_uuid', formData.category_uuid)
      
      // Transform specifications to dictionary format
      if (formData.specifications?.length > 0) {
        const specifications = formData.specifications
          .filter(spec => spec.name && spec.value)
          .reduce((acc, spec) => {
            acc[spec.name] = spec.value
            return acc
          }, {})
        formData.append('specifications', JSON.stringify(specifications))
      } else {
        formData.append('specifications', JSON.stringify({}))
      }

      // Handle main image
      const mainImage = formData.images[0]
      if (mainImage?.isNew && mainImage.file) {
        formData.append('main_image', mainImage.file)
      } else if (mainImage?.isExisting) {
        formData.append('main_image_url', mainImage.url)
      }

      // Handle additional images
      const additionalImages = formData.images.slice(1)
      if (additionalImages.length > 0) {
        const existingAdditionalImages = additionalImages
          .filter(img => img.isExisting)
          .map(img => img.url)
        
        if (existingAdditionalImages.length > 0) {
          existingAdditionalImages.forEach(url => {
            formData.append('images_to_keep[]', url)
          })
        }

        const newAdditionalImages = additionalImages
          .filter(img => img.isNew && img.file)
        
        newAdditionalImages.forEach(img => {
          formData.append('additional_images', img.file)
        })
      }

      // Format variations for the backend
      const formattedVariations = variations.map(variation => ({
        variation_uuid: variation.id,
        product_uuid: productUuid,
        price: parseFloat(variation.price || product.price),
        compare_at_price: variation.compare_at_price ? parseFloat(variation.compare_at_price) : null,
        has_individual_stock: true,
        quantity: parseInt(variation.quantity || '0'),
        options: variation.options.map(option => ({
          option_uuid: option.id,
          name: variation.name,
          value: option.value,
          price: parseFloat(option.price || variation.price || product.price),
          stock: parseInt(option.stock || '0'),
          low_stock_alert: parseInt(option.low_stock_alert || '5'),
          sku: option.sku || null
        }))
      }));

      formData.append('variations', JSON.stringify(formattedVariations));

      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update product');
      }

      const data = await response.json();
      
      // Update inventory after successful product update
      if (variations.length > 0) {
        const inventoryUpdates = variations.flatMap(variation =>
          variation.options.map(option => ({
            type: 'variation',
            variation_uuid: variation.id,
            option_uuid: option.id,
            field: 'stock',
            value: parseInt(option.stock)
          }))
        );

        await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products/${productUuid}/inventory`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ updates: inventoryUpdates })
          }
        );
      }
      
      toast.success("Product updated successfully", {
        id: loadingToast
      });
      
      navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto text-center">
          Loading product data...
        </div>
      </div>
    )
  }

  const steps = [
    {
      title: "Basic Information",
      component: (
        <BasicInformationStep
          formData={formData}
          onInputChange={handleInputChange}
          onImageUpload={handleImageUpload}
          onRemoveImage={handleRemoveImage}
          onAddSpecification={handleAddSpecification}
          onRemoveSpecification={handleRemoveSpecification}
          onSpecificationChange={handleSpecificationChange}
          categories={categories}
          onCategoryChange={handleCategoryChange}
        />
      )
    },
    {
      title: "Sales Information",
      component: (
        <SalesInformationStep
          formData={formData}
          variations={variations}
          onInputChange={handleInputChange}
          onVariationChange={handleVariationChange}
          onAddVariation={handleAddVariation}
          onRemoveVariation={handleRemoveVariation}
          onAddVariationOption={handleAddVariationOption}
          onRemoveVariationOption={handleRemoveVariationOption}
          onVariationOptionChange={handleVariationOptionChange}
          shopUuid={shopUuid}
          productUuid={productUuid}
        />
      )
    }
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(`/seller/seller-center/shop/${shopUuid}/products/${productUuid}`)}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Product Details
        </Button>

        <h1 className="text-3xl font-bold mb-8">
          Edit Product
        </h1>

        <div className="flex gap-4 mb-8">
          {steps.map((step, index) => (
            <Button
              key={index}
              variant={currentStep === index ? "default" : "outline"}
              onClick={() => setCurrentStep(index)}
            >
              {step.title}
            </Button>
          ))}
        </div>

        {steps[currentStep].component}

        <div className="flex justify-end gap-4 mt-8">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit}>
              Update Product
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EditProduct
import React, { useState, useEffect, useCallback, memo } from "react"
import { useParams } from "react-router-dom"
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
import { Plus, Trash2, X, Upload } from "lucide-react"
import { useNavigate } from 'react-router-dom';
import BulkUploadDialog from "@/components/seller/BulkUploadDialog"

const steps = [
  { id: 1, name: "Basic Information" },
  { id: 2, name: "Sales Information" },
  { id: 3, name: "Shipping" },
]

const BasicInformationStep = memo(({ 
  images, 
  imageUrls, 
  formData, 
  specifications, 
  categories,
  selectedParentCategory,
  subcategories, 
  onImageDelete, 
  onImageUpload, 
  onInputChange, 
  onSpecificationChange,
  onCategoryChange,
  onParentCategoryChange,
  onAddSpecification,
  onRemoveSpecification 
}) => (
  <div className="space-y-6">
    <div>
      <Label>Product Images (Max 9)</Label>
      <div className="grid grid-cols-3 gap-4 mt-2">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={cn(
              "relative aspect-square rounded-lg border overflow-hidden group",
              index === 0 ? "border-yellow-500" : "border-border"
            )}
          >
            <img
              src={imageUrls[index]}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-md">
                Cover Image
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => onImageDelete(index)}
                className="bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        {images.length < 9 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-yellow-500 transition-colors cursor-pointer flex flex-col items-center justify-center">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onImageUpload}
              multiple
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-6 h-6 mb-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm text-muted-foreground">
              Upload Image
            </span>
          </label>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Upload up to 9 images. First image will be the main product image.
      </p>
    </div>

    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          placeholder="Enter product name (min. 20 characters)"
          className={formData.name.length > 0 && formData.name.length < 20 ? 'border-red-500' : ''}
        />
        <div className="flex justify-between mt-1">
          <p className={`text-sm ${formData.name.length > 0 && formData.name.length < 20 ? 'text-red-500' : 'text-muted-foreground'}`}>
            Minimum 20 characters required
          </p>
          <p className={`text-sm ${formData.name.length > 120 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {formData.name.length}/120
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <div className="relative">
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={onInputChange}
            placeholder="Enter detailed product description (min. 100 characters)"
            className={`min-h-[200px] ${formData.description.length > 0 && formData.description.length < 100 ? 'border-red-500' : ''}`}
          />
          <div className="absolute bottom-2 right-2 text-sm text-muted-foreground bg-background px-2 py-1 rounded-md">
            {formData.description.length}/2000
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <p className={`text-sm ${formData.description.length > 0 && formData.description.length < 100 ? 'text-red-500' : 'text-muted-foreground'}`}>
            Minimum 100 characters required
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p> Tips for a good description:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Include key product features and specifications</li>
              <li>Mention materials, dimensions, and care instructions</li>
              <li>Highlight unique selling points</li>
              <li>Add warranty information if applicable</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <div className="space-y-2">
          <Select value={selectedParentCategory} onValueChange={onParentCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.uuid} value={category.uuid}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedParentCategory && subcategories.length > 0 && (
            <Select 
              value={formData.category_uuid} 
              onValueChange={onCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory (optional)" />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map((subcategory) => (
                  <SelectItem key={subcategory.uuid} value={subcategory.uuid}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedParentCategory && (
            <p className="text-sm text-muted-foreground">
              Selected: {categories.find(c => c.uuid === selectedParentCategory)?.name} 
              {formData.category_uuid && ' > ' + subcategories.find(s => s.uuid === formData.category_uuid)?.name}
              {!formData.category_uuid && ' (Parent Category)'}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label>Specifications</Label>
        {specifications.map((spec, index) => (
          <div key={index} className="flex gap-4 mt-2">
            <Input
              placeholder="Key"
              value={spec.key}
              onChange={(e) => onSpecificationChange(index, "key", e.target.value)}
            />
            <Input
              placeholder="Value"
              value={spec.value}
              onChange={(e) => onSpecificationChange(index, "value", e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onRemoveSpecification(index)}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={onAddSpecification}
          className="w-full mt-2"
        >
          Add Specification
        </Button>
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
  onVariationStockChange,
  onToggleStockType
}) => {
  // Calculate price range from variations
  const calculatePriceRange = useCallback(() => {
    if (!variations.length || !variations.some(v => v.options && v.options.length > 0)) {
      return {
        minPrice: Number(formData.price),
        maxPrice: Number(formData.price)
      };
    }

    const prices = variations.reduce((acc, variation) => {
      if (!variation.options) return acc;
      variation.options.forEach(option => {
        if (option.price) {
          acc.push(Number(option.price));
        }
      });
      return acc;
    }, []);

    if (!prices.length) return {
      minPrice: Number(formData.price),
      maxPrice: Number(formData.price)
    };

    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }, [variations, formData.price]);

  // Format price range for display
  const formatPriceRange = useCallback((minPrice, maxPrice) => {
    const formatter = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    });

    if (minPrice === maxPrice) {
      return formatter.format(minPrice);
    }
    return `${formatter.format(minPrice)} - ${formatter.format(maxPrice)}`;
  }, []);

  const { minPrice, maxPrice } = calculatePriceRange();
  const priceRange = formatPriceRange(minPrice, maxPrice);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-lg font-semibold" htmlFor="price">Base Price</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-foreground">₱</span>
            <Input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={onInputChange}
              className="pl-7"
              min="0"
              step="0.01"
            />
          </div>
          {variations.length > 0 && variations.some(v => v.options.some(o => o.price)) && (
            <p className="text-sm text-muted-foreground mt-1">
              Price range: {priceRange}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-semibold" htmlFor="quantity">Overall Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={onInputChange}
            disabled={variations.some(v => v.options && v.options.length > 0 && v.has_individual_stock)}
            placeholder={variations.some(v => v.options && v.options.length > 0 && v.has_individual_stock) ? "Calculated from variations" : "Enter overall quantity"}
            required
          />
          {variations.some(v => v.options && v.options.length > 0 && v.has_individual_stock) ? (
            <p className="text-sm text-muted-foreground mt-1">
              Total quantity is calculated from variation quantities
            </p>
          ) : variations.some(v => v.options && v.options.length > 0) && (
            <p className="text-sm text-muted-foreground mt-1">
              Quantity will be divided equally among variations
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-semibold">Product Variations</Label>
            <p className="text-sm text-muted-foreground">
              Add variations like different sizes or colors with specific prices and stock
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddVariation}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>
        </div>

        {variations.map((variation, variationIndex) => (
          <Card key={variation.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Variation name (e.g., Size, Color)"
                    value={variation.name}
                    onChange={(e) =>
                      onVariationChange(variationIndex, "name", e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveVariation(variationIndex)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Stock Type Toggle */}
              {variation.options && variation.options.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleStockType(variationIndex, !variation.has_individual_stock)}
                  >
                    {variation.has_individual_stock ? "Use Overall Quantity" : "Use Individual Quantity"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {variation.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label>Option Value</Label>
                      <Input
                        value={option.value}
                        onChange={(e) =>
                          onVariationOptionChange(
                            variationIndex,
                            optionIndex,
                            'value',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={option.price || ''}
                        placeholder={`Default: ${formData.price}`}
                        onChange={(e) =>
                          onVariationOptionChange(
                            variationIndex,
                            optionIndex,
                            'price',
                            e.target.value
                          )
                        }
                      />
                    </div>
                    {variation.has_individual_stock && (
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="0"
                          value={option.quantity || ''}
                          onChange={(e) =>
                            onVariationOptionChange(
                              variationIndex,
                              optionIndex,
                              'quantity',
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                    <div>
                      <Label>SKU</Label>
                      <Input
                        value={option.sku || ''}
                        placeholder={`${formData.sku}-${option.value.toUpperCase()}`}
                        onChange={(e) =>
                          onVariationOptionChange(
                            variationIndex,
                            optionIndex,
                            'sku',
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onAddVariationOption(variationIndex)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});

SalesInformationStep.displayName = "SalesInformationStep"

const ShippingStep = memo(({ 
  formData, 
  onInputChange,
  shippingProviders,
  shippingRates,
  selectedProvider,
  calculatedShippingFee,
  onProviderChange,
  onRateChange 
}) => {
  // Get the selected rate details for display
  const selectedRate = shippingRates.find(rate => rate.rate_uuid === formData.shipping_rate_uuid);
  
  return (
    <div className="space-y-6">
      {/* Dimensions and Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="shipping_length">Length (cm)</Label>
          <Input
            id="shipping_length"
            name="shipping_length"
            type="number"
            min="0"
            step="0.1"
            value={formData.shipping_length}
            onChange={onInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="shipping_width">Width (cm)</Label>
          <Input
            id="shipping_width"
            name="shipping_width"
            type="number"
            min="0"
            step="0.1"
            value={formData.shipping_width}
            onChange={onInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="shipping_height">Height (cm)</Label>
          <Input
            id="shipping_height"
            name="shipping_height"
            type="number"
            min="0"
            step="0.1"
            value={formData.shipping_height}
            onChange={onInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="shipping_weight">Weight (kg)</Label>
          <Input
            id="shipping_weight"
            name="shipping_weight"
            type="number"
            min="0"
            step="0.1"
            value={formData.shipping_weight}
            onChange={onInputChange}
            required
          />
        </div>
      </div>

      {/* Shipping Provider Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="shipping_provider">Shipping Provider</Label>
          <Select
            value={formData.shipping_provider_uuid}
            onValueChange={(value) => onProviderChange(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select shipping provider" />
            </SelectTrigger>
            <SelectContent>
              {shippingProviders.map((provider) => (
                <SelectItem 
                  key={provider.provider_uuid} 
                  value={provider.provider_uuid}
                >
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Shipping Rates */}
        {selectedProvider && shippingRates.length > 0 && (
          <div>
            <Label htmlFor="shipping_rate">Shipping Rate</Label>
            <Select
              value={formData.shipping_rate_uuid}
              onValueChange={(value) => onRateChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipping rate" />
              </SelectTrigger>
              <SelectContent>
                {shippingRates.map((rate) => (
                  <SelectItem 
                    key={rate.rate_uuid} 
                    value={rate.rate_uuid}
                  >
                    {rate.name} - Base: ₱{rate.base_rate} + ₱{rate.weight_rate}/kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Shipping Fee Calculation Details */}
        {selectedRate && formData.shipping_weight && calculatedShippingFee !== null && (
          <div className="rounded-lg border p-4 bg-muted space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Shipping Rate Details:</span>
              <span className="text-sm">{selectedRate.name}</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Rate:</span>
                <span>₱{selectedRate.base_rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Weight Rate:</span>
                <span>₱{selectedRate.weight_rate}/kg × {formData.shipping_weight}kg</span>
              </div>
              <div className="flex justify-between">
                <span>Weight Fee:</span>
                <span>₱{(selectedRate.weight_rate * formData.shipping_weight).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total Shipping Fee:</span>
                <span>₱{calculatedShippingFee.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Calculation: Base Rate + (Weight Rate × Weight)
            </p>
          </div>
        )}

        {selectedRate && !formData.shipping_weight && (
          <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
            Please enter the product weight to calculate shipping fee
          </div>
        )}
      </div>
    </div>
  );
});

ShippingStep.displayName = "ShippingStep"

export default function AddProduct() {
  const { shopUuid } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate();

  // All state declarations first
  const [currentStep, setCurrentStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [specifications, setSpecifications] = useState([{ key: "", value: "" }])
  const [variations, setVariations] = useState([{ 
    id: uuidv4(),
    name: "", 
    values: "",
    options: [],
    has_individual_stock: false,
    quantity: 0
  }])
  const [categories, setCategories] = useState([])
  const [selectedParentCategory, setSelectedParentCategory] = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category_uuid: "",
    price: "",
    quantity: "",  
    sku: "",
    shipping_length: "",
    shipping_width: "",
    shipping_height: "",
    shipping_weight: "",
    shipping_provider: "",
    shipping_fee: "",
    shipping_provider_uuid: '',
    shipping_rate_uuid: '',
  })
  const [autoGeneratedSku, setAutoGeneratedSku] = useState('');
  const [shippingProviders, setShippingProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [shippingRates, setShippingRates] = useState([]);
  const [calculatedShippingFee, setCalculatedShippingFee] = useState(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Define fetch functions with useCallback
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5555/categories', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      
      const parentCategories = data.filter(cat => !cat.parent_id && cat.is_active);
      setCategories(parentCategories);

      console.log('Fetched categories:', data);
      console.log('Parent categories:', parentCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchShippingProviders = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5555/admin/shipping-providers', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch shipping providers');
      const data = await response.json();
      setShippingProviders(data);
      
      const defaultProvider = data.find(p => p.is_default);
      if (defaultProvider) {
        setSelectedProvider(defaultProvider);
      }
    } catch (error) {
      console.error('Error fetching shipping providers:', error);
      toast.error('Failed to load shipping providers');
    }
  }, []);

  const fetchShippingRates = useCallback(async (providerUuid) => {
    try {
      const response = await fetch(`http://localhost:5555/admin/shipping-providers/${providerUuid}/rates`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch shipping rates');
      const data = await response.json();
      setShippingRates(data);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error('Failed to load shipping rates');
    }
  }, []);

  // useEffect hooks
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchShippingProviders()
      ]);
    };
    initializeData();
  }, [fetchCategories, fetchShippingProviders]);

  useEffect(() => {
    if (selectedProvider) {
      fetchShippingRates(selectedProvider.provider_uuid);
    }
  }, [selectedProvider, fetchShippingRates]);

  useEffect(() => {
    if (formData.shipping_rate_uuid && formData.weight) {
      calculateShippingFee(formData.shipping_rate_uuid, formData.weight);
    }
  }, [formData.shipping_rate_uuid, formData.weight]);

  const calculateShippingFee = async (rateUuid, weight) => {
    try {
      const response = await fetch(`http://localhost:5555/shipping/calculate/${rateUuid}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weight: parseFloat(weight) })
      });
      
      if (!response.ok) throw new Error('Failed to calculate shipping fee');
      const data = await response.json();
      setCalculatedShippingFee(data.shipping_fee);
      
      // Update form data with calculated shipping fee
      setFormData(prev => ({
        ...prev,
        shipping_fee: data.shipping_fee
      }));
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      toast.error('Failed to calculate shipping fee');
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    if (['price', 'quantity', 'shipping_length', 'shipping_width', 'shipping_height', 'shipping_weight', 'shipping_fee'].includes(name)) {
      // Allow empty string or valid numbers
      if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // If weight is changing, trigger shipping fee recalculation
        if (name === 'shipping_weight' && value && formData.shipping_rate_uuid) {
          handleRateChange(formData.shipping_rate_uuid);
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, [formData.shipping_rate_uuid]);

  const handleSpecificationChange = useCallback((index, field, value) => {
    setSpecifications(prev => {
      const newSpecs = [...prev]
      newSpecs[index][field] = value
      return newSpecs
    })
  }, [])

  const handleImageDelete = useCallback((index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 9) {
      toast.error("Maximum 9 images allowed")
      return
    }
    setImages(prev => [...prev, ...files])
    e.target.value = null
  }, [images.length])

  const handleParentCategoryChange = useCallback((value) => {
    setSelectedParentCategory(value);
    const parent = categories.find(cat => cat.uuid === value);
    setSubcategories(parent ? parent.subcategories : []);
    // Reset category in formData
    setFormData(prev => ({ ...prev, category_uuid: '' }));
  }, [categories]);

  const handleCategoryChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, category_uuid: value }))
  }, [])

  const handleAddSpecification = useCallback(() => {
    setSpecifications(prev => [...prev, { key: "", value: "" }])
  }, [])

  const handleRemoveSpecification = useCallback((index) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleVariationChange = useCallback((index, field, value) => {
    setVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      const variation = { ...updatedVariations[index] };

      if (field === 'options') {
        // Handle adding new options
        const newOptions = value.split('\n').map(v => v.trim()).filter(Boolean);
        const existingValues = new Set(variation.options.map(opt => opt.value));
        
        // Add only new unique options
        const newOptionObjects = newOptions
          .filter(v => !existingValues.has(v))
          .map(v => ({
            name: variation.name || '',
            value: v,
            price: Number(formData.price),
            quantity: variation.has_individual_stock ? 0 : Math.floor(Number(formData.quantity) / newOptions.length),
            low_stock_alert: 5,
            sku: formData.sku ? `${formData.sku}-${v.toUpperCase()}` : ''
          }));

        variation.options = [...variation.options, ...newOptionObjects];
      } else if (field === 'price' || field === 'quantity' || field === 'low_stock_alert') {
        // Handle numeric fields
        variation[field] = value === '' ? '' : Number(value);
      } else {
        variation[field] = value;
      }

      updatedVariations[index] = variation;
      return updatedVariations;
    });
  }, [formData]);

  const handleVariationOptionChange = useCallback((variationIndex, optionIndex, field, value) => {
    setVariations(prev => {
      const newVariations = [...prev];
      const variation = { ...newVariations[variationIndex] };
      const option = { ...variation.options[optionIndex] };

      if (field === 'price' || field === 'quantity' || field === 'low_stock_alert') {
        option[field] = value === '' ? '' : Number(value);
      } else {
        option[field] = value;
      }

      // Update option
      variation.options[optionIndex] = option;

      // Update variation price if this is a price change
      if (field === 'price') {
        variation.price = variation.options.reduce((max, opt) => {
          const optPrice = Number(opt.price) || Number(formData.price);
          return Math.max(max, optPrice);
        }, 0);
      }

      newVariations[variationIndex] = variation;
      return newVariations;
    });
  }, [formData.price]);

  const handleAddVariation = useCallback(() => {
    setVariations(prev => [...prev, { 
      id: uuidv4(),
      name: "", 
      values: "",
      options: [],
      has_individual_stock: false,
      quantity: 0
    }])
  }, [])

  const handleRemoveVariation = useCallback((index) => {
    setVariations(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddVariationOption = useCallback((variationIndex) => {
    setVariations(prevVariations => {
      // Create a new array with all previous variations
      const newVariations = [...prevVariations];
      
      // Get the variation we want to modify
      const variation = { ...newVariations[variationIndex] };
      
      // Add a single new option
      const newOption = {
        id: uuidv4(),
        name: variation.name || '',
        value: '',
        price: '',
        quantity: 0,
        low_stock_alert: 5,
        sku: ''
      };
      
      // Update the options array
      variation.options = [...variation.options, newOption];
      
      // Update the variation in our array
      newVariations[variationIndex] = variation;
      
      return newVariations;
    });
  }, []);

  const handleRemoveVariationOption = useCallback((variationIndex, optionIndex) => {
    setVariations(prev => {
      const newVariations = [...prev];
      const variation = { ...newVariations[variationIndex] };
      variation.options.splice(optionIndex, 1);
      newVariations[variationIndex] = variation;
      return newVariations;
    });
  }, []);

  const handleVariationStockChange = useCallback((variationIndex, optionIndex, value) => {
    setVariations(prev => {
      const newVariations = [...prev];
      const variation = { ...newVariations[variationIndex] };
      const option = { ...variation.options[optionIndex] };
      option.quantity = value;
      variation.options[optionIndex] = option;
      newVariations[variationIndex] = variation;
      return newVariations;
    });
  }, []);

  const handleToggleStockType = useCallback((variationIndex, value) => {
    setVariations(prev => {
      const newVariations = [...prev];
      const variation = { ...newVariations[variationIndex] };
      variation.has_individual_stock = value;
      newVariations[variationIndex] = variation;
      return newVariations;
    });
  }, []);

  const validateStep = useCallback((step) => {
    try {
      switch (step) {
        case 1: // Basic Information
          if (!formData.name || formData.name.length < 20) {
            toast.error('Product name must be at least 20 characters long')
            return false
          }
          if (!formData.description || formData.description.length < 100) {
            toast.error('Product description must be at least 100 characters long')
            return false
          }
          if (!formData.category_uuid) {
            toast.error('Please select a category')
            return false
          }
          if (images.length === 0) {
            toast.error('Please add at least one product image')
            return false
          }
          return true

        case 2: // Sales Information
          if (!formData.price || Number(formData.price) <= 0) {
            toast.error('Please enter a valid price')
            return false
          }

          // Validate quantity if no variations
          if (!variations.some(v => v.options && v.options.length > 0)) {
            if (!formData.quantity || Number(formData.quantity) <= 0) {
              toast.error('Please enter a valid quantity')
              return false
            }
          }

          // Validate variations if they exist
          const hasVariations = variations.some(v => v.options && v.options.length > 0);
          if (hasVariations) {
            const invalidVariations = variations.filter(variation => {
              if (variation.options && variation.options.length > 0) {
                // Check variation name
                if (!variation.name) {
                  toast.error('Please provide a name for all variations')
                  return true
                }
                // Check variation options
                if (variation.options.some(option => !option.value)) {
                  toast.error('Please provide values for all variation options')
                  return true
                }
                // Check variation quantities if using individual stock
                if (variation.has_individual_stock && 
                    variation.options.some(option => !option.quantity || Number(option.quantity) <= 0)) {
                  toast.error('Please provide valid quantities for all variation options')
                  return true
                }
              }
              return false
            });

            if (invalidVariations.length > 0) {
              return false
            }
          }
          return true

        case 3: // Shipping Information
          // Validate dimensions
          if (!formData.shipping_length || Number(formData.shipping_length) <= 0) {
            toast.error('Please enter a valid shipping length')
            return false
          }
          if (!formData.shipping_width || Number(formData.shipping_width) <= 0) {
            toast.error('Please enter a valid shipping width')
            return false
          }
          if (!formData.shipping_height || Number(formData.shipping_height) <= 0) {
            toast.error('Please enter a valid shipping height')
            return false
          }
          if (!formData.shipping_weight || Number(formData.shipping_weight) <= 0) {
            toast.error('Please enter a valid shipping weight')
            return false
          }

          // Validate shipping provider and rate
          if (!formData.shipping_provider_uuid) {
            toast.error('Please select a shipping provider')
            return false
          }
          if (!formData.shipping_rate_uuid) {
            toast.error('Please select a shipping rate')
            return false
          }
          if (!formData.shipping_fee || Number(formData.shipping_fee) <= 0) {
            toast.error('Please ensure shipping fee is calculated')
            return false
          }

          return true

        default:
          return true
      }
    } catch (error) {
      console.error('Validation error:', error)
      return false
    }
  }, [formData, variations, images]);

  useEffect(() => {
    // Clean up old URLs
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Create new URLs
    const urls = images.map(image => URL.createObjectURL(image));
    setImageUrls(urls);

    // Cleanup function
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

  // Recursive function to flatten categories for the dropdown
  const flattenCategories = (categories, prefix = '') => {
    return categories.reduce((acc, category) => {
      if (!category.is_active) return acc
      
      const flatCategory = {
        uuid: category.uuid,
        name: prefix ? `${prefix} > ${category.name}` : category.name
      }
      
      acc.push(flatCategory)
      
      if (category.subcategories && category.subcategories.length > 0) {
        acc.push(...flattenCategories(category.subcategories, flatCategory.name))
      }
      
      return acc
    }, [])
  }

  const generateSku = useCallback(async () => {
    if (!formData.name || !selectedParentCategory) return '';

    // Get the first 3 letters of the category (uppercase)
    const categoryPrefix = categories.find(cat => cat.uuid === selectedParentCategory).name.substring(0, 3).toUpperCase();
    
    // Get the first 3 letters of each word in the product name (uppercase)
    const nameWords = formData.name.split(' ');
    const namePrefix = nameWords
      .map(word => word.substring(0, 3).toUpperCase())
      .join('');
    
    // Add a random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    // Combine all parts
    return `${categoryPrefix}-${namePrefix}-${randomNum}`;
  }, [formData.name, selectedParentCategory, categories]);

  useEffect(() => {
    // Generate SKU when name or category changes
    const updateSku = async () => {
      if (formData.name && selectedParentCategory) {
        const newSku = await generateSku();
        setFormData(prev => ({ ...prev, sku: newSku }));
      }
    };
    updateSku();
  }, [formData.name, selectedParentCategory, generateSku]);

  const prepareFormData = async () => {
    const formDataToSubmit = new FormData();
    
    // Calculate total quantity from variations or use overall quantity
    let totalQuantity = Number(formData.quantity) || 0;
    let minPrice = Number(formData.price);
    let maxPrice = Number(formData.price);

    if (variations.some(v => v.options && v.options.length > 0)) {
      totalQuantity = variations.reduce((total, variation) => {
        if (!variation.options || !variation.has_individual_stock) return total;
        return total + variation.options.reduce((sum, opt) => sum + (Number(opt.quantity) || 0), 0);
      }, 0);

      // Calculate price range from variations
      variations.forEach(variation => {
        variation.options.forEach(option => {
          const optionPrice = Number(option.price) || Number(formData.price);
          minPrice = Math.min(minPrice, optionPrice);
          maxPrice = Math.max(maxPrice, optionPrice);
        });
      });
    }

    // Add basic product information
    formDataToSubmit.append('name', formData.name);
    formDataToSubmit.append('description', formData.description);
    formDataToSubmit.append('price', minPrice.toString());
    // Only append compare_at_price if it has a valid value
    if (formData.compare_at_price && formData.compare_at_price !== 'undefined' && formData.compare_at_price !== '') {
        formDataToSubmit.append('compare_at_price', formData.compare_at_price.toString());
    }
    formDataToSubmit.append('category_uuid', formData.category_uuid);
    formDataToSubmit.append('sku', formData.sku);
    formDataToSubmit.append('quantity', totalQuantity.toString());

    // Optional fields
    if (formData.brand) formDataToSubmit.append('brand', formData.brand);
    if (formData.tags) formDataToSubmit.append('tags', formData.tags);
    if (formData.meta_title) formDataToSubmit.append('meta_title', formData.meta_title);
    if (formData.meta_description) formDataToSubmit.append('meta_description', formData.meta_description);

    // Add shipping information
    formDataToSubmit.append('shipping_length', formData.shipping_length);
    formDataToSubmit.append('shipping_width', formData.shipping_width);
    formDataToSubmit.append('shipping_height', formData.shipping_height);
    formDataToSubmit.append('shipping_weight', formData.shipping_weight);
    formDataToSubmit.append('shipping_provider_uuid', formData.shipping_provider_uuid);
    formDataToSubmit.append('shipping_rate_uuid', formData.shipping_rate_uuid);
    formDataToSubmit.append('shipping_fee', formData.shipping_fee);

    // Add shipping provider details
    if (selectedProvider) {
      formDataToSubmit.append('shipping_provider_details', JSON.stringify({
        provider_uuid: selectedProvider.provider_uuid,
        name: selectedProvider.name,
        logo_url: selectedProvider.logo_url
      }));
    }

    // Add shipping rate details
    const selectedRate = shippingRates.find(rate => rate.rate_uuid === formData.shipping_rate_uuid);
    if (selectedRate) {
      formDataToSubmit.append('shipping_rate_details', JSON.stringify({
        rate_uuid: selectedRate.rate_uuid,
        name: selectedRate.name,
        base_rate: selectedRate.base_rate,
        weight_rate: selectedRate.weight_rate
      }));
    }

    // Add specifications if any
    if (specifications.length > 0) {
      const validSpecs = specifications.filter(spec => spec.key && spec.value);
      if (validSpecs.length > 0) {
        formDataToSubmit.append('specifications', JSON.stringify(validSpecs));
      }
    }

    // Add variations if any
    if (variations.length > 0) {
      const processedVariations = variations
        .filter(v => v.name && v.options && v.options.length > 0)
        .map(variation => {
          // Calculate variation level price (max of option prices)
          const variationPrice = variation.options.reduce((max, opt) => {
            const optPrice = Number(opt.price) || Number(formData.price);
            return Math.max(max, optPrice);
          }, 0);

          return {
            name: variation.name,
            has_individual_stock: variation.has_individual_stock,
            price: variationPrice,
            quantity: variation.options.reduce((sum, opt) => sum + (Number(opt.quantity) || 0), 0),
            options: variation.options.map(option => ({
              name: variation.name,
              value: option.value,
              price: Number(option.price) || Number(formData.price),
              stock: variation.has_individual_stock ? Number(option.quantity) || 0 : Math.floor(totalQuantity / variation.options.length),
              low_stock_alert: Number(option.low_stock_alert) || 5,
              sku: option.sku || `${formData.sku}-${option.value.toUpperCase()}`
            }))
          };
        });

      if (processedVariations.length > 0) {
        formDataToSubmit.append('variations', JSON.stringify(processedVariations));
      }
    }

    // Add images
    if (images.length > 0) {
      formDataToSubmit.append('main_image', images[0]);
      for (let i = 1; i < images.length; i++) {
        formDataToSubmit.append(`additional_image_${i}`, images[i]);
      }
    }

    return formDataToSubmit;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formDataToSubmit = await prepareFormData();
      
      // Debug log
      console.log('Submitting product with shipping details:', {
        provider_uuid: formData.shipping_provider_uuid,
        rate_uuid: formData.shipping_rate_uuid,
        fee: formData.shipping_fee
      });

      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/shops/${shopUuid}/products`,
        {
          method: 'POST',
          credentials: 'include',
          body: formDataToSubmit
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const result = await response.json();
      
      if (result.product_uuid) {
        toast.success('Product created successfully');
        navigate(`/seller/seller-center/products/listings`);
      } else {
        throw new Error('Product UUID not returned from server');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProviderChange = async (providerUuid) => {
    setFormData(prev => ({ ...prev, shipping_provider_uuid: providerUuid }));
    
    // Find the selected provider
    const provider = shippingProviders.find(p => p.provider_uuid === providerUuid);
    setSelectedProvider(provider);
    
    // Reset shipping rate and fee when provider changes
    setFormData(prev => ({ ...prev, shipping_rate_uuid: '', shipping_fee: '' }));
    setCalculatedShippingFee(null);
  };

  const handleRateChange = async (rateUuid) => {
    setFormData(prev => ({ ...prev, shipping_rate_uuid: rateUuid }));
    
    // Calculate shipping fee if weight is available
    if (formData.shipping_weight) {
      try {
        const response = await fetch(`http://localhost:5555/shipping/calculate/${rateUuid}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            weight: parseFloat(formData.shipping_weight)
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to calculate shipping fee');
        }

        const data = await response.json();
        setCalculatedShippingFee(data.shipping_fee);
        setFormData(prev => ({ ...prev, shipping_fee: data.shipping_fee }));
      } catch (error) {
        console.error('Error calculating shipping fee:', error);
        toast.error(error.message || 'Failed to calculate shipping fee');
      }
    }
  };

  // Add a useEffect to watch for weight changes
  useEffect(() => {
    // Recalculate shipping fee when weight changes
    if (formData.shipping_weight && formData.shipping_rate_uuid) {
      handleRateChange(formData.shipping_rate_uuid);
    }
  }, [formData.shipping_weight]); // Add handleRateChange to dependencies if needed

  const handleBulkUploadSuccess = (data) => {
    toast.success(`Successfully uploaded ${data.products_created} products`);
    // Optionally navigate to products list
    navigate(`/seller/seller-center/products/listings`);
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6">
      {/* Add Bulk Upload Button */}
      <div className="flex justify-end mb-6">
        <Button
          variant="outline"
          onClick={() => setShowBulkUpload(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Bulk Upload Products
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Side Steps - Converts to top navigation on mobile */}
        <div className="w-full lg:w-64 lg:shrink-0 order-2 lg:order-1">
          <Card className="p-4 lg:sticky lg:top-6">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
              {steps.map((step) => (
                <Button
                  key={step.id}
                  variant={currentStep === step.id ? "default" : "ghost"}
                  className="flex-1 lg:flex-none justify-start whitespace-nowrap"
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                        currentStep === step.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {step.id}
                    </div>
                    <span>{step.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 order-1 lg:order-2">
          <Card className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information Step */}
              {currentStep === 1 && (
                <BasicInformationStep
                  images={images}
                  imageUrls={imageUrls}
                  formData={formData}
                  specifications={specifications}
                  categories={categories}
                  selectedParentCategory={selectedParentCategory}
                  subcategories={subcategories}
                  onImageDelete={handleImageDelete}
                  onImageUpload={handleImageUpload}
                  onInputChange={handleInputChange}
                  onSpecificationChange={handleSpecificationChange}
                  onCategoryChange={handleCategoryChange}
                  onParentCategoryChange={handleParentCategoryChange}
                  onAddSpecification={handleAddSpecification}
                  onRemoveSpecification={handleRemoveSpecification}
                />
              )}

              {/* Sales Information Step */}
              {currentStep === 2 && (
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
                  onVariationStockChange={handleVariationStockChange}
                  onToggleStockType={handleToggleStockType}
                />
              )}

              {/* Shipping Step */}
              {currentStep === 3 && (
                <ShippingStep
                  formData={formData}
                  onInputChange={handleInputChange}
                  shippingProviders={shippingProviders}
                  shippingRates={shippingRates}
                  selectedProvider={selectedProvider}
                  calculatedShippingFee={calculatedShippingFee}
                  onProviderChange={handleProviderChange}
                  onRateChange={handleRateChange}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (validateStep(currentStep)) {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    {submitting ? "Creating..." : "Create Product"}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Bulk Upload Dialog */}
      <BulkUploadDialog
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        shopUuid={shopUuid}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  )
}

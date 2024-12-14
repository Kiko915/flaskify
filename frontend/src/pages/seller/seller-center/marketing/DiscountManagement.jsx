import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { format, parseISO, formatISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DiscountManagement = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Initialize form with empty values
  const getInitialFormState = () => ({
    discount_name: '',
    discount_percentage: '',
    start_date: '',
    end_date: ''
  });
  
  const [formData, setFormData] = useState(getInitialFormState());
  const [activeDiscounts, setActiveDiscounts] = useState({ active: [], pending: [] });
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const cleanupExpiredDiscounts = async () => {
    if (!user?.seller?.seller_id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/discounts/cleanup`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Cleaned up ${result.products_cleaned} expired discounts`);
        // Refresh the discounts list
        fetchActiveDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to clean up expired discounts');
      }
    } catch (error) {
      console.error('Error cleaning up discounts:', error);
      toast.error('Failed to clean up expired discounts');
    } finally {
      setLoading(false);
    }
  };

  // Reset form helper
  const resetForm = () => {
    setFormData(getInitialFormState());
  };

  useEffect(() => {
    // Check if user is a seller and has seller information
    if (!user || !user.seller || !user.seller.seller_id) {
      toast.error('Seller information not found');
      navigate('/seller/register');
      return;
    }

    fetchProducts(1);
    fetchActiveDiscounts();
  }, [user]);

  // Fetch products that can be discounted
  const fetchProducts = async (page = 1) => {
    if (!user?.seller?.seller_id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/products/discountable?page=${page}&search=${searchTerm}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.status === 401) {
        // Redirect to login if unauthorized
        const data = await response.json();
        toast.error(data.message || 'Please login to continue');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products);
      setPagination({
        currentPage: data.current_page,
        totalPages: data.pages,
        totalProducts: data.total
      });
    } catch (error) {
      toast.error('Error fetching products');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active discounts
  const fetchActiveDiscounts = async () => {
    if (!user?.seller?.seller_id) return;

    try {
      console.log('Fetching discounts...');
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/discounts/active`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
      if (response.status === 401) {
        // Redirect to login if unauthorized
        const data = await response.json();
        toast.error(data.message || 'Please login to continue');
        navigate('/login', { state: { from: location.pathname } });
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch discounts');
      const data = await response.json();
      console.log('Discounts received:', data);
      setActiveDiscounts(data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error('Error fetching discounts');
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (!user?.seller?.seller_id) return;

    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Log the input value for debugging
    if (name === 'start_date' || name === 'end_date') {
      console.log(`${name} input value:`, value);
      const date = new Date(value);
      console.log(`${name} parsed as:`, date.toLocaleString());
    }
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.product_uuid));
    }
  };

  const calculateDiscountedPrice = (price) => {
    if (!formData.discount_percentage) return price;
    const discount = parseFloat(formData.discount_percentage);
    if (isNaN(discount)) return price;
    return price * (1 - discount / 100);
  };

  // Helper function to format date for datetime-local input
  const formatDateForInput = (date) => {
    const d = new Date(date);
    // Adjust for local timezone
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset * 60000));
    return adjustedDate.toISOString().slice(0, 16);
  };

  const handleEditDiscount = (discount) => {
    setEditingDiscount(discount);
    setIsEditMode(true);
    // Convert UTC dates back to local time for form
    const startDate = convertToManilaTime(discount.start_date);
    const endDate = convertToManilaTime(discount.end_date);
    setFormData({
      discount_name: discount.discount_name,
      discount_percentage: discount.discount_percentage.toString(),
      start_date: formatDateForInput(startDate),
      end_date: formatDateForInput(endDate)
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingDiscount(null);
    resetForm();
  };

  const handleDeleteDiscount = async (discount) => {
    if (!user?.seller?.seller_id) return;
    
    if (!window.confirm(`Are you sure you want to delete the discount "${discount.discount_name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5555/seller/${user.seller.seller_id}/discounts/${encodeURIComponent(discount.discount_name)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success('Discount deleted successfully');
      fetchActiveDiscounts();
      fetchProducts(1);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.seller?.seller_id) {
      toast.error('Seller information not found');
      return;
    }

    if (!isEditMode && selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      setLoading(true);
      
      // Create dates and ensure they're in local time
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      // Log the dates for debugging
      console.log('Original input dates:');
      console.log('Start date (local):', startDate.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
      console.log('End date (local):', endDate.toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
      
      // Convert to UTC
      const startUTC = new Date(startDate);
      const endUTC = new Date(endDate);
      
      console.log('Converted to UTC:');
      console.log('Start date (UTC):', startUTC.toISOString());
      console.log('End date (UTC):', endUTC.toISOString());

      if (isEditMode) {
        // Update existing discount
        const response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/discounts/${encodeURIComponent(editingDiscount.discount_name)}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              discount_name: formData.discount_name,
              discount_percentage: parseFloat(formData.discount_percentage),
              start_date: startUTC.toISOString(),
              end_date: endUTC.toISOString()
            })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        toast.success('Discount updated successfully');
        setIsEditMode(false);
        setEditingDiscount(null);
      } else {
        // Create new discount
        const response = await fetch(
          `http://localhost:5555/seller/${user.seller.seller_id}/discounts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              ...formData,
              discount_percentage: parseFloat(formData.discount_percentage),
              product_ids: selectedProducts,
              start_date: startUTC.toISOString(),
              end_date: endUTC.toISOString()
            })
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }

        toast.success('Discount created successfully');
        setSelectedProducts([]);
      }

      // Reset form and refresh data
      resetForm();
      fetchProducts(1);
      fetchActiveDiscounts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProducts = (discount) => {
    setSelectedDiscount(discount);
    setIsModalOpen(true);
  };

  // Helper function to convert UTC to Manila time
  const convertToManilaTime = (utcDateString) => {
    const date = new Date(utcDateString);
    // Get the local timezone offset and adjust for Manila time (+8)
    const offset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() + offset + (8 * 60));
    return date;
  };

  const DiscountableProductsTable = ({ products, selectedProducts, onProductSelect }) => {
    const calculateDisplayPrice = (product) => {
      const now = new Date();
      const startDate = product.discount_start_date ? new Date(product.discount_start_date) : null;
      const endDate = product.discount_end_date ? new Date(product.discount_end_date) : null;
      
      // Only show discounted price if discount is currently active
      if (startDate && endDate && now >= startDate && now <= endDate) {
        return product.price;
      }
      // Otherwise show the original price
      return product.compare_at_price || product.price;
    };

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const allProductIds = products.map(product => product.product_uuid);
                    onProductSelect(isChecked ? allProductIds : []);
                  }}
                  checked={selectedProducts.length === products.length && products.length > 0}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discounted Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => {
              const isDiscountActive = product.discount_start_date && 
                product.discount_end_date && 
                new Date() >= new Date(product.discount_start_date) && 
                new Date() <= new Date(product.discount_end_date);

              return (
                <tr key={product.product_uuid}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.product_uuid)}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onProductSelect(
                          isChecked
                            ? [...selectedProducts, product.product_uuid]
                            : selectedProducts.filter(id => id !== product.product_uuid)
                        );
                      }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₱{product.compare_at_price || product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isDiscountActive ? (
                      <span className="text-red-600">₱{product.price}</span>
                    ) : (
                      <span className="text-gray-500">₱{product.compare_at_price || product.price}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Discount Management</h1>
        <div className="flex gap-4">
          <button
            onClick={cleanupExpiredDiscounts}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clean Up Expired Discounts
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#062a51] rounded-md hover:bg-[#062a51]/90"
          >
            Create Discount
          </button>
        </div>
      </div>

      {/* Create/Edit Discount Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          {isEditMode ? 'Edit Discount' : 'Create New Discount'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Name</label>
              <input
                type="text"
                name="discount_name"
                value={formData.discount_name}
                onChange={handleInputChange}
                maxLength={50}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#062a51] focus:outline-none focus:ring-1 focus:ring-[#062a51]"
                placeholder="e.g., Holiday Sale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  name="discount_percentage"
                  value={formData.discount_percentage}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  required
                  className="block w-full rounded-md border border-gray-300 pl-3 pr-12 py-2 focus:border-[#062a51] focus:outline-none focus:ring-1 focus:ring-[#062a51]"
                  placeholder="20"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                step="60"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#062a51] focus:outline-none focus:ring-1 focus:ring-[#062a51]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                step="60"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#062a51] focus:outline-none focus:ring-1 focus:ring-[#062a51]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {isEditMode && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isEditMode ? 'Update Discount' : 'Create Discount'}
            </button>
          </div>
        </form>
      </div>

      {/* Product Selection - Only show when not in edit mode */}
      {!isEditMode && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Select Products</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#062a51] focus:outline-none focus:ring-1 focus:ring-[#062a51]"
              />
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-[#062a51] bg-[#062a51]/10 rounded-md hover:bg-[#062a51]/20"
              >
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="mt-4">
            <DiscountableProductsTable
              products={products}
              selectedProducts={selectedProducts}
              onProductSelect={setSelectedProducts}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {[...Array(pagination.totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => fetchProducts(index + 1)}
                    className={`px-3 py-1 rounded ${
                      pagination.currentPage === index + 1
                        ? 'bg-[#062a51] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Discounts */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Active Discounts</h2>
        <div className="space-y-4">
          {activeDiscounts.active.map((discount, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{discount.discount_name}</h3>
                  <p className="text-sm text-gray-500">
                    {discount.discount_percentage}% OFF • 
                    {format(convertToManilaTime(discount.start_date), 'MMM d, yyyy h:mm a')} - 
                    {format(convertToManilaTime(discount.end_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Active
                  </span>
                  <button
                    onClick={() => handleEditDiscount(discount)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDiscount(discount)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => handleViewProducts(discount)}
                  className="text-sm text-gray-600 hover:text-[#062a51] hover:underline"
                >
                  {discount.products.length} products
                </button>
              </div>
            </div>
          ))}
          {activeDiscounts.active.length === 0 && (
            <p className="text-gray-500 text-center py-4">No active discounts</p>
          )}
        </div>
      </div>

      {/* Pending Discounts */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Discounts</h2>
        <div className="space-y-4">
          {activeDiscounts.pending.map((discount, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{discount.discount_name}</h3>
                  <p className="text-sm text-gray-500">
                    {discount.discount_percentage}% OFF • 
                    {format(convertToManilaTime(discount.start_date), 'MMM d, yyyy h:mm a')} - 
                    {format(convertToManilaTime(discount.end_date), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                    Pending
                  </span>
                  <button
                    onClick={() => handleEditDiscount(discount)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDiscount(discount)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => handleViewProducts(discount)}
                  className="text-sm text-gray-600 hover:text-[#062a51] hover:underline"
                >
                  {discount.products.length} products
                </button>
              </div>
            </div>
          ))}
          {activeDiscounts.pending.length === 0 && (
            <p className="text-gray-500 text-center py-4">No pending discounts</p>
          )}
        </div>
      </div>

      {/* Products Modal */}
      {isModalOpen && selectedDiscount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedDiscount.discount_name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedDiscount.discount_percentage}% OFF
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discounted Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedDiscount.products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">₱{product.original_price.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600">₱{product.discounted_price.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement; 
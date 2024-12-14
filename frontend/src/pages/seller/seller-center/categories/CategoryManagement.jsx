import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import toast from 'react-hot-toast';

const CategoryManagement = () => {
  // Initialize categories as an empty array
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bulkCategories, setBulkCategories] = useState([{
    parent: {
      name: '',
      description: '',
      is_active: true
    },
    children: [{
      name: '',
      description: '',
      is_active: true
    }]
  }]);
  const [filters, setFilters] = useState({
    search: '',
    is_active: 'all',
    type: 'all'
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
    is_active: true,
    image: null
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    dateRange: 'all', // all, today, week, month
    sortBy: 'name', // name, date, subcategories
    sortOrder: 'asc' // asc, desc
  });

  // Add debounce function for search
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Add this helper function at the top of the component
  const getParentCategoryName = (parentId) => {
    const parent = categories.find(c => c.id === parentId || c.uuid === parentId);
    return parent ? parent.name : 'Unknown';
  };

  // Add this helper function to flatten the category hierarchy
  const flattenCategories = (category, parentId = null) => {
    const flatCategory = {
      ...category,
      parent_id: parentId
    };
    
    const subcategories = category.subcategories || [];
    return [
      flatCategory,
      ...subcategories.flatMap(sub => flattenCategories(sub, category.uuid))
    ];
  };

  // Modify the organizeCategories function to ensure unique categories
  const organizeCategories = (categories) => {
    // Create a Map to store unique categories by UUID
    const uniqueCategories = new Map();
    categories.forEach(cat => uniqueCategories.set(cat.uuid, cat));
    
    const categoriesArray = Array.from(uniqueCategories.values());
    const parentCategories = categoriesArray.filter(cat => !cat.parent_id);
    const childCategories = categoriesArray.filter(cat => cat.parent_id);
    
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent_id === parent.uuid) || []
    }));
  };

  useEffect(() => {
    fetchCategories();
  }, [filters]); // Re-fetch when filters change

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.is_active && filters.is_active !== 'all') {
        const isActiveValue = filters.is_active === 'active' ? 'true' : 'false';
        queryParams.append('is_active', isActiveValue);
      }
      if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);

      const url = `http://localhost:5555/categories?${queryParams.toString()}`;
      console.log('Fetching categories with URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      console.log('Fetched categories:', data);
      
      // Handle both array and single object responses
      const categoriesArray = Array.isArray(data) ? data : [data];
      
      // Flatten the category hierarchy if needed
      const flattenedCategories = categoriesArray.flatMap(cat => flattenCategories(cat));
      console.log('Flattened categories:', flattenedCategories);
      
      setCategories(flattenedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories. Please try again later.');
      toast.error('Failed to fetch categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Add handler for filter changes
  const handleFilterChange = debounce((name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  }, 300);

  const handleOpenDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || '',
        is_active: category.is_active,
        image: null
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        parent_id: '',
        is_active: true,
        image: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCategory(null);
  };

  // Add these helper functions at the top of the component, after the imports
  const generateCategoryId = (type, existingCategories) => {
    const getNextNumber = (prefix) => {
      const existing = existingCategories
        .filter(cat => cat.uuid.startsWith(prefix))
        .map(cat => {
          const num = parseInt(cat.uuid.split('-').pop());
          return isNaN(num) ? 0 : num;
        });
      
      const maxNum = Math.max(0, ...existing);
      return String(maxNum + 1).padStart(2, '0');
    };

    switch (type) {
      case 'parent':
        return `main-cat-${getNextNumber('main-cat-')}`;
      case 'sub': {
        // For single subcategory creation, use parent number and next available sub number
        const parentNum = getNextNumber('main-cat-');
        const subNum = getNextNumber(`sub-cat-${parentNum}-`);
        return `sub-cat-${parentNum}-${subNum}`;
      }
      default:
        return `item-1-${getNextNumber('item-1-')}`;
    }
  };

  // Modify the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedCategory 
        ? `http://localhost:5555/admin/categories/${selectedCategory.uuid}`
        : 'http://localhost:5555/admin/categories';

      // Generate custom ID for new categories
      const customId = !selectedCategory ? generateCategoryId(
        formData.parent_id ? 'sub' : 'parent',
        categories
      ) : undefined;

      // Create FormData object for multipart/form-data
      const formDataObj = new FormData();
      
      // Add custom ID for new categories
      if (customId) {
        formDataObj.append('uuid', customId);
      }
      
      // Handle other form data
      Object.keys(formData).forEach(key => {
        if (key === 'parent_id') {
          // Only append parent_id if it has a valid value
          if (formData[key] && formData[key] !== 'none') {
            formDataObj.append(key, formData[key]);
          } else {
            formDataObj.append(key, 'null');  // Send 'null' string for empty parent_id
          }
        } else if (key === 'is_active') {
          formDataObj.append(key, formData[key] ? '1' : '0');
        } else if (key === 'image' && formData[key]) {
          formDataObj.append('image', formData[key]);
        } else if (key !== 'image' && formData[key] !== undefined && formData[key] !== null) {
          formDataObj.append(key, formData[key]);
        }
      });

      // Log the form data being sent
      for (let pair of formDataObj.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // Get access token from cookie
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('access_token_cookie='))
        ?.split('=')[1];

      const response = await fetch(url, {
        method: selectedCategory ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: formDataObj
      });

      let responseData;
      try {
        responseData = await response.json();
        console.log('Server response:', responseData);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        throw new Error(responseData.message || 'Failed to save category');
      }

      toast.success(selectedCategory ? 'Category updated successfully' : 'Category created successfully');
      await fetchCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This will also delete all its subcategories.')) {
      try {
        console.log('Attempting to delete category:', categoryId);
        
        // Get access token from cookie
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('access_token_cookie='))
          ?.split('=')[1];

        // First, try to fetch the category to check if it has subcategories
        const category = categories.find(c => c.uuid === categoryId);
        if (!category) {
          throw new Error('Category not found');
        }

        const deleteUrl = `http://localhost:5555/admin/categories/${categoryId}`;
        console.log('Delete URL:', deleteUrl);

        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${accessToken || ''}`,
            'Content-Type': 'application/json'
          },
          // Send empty body to satisfy backend requirements
          body: JSON.stringify({})
        });
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = null;
        }
        console.log('Delete response:', response.status, responseData);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = '/login';
            return;
          }
          throw new Error(responseData?.message || 'Failed to delete category');
        }

        toast.success('Category deleted successfully');
        await fetchCategories(); // Refresh the categories list
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error(error.message || 'Failed to delete category');
      }
    }
  };

  // Modify the handleBulkUpload function
  const handleBulkUpload = async () => {
    // Validate inputs
    for (const category of bulkCategories) {
      if (!category.parent.name.trim()) {
        toast.error('Parent category name is required');
        return;
      }
      for (const child of category.children) {
        if (!child.name.trim()) {
          toast.error('Child category name is required');
          return;
        }
      }
    }

    try {
      // Transform the bulk categories data to include custom IDs
      const transformedCategories = bulkCategories.map((categoryGroup, parentIndex) => {
        const parentId = generateCategoryId('parent', categories);
        
        return {
          parent: {
            ...categoryGroup.parent,
            uuid: parentId
          },
          children: categoryGroup.children.map((child, childIndex) => {
            // Generate unique subcategory ID using parent ID and child index
            return {
              ...child,
              uuid: `sub-cat-${parentId.split('-').pop()}-${String(childIndex + 1).padStart(2, '0')}`,
              parent_id: parentId
            };
          })
        };
      });

      const response = await fetch('http://localhost:5555/admin/categories/bulk-create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: transformedCategories })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create categories');
      }

      toast.success('Categories created successfully');
      setOpenBulkUploadDialog(false);
      setBulkCategories([{
        parent: { name: '', description: '', is_active: true },
        children: [{ name: '', description: '', is_active: true }]
      }]);
      fetchCategories(); // Refresh the categories list
    } catch (error) {
      console.error('Error creating categories:', error);
      toast.error(error.message || 'Failed to create categories');
    }
  };

  const addParentCategory = () => {
    setBulkCategories(prev => [...prev, {
      parent: { name: '', description: '', is_active: true },
      children: [{ name: '', description: '', is_active: true }]
    }]);
  };

  const addChildCategory = (parentIndex) => {
    setBulkCategories(prev => {
      const newCategories = [...prev];
      newCategories[parentIndex].children.push({
        name: '',
        description: '',
        is_active: true
      });
      return newCategories;
    });
  };

  const removeParentCategory = (parentIndex) => {
    setBulkCategories(prev => prev.filter((_, index) => index !== parentIndex));
  };

  const removeChildCategory = (parentIndex, childIndex) => {
    setBulkCategories(prev => {
      const newCategories = [...prev];
      newCategories[parentIndex].children = newCategories[parentIndex].children.filter((_, index) => index !== childIndex);
      return newCategories;
    });
  };

  const handleParentChange = (parentIndex, field, value) => {
    setBulkCategories(prev => {
      const newCategories = [...prev];
      newCategories[parentIndex].parent[field] = value;
      return newCategories;
    });
  };

  const handleChildChange = (parentIndex, childIndex, field, value) => {
    setBulkCategories(prev => {
      const newCategories = [...prev];
      newCategories[parentIndex].children[childIndex][field] = value;
      return newCategories;
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (checked) => {
    setFormData({ ...formData, is_active: checked });
  };

  // Add these helper functions at the top of the component
  const searchCategories = (categories, searchTerm) => {
    if (!searchTerm) return categories;
    
    searchTerm = searchTerm.toLowerCase();
    
    return categories.filter(category => {
      // Search in category name and description
      const nameMatch = category.name.toLowerCase().includes(searchTerm);
      const descriptionMatch = category.description?.toLowerCase().includes(searchTerm);
      
      // Search in attributes
      const attributeMatch = (category.attributes || []).some(attr => 
        attr.name.toLowerCase().includes(searchTerm)
      );
      
      // If this is a parent category, also search in subcategories
      const subcategoryMatch = (category.subcategories || []).some(sub => 
        sub.name.toLowerCase().includes(searchTerm) || 
        sub.description?.toLowerCase().includes(searchTerm)
      );
      
      return nameMatch || descriptionMatch || attributeMatch || subcategoryMatch;
    });
  };

  // Modify the filterAndSortCategories function
  const filterAndSortCategories = (categories) => {
    // Create a Map to store unique categories by UUID
    const uniqueCategories = new Map();
    categories.forEach(cat => uniqueCategories.set(cat.uuid, cat));
    let allCategories = Array.from(uniqueCategories.values());
    
    // Get only main categories (those with uuid starting with 'main-cat-')
    let mainCategories = allCategories.filter(cat => cat.uuid.startsWith('main-cat-'));
    
    // Get all subcategories
    const subCategories = allCategories.filter(cat => cat.uuid.startsWith('sub-cat-'));
    
    // Apply search filter if needed
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      mainCategories = mainCategories.filter(category => {
        const nameMatch = category.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = category.description?.toLowerCase().includes(searchTerm);
        return nameMatch || descriptionMatch;
      });
    }
    
    // Apply status filter
    if (filters.is_active !== 'all') {
      const isActive = filters.is_active === 'active';
      mainCategories = mainCategories.filter(cat => cat.is_active === isActive);
    }
    
    // Apply type filter
    if (filters.type === 'sub') {
      return subCategories.map(cat => ({
        ...cat,
        subcategories: []
      }));
    } else if (filters.type === 'parent') {
      return mainCategories.map(cat => ({
        ...cat,
        subcategories: []
      }));
    }
    
    // Apply sorting
    mainCategories.sort((a, b) => {
      switch (advancedFilters.sortBy) {
        case 'name':
          return advancedFilters.sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'date':
          return advancedFilters.sortOrder === 'asc'
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        case 'subcategories':
          const aCount = (a.subcategories || []).length;
          const bCount = (b.subcategories || []).length;
          return advancedFilters.sortOrder === 'asc'
            ? aCount - bCount
            : bCount - aCount;
        default:
          return 0;
      }
    });
    
    return mainCategories;
  };

  // Add this JSX for advanced filters above the categories list
  const renderAdvancedFilters = () => (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-wrap gap-4">
        <div className="w-48">
          <Label>Date Range</Label>
          <Select
            value={advancedFilters.dateRange}
            onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, dateRange: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-48">
          <Label>Sort By</Label>
          <Select
            value={advancedFilters.sortBy}
            onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="date">Date Created</SelectItem>
              <SelectItem value="subcategories">Subcategories Count</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-48">
          <Label>Sort Order</Label>
          <Select
            value={advancedFilters.sortOrder}
            onValueChange={(value) => setAdvancedFilters(prev => ({ ...prev, sortOrder: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Add image handling function
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  console.log('Current categories state:', categories);
  const filteredAndSortedCategories = filterAndSortCategories(categories);
  console.log('Filtered and sorted categories:', filteredAndSortedCategories);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <div className="space-x-2">
          <Button onClick={() => handleOpenDialog()} variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => setOpenBulkUploadDialog(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Add filter controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search categories..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div className="w-48">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.is_active}
              onValueChange={(value) => handleFilterChange('is_active', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Label htmlFor="type">Category Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="parent">Parent Categories</SelectItem>
                <SelectItem value="sub">Subcategories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-center">
            <p className="text-lg font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No categories found</p>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Category
          </Button>
        </div>
      ) : (
        <>
          {renderAdvancedFilters()}
          <div className="grid grid-cols-1 gap-6">
            {filteredAndSortedCategories.map((parentCategory) => (
              <div 
                key={`parent-${parentCategory.uuid}`}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Parent Category Header */}
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {parentCategory.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {parentCategory.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDialog(parentCategory)}
                        className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(parentCategory.uuid)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <span>Status: {parentCategory.is_active ? 'Active' : 'Inactive'}</span>
                    <span className="mx-2">•</span>
                    <span>{(parentCategory.subcategories || []).length} Subcategories</span>
                  </div>
                </div>

                {/* Child Categories */}
                {parentCategory.subcategories && parentCategory.subcategories.length > 0 && (
                  <div className="divide-y">
                    {parentCategory.subcategories.map((childCategory) => (
                      <div 
                        key={`child-${childCategory.uuid}-${parentCategory.uuid}`}
                        className="p-4 pl-8 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-md font-medium text-gray-900">
                              {childCategory.name}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {childCategory.description || 'No description'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenDialog(childCategory)}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(childCategory.uuid)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Status: {childCategory.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {/* Bulk Upload Dialog */}
      <Dialog open={openBulkUploadDialog} onOpenChange={setOpenBulkUploadDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Create Categories</DialogTitle>
            <DialogDescription>
              Create multiple parent categories and their child categories at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {bulkCategories.map((category, parentIndex) => (
              <div key={parentIndex} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">Parent Category {parentIndex + 1}</h3>
                  {parentIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParentCategory(parentIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Parent Category Fields */}
                <div className="grid gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={category.parent.name}
                      onChange={(e) => handleParentChange(parentIndex, 'name', e.target.value)}
                      placeholder="Parent category name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={category.parent.description}
                      onChange={(e) => handleParentChange(parentIndex, 'description', e.target.value)}
                      placeholder="Parent category description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`parent-active-${parentIndex}`}
                      checked={category.parent.is_active}
                      onCheckedChange={(checked) => handleParentChange(parentIndex, 'is_active', checked)}
                    />
                    <Label htmlFor={`parent-active-${parentIndex}`}>Active</Label>
                  </div>
                </div>

                {/* Child Categories */}
                <div className="ml-6 space-y-4">
                  <h4 className="text-md font-medium">Child Categories</h4>
                  {category.children.map((child, childIndex) => (
                    <div key={childIndex} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-start">
                        <h5 className="text-sm font-medium">Child Category {childIndex + 1}</h5>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChildCategory(parentIndex, childIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={child.name}
                            onChange={(e) => handleChildChange(parentIndex, childIndex, 'name', e.target.value)}
                            placeholder="Child category name"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={child.description}
                            onChange={(e) => handleChildChange(parentIndex, childIndex, 'description', e.target.value)}
                            placeholder="Child category description"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`child-active-${parentIndex}-${childIndex}`}
                            checked={child.is_active}
                            onCheckedChange={(checked) => handleChildChange(parentIndex, childIndex, 'is_active', checked)}
                          />
                          <Label htmlFor={`child-active-${parentIndex}-${childIndex}`}>Active</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addChildCategory(parentIndex)}
                  >
                    Add Child Category
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addParentCategory}
              >
                Add Another Parent Category
              </Button>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpenBulkUploadDialog(false);
                    setBulkCategories([{
                      parent: { name: '', description: '', is_active: true },
                      children: [{ name: '', description: '', is_active: true }]
                    }]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkUpload}>
                  Create Categories
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={handleCloseDialog} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="parent_id">Parent Category</Label>
                <Select
                  value={formData.parent_id?.toString() || "none"}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.length > 0 && categories
                      .filter(c => {
                        console.log('Filtering category:', c);
                        return (!selectedCategory || c.uuid !== selectedCategory?.uuid);
                      })
                      .map(category => {
                        console.log('Mapping category for select:', category);
                        const value = category.uuid || category.id;
                        if (!value) {
                          console.warn('Category missing uuid/id:', category);
                          return null;
                        }
                        return (
                          <SelectItem key={value} value={value.toString()}>
                            {category.name || 'Unnamed Category'}
                          </SelectItem>
                        );
                      })
                      .filter(Boolean)
                    }
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image">Category Image</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {selectedCategory?.image_url && (
                  <div className="mt-2">
                    <img 
                      src={selectedCategory.image_url} 
                      alt="Current category image" 
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;

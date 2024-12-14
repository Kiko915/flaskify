import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ProductCard/ProductCard';

const CategoryPage = () => {
  const { categoryId, subcategoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });

  const sortOptions = [
    { id: 'popular', label: 'Popular' },
    { id: 'latest', label: 'Latest' },
    { id: 'topSales', label: 'Top Sales' },
    { id: 'priceAsc', label: 'Price: Low to High' },
    { id: 'priceDesc', label: 'Price: High to Low' }
  ];

  const fetchProducts = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        category_uuid: subcategoryId || categoryId,
        page: page,
        sort_by: sortBy,
        per_page: 20
      });

      if (priceRange.min) params.append('min_price', priceRange.min);
      if (priceRange.max) params.append('max_price', priceRange.max);
      if (selectedRating) params.append('rating', selectedRating);

      const response = await fetch(`http://localhost:5555/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data.products);
      setPagination({
        currentPage: data.current_page,
        totalPages: data.pages,
        totalProducts: data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch category details
        const categoryResponse = await fetch(`http://localhost:5555/categories/${categoryId}`);
        if (!categoryResponse.ok) {
          throw new Error('Category not found');
        }
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);

        // Fetch subcategories
        const subcategoriesResponse = await fetch(`http://localhost:5555/categories?type=sub&is_active=true`);
        if (subcategoriesResponse.ok) {
          const subcategoriesData = await subcategoriesResponse.json();
          // Filter subcategories that belong to this category based on ID pattern
          const relatedSubcategories = subcategoriesData.filter(sub => 
            sub.uuid.startsWith(`sub-cat-${categoryId.split('-')[2]}-`)
          );
          setSubcategories(relatedSubcategories);
        }

        // Fetch products
        await fetchProducts(1);

      } catch (err) {
        console.error('Error fetching category data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [categoryId, subcategoryId]);

  // Refetch products when filters change
  useEffect(() => {
    if (!loading) {
      fetchProducts(1);
    }
  }, [sortBy, selectedRating, categoryId, subcategoryId]);

  const handlePriceFilter = () => {
    fetchProducts(1);
  };

  const renderStars = (count) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={`text-lg ${index < count ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">Category Not Found</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/" className="text-[#062a51] hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="container mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link to="/" className="hover:text-[#062a51]">Home</Link>
          <ChevronRight size={16} />
          <Link to="/categories" className="hover:text-[#062a51]">Categories</Link>
          <ChevronRight size={16} />
          <Link 
            to={`/category/${categoryId}`} 
            className={`hover:text-[#062a51] ${!subcategoryId ? 'text-[#062a51] font-medium' : ''}`}
          >
            {category?.name}
          </Link>
          {subcategoryId && (
            <>
              <ChevronRight size={16} />
              <span className="text-[#062a51] font-medium">
                {subcategories.find(sub => sub.uuid === subcategoryId)?.name}
              </span>
            </>
          )}
        </div>

        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-[250px] flex-shrink-0 space-y-4">
            {/* Category Section */}
            <div className="bg-white rounded-lg shadow-sm">
              {/* Category Title */}
              <div className="p-4 border-b">
                <h2 className="font-medium text-lg">{category?.name}</h2>
              </div>

              {/* Subcategories List */}
              <div className="p-2">
                <Link
                  to={`/category/${categoryId}`}
                  className={`block py-2 px-3 rounded-md text-sm ${
                    !subcategoryId
                      ? 'text-[#062a51] font-medium bg-blue-50'
                      : 'text-gray-600 hover:text-[#062a51] hover:bg-gray-50'
                  }`}
                >
                  All {category?.name}
                </Link>
                {subcategories.map((sub) => (
                  <Link
                    key={sub.uuid}
                    to={`/category/${categoryId}/${sub.uuid}`}
                    className={`block py-2 px-3 rounded-md text-sm ${
                      subcategoryId === sub.uuid
                        ? 'text-[#062a51] font-medium bg-blue-50'
                        : 'text-gray-600 hover:text-[#062a51] hover:bg-gray-50'
                    }`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Filter Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="font-medium border-b pb-2 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                SEARCH FILTER
              </h2>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={handlePriceFilter}
                    className="w-full py-2 bg-[#062a51] text-white rounded-md hover:bg-[#083a6f] transition-colors text-sm"
                  >
                    APPLY
                  </button>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Rating</h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                      className={`w-full flex items-center gap-1 py-1.5 px-2 rounded-md text-sm ${
                        selectedRating === rating ? 'bg-blue-50 text-[#062a51]' : 'hover:bg-gray-50'
                      }`}
                    >
                      {renderStars(rating)}
                      {rating === 5 ? '' : '& Up'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => {
                  setPriceRange({ min: '', max: '' });
                  setSelectedRating(null);
                }}
                className="w-full py-2 border border-[#062a51] text-[#062a51] rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                CLEAR ALL
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">Sort By</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                      className="flex items-center gap-2 py-1.5 px-3 rounded-md hover:bg-gray-100"
                    >
                      {sortOptions.find(opt => opt.id === sortBy)?.label}
                      <ChevronDown size={16} />
                    </button>
                    {showSortDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                        {sortOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setSortBy(option.id);
                              setShowSortDropdown(false);
                            }}
                            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${
                              sortBy === option.id ? 'text-[#062a51] font-medium' : ''
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {pagination.totalProducts} Products
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <Link
                      key={product.product_uuid}
                      to={`/product/${product.product_uuid}`}
                    >
                      <ProductCard
                        variant="basic"
                        title={product.name}
                        price={product.price}
                        rating={4.5} // TODO: Implement actual rating system
                        reviews={null}
                        itemsSold={product.total_sales}
                        location={product.shop?.business_city ? `${product.shop.business_city}, ${product.shop.business_province}` : null}
                        shipping_fee={product.shipping_fee}
                        shipping_provider_details={product.shipping_provider}
                        shipping_rate_details={product.shipping_rate}
                        hasDiscount={product.compare_at_price > product.price}
                        discountPercentage={product.discount_percentage}
                        discountName={product.discount_name}
                        imageUrl={product.main_image}
                      />
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    {[...Array(pagination.totalPages)].map((_, index) => (
                      <button
                        key={index + 1}
                        onClick={() => fetchProducts(index + 1)}
                        className={`px-4 py-2 rounded-md ${
                          pagination.currentPage === index + 1
                            ? 'bg-[#062a51] text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-500">
                    There are currently no products available in this category. Please check back later or browse other categories.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage; 
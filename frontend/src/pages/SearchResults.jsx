import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../components/ProductCard/ProductCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Loader2, Tag, Filter, Star, ChevronRight, Package, Clock, MessageSquare } from "lucide-react";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sort') || 'relevance';
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedMinPrice, setAppliedMinPrice] = useState('');
  const [appliedMaxPrice, setAppliedMaxPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch search results
  const { data, isLoading, error } = useQuery({
    queryKey: ['searchResults', query, page, sortBy, appliedMinPrice, appliedMaxPrice, selectedRating, selectedCategory],
    queryFn: async () => {
      const response = await axios.get('/products/search', {
        params: {
          q: query,
          page,
          sort_by: sortBy,
          min_price: appliedMinPrice || undefined,
          max_price: appliedMaxPrice || undefined,
          rating: selectedRating,
          category: selectedCategory || undefined,
        },
      });
      return response.data;
    },
    enabled: !!query,
  });

  useEffect(() => {
    // Initialize input fields with URL params if they exist
    const urlMinPrice = searchParams.get('min_price');
    const urlMaxPrice = searchParams.get('max_price');
    if (urlMinPrice) {
      setMinPrice(urlMinPrice);
      setAppliedMinPrice(urlMinPrice);
    }
    if (urlMaxPrice) {
      setMaxPrice(urlMaxPrice);
      setAppliedMaxPrice(urlMaxPrice);
    }
  }, []);

  const handleSortChange = (value) => {
    searchParams.set('sort', value);
    setSearchParams(searchParams);
  };

  const handlePriceApply = () => {
    // Validate and apply price filter
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (min && max && min > max) {
      alert('Minimum price cannot be greater than maximum price');
      return;
    }
    // Set the applied price values
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    // Update URL params
    if (minPrice) searchParams.set('min_price', minPrice);
    else searchParams.delete('min_price');
    if (maxPrice) searchParams.set('max_price', maxPrice);
    else searchParams.delete('max_price');
    // Reset to page 1 when applying new filters
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleRatingClick = (rating) => {
    setSelectedRating(rating === selectedRating ? null : rating);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleClearAll = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedMinPrice('');
    setAppliedMaxPrice('');
    setSelectedRating(null);
    setSelectedCategory('');
    // Clear URL params
    searchParams.delete('min_price');
    searchParams.delete('max_price');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage) => {
    searchParams.set('page', newPage);
    setSearchParams(searchParams);
    window.scrollTo(0, 0);
  };

  const handleCategoryClick = (categoryUuid) => {
    setSelectedCategory(categoryUuid === selectedCategory ? '' : categoryUuid);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const renderStars = (count, filled = true) => {
    return Array(count)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          className={`w-4 h-4 ${
            filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ));
  };

  const renderShopStats = (icon, value, label) => (
    <div className="flex items-center gap-1 text-gray-600">
      {icon}
      <span className="text-[#ff424f] font-medium">{value}</span>
      <span className="text-sm">{label}</span>
    </div>
  );

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">
          Search Results for "{query}"
        </h1>
        {data && (
          <p className="text-gray-600">
            Found {data.total} products
          </p>
        )}

        {/* Related Shops Section */}
        {data?.related_shops && data.related_shops.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">
                SHOPS RELATED TO "{query.toUpperCase()}"
              </h2>
              <Link to="#" className="text-[#ff424f] hover:opacity-80 flex items-center gap-1">
                More Shops
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y">
              {data.related_shops.map((shop) => (
                <div key={shop.shop_uuid} className="p-4 flex items-center gap-4">
                  <img
                    src={shop.logo_url || '/assets/default-shop.png'}
                    alt={shop.business_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium mb-1">{shop.business_name}</h3>
                    <div className="text-sm text-gray-500 mb-2">
                      {shop.business_city}, {shop.business_province}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {renderShopStats(
                        <Package className="w-4 h-4" />,
                        shop.product_count,
                        "Products"
                      )}
                      {renderShopStats(
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />,
                        shop.rating,
                        "Rating"
                      )}
                      {renderShopStats(
                        <MessageSquare className="w-4 h-4" />,
                        `${shop.response_rate}%`,
                        "Response Rate"
                      )}
                      {renderShopStats(
                        <Clock className="w-4 h-4" />,
                        shop.response_time,
                        "Response Time"
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {shop.follower_count} Followers | {shop.following_count} Following
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-[#ff424f] text-[#ff424f] hover:bg-[#ff424f]/10"
                  >
                    View Shop
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Categories */}
        {data?.related_categories && data.related_categories.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-medium mb-2">Related Categories:</h2>
            <div className="flex flex-wrap gap-2">
              {data.related_categories.map((category) => (
                <button
                  key={category.uuid}
                  onClick={() => handleCategoryClick(category.uuid)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                    selectedCategory === category.uuid
                      ? 'bg-[#062a51] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  {category.parent_name ? `${category.parent_name} > ` : ''}{category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span className="font-medium">SEARCH FILTER</span>
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Price Range</h3>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <Button
                onClick={handlePriceApply}
                className="w-full text-white bg-[#062a51] hover:bg-[#062a51]/90"
              >
                APPLY
              </Button>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Rating</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingClick(rating)}
                    className={`w-full flex items-center gap-1 p-2 rounded ${
                      selectedRating === rating
                        ? 'bg-[#062a51]/10'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {renderStars(rating)}
                      {renderStars(5 - rating, false)}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">& Up</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All Button */}
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="w-full border-[#062a51] text-[#062a51] hover:bg-[#062a51]/10"
            >
              CLEAR ALL
            </Button>
          </div>
        </div>

        {/* Results section */}
        <div className="lg:col-span-3">
          {/* Sort dropdown */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="bestselling">Best Selling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results grid */}
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : data?.products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No products found</p>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="mt-4 text-[#062a51] hover:underline"
                >
                  Clear category filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.products.map((product) => (
                  <Link 
                    key={product.product_uuid}
                    to={`/product/${product.product_uuid}`}
                    className="no-underline"
                  >
                    <ProductCard
                      title={product.name}
                      price={product.price}
                      rating={product.rating}
                      imageUrl={product.main_image}
                      hasDiscount={product.discount_percentage !== null}
                      discountPercentage={product.discount_percentage}
                      location={`${product.shop.business_city}, ${product.shop.business_province}`}
                      itemsSold={product.total_sales}
                      variant="detailed"
                    />
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data?.pages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === data.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults; 
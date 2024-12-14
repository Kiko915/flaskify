import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('http://localhost:5555/featured');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
      // Use dummy data for now
      setProducts([
        {
          uuid: '1',
          name: 'Premium Wireless Headphones',
          price: 2999.99,
          compare_at_price: 3999.99,
          rating: 4.5,
          main_image: '/assets/products/headphones.jpg',
          total_sales: 1234
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-square"></div>
            <div className="space-y-2 mt-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#062a51]">Featured Products</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <Link
            key={product.product_uuid}
            to={`/product/${product.product_uuid}`}
          >
            <ProductCard
              title={product.name}
              price={product.price}
              rating={product.rating}
              itemsSold={product.total_sales}
              hasDiscount={product.compare_at_price > product.price}
              discountPercentage={
                product.compare_at_price 
                  ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                  : null
              }
              imageUrl={product.main_image}
              shipping_fee={product.shipping_fee}
              shipping_provider_details={product.shipping_provider_details}
              shipping_rate_details={product.shipping_rate_details}
              discountName={product.discount_name}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedProducts; 
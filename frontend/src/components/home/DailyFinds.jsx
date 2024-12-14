import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';

const DailyFinds = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 24,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    fetchDailyFinds();
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const totalSeconds = prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) {
          // Refresh products when timer ends
          fetchDailyFinds();
          return { hours: 24, minutes: 0, seconds: 0 };
        }
        return {
          hours: Math.floor(totalSeconds / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDailyFinds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5555/products/daily-finds');
      if (!response.ok) {
        throw new Error('Failed to fetch daily finds');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching daily finds:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#062a51]">Daily Finds</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg aspect-square"></div>
              <div className="space-y-2 mt-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center text-red-500">
          <p>Error loading daily finds. Please try again later.</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8">
        <div className="text-center text-gray-500">
          <p>No daily finds available at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-[#062a51]">Daily Finds</h2>
          <div className="flex items-center gap-2 bg-red-50 text-red-500 px-3 py-1 rounded-full">
            <Timer size={16} />
            <span className="font-medium">
              {String(timeLeft.hours).padStart(2, '0')}:
              {String(timeLeft.minutes).padStart(2, '0')}:
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
        <Link to="/daily-finds" className="text-[#062a51] hover:underline">
          View All
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Link
            key={product.product_uuid}
            to={`/product/${product.product_uuid}`}
          >
            <ProductCard
              variant="detailed"
              title={product.name}
              price={product.price}
              rating={product.rating}
              reviews={null}
              itemsSold={product.total_sales}
              location={`${product.shop.business_city}, ${product.shop.business_province}`}
              shipping_fee={product.shipping_fee}
              shipping_provider_details={product.shipping_provider_details}
              shipping_rate_details={product.shipping_rate_details}
              hasDiscount={true}
              discountPercentage={product.discount_percentage}
              discountName={product.discount_name}
              imageUrl={product.main_image}
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DailyFinds; 
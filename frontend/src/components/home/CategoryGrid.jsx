import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5555/categories?type=parent&is_active=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      
      // Filter to only include main categories (those with main-cat-xx pattern)
      const mainCategories = data.filter(category => category.uuid.startsWith('main-cat-'));
      setCategories(mainCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -800 : 800;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Add this component for image loading skeleton
  const ImageSkeleton = () => (
    <div className="w-[100px] h-[100px] bg-gray-200 rounded-lg animate-pulse" />
  );

  if (loading) {
    return (
      <div className="py-8 bg-gray-50 relative z-0">
        <div className="container mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-[#062a51] px-2">Categories</h2>
          <div className="grid grid-rows-2 auto-cols-[120px] grid-flow-col gap-4 overflow-hidden py-4">
            {[...Array(20)].map((_, index) => (
              <div key={index} className="animate-pulse w-[120px]">
                <div className="bg-gray-200 rounded-lg w-[120px] h-[120px]"></div>
                <div className="h-4 bg-gray-200 rounded mt-2 w-2/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gray-50 relative z-0">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-semibold text-[#062a51]">Categories</h2>
          <Link to="/categories" className="text-sm text-[#062a51] hover:underline">
            View All Categories
          </Link>
        </div>
        <div className="relative bg-gray-50">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-[1] bg-white p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-[1] bg-white p-2 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Categories Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="grid grid-rows-2 auto-cols-[120px] grid-flow-col gap-x-4 gap-y-6 overflow-x-auto scrollbar-hide scroll-smooth px-2 relative z-0"
          >
            {categories.map((category) => (
              <Link
                key={category.uuid}
                to={`/category/${category.uuid}`}
                className="group w-[120px]"
              >
                <div className="bg-white rounded-lg p-3 h-[160px] transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="w-[100px] h-[100px] mx-auto rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-2">
                    {category.image_url ? (
                      <div className="w-full h-full relative">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log(`Image load error for ${category.name}`);
                            e.target.style.display = 'none';
                            e.target.onerror = null;
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-3xl">📦</span>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-medium text-gray-700 group-hover:text-[#062a51] line-clamp-2">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryGrid; 
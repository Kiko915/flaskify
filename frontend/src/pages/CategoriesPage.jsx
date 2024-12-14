import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5555/categories?type=parent&is_active=true');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        const mainCategories = data.filter(cat => cat.uuid.startsWith('main-cat-'));
        setCategories(mainCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-40 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link to="/" className="hover:text-[#062a51]">Home</Link>
          <ChevronRight size={16} />
          <span className="text-[#062a51] font-medium">All Categories</span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-5 gap-6 mb-12">
          {categories.map((category) => (
            <Link
              key={category.uuid}
              to={`/category/${category.uuid}`}
              className="group"
            >
              <div className="bg-white rounded-lg p-4 h-[200px] transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col items-center justify-center">
                <div className="w-[120px] h-[120px] rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-4">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">📦</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-900 text-center group-hover:text-[#062a51]">
                  {category.name}
                </h3>
                {category.subcategories && category.subcategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {category.subcategories.length} subcategories
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Categories List with Subcategories */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8">Browse Categories</h2>
          <div className="grid grid-cols-4 gap-8">
            {categories.map((category) => (
              <div key={category.uuid} className="space-y-4">
                <Link
                  to={`/category/${category.uuid}`}
                  className="text-lg font-medium text-[#062a51] hover:underline block"
                >
                  {category.name}
                </Link>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ul className="space-y-2">
                    {category.subcategories.map((sub) => (
                      <li key={sub.uuid}>
                        <Link
                          to={`/category/${category.uuid}/${sub.uuid}`}
                          className="text-sm text-gray-600 hover:text-[#062a51] hover:underline block"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage; 
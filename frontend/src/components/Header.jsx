import { Link } from 'react-router-dom';
import logo from '/assets/flaskify-wordmark-noslogan.png';
import { Bell, Gauge, Heart, HelpCircle, ChevronDown, MoreHorizontal, MessageCircle } from 'lucide-react';
import SearchComponent from './SearchComponent';
import { useAuth } from '../utils/AuthContext';
import UserPopover from './UserPopover';
import { CartIcon } from './Cart/CartIcon';
import { useState, useEffect } from 'react';

const Header = () => {
  const { user, loading, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState(null);
  const [parentCategories, setParentCategories] = useState([]);
  const [randomizedCategories, setRandomizedCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  useEffect(() => {
    fetchParentCategories();
  }, []);

  useEffect(() => {
    if (parentCategories.length > 0) {
      randomizeCategories();
    }
  }, [parentCategories]);

  const randomizeCategories = () => {
    // Create a copy of the array to avoid mutating the original
    const shuffled = [...parentCategories];
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRandomizedCategories(shuffled);
  };

  const fetchParentCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch('http://localhost:5555/categories?type=parent&is_active=true');
      if (response.ok) {
        const data = await response.json();
        setParentCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const visibleCategories = randomizedCategories.slice(0, 5);
  const moreCategories = randomizedCategories.slice(5);

  return (
    <header className='w-full sticky top-0 z-50 bg-white shadow-sm'>
      {/* Top Navigation */}
      <div className='px-4 lg:px-32 py-1.5 text-gray-600 border-b'>
        <div className='flex items-center justify-between text-xs'>
          <div className='flex items-center gap-3'>
            {!loading && user?.role !== "ADMIN" && (
              <>
                {user?.role === "SELLER" && (
                  <Link to='/seller/seller-center' className='hover:text-[#062a51]'>
                    Seller Centre
                  </Link>
                )}
                <div className='h-4 w-[1px] bg-gray-300'></div>
                <Link to='/seller/register' className='hover:text-[#062a51]'>
                  Start Selling
                </Link>
              </>
            )}
            {!loading && user?.role === "ADMIN" && (
              <Link to='/admin/dashboard' className='inline-flex hover:text-[#062a51] items-center gap-2'>
                <Gauge size={16} /> Admin Dashboard
              </Link>
            )}
          </div>

          <div className='flex items-center gap-4'>
            <Link to='/notifications' className='flex items-center gap-1 hover:text-[#062a51]'>
              <Bell size={16} />
              <span className='hidden sm:inline'>Notifications</span>
            </Link>
            <Link to='/messages' className='flex items-center gap-1 hover:text-[#062a51]'>
              <MessageCircle size={16} />
              <span className='hidden sm:inline'>Messages</span>
            </Link>
            <Link 
              to='/help' 
              className='flex items-center gap-1 hover:text-[#062a51] transition-colors'
            >
              <HelpCircle size={16} />
              <span className='hidden sm:inline'>Help</span>
            </Link>
            {!loading ? (
              user ? (
                <UserPopover user={user} logout={logout} />
              ) : (
                <div className='flex items-center gap-3'>
                  <Link to='/auth/signup' className='hover:text-[#062a51]'>
                    Sign Up
                  </Link>
                  <div className='h-4 w-[1px] bg-gray-300'></div>
                  <Link to='/auth/login' className='hover:text-[#062a51]'>
                    Login
                  </Link>
                </div>
              )
            ) : (
              <div className='animate-pulse flex items-center gap-1'>
                <div className='w-6 h-6 bg-gray-200 rounded-full'></div>
                <div className='w-12 h-4 bg-gray-200 rounded-md'></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className='bg-white px-4 lg:px-32 py-4'>
        <div className='flex items-center gap-8'>
          {/* Logo */}
          <Link to='/' className='min-w-[140px] lg:min-w-[180px]'>
            <img 
              src={logo} 
              alt="Flaskify Logo" 
              className='h-8 lg:h-10 w-auto object-contain'
            />
          </Link>

          {/* Search */}
          <div className='flex-1 max-w-4xl'>
            <SearchComponent />
          </div>

          {/* Cart & Wishlist */}
          <div className='flex items-center gap-8 ml-4 text-gray-700'>
            <Link to='/wishlist' className='hover:text-[#062a51] transition-colors'>
              <Heart size={26} strokeWidth={1.5} />
            </Link>
            <CartIcon />
          </div>
        </div>
      </div>

      {/* Bottom Navigation with Categories */}
      <div className='bg-white px-4 lg:px-32 border-t relative'>
        <nav className='text-sm text-gray-600'>
          <ul className='flex items-center justify-center gap-8'>
            {!isLoadingCategories && visibleCategories.map((category) => (
              <li 
                key={category.uuid}
                className='relative'
                onMouseEnter={() => setActiveCategory(category.uuid)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link 
                  to={`/category/${category.uuid}`}
                  className='flex items-center gap-1 py-3 hover:text-[#062a51] transition-colors'
                >
                  {category.name}
                  {category.subcategories?.length > 0 && <ChevronDown size={16} />}
                </Link>

                {/* Category Dropdown */}
                {activeCategory === category.uuid && category.subcategories?.length > 0 && (
                  <div className='absolute top-full left-0 w-[250px] bg-white shadow-lg rounded-b-lg py-2 border-t z-50'>
                    {category.subcategories.filter(sub => sub.is_active).map((subcategory) => (
                      <div key={subcategory.uuid} className="px-4 py-2 hover:bg-gray-50">
                        <Link 
                          to={`/category/${category.uuid}/${subcategory.uuid}`}
                          className='text-gray-700 hover:text-[#062a51] block'
                        >
                          {category.name} &gt; {subcategory.name}
                        </Link>
                        {subcategory.attributes && subcategory.attributes.length > 0 && (
                          <ul className='mt-1 ml-4 space-y-1'>
                            {subcategory.attributes.slice(0, 4).map((attr) => (
                              <li key={attr.uuid}>
                                <Link 
                                  to={`/category/${category.uuid}/${subcategory.uuid}?attribute=${attr.name}`}
                                  className='text-gray-500 hover:text-[#062a51] text-sm block'
                                >
                                  {attr.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}

            {/* See More Dropdown */}
            {!isLoadingCategories && moreCategories.length > 0 && (
              <li 
                className='relative'
                onMouseEnter={() => setShowMoreDropdown(true)}
                onMouseLeave={() => setShowMoreDropdown(false)}
              >
                <button
                  className='flex items-center gap-1 py-3 hover:text-[#062a51] transition-colors'
                >
                  See More
                  <ChevronDown size={16} />
                </button>

                {showMoreDropdown && (
                  <div className='absolute top-full left-0 w-[250px] bg-white shadow-lg rounded-b-lg py-2 border-t z-50 max-h-[calc(100vh-200px)] overflow-y-auto'>
                    {moreCategories.map((category) => (
                      <div 
                        key={category.uuid}
                        className='relative group'
                        onMouseEnter={() => setActiveCategory(category.uuid)}
                        onMouseLeave={() => setActiveCategory(null)}
                      >
                        <Link 
                          to={`/category/${category.uuid}`}
                          className='flex items-center justify-between px-4 py-2 hover:bg-gray-50'
                        >
                          <span>{category.name}</span>
                          {category.subcategories?.length > 0 && <ChevronDown size={16} />}
                        </Link>

                        {/* Subcategories dropdown for See More items */}
                        {activeCategory === category.uuid && category.subcategories?.length > 0 && (
                          <div className='w-full bg-gray-50'>
                            {category.subcategories.filter(sub => sub.is_active).map((subcategory) => (
                              <div key={subcategory.uuid} className="px-6 py-2 hover:bg-gray-100">
                                <Link 
                                  to={`/category/${category.uuid}/${subcategory.uuid}`}
                                  className='text-gray-700 hover:text-[#062a51] block'
                                >
                                  {category.name} &gt; {subcategory.name}
                                </Link>
                                {subcategory.attributes && subcategory.attributes.length > 0 && (
                                  <ul className='mt-1 ml-4 space-y-1'>
                                    {subcategory.attributes.slice(0, 4).map((attr) => (
                                      <li key={attr.uuid}>
                                        <Link 
                                          to={`/category/${category.uuid}/${subcategory.uuid}?attribute=${attr.name}`}
                                          className='text-gray-500 hover:text-[#062a51] text-sm block'
                                        >
                                          {attr.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;

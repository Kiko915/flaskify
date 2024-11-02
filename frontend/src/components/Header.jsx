import { Link } from 'react-router-dom';
import logo from '/assets/flaskify-wordmark-noslogan.png';
import { Bell, Gauge, Heart, HelpCircle, ShoppingCart } from 'lucide-react';
import SearchComponent from './SearchComponent';
import { useAuth } from '../utils/AuthContext';
import UserPopover from './UserPopover';

const Header = () => {
  const { user, loading, logout } = useAuth(); // Destructure both user and loading

  return (
    <header className='py-2 w-full sticky top-0 z-10 border-b bg-white'>
      <div className='mb-2 px-4 lg:px-12' id='top_nav'>
        <div className='flex items-center justify-between text-xs lg:text-sm'>
          {!loading && user?.role !== "Admin" && <ul className='flex items-center gap-2'>
            {user?.role === "Seller" && <li><Link to='/seller/center'>Seller Centre</Link></li>}
            <li><Link to='/seller/register'>Start Selling</Link></li>
          </ul>}
          {!loading && user?.role === "Admin" && <ul className='flex items-center gap-2'>
            <li><Link to='/admin/dashboard' className='inline-flex items-center gap-2 hover:text-yellow-500'><Gauge />  Admin Dashboard</Link></li>
          </ul>
          }

          <ul className='flex items-center gap-2'>
            <li>
              <Link to='/notifications' className='flex items-center gap-1'>
                <Bell strokeWidth={1.5} size={20} />
                <span className='hidden sm:inline'>Notification</span>
              </Link>
            </li>
            <li>
              <Link to='/help' className='flex items-center gap-1'>
                <HelpCircle strokeWidth={1.5} size={20} />
                <span className='hidden sm:inline'>Help</span>
              </Link>
            </li>
            {!loading ? (
              user ? ( // Check if user exists
                <li>
                  <UserPopover user={user} logout={logout} />
                </li>
              ) : (
                <>
                  <li>
                    <Link to='/auth/signup' className='font-bold'>
                      Signup
                    </Link>
                  </li>
                  <li><span>|</span></li>
                  <li>
                    <Link to='/auth/login' className='font-bold'>
                      Login
                    </Link>
                  </li>
                </>
              )
            ) : (
              // Display a skeleton for loading state
              <li>
                <div className='animate-pulse flex items-center gap-1'>
                  <div className='w-6 h-6 bg-gray-200 rounded-full'></div>
                  <div className='w-12 h-4 bg-gray-200 rounded-md'></div>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className='middle_nav flex items-center justify-between border-t border-b py-4 px-4 lg:px-12'>
        <div className='flaskify_logo w-1/3 lg:w-auto'>
          <Link to='/'>
            <img src={logo} className='w-24 lg:w-36' alt="Flaskify Logo" />
          </Link>
        </div>
        <div className='w-full lg:w-2/3 flex items-center justify-center my-2 lg:my-0'>
          <SearchComponent />
        </div>
        <div className='flex items-center gap-4'>
          <div className='flaskify_wishhlist lg:w-auto'>
            <Link to='/wishlist' className='text-gray-600'>
              <Heart size={24} />
            </Link>
          </div>
          <div className="flaskify_cart w-1/3 lg:w-auto flex justify-end">
            <Link to='/cart' className='text-gray-600'>
              <ShoppingCart size={24} />
            </Link>
          </div>
        </div>
      </div>

      <div className='bottom_nav px-4 lg:px-12 py-2 text-sm hidden md:block'>
        bottom nav here
      </div>
    </header>
  );
};

export default Header;

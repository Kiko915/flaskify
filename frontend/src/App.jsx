import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Loader from './components/Loader';
import Header from './components/Header';
import Footer from './components/Footer';
import { Helmet } from 'react-helmet-async';
import CountdownTimer from './components/CountdownTimer';

const AppLayout = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Don't show loader for auth routes and user routes
    const isAuthRoute = location.pathname.startsWith('/auth/');
    const isUserRoute = location.pathname.startsWith('/user/');
    const isSellerRegisterRoute = location.pathname.startsWith('/seller/register');
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isSellerCenter = location.pathname.startsWith('/seller/seller-center');
    
    if (!isAuthRoute && !isUserRoute && !isSellerRegisterRoute && !isAdminRoute && !isSellerCenter) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Check for auth routes to hide header
  const isAuthRoute = location.pathname.startsWith('/auth/');
  const isSellerRegisterRoute = location.pathname.startsWith('/seller/register');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSellerCenter = location.pathname.startsWith('/seller/seller-center');
  
  return (
    <div>
      <Helmet>
        <title>Flaskify | Tech powered marketplace.</title>
      </Helmet>
      <CountdownTimer />
      {/* Show header except for auth routes */}
      {!isAuthRoute && !isSellerRegisterRoute && !isAdminRoute && !isSellerCenter && <Header />}
      
      {/* Show loader only when loading is true and not on user/auth routes */}
      {loading && <Loader />}
      
      {/* Show content when not loading or on user/auth routes */}
      {(!loading || location.pathname.startsWith('/user/') || location.pathname.startsWith('/auth/') || isSellerRegisterRoute) && <Outlet />}
      
      <Footer />
    </div>
  );
};

export default AppLayout;
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Loader from './components/Loader';
import Header from './components/Header';
import Footer from './components/Footer';
import { Helmet } from 'react-helmet-async';
import CountdownTimer from './components/CountdownTimer';
import { AuthProvider, useAuth } from './utils/AuthContext';
import SessionExpiredDialog from './components/SessionExpiredDialog';
import Messages from './pages/Messages';

const AppContent = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { showSessionExpired, handleSessionExpiredClose } = useAuth();

  useEffect(() => {
    // Don't show loader for auth routes and user routes
    const isAuthRoute = location.pathname.startsWith('/auth/');
    const isUserRoute = location.pathname.startsWith('/user/');
    const isSellerRegisterRoute = location.pathname.startsWith('/seller/register');
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isSellerCenter = location.pathname.startsWith('/seller/seller-center');
    const isCheckoutRoute = location.pathname === '/checkout';
    const isMessagesRoute = location.pathname === '/messages';
    
    if (!isAuthRoute && !isUserRoute && !isSellerRegisterRoute && !isAdminRoute && !isSellerCenter && !isCheckoutRoute && !isMessagesRoute) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Check for routes to hide header and footer
  const isAuthRoute = location.pathname.startsWith('/auth/');
  const isSellerRegisterRoute = location.pathname.startsWith('/seller/register');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isSellerCenter = location.pathname.startsWith('/seller/seller-center');
  const isCheckoutRoute = location.pathname === '/checkout';
  
  return (
    <div>
      <Helmet>
        <title>Flaskify | Tech powered marketplace.</title>
      </Helmet>
      <CountdownTimer />
      {/* Show header except for auth routes and checkout */}
      {!isAuthRoute && !isSellerRegisterRoute && !isAdminRoute && !isSellerCenter && !isCheckoutRoute && <Header />}
      
      {/* Show loader only when loading is true and not on user/auth routes */}
      {loading && <Loader />}
      
      {/* Show content when not loading or on user/auth routes */}
      {(!loading || location.pathname.startsWith('/user/') || location.pathname.startsWith('/auth/') || isSellerRegisterRoute || isCheckoutRoute) && <Outlet />}
      
      {/* Show footer except for seller center and admin routes */}
      {!isAdminRoute && !isSellerCenter && <Footer />}

      {/* Session Expired Dialog */}
      <SessionExpiredDialog 
        isOpen={showSessionExpired} 
        onClose={handleSessionExpiredClose} 
      />
    </div>
  );
};

const AppLayout = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default AppLayout;
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export default function ProtectedRoute({ children, requiresSeller = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // You can show a loading spinner here
    return <div>Loading...</div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiresSeller && (!user.seller || !user.seller.seller_id)) {
    // Redirect to seller registration if seller access is required but user is not a seller
    return <Navigate to="/seller/register" state={{ from: location.pathname }} replace />;
  }

  return children;
} 
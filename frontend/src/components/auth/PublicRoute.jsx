import { Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/user/account" replace />;
  }

  return children;
};

export default PublicRoute;
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
};

export const RoleBasedRoute = ({ children, roles, requireVerified }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!roles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have permission to access this page.
            {user?.role === 'RENTER' && ' Only verified Owners can create listings.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary text-sm">Go Home</Link>
            <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  // If requireVerified is true, redirect unverified users to /unauthorized
  if (requireVerified && !user?.isVerified) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;

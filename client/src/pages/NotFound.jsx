import { Link } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';

const NotFound = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        <div className="text-8xl font-extrabold text-primary-600 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <HiHome size={20} /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

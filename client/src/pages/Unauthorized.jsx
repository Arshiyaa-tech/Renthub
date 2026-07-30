import { Link, useNavigate } from 'react-router-dom';
import { HiShieldExclamation, HiHome, HiArrowLeft } from 'react-icons/hi';

/**
 * 403 Unauthorized page.
 * Shown when a user tries to access admin pages without a verified account.
 */
const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center px-4 max-w-lg">
        {/* Shield icon with red accent */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <HiShieldExclamation className="text-red-500" size={44} />
        </div>

        {/* Error code */}
        <div className="text-7xl font-extrabold text-red-500 mb-2">403</div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>

        {/* Description */}
        <p className="text-gray-600 mb-2 text-lg">
          You don't have the required permissions to access this page.
        </p>
        <p className="text-gray-500 mb-8 text-sm">
          Admin access requires a verified account. Please contact support if you believe this is an error.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <HiArrowLeft size={18} /> Go Back
          </button>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
          >
            <HiHome size={18} /> Back to Home
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-gray-400">
          Need help? Contact the administrator to verify your account.
        </p>
      </div>
    </div>
  );
};

export default Unauthorized;

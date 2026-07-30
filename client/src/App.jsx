import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute, { RoleBasedRoute } from './components/ProtectedRoute';

/**
 * Lazy-loaded pages for code splitting.
 * Critical pages (Home, Login, Signup, Browse, ListingDetails) are eagerly loaded
 * for fast first paint. All other pages are code-split via React.lazy().
 */
const CreateListing = lazy(() => import('./pages/CreateListing'));
const MyListings = lazy(() => import('./pages/MyListings'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingDetails = lazy(() => import('./pages/BookingDetails'));
const OwnerBookings = lazy(() => import('./pages/OwnerBookings'));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const PaymentDetails = lazy(() => import('./pages/PaymentDetails'));
const WriteReview = lazy(() => import('./pages/WriteReview'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const CreateDispute = lazy(() => import('./pages/CreateDispute'));
const MyDisputes = lazy(() => import('./pages/MyDisputes'));
const DisputeDetails = lazy(() => import('./pages/DisputeDetails'));
const AdminDisputes = lazy(() => import('./pages/AdminDisputes'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Eagerly loaded pages (critical for first paint)
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BrowseListings from './pages/BrowseListings';
import ListingDetails from './pages/ListingDetails';

/** Loading fallback for Suspense boundaries */
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

/** Suspense wrapper for lazy-loaded page elements */
const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

/**
 * Root App component.
 *
 * Implements code splitting via React.lazy() + Suspense.
 * Critical pages (Home, Login, Signup, Browse, ListingDetails) load eagerly.
 * All other pages are code-split for faster initial load.
 *
 * Route access levels:
 * - Public:      Home, Login, Signup, Browse, ListingDetails
 * - Protected:   Wishlist, Bookings, BookingDetails, Dashboard, Profile, MyListings
 * - Owner-only:  Create Listing, OwnerBookings (incoming booking management)
 */
function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* ===== Public Routes (Eagerly Loaded) ===== */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="listings" element={<BrowseListings />} />
          <Route path="listings/:id" element={<ListingDetails />} />

          {/* ===== Protected Routes (require authentication) ===== */}
          <Route element={<ProtectedRoute />}>
            <Route path="wishlist" element={<LazyPage><Wishlist /></LazyPage>} />
            <Route path="bookings" element={<LazyPage><Bookings /></LazyPage>} />
            <Route path="bookings/:id" element={<LazyPage><BookingDetails /></LazyPage>} />
            <Route path="checkout/:bookingId" element={<LazyPage><PaymentCheckout /></LazyPage>} />
            <Route path="payments" element={<LazyPage><PaymentHistory /></LazyPage>} />
            <Route path="payments/:id" element={<LazyPage><PaymentDetails /></LazyPage>} />
            <Route path="write-review/:bookingId" element={<LazyPage><WriteReview /></LazyPage>} />
            <Route path="my-reviews" element={<LazyPage><MyReviews /></LazyPage>} />
            <Route path="disputes" element={<LazyPage><MyDisputes /></LazyPage>} />
            <Route path="disputes/:id" element={<LazyPage><DisputeDetails /></LazyPage>} />
            <Route path="create-dispute/:bookingId" element={<LazyPage><CreateDispute /></LazyPage>} />
            <Route path="dashboard" element={<LazyPage><Dashboard /></LazyPage>} />
            <Route path="unauthorized" element={<LazyPage><Unauthorized /></LazyPage>} />
            <Route path="notifications" element={<LazyPage><Notifications /></LazyPage>} />
            <Route path="profile" element={<LazyPage><Profile /></LazyPage>} />
            <Route path="my-listings" element={<LazyPage><MyListings /></LazyPage>} />

            {/* Admin routes (require OWNER role + verified) */}
            <Route element={<RoleBasedRoute roles={['OWNER']} requireVerified={true} />}>
              <Route path="admin/dashboard" element={<LazyPage><AdminDashboard /></LazyPage>} />
              <Route path="admin/disputes" element={<LazyPage><AdminDisputes /></LazyPage>} />
            </Route>

            {/* Owner-only routes */}
            <Route element={<RoleBasedRoute roles={['OWNER']} />}>
              <Route path="create-listing" element={<LazyPage><CreateListing /></LazyPage>} />
              <Route path="owner/bookings" element={<LazyPage><OwnerBookings /></LazyPage>} />
            </Route>
          </Route>

          {/* ===== 404 ===== */}
          <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;

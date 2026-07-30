import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import { FaHeart, FaCalendarAlt, FaChartBar, FaUser, FaSignOutAlt, FaCalendarCheck, FaCreditCard, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import { AiOutlineHome, AiOutlineSearch, AiOutlinePlusCircle, AiOutlineLogin, AiOutlineUserAdd } from 'react-icons/ai';
import { APP_NAME } from '../utils/constants';
import useAuth from '../hooks/useAuth';
import { getInitials } from '../utils/helpers';
import NotificationBell from './NotificationBell';
import { getWishlistCount } from '../services/wishlistService';

/**
 * Navigation bar component — auth-aware.
 *
 * - Desktop: main links + auth buttons (Login/Signup or Profile/Logout)
 * - Mobile: hamburger toggle with slide-out drawer
 * - Shows real user avatar/initials when logged in
 * - Role-based: owners see "Create Listing" and "Incoming Bookings"
 */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getWishlistCount();
      if (res.success) setWishlistCount(res.data.count);
    } catch (e) { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchWishlistCount();
  }, [fetchWishlistCount, location.pathname]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50/50'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 border-l-4 border-transparent'
    }`;

  const mainLinks = [
    { label: 'Home', path: '/', icon: AiOutlineHome },
    { label: 'Browse', path: '/listings', icon: AiOutlineSearch },
  ];

  const isOwner = isAuthenticated && user?.role === 'OWNER';
  const isAdmin = isOwner && user?.isVerified;

  const protectedLinks = [
    // Only show Owner-specific links if the user is an owner
    ...(isOwner ? [
      { label: 'Create Listing', path: '/create-listing', icon: AiOutlinePlusCircle },
      { label: 'My Listings', path: '/my-listings', icon: FaChartBar },
      { label: 'Incoming Bookings', path: '/owner/bookings', icon: FaCalendarCheck },
    ] : []),
    { label: 'Wishlist', path: '/wishlist', icon: FaHeart },
    { label: 'Bookings', path: '/bookings', icon: FaCalendarAlt },
    { label: 'Dashboard', path: '/dashboard', icon: FaChartBar },
    { label: 'My Reviews', path: '/my-reviews', icon: FaStar },
    { label: 'Disputes', path: '/disputes', icon: FaExclamationTriangle },
    ...(isAdmin ? [
      { label: 'Admin Dashboard', path: '/admin/dashboard', icon: FaChartBar },
      { label: 'Admin Disputes', path: '/admin/disputes', icon: FaExclamationTriangle },
    ] : []),
    { label: 'Payments', path: '/payments', icon: FaCreditCard },
    { label: 'Profile', path: '/profile', icon: FaUser },
  ];

  const userInitials = user ? getInitials(user.fullName) : 'U';

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
              <span className="bg-primary-600 text-white px-2.5 py-1 rounded-lg text-lg">RH</span>
              <span className="hidden sm:inline">{APP_NAME}</span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {mainLinks.map((link) => (
                <NavLink key={link.path} to={link.path} className={linkClass} end={link.path === '/'}>
                  <link.icon className="text-base" />
                  {link.label}
                </NavLink>
              ))}
              {/* Show protected links only if authenticated */}
              {isAuthenticated && protectedLinks.map((link) => (
                <NavLink key={link.path} to={link.path} className={linkClass}>
                  <link.icon className="text-base" />
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {!isAuthenticated ? (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">Login</Link>
                  <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md">Sign Up</Link>
                </>
              ) : (
                <div className="flex items-center gap-1">
                  {/* Wishlist Heart with Count */}
                  <Link to="/wishlist" className="relative p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-all" title="Wishlist">
                    <FaHeart size={18} />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </span>
                    )}
                  </Link>
                  <NotificationBell />
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">
                      {userInitials}
                    </div>
                    <span className="hidden xl:inline">{user.fullName?.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
                    <FaSignOutAlt size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all" aria-label={isOpen ? 'Close menu' : 'Open menu'}>
              {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      {/* Mobile Drawer */}
      <div className={`fixed top-0 right-0 h-full w-72 bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl lg:hidden overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-600">
            <span className="bg-primary-600 text-white px-2 py-1 rounded-lg text-sm">RH</span>
            {APP_NAME}
          </Link>
          <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-all">
            <HiX size={22} />
          </button>
        </div>

        {/* User info when logged in */}
        {isAuthenticated && user && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">{userInitials}</div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-1">
          {mainLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={mobileLinkClass} end={link.path === '/'}>
              <link.icon className="text-lg" />{link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <>
              <div className="my-3 border-t border-gray-100" />
              {protectedLinks.map((link) => (
                <NavLink key={link.path} to={link.path} className={mobileLinkClass}>
                  <link.icon className="text-lg" />{link.label}
                </NavLink>
              ))}
            </>
          )}
          <div className="my-4 border-t border-gray-100" />
          {!isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/login" className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-all">
                <AiOutlineLogin className="text-lg" />Login
              </Link>
              <Link to="/signup" className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all">
                <AiOutlineUserAdd className="text-lg" />Sign Up
              </Link>
            </div>
          ) : (
            <button onClick={() => { handleLogout(); setIsOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
              <FaSignOutAlt className="text-lg" />Logout
            </button>
          )}
        </div>
      </div>

      <div className="h-16" />
    </>
  );
};

export default Navbar;

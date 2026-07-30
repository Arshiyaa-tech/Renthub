import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiEye, HiStar as HiStarIcon, HiCurrencyRupee } from 'react-icons/hi';
import { FaBox, FaCalendarCheck, FaHeart, FaCalendarAlt } from 'react-icons/fa';
import { getMyBookings, getOwnerBookings } from '../services/bookingService';
import { getMyListings } from '../services/listingService';
import { getMyReviews } from '../services/reviewService';
import useAuth from '../hooks/useAuth';
import { formatPrice } from '../utils/helpers';

/**
 * Dashboard page — overview with live stats from the API.
 * Shows listing count, booking counts, and quick actions.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeListings: 0,
    activeBookings: 0,
    totalEarnings: 0,
    pendingBookings: 0,
    totalBookings: 0,
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const isOwner = user?.role === 'OWNER';
      let listingCount = 0;
      let ownerBookings = [];
      let renterBookings = [];

      // Fetch owner-specific data
      if (isOwner) {
        try {
          const listingRes = await getMyListings();
          listingCount = listingRes.data?.length || 0;
        } catch (e) { /* ignore */ }
        try {
          const bookingRes = await getOwnerBookings();
          ownerBookings = bookingRes.data || [];
        } catch (e) { /* ignore */ }
      }

      // Fetch renter bookings
      try {
        const bookingRes = await getMyBookings();
        renterBookings = bookingRes.data || [];
      } catch (e) { /* ignore */ }

      // Combine and calculate stats
      const allOwnerActive = ownerBookings.filter(b => ['CONFIRMED', 'ACTIVE'].includes(b.status));
      const allRenterActive = renterBookings.filter(b => ['CONFIRMED', 'ACTIVE'].includes(b.status));
      const allPending = ownerBookings.filter(b => b.status === 'PENDING');
      const completedBookings = [...ownerBookings, ...renterBookings].filter(b => b.status === 'COMPLETED');
      const totalEarnings = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

      // Fetch review stats
      let avgRating = 0;
      let totalReviews = 0;
      try {
        const reviewRes = await getMyReviews();
        if (reviewRes.success) {
          avgRating = reviewRes.data.stats?.averageRating || 0;
          totalReviews = reviewRes.data.stats?.receivedCount || 0;
        }
      } catch (e) { /* ignore */ }

      setStats({
        activeListings: listingCount,
        activeBookings: isOwner ? allOwnerActive.length : allRenterActive.length,
        totalEarnings,
        pendingBookings: allPending.length,
        totalBookings: ownerBookings.length + renterBookings.length,
        averageRating: avgRating,
        totalReviews,
      });
    } catch (error) {
      // Stats default to 0 on error
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Active Listings', value: stats.activeListings.toString(), icon: FaBox, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Bookings', value: stats.activeBookings.toString(), icon: FaCalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Earnings', value: formatPrice(stats.totalEarnings), icon: HiCurrencyRupee, color: 'text-accent-600', bg: 'bg-orange-50' },
    { label: 'Rating', value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0', icon: HiStarIcon, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    ...(user?.role === 'OWNER' ? [{ label: 'Pending Requests', value: stats.pendingBookings.toString(), icon: FaCalendarAlt, color: 'text-yellow-600', bg: 'bg-yellow-50' }] : [{ label: 'Total Bookings', value: stats.totalBookings.toString(), icon: FaCalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' }]),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Overview of your RentHub activity</p>
            </div>
            {user?.role === 'OWNER' && (
              <Link to="/create-listing" className="btn-primary flex items-center gap-2"><HiPlus size={20} /> Create Listing</Link>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={stat.color} size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {stats.totalBookings === 0 && stats.activeListings === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📊</p>
                <p>No recent activity to show</p>
                <p className="text-sm mt-1">Your dashboard activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.activeListings > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                    <FaBox size={16} />
                    <span>You have {stats.activeListings} active {stats.activeListings === 1 ? 'listing' : 'listings'}</span>
                  </div>
                )}
                {stats.pendingBookings > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 text-yellow-700 text-sm">
                    <FaCalendarAlt size={16} />
                    <span>You have {stats.pendingBookings} pending booking {stats.pendingBookings === 1 ? 'request' : 'requests'}</span>
                  </div>
                )}
                {stats.activeBookings > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                    <FaCalendarCheck size={16} />
                    <span>{stats.activeBookings} active {stats.activeBookings === 1 ? 'booking' : 'bookings'} in progress</span>
                  </div>
                )}
                {stats.totalEarnings > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 text-orange-700 text-sm">
                    <HiCurrencyRupee size={16} />
                    <span>Total earnings: {formatPrice(stats.totalEarnings)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {user?.role === 'OWNER' && (
                <>
                  <Link to="/create-listing" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform"><HiPlus size={20} /></div>
                    <div><p className="font-medium text-gray-900 text-sm">Create New Listing</p><p className="text-xs text-gray-500">List an item for rent</p></div>
                  </Link>
                  <Link to="/owner/bookings" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform"><FaCalendarAlt size={20} /></div>
                    <div><p className="font-medium text-gray-900 text-sm">Incoming Bookings</p><p className="text-xs text-gray-500">Approve or reject rental requests</p></div>
                  </Link>
                  <Link to="/my-listings" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform"><HiEye size={20} /></div>
                    <div><p className="font-medium text-gray-900 text-sm">View My Listings</p><p className="text-xs text-gray-500">Manage your listed items</p></div>
                  </Link>
                </>
              )}
              <Link to="/bookings" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center text-accent-600 group-hover:scale-110 transition-transform"><FaCalendarCheck size={20} /></div>
                <div><p className="font-medium text-gray-900 text-sm">View My Bookings</p><p className="text-xs text-gray-500">Check your rental bookings</p></div>
              </Link>
              <Link to="/wishlist" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform"><FaHeart size={20} /></div>
                <div><p className="font-medium text-gray-900 text-sm">View Wishlist</p><p className="text-xs text-gray-500">Items you've saved</p></div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

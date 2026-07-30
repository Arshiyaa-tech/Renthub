import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendar, HiLocationMarker, HiClock, HiEye, HiBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, getPlaceholderImage } from '../utils/helpers';
import { getMyBookings, updateBookingStatus } from '../services/bookingService';

/**
 * Renter's Bookings page — displays the user's rental bookings.
 * Tabs: Upcoming (PENDING/CONFIRMED), Active, Past (COMPLETED), Cancelled
 */
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const response = await getMyBookings();
      setBookings(response.data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      await updateBookingStatus(id, 'CANCELLED');
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  // Categorize bookings
  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'active', label: 'Active' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredBookings = bookings.filter((b) => {
    switch (activeTab) {
      case 'upcoming': return ['PENDING', 'CONFIRMED'].includes(b.status);
      case 'active': return ['ACTIVE'].includes(b.status);
      case 'past': return ['COMPLETED', 'REJECTED'].includes(b.status);
      case 'cancelled': return ['CANCELLED'].includes(b.status);
      default: return true;
    }
  });

  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

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
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">Track and manage your rentals</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {tab.label} {tab.key === 'upcoming' && bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length > 0 &&
                <span className="ml-1.5 bg-primary-400 text-white text-xs px-1.5 py-0.5 rounded-full">{bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length}</span>}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} bookings</h2>
            <p className="text-gray-500 mb-6">Browse items and book your first rental</p>
            <Link to="/listings" className="btn-primary inline-flex items-center gap-2">Browse Rentals</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-28 h-28 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={booking.listing?.imageUrls?.[0] || getPlaceholderImage(booking.listing?.category)} alt={booking.listing?.title}
                      className="w-full h-full object-cover" onError={(e) => { e.target.src = getPlaceholderImage('default'); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-lg truncate">{booking.listing?.title}</h3>
                          {booking.hasInsurance && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold whitespace-nowrap">
                              <HiBadgeCheck size={12} /> Protected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <HiLocationMarker size={14} className="flex-shrink-0" />
                          <span className="truncate">{booking.listing?.location}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusStyles[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                      <span className="flex items-center gap-1"><HiCalendar size={16} />{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                      <span className="flex items-center gap-1"><HiClock size={16} />{booking.numberOfDays} {booking.numberOfDays === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-lg font-bold text-primary-600">{formatPrice(booking.totalAmount)}</span>
                        {booking.owner && <span className="text-sm text-gray-500 ml-2">· {booking.owner.fullName}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/bookings/${booking.id}`} className="text-sm text-gray-600 hover:text-primary-600 px-4 py-2 border border-gray-200 rounded-lg hover:border-primary-200 transition-all flex items-center gap-1">
                          <HiEye size={16} /> Details
                        </Link>
                        {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                          <button onClick={() => handleCancel(booking.id)} disabled={cancelling === booking.id}
                            className="text-sm text-red-600 hover:text-red-700 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50">
                            {cancelling === booking.id ? '...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;

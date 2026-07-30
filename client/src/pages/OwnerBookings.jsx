import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendar, HiCheck, HiX, HiEye, HiCreditCard, HiBadgeCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, getPlaceholderImage, getInitials } from '../utils/helpers';
import { getOwnerBookings, updateBookingStatus } from '../services/bookingService';
import { capturePayment } from '../services/paymentService';

/**
 * Owner's Bookings page — manage incoming booking requests.
 * Tabs: Pending (approve/reject), Active (confirmed/active), Completed, Rejected/Cancelled
 */
const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const response = await getOwnerBookings();
      setBookings(response.data || []);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(`${bookingId}-${newStatus}`);
    try {
      const response = await updateBookingStatus(bookingId, newStatus);
      if (response.success) {
        toast.success(response.message);
        fetchBookings();
        // If marking as completed, notify about payment capture
        if (newStatus === 'COMPLETED') {
          toast('You can now capture payment from the Completed tab', { icon: '💳' });
        }
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCapturePayment = async (bookingId) => {
    setActionLoading(`${bookingId}-capture`);
    try {
      const response = await capturePayment(bookingId);
      if (response.success) { toast.success('Payment captured successfully!'); fetchBookings(); }
    } catch (error) {
      toast.error(error.message || 'Failed to capture payment');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', statuses: ['PENDING'] },
    { key: 'active', label: 'Active', statuses: ['CONFIRMED', 'ACTIVE'] },
    { key: 'completed', label: 'Completed', statuses: ['COMPLETED'] },
    { key: 'cancelled', label: 'Rejected/Cancelled', statuses: ['REJECTED', 'CANCELLED'] },
  ];

  const filteredBookings = bookings.filter((b) => {
    const tab = tabs.find((t) => t.key === activeTab);
    return tab ? tab.statuses.includes(b.status) : true;
  });

  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700', COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-700',
  };

  const getActions = (booking) => {
    switch (booking.status) {
      case 'PENDING':
        return (<div className="flex gap-2">
          <button onClick={() => handleStatusUpdate(booking.id, 'CONFIRMED')} disabled={actionLoading === `${booking.id}-CONFIRMED`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50">
            <HiCheck size={14} /> Approve
          </button>
          <button onClick={() => handleStatusUpdate(booking.id, 'REJECTED')} disabled={actionLoading === `${booking.id}-REJECTED`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50">
            <HiX size={14} /> Reject
          </button>
        </div>);
      case 'CONFIRMED': return (
        <button onClick={() => handleStatusUpdate(booking.id, 'ACTIVE')} disabled={actionLoading === `${booking.id}-ACTIVE`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50">
          <HiCheck size={14} /> Mark Active
        </button>);
      case 'ACTIVE': return (
        <button onClick={() => handleStatusUpdate(booking.id, 'COMPLETED')} disabled={actionLoading === `${booking.id}-COMPLETED`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50">
          <HiCheck size={14} /> Mark Returned
        </button>);
      case 'COMPLETED':
        return (
          <div className="flex gap-2">
            <button onClick={() => handleCapturePayment(booking.id)} disabled={actionLoading === `${booking.id}-capture`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-all disabled:opacity-50">
              <HiCreditCard size={14} /> {actionLoading === `${booking.id}-capture` ? 'Processing...' : 'Capture Payment'}
            </button>
          </div>
        );
      default: return null;
    }
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Incoming Bookings</h1>
          <p className="text-gray-600 mt-2">Manage rental requests for your listings</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
              {tab.label}
              {tab.key === 'pending' && bookings.filter(b => b.status === 'PENDING').length > 0 &&
                <span className="ml-1.5 bg-accent-500 text-white text-xs px-1.5 py-0.5 rounded-full">{bookings.filter(b => b.status === 'PENDING').length}</span>}
            </button>
          ))}
        </div>
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16"><div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} bookings</h2>
            <p className="text-gray-500">Booking requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const renterInitials = getInitials(booking.renter?.fullName);
              return (
                <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
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
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-[10px]">{renterInitials}</div>
                            <span>{booking.renter?.fullName}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${statusStyles[booking.status] || ''}`}>{booking.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                        <span className="flex items-center gap-1"><HiCalendar size={16} />{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                        <span className="font-medium text-primary-600">{formatPrice(booking.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <div className="flex gap-2">{getActions(booking)}</div>
                        <Link to={`/bookings/${booking.id}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                          <HiEye size={16} /> Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBookings;

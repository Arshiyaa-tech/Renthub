import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCalendar, HiChevronLeft, HiCheck, HiX, HiShieldCheck, HiStar, HiBadgeCheck } from 'react-icons/hi';
import { formatPrice, formatDate, getInitials } from '../utils/helpers';
import { getBookingById, updateBookingStatus } from '../services/bookingService';
import { getMyReviews } from '../services/reviewService';
import { getMyDisputes } from '../services/disputeService';
import toast from 'react-hot-toast';
import useAuth from '../hooks/useAuth';

/**
 * Booking Details page — full breakdown of a single booking.
 * Shows status timeline, price breakdown, owner/renter info, and action buttons.
 */
const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [checkingReview, setCheckingReview] = useState(false);
  const [existingDispute, setExistingDispute] = useState(null);
  const [checkingDispute, setCheckingDispute] = useState(false);

  useEffect(() => { fetchBooking(); }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await getBookingById(id);
      setBooking(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setActionLoading(newStatus);
    try {
      const response = await updateBookingStatus(id, newStatus);
      if (response.success) { toast.success(response.message); fetchBooking(); }
    } catch (error) {
      toast.error(error.message || 'Failed to update booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Check if user has already reviewed/disputed this booking on mount
  useEffect(() => {
    if (booking && booking.status === 'COMPLETED') {
      checkExistingReview();
      checkExistingDispute();
    }
  }, [booking?.id, booking?.status]);

  const checkExistingReview = async () => {
    if (checkingReview) return;
    setCheckingReview(true);
    try {
      const res = await getMyReviews();
      const found = res.data?.written?.find(r => r.booking?.id === id);
      setExistingReview(found || null);
    } catch (e) { /* ignore */ }
    finally { setCheckingReview(false); }
  };

  const checkExistingDispute = async () => {
    if (checkingDispute) return;
    setCheckingDispute(true);
    try {
      const res = await getMyDisputes();
      const found = (res.data || []).find(d => d.bookingId === id);
      setExistingDispute(found || null);
    } catch (e) { /* ignore */ }
    finally { setCheckingDispute(false); }
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);
  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Booking not found</h2>
        <Link to="/bookings" className="btn-primary">My Bookings</Link>
      </div>
    </div>
  );

  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
    ACTIVE: 'bg-green-100 text-green-700', COMPLETED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-700',
  };

  const statusTimeline = ['PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED'];
  const currentIdx = statusTimeline.indexOf(booking.status);
  const ownerInitials = getInitials(booking.owner?.fullName);
  const renterInitials = getInitials(booking.renter?.fullName);
  const isOwner = user?.id === booking.owner?.id;
  const isRenter = user?.id === booking.renter?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={isOwner ? '/owner/bookings' : '/bookings'} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <HiChevronLeft size={20} /> Back to bookings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{booking.listing?.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <HiCalendar size={18} />
                    <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                    <span className="text-gray-400">·</span>
                    <span>{booking.numberOfDays} {booking.numberOfDays === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusStyles[booking.status] || ''}`}>{booking.status}</span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Timeline</h2>
              <div className="flex items-center gap-0">
                {statusTimeline.map((s, i) => (
                  <div key={s} className="flex-1 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i <= currentIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {i < currentIdx ? <HiCheck size={20} /> : i === currentIdx ? i + 1 : <HiX size={20} />}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${i <= currentIdx ? 'text-primary-600' : 'text-gray-400'}`}>{s}</p>
                    {i < statusTimeline.length - 1 && (
                      <div className={`h-1 w-full max-w-[40px] -mt-5 ${i < currentIdx ? 'bg-primary-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* People */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">People</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{ownerInitials}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{booking.owner?.fullName}</p>
                    <p className="text-xs text-gray-500">Owner {booking.owner?.location ? `· ${booking.owner.location}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{renterInitials}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{booking.renter?.fullName}</p>
                    <p className="text-xs text-gray-500">Renter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Price Breakdown & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              {/* Review Section for COMPLETED bookings */}
              {booking.status === 'COMPLETED' && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <HiStar className="text-yellow-400" size={16} /> Review
                  </h3>
                  {existingReview ? (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900">You reviewed this booking</p>
                      <StarRating rating={existingReview.rating} size="sm" />
                      <p className="text-xs text-gray-400 mt-1">{existingReview.title}</p>
                    </div>
                  ) : (
                    <Link to={'/write-review/' + booking.id}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold bg-yellow-50 text-yellow-700 rounded-xl hover:bg-yellow-100 transition-all">
                      <HiStar size={16} /> Write a Review
                    </Link>
                  )}
                </div>
              )}

              {/* Dispute Section for COMPLETED bookings */}
              {booking.status === 'COMPLETED' && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <HiX className="text-red-400" size={16} /> Dispute
                  </h3>
                  {existingDispute ? (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900">Dispute raised</p>
                      <p className="text-xs text-gray-400 mt-1">Status: {existingDispute.status?.replace(/_/g, ' ')}</p>
                      <Link to={'/disputes/' + existingDispute.id} className="text-xs text-primary-600 hover:underline mt-1 block">View Details</Link>
                    </div>
                  ) : (
                    <Link to={'/create-dispute/' + booking.id}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-semibold bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all">
                      <HiX size={16} /> Raise a Dispute
                    </Link>
                  )}
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-900 mb-6">Price Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600"><span>{formatPrice(booking.dailyRate)} x {booking.numberOfDays} days</span><span>{formatPrice(booking.subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Platform fee (10%)</span><span>{formatPrice(booking.platformFee)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Service fee</span><span>{formatPrice(booking.serviceFee)}</span></div>
                {booking.securityDeposit > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Security deposit</span><span>{formatPrice(booking.securityDeposit)}</span></div>}
                {booking.hasInsurance && (
                  <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1.5 text-green-700 font-medium">
                      <HiBadgeCheck size={16} /> Damage Protection
                    </span>
                    <span className="text-green-700">{booking.insuranceLabel || 'Covered'}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 text-lg pt-3 border-t border-gray-100">
                  <span>Total</span><span>{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mt-6 mb-4">
                <HiShieldCheck className="text-green-500" size={16} />
                <span>Payment placeholder</span>
              </div>

              {/* Actions - context aware */}
              {isRenter && booking.status === 'PENDING' && (
                <button onClick={() => handleStatusUpdate('CANCELLED')} disabled={actionLoading === 'CANCELLED'}
                  className="w-full px-4 py-2.5 text-sm font-semibold border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50">
                  {actionLoading === 'CANCELLED' ? 'Processing...' : 'Cancel Booking'}
                </button>
              )}
              {isOwner && booking.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button onClick={() => handleStatusUpdate('CONFIRMED')} disabled={actionLoading === 'CONFIRMED'}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50">
                    {actionLoading === 'CONFIRMED' ? '...' : 'Approve'}
                  </button>
                  <button onClick={() => handleStatusUpdate('REJECTED')} disabled={actionLoading === 'REJECTED'}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50">
                    {actionLoading === 'REJECTED' ? '...' : 'Reject'}
                  </button>
                </div>
              )}
              {isOwner && booking.status === 'CONFIRMED' && (
                <button onClick={() => handleStatusUpdate('ACTIVE')} disabled={actionLoading === 'ACTIVE'}
                  className="w-full px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50">
                  {actionLoading === 'ACTIVE' ? '...' : 'Mark Active'}
                </button>
              )}
              {isOwner && booking.status === 'ACTIVE' && (
                <button onClick={() => handleStatusUpdate('COMPLETED')} disabled={actionLoading === 'COMPLETED'}
                  className="w-full px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50">
                  {actionLoading === 'COMPLETED' ? '...' : 'Mark Returned'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

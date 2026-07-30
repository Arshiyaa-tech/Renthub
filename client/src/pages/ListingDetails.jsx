import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { HiLocationMarker, HiHeart, HiShare, HiCalendar, HiShieldCheck, HiChevronLeft, HiCheck, HiX as HiXIcon, HiStar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, getPlaceholderImage, formatDate, getInitials } from '../utils/helpers';
import { getListingById } from '../services/listingService';
import { getBookedDates, createBooking } from '../services/bookingService';
import { getListingReviews } from '../services/reviewService';
import { checkWishlist, addToWishlist, removeFromWishlist } from '../services/wishlistService';
import { HiBadgeCheck, HiShieldExclamation } from 'react-icons/hi';
import { checkListingIdentity } from '../services/identityService';
import StarRating from '../components/StarRating';
import useAuth from '../hooks/useAuth';

const PLATFORM_FEE_PERCENT = 0.10;
const SERVICE_FEE_FIXED = 5;

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [identityRequired, setIdentityRequired] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review state
  const [reviews, setReviews] = useState({ reviews: [], stats: { totalReviews: 0, averageRating: 0, distribution: {} } });
  const [reviewSort, setReviewSort] = useState('newest');

  useEffect(() => {
    if (!loading && listing) fetchReviews();
  }, [id, reviewSort, loading]);

  const fetchReviews = async () => {
    try {
      const res = await getListingReviews(id, reviewSort);
      if (res.success) setReviews(res.data);
    } catch (e) { /* reviews are optional */ }
  };

  // Booking state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [insurancePlan, setInsurancePlan] = useState('');

  useEffect(() => {
    fetchListing();
    fetchBookedDates();
    checkWishlistStatus();
    checkIdentityStatus();
  }, [id]);

  const checkIdentityStatus = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await checkListingIdentity(id);
      if (res.success) {
        setIdentityRequired(res.data.required);
        setIdentityVerified(res.data.verified);
      }
    } catch (e) { /* optional */ }
  };

  const checkWishlistStatus = async () => {
    try {
      const res = await checkWishlist(id);
      if (res.success) setIsWishlisted(res.data.isWishlisted);
    } catch (e) { /* wishlist check is optional */ }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save items');
      navigate('/login', { state: { from: { pathname: '/listings/' + id } } });
      return;
    }
    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const fetchListing = async () => {
    try {
      const response = await getListingById(id);
      setListing(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedDates = async () => {
    try {
      const response = await getBookedDates(id);
      setBookedDates(response.data || []);
    } catch (e) {
      // booked dates are optional
    }
  };

  // Calculate price breakdown
  const calcPriceBreakdown = () => {
    if (!startDate || !endDate || !listing) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return null;

    const days = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    const dailyRate = listing.dailyRate;
    const subtotal = dailyRate * days;
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT * 100) / 100;
    const serviceFee = SERVICE_FEE_FIXED;
    const securityDeposit = listing.securityDeposit;
    const total = subtotal + platformFee + serviceFee + securityDeposit;

    return { days, dailyRate, subtotal, platformFee, serviceFee, securityDeposit, total };
  };

  const priceBreakdown = calcPriceBreakdown();

  // Check if a date is booked
  const isDateBooked = (dateStr) => bookedDates.includes(dateStr);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    // If end date is before new start, reset end
    if (endDate && new Date(endDate) <= new Date(val)) {
      setEndDate('');
    }
  };

  const handleBookNow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to book this item');
      navigate('/login', { state: { from: { pathname: `/listings/${id}` } } });
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await createBooking({
        listingId: id,
        startDate,
        endDate,
        insurancePlan: insurancePlan || undefined,
      });

      if (response.success && response.data?.id) {
        toast.success('Booking created! Proceed to payment.');
        // Navigate to checkout with the booking ID for payment
        navigate(`/checkout/${response.data.id}`);
      } else if (response.success) {
        toast.success('Booking created!');
        navigate('/bookings');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD for min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Listing not found</h2>
          <p className="text-gray-500 mb-6">{error || 'This listing does not exist.'}</p>
          <Link to="/listings" className="btn-primary">Browse Listings</Link>
        </div>
      </div>
    );
  }

  const images = listing.imageUrls?.length > 0 ? listing.imageUrls : [getPlaceholderImage(listing.category)];
  const ownerInitials = getInitials(listing.owner?.fullName);
  const categoryName = listing.category?.replace(/-/g, ' ');
  const conditionLabel = listing.condition?.toLowerCase().replace(/_/g, ' ');
  const isOwner = user?.id === listing.owner?.id;

  const conditionStyles = {
    NEW: 'bg-green-50 text-green-700', LIKE_NEW: 'bg-blue-50 text-blue-700',
    GOOD: 'bg-yellow-50 text-yellow-700', FAIR: 'bg-orange-50 text-orange-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/listings" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <HiChevronLeft size={20} /> Back to listings
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="relative h-[400px] md:h-[500px] bg-gray-100">
                <img src={images[selectedImage]} alt={listing.title} className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getPlaceholderImage(listing.category); }} />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleWishlistToggle} disabled={wishlistLoading}
                    className={`p-3 rounded-full backdrop-blur-sm transition-all duration-200 transform ${isWishlisted ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-gray-600 hover:bg-white hover:scale-105'} ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <HiHeart size={22} className={`transition-all duration-200 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-3 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white transition-all"><HiShare size={22} /></button>
                </div>
                {!listing.isAvailable && <div className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Currently Rented</div>}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 p-4 overflow-x-auto">
                  {images.map((img, index) => (
                    <button key={index} onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all ${selectedImage === index ? 'ring-2 ring-primary-600 ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = getPlaceholderImage(listing.category); }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{listing.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-600">
                    <span className="flex items-center gap-1"><HiLocationMarker size={18} />{listing.location}</span>
                    <span className="flex items-center gap-1"><HiShieldCheck className="text-green-500" size={18} /> Security: {formatPrice(listing.securityDeposit)}</span>
                  </div>
                </div>
                <span className="text-sm bg-primary-50 text-primary-700 font-semibold px-4 py-2 rounded-full capitalize">{categoryName}</span>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${conditionStyles[listing.condition] || 'bg-gray-50 text-gray-700'}`}><HiCheck className="text-current" size={16} />{conditionLabel}</span>
                {listing.isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg"><HiCheck className="text-green-500" size={16} /> Available</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg"><HiXIcon className="text-red-500" size={16} /> Unavailable</span>
                )}
                {/* Identity Required Badge for high-value items */}
                {identityRequired && (
                  <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ${
                    identityVerified ? 'bg-green-50 text-green-700' : 'bg-purple-50 text-purple-700'
                  }`}>
                    <HiShieldCheck size={16} />
                    {identityVerified ? 'Identity Verified' : 'Identity Required'}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100" id="reviews">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <HiStar className="text-yellow-400" size={22} />
                    Reviews
                  </h2>
                  {reviews.stats.totalReviews > 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      <StarRating rating={reviews.stats.averageRating} reviewCount={reviews.stats.totalReviews} />
                      <span className="text-sm text-gray-400">{reviews.stats.totalReviews} {reviews.stats.totalReviews === 1 ? 'review' : 'reviews'}</span>
                    </div>
                  )}
                </div>
                <select value={reviewSort} onChange={(e) => setReviewSort(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="newest">Newest</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>

              {/* Rating Breakdown */}
              {reviews.stats.totalReviews > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews.stats.distribution[star] || 0;
                    const pct = reviews.stats.totalReviews > 0 ? (count / reviews.stats.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 w-4">{star}</span>
                        <HiStar className="text-yellow-400" size={14} />
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: pct + '%' }} />
                        </div>
                        <span className="text-gray-400 text-xs w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reviews List */}
              {reviews.reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <HiStar className="mx-auto text-gray-300 mb-2" size={32} />
                  <p>No reviews yet. Be the first to review this item after renting!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {reviews.reviews.map((review) => (
                    <div key={review.id} className="pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-[10px]">
                            {review.reviewer?.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{review.reviewer?.fullName}</p>
                            <p className="text-xs text-gray-400">{review.booking?.startDate ? formatDate(review.booking.startDate) : ''}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mt-2">{review.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">{formatPrice(listing.dailyRate)}</span>
                <span className="text-gray-500"> / day</span>
              </div>

              {listing.securityDeposit > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <HiShieldCheck className="text-green-500" size={16} />
                  <span>Security deposit: {formatPrice(listing.securityDeposit)} (refundable)</span>
                </div>
              )}

              {/* Date Range Picker */}
              {listing.isAvailable && !isOwner && (
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                    <div className="relative">
                      <HiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="date" value={startDate} onChange={handleStartDateChange} min={todayStr}
                        className="input-field pl-10" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                    <div className="relative">
                      <HiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || todayStr} className="input-field pl-10" />
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance Selection */}
              {listing.isAvailable && !isOwner && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Damage Protection <span className="text-xs font-normal text-gray-400">(optional)</span></h3>
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${insurancePlan === 'standard' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="insurance" value="standard" checked={insurancePlan === 'standard'} onChange={(e) => setInsurancePlan(e.target.value)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">Standard Protection</span>
                        <span className="font-semibold text-primary-600 text-sm">+$12</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Coverage up to $1,000 — covers accidental damage</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all mt-2 ${insurancePlan === 'premium' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="insurance" value="premium" checked={insurancePlan === 'premium'} onChange={(e) => setInsurancePlan(e.target.value)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">Premium Protection</span>
                        <span className="font-semibold text-primary-600 text-sm">+$25</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">Coverage up to $3,000 — comprehensive coverage</p>
                    </div>
                  </label>
                  {insurancePlan && (
                    <button onClick={() => setInsurancePlan('')} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Remove protection</button>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              {priceBreakdown && (
                <div className="space-y-2 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatPrice(priceBreakdown.dailyRate)} x {priceBreakdown.days} {priceBreakdown.days === 1 ? 'day' : 'days'}</span>
                    <span>{formatPrice(priceBreakdown.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform fee (10%)</span><span>{formatPrice(priceBreakdown.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Service fee</span><span>{formatPrice(priceBreakdown.serviceFee)}</span>
                  </div>
                  {priceBreakdown.securityDeposit > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Security deposit</span><span>{formatPrice(priceBreakdown.securityDeposit)}</span>
                    </div>
                  )}
                  {insurancePlan === 'standard' && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1"><HiBadgeCheck size={14} /> Damage Protection (Standard)</span>
                      <span>+$12.00</span>
                    </div>
                  )}
                  {insurancePlan === 'premium' && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1"><HiBadgeCheck size={14} /> Damage Protection (Premium)</span>
                      <span>+$25.00</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900 text-base pt-2 border-t border-gray-100">
                    <span>Total</span><span>{formatPrice(priceBreakdown.total + (insurancePlan === 'standard' ? 12 : insurancePlan === 'premium' ? 25 : 0))}</span>
                  </div>
                </div>
              )}

              {/* Book Now / Owner message */}
              {isOwner ? (
                <div className="text-center text-sm text-gray-500 py-3">You own this listing</div>
              ) : listing.isAvailable ? (
                <button onClick={handleBookNow} disabled={bookingLoading || !startDate || !endDate}
                  className="btn-primary w-full text-center mb-4">
                  {bookingLoading ? 'Booking...' : 'Book Now'}
                </button>
              ) : (
                <button disabled className="btn-primary w-full text-center mb-4 opacity-50 cursor-not-allowed">Not Available</button>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mb-6">
                <HiShieldCheck className="text-green-500" size={16} />
                <span>Secure payment. Cancel anytime.</span>
              </div>

              {/* Owner Card */}
              {listing.owner && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Listed by</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{ownerInitials}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{listing.owner.fullName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {listing.owner.location && <span>{listing.owner.location}</span>}
                        {listing.owner.isVerified && <><span>·</span><span className="text-blue-600">Verified</span></>}
                        <span>·</span>
                        <span>Member since {listing.owner.createdAt ? formatDate(listing.owner.createdAt, { year: 'numeric', month: 'short' }) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;

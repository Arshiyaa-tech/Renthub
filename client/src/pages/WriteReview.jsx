import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiChevronLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { formatDate, getPlaceholderImage } from '../utils/helpers';
import { getBookingById } from '../services/bookingService';
import { createReview } from '../services/reviewService';

const WriteReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { if (bookingId) fetchBooking(); }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await getBookingById(bookingId);
      const data = res.data;
      if (data.status !== 'COMPLETED') setError('Can only review completed bookings');
      setBooking(data);
    } catch (err) { setError(err.message || 'Failed to load booking');
    } finally { setLoading(false); }
  };

  const validate = () => {
    const errors = {};
    if (!form.rating || form.rating < 1) errors.rating = 'Select a rating';
    if (!form.title.trim() || form.title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
    if (form.title.trim().length > 100) errors.title = 'Title max 100 characters';
    if (!form.comment.trim() || form.comment.trim().length < 20) errors.comment = 'Comment must be at least 20 characters';
    if (form.comment.trim().length > 1000) errors.comment = 'Comment max 1000 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await createReview({ bookingId, rating: form.rating, title: form.title.trim(), comment: form.comment.trim() });
      if (res.success) { toast.success('Review submitted!'); navigate('/my-reviews'); }
    } catch (err) { toast.error(err.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);
  if (error && !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Cannot write review</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/bookings" className="btn-primary">My Bookings</Link>
      </div>
    </div>
  );

  const revieweeName = booking?.owner?.fullName || 'the other party';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={'/bookings/' + bookingId} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <HiChevronLeft size={20} /> Back to booking
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Write a Review</h1>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              <img src={booking?.listing?.imageUrls?.[0] || getPlaceholderImage(booking?.listing?.category)} alt={booking?.listing?.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{booking?.listing?.title}</p>
              <p className="text-sm text-gray-500">{formatDate(booking?.startDate)} - {formatDate(booking?.endDate)}</p>
              <p className="text-xs text-gray-400">Reviewing: {revieweeName}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex items-center gap-2">
              <StarRating rating={form.rating} interactive onChange={(v) => { setForm({...form, rating: v}); setFormErrors({...formErrors, rating: ''}); }} size="lg" />
              <span className="text-sm text-gray-500 ml-2">{form.rating > 0 ? form.rating + ' out of 5' : 'Select a rating'}</span>
            </div>
            {formErrors.rating && <p className="text-xs text-red-500 mt-1">{formErrors.rating}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={form.title} onChange={(e) => { setForm({...form, title: e.target.value}); setFormErrors({...formErrors, title: ''}); }}
              placeholder="Summarize your experience" className="input-field" maxLength={100} />
            <div className="flex justify-between mt-1">
              {formErrors.title && <p className="text-xs text-red-500">{formErrors.title}</p>}
              <p className="text-xs text-gray-400 ml-auto">{form.title.length}/100</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment</label>
            <textarea value={form.comment} onChange={(e) => { setForm({...form, comment: e.target.value}); setFormErrors({...formErrors, comment: ''}); }}
              rows={5} placeholder="Share your experience..." className="input-field resize-none" maxLength={1000} />
            <div className="flex justify-between mt-1">
              {formErrors.comment && <p className="text-xs text-red-500">{formErrors.comment}</p>}
              <p className="text-xs text-gray-400 ml-auto">{form.comment.length}/1000</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5">{submitting ? 'Submitting...' : 'Submit Review'}</button>
            <Link to={'/bookings/' + bookingId} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReview;

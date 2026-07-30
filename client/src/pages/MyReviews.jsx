import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendar, HiStar as HiStarIcon } from 'react-icons/hi';
import toast from 'react-hot-toast';
import StarRating from '../components/StarRating';
import { formatDate, getPlaceholderImage, getInitials } from '../utils/helpers';
import { getMyReviews, deleteReview } from '../services/reviewService';

const MyReviews = () => {
  const [data, setData] = useState({ written: [], received: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('written');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await getMyReviews();
      setData(res.data);
    } catch (err) { toast.error('Failed to load reviews');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    setDeleting(id);
    try {
      await deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
    } catch (err) { toast.error(err.message || 'Failed to delete');
    } finally { setDeleting(null); }
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  const reviews = activeTab === 'written' ? data.written : data.received;
  const s = data.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">Manage your reviews and reputation</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-primary-600">{s.writtenCount || 0}</p>
            <p className="text-sm text-gray-500">Written</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-2xl font-bold text-green-600">{s.receivedCount || 0}</p>
            <p className="text-sm text-gray-500">Received</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-yellow-500">{s.averageRating ? s.averageRating.toFixed(1) : '0'}</span>
              <HiStarIcon className="text-yellow-400" size={20} />
            </div>
            <p className="text-sm text-gray-500">Avg Rating</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('written')}
            className={'px-5 py-2.5 rounded-full text-sm font-medium transition-all ' + (activeTab === 'written' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')}>
            Written ({data.written.length})
          </button>
          <button onClick={() => setActiveTab('received')}
            className={'px-5 py-2.5 rounded-full text-sm font-medium transition-all ' + (activeTab === 'received' ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')}>
            Received ({data.received.length})
          </button>
        </div>
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">⭐</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} reviews yet</h2>
            <p className="text-gray-500">{activeTab === 'written' ? 'Write reviews for completed bookings' : 'Reviews from others will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const person = activeTab === 'written' ? review.reviewee : review.reviewer;
              return (
                <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs flex-shrink-0">{getInitials(person?.fullName)}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{person?.fullName}</p>
                        <p className="text-xs text-gray-500">{activeTab === 'written' ? 'Reviewee' : 'Reviewer'}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{review.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {review.listing && <span className="font-medium text-primary-600 truncate max-w-[150px]">{review.listing.title}</span>}
                      <span className="flex items-center gap-1"><HiCalendar size={12} />{formatDate(review.createdAt)}</span>
                    </div>
                    {activeTab === 'written' && (
                      <button onClick={() => handleDelete(review.id)} disabled={deleting === review.id}
                        className="text-xs text-red-500 hover:text-red-700 px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                        {deleting === review.id ? '...' : 'Delete'}
                      </button>
                    )}
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

export default MyReviews;

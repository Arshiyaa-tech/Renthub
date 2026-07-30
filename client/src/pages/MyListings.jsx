import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiLocationMarker, HiPencil, HiTrash, HiPlus, HiEye } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, getPlaceholderImage } from '../utils/helpers';
import { getMyListings, deleteListing } from '../services/listingService';

/**
 * My Listings page — fetches and displays the owner's listings.
 * Supports edit, delete, and view details actions.
 */
const MyListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await getMyListings();
      setListings(response.data || []);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleting(id);
    try {
      await deleteListing(id);
      toast.success('Listing deleted');
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (error) {
      toast.error(error.message || 'Failed to delete listing');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-600 mt-2">{listings.length} {listings.length === 1 ? 'item' : 'items'} listed</p>
          </div>
          <Link to="/create-listing" className="btn-primary flex items-center gap-2">
            <HiPlus size={20} /> Create Listing
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No listings yet</h2>
            <p className="text-gray-500 mb-6">Start earning by listing your first item</p>
            <Link to="/create-listing" className="btn-primary inline-flex items-center gap-2">
              <HiPlus size={20} /> Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all">
                {/* Image */}
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                  <img
                    src={item.imageUrls?.[0] || getPlaceholderImage(item.category)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => { e.target.src = getPlaceholderImage(item.category); }}
                  />
                  <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    item.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.isAvailable ? 'Available' : 'Rented'}
                  </span>
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-700 px-2.5 py-1 rounded-full capitalize">
                    {item.category?.replace(/-/g, ' ')}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <HiLocationMarker size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.condition?.toLowerCase().replace(/_/g, ' ')}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">₹{item.securityDeposit} deposit</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(item.dailyRate)}
                      <span className="text-sm font-normal text-gray-500">/day</span>
                    </span>
                    <div className="flex gap-1">
                      <Link to={`/listings/${item.id}`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="View Details">
                        <HiEye size={18} />
                      </Link>
                      <Link to={`/create-listing?edit=${item.id}`}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Edit">
                        <HiPencil size={18} />
                      </Link>
                      <button onClick={() => handleDelete(item.id, item.title)} disabled={deleting === item.id}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                        <HiTrash size={18} className={deleting === item.id ? 'animate-pulse' : ''} />
                      </button>
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

export default MyListings;

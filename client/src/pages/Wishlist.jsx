import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiHeart, HiLocationMarker, HiStar, HiTrash, HiSearch, HiAdjustments } from 'react-icons/hi';
import { formatPrice, getPlaceholderImage } from '../utils/helpers';
import { CATEGORIES } from '../utils/constants';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Saved' },
  { value: 'oldest', label: 'Oldest Saved' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'title', label: 'Alphabetical' },
];

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (search) params.search = search;
      if (category) params.category = category;
      if (availableOnly) params.available = 'true';
      const res = await getWishlist(params);
      if (res.success) setItems(res.data || []);
    } catch (e) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [search, category, availableOnly, sort]);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  const handleRemove = async (listingId) => {
    try {
      const res = await removeFromWishlist(listingId);
      if (res.success) {
        setItems(prev => prev.filter(i => i.listingId !== listingId && i.listing?.id !== listingId));
        toast.success('Removed from wishlist');
      }
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} saved</p>
            </div>
            <Link to="/listings" className="btn-primary px-5 py-2.5 text-sm">Browse Rentals</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search wishlist..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 bg-white text-sm" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary-500">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ${showFilters ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
            <HiAdjustments size={18} /> Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-primary-500">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700">Available only</span>
            </label>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5 space-y-3"><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love by tapping the heart icon</p>
            <Link to="/listings" className="btn-primary inline-flex items-center gap-2">Browse Rentals</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((w) => {
              const item = w.listing || w;
              const listingId = item.id;
              return (
                <div key={w.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <img src={item.imageUrls?.[0] || getPlaceholderImage(item.category)} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy"
                      onError={e => { e.target.src = getPlaceholderImage(item.category); }} />
                    <button onClick={() => handleRemove(listingId)}
                      className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-white hover:scale-110 transition-all shadow-md">
                      <HiTrash size={16} />
                    </button>
                    {item.isAvailable === false && (
                      <span className="absolute bottom-3 left-3 bg-red-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Unavailable</span>
                    )}
                  </div>
                  <Link to={`/listings/${listingId}`} className="p-5 block">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1">{item.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <HiLocationMarker size={14} className="mr-1 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      <HiStar className="text-yellow-400 fill-current" size={16} />
                      <span className="text-sm font-medium text-gray-700">{item.averageRating || 'New'}</span>
                      {item.reviewCount > 0 && <span className="text-xs text-gray-400">({item.reviewCount})</span>}
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(item.dailyRate)}<span className="text-sm font-normal text-gray-500">/day</span>
                      </span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {item.isAvailable ? 'Available' : 'Rented'}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

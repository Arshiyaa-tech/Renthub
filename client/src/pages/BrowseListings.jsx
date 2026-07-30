import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { HiSearch, HiLocationMarker, HiStar, HiAdjustments, HiX, HiViewGrid, HiViewList, HiHeart } from 'react-icons/hi';
import { CATEGORIES, CONDITIONS } from '../utils/constants';
import { formatPrice, getPlaceholderImage } from '../utils/helpers';
import { getListings } from '../services/listingService';
import { addToWishlist, removeFromWishlist, getWishlist } from '../services/wishlistService';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * Browse Listings — fetches real data from API with search, filter, sort.
 */
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'title', label: 'Alphabetical' },
];

const BrowseListings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availableOnly, setAvailableOnly] = useState(false);

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [wishlistSet, setWishlistSet] = useState(new Set());
  const [wlLoading, setWlLoading] = useState(null);

  // Fetch wishlist IDs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getWishlist().then(res => {
        if (res.success) setWishlistSet(new Set(res.data.map(w => w.listing?.id || w.listingId)));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings();
  }, [selectedCategory, selectedCondition, sortBy, priceRange, availableOnly, page]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {
        sort: sortBy,
        page,
        limit: 12,
      };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedCondition) params.condition = selectedCondition;
      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;
      if (availableOnly) params.available = 'true';

      const response = await getListings(params);
      setListings(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleWishlistToggle = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please log in to save items');
      return;
    }
    setWlLoading(listingId);
    try {
      if (wishlistSet.has(listingId)) {
        await removeFromWishlist(listingId);
        setWishlistSet(prev => { const n = new Set(prev); n.delete(listingId); return n; });
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(listingId);
        setWishlistSet(prev => new Set(prev).add(listingId));
        toast.success('Added to wishlist');
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setWlLoading(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCondition('');
    setPriceRange({ min: '', max: '' });
    setAvailableOnly(false);
    setPage(1);
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedCondition || priceRange.min || priceRange.max || availableOnly;
  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Rentals</h1>
          <p className="text-gray-600 mt-2">Find the perfect item for your next project or adventure</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Sort */}
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Search by title, description, or location..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 bg-white shadow-sm" />
          </div>
          <button type="submit" className="btn-primary px-6 py-3">Search</button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 text-gray-700">
            {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showFilters ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}>
            <HiAdjustments size={20} /><span className="hidden sm:inline">Filters</span>
          </button>
          <div className="hidden sm:flex items-center bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}><HiViewGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}><HiViewList size={20} /></button>
          </div>
        </form>

        <div className="flex gap-8">
          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><HiX size={14} /> Clear</button>
                )}
              </div>

              {/* Category */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCategory('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat.name}</button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Condition</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setSelectedCondition('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!selectedCondition ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Any</button>
                  {CONDITIONS.map((c) => (
                    <button key={c.value} onClick={() => setSelectedCondition(c.value === selectedCondition ? '' : c.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedCondition === c.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.label}</button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range (₹/day)</h4>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>

              {/* Available */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700">Available only</span>
              </label>
            </div>
          </div>

          {/* Listings */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">Showing {listings.length} of {total} items</p>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                  {listings.map((item) => {
                    const isSaved = wishlistSet.has(item.id);
                    return (
                    <Link key={item.id} to={`/listings/${item.id}`}
                      className={`group bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300 overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`${viewMode === 'list' ? 'w-48 h-full flex-shrink-0' : 'h-48'} bg-gray-100 overflow-hidden relative`}>
                        <img src={item.imageUrls?.[0] || getPlaceholderImage(item.category)} alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy"
                          onError={(e) => { e.target.src = getPlaceholderImage(item.category); }} />
                        <button onClick={(e) => handleWishlistToggle(e, item.id)}
                          className={`absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 shadow-md ${
                            isSaved ? 'bg-red-500 text-white scale-110' : 'bg-white/90 backdrop-blur-sm text-gray-500 hover:bg-white hover:text-red-500'
                          } ${wlLoading === item.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <HiHeart size={18} className={`transition-all ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-700 px-2.5 py-1 rounded-full capitalize">
                          {item.category?.replace(/-/g, ' ')}
                        </span>
                        {!item.isAvailable && (
                          <span className="absolute bottom-3 left-3 bg-red-500/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Rented</span>
                        )}
                      </div>
                      <div className="p-5 flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-1 truncate">{item.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-1">
                          <HiLocationMarker size={14} className="mr-1 flex-shrink-0" />{item.location}
                        </div>
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{item.condition?.toLowerCase().replace(/_/g, ' ')}</span>
                          {item.owner?.fullName && (
                            <span className="text-xs text-gray-400">by {item.owner.fullName.split(' ')[0]}</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-lg font-bold text-primary-600">{formatPrice(item.dailyRate)}<span className="text-sm font-normal text-gray-500">/day</span></span>
                          <span className="text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform">Details →</span>
                        </div>
                      </div>                      </Link>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-all">Previous</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                    ))}
                    {totalPages > 5 && <span className="text-gray-400">...</span>}
                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 transition-all">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseListings;

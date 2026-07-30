import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaCheckDouble, FaTrash, FaTimes, FaSearch, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService';
import { formatDate } from '../utils/helpers';

const TYPE_ICONS = {
  BOOKING_REQUEST: '📅', BOOKING_CONFIRMED: '✅', BOOKING_REJECTED: '❌',
  BOOKING_CANCELLED: '🚫', BOOKING_COMPLETED: '🎉',
  PAYMENT_AUTHORIZED: '💳', PAYMENT_CAPTURED: '💰', PAYMENT_REFUNDED: '🔄',
  REVIEW_RECEIVED: '⭐', DISPUTE_CREATED: '⚠️', DISPUTE_UPDATED: '📋',
  SYSTEM: '🔔',
};

const Notifications = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [al, setAl] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 20 };
      if (search) params.search = search;
      if (filter === 'read') params.isRead = 'true';
      else if (filter === 'unread') params.isRead = 'false';
      const res = await getNotifications(params);
      if (res.success) { setList(res.data); setPagination(res.pagination); }
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [page, search, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filter]);

  const handleMarkRead = async (id) => {
    setAl(id);
    try { await markAsRead(id); setList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); }
    catch (e) { toast.error('Failed'); }
    finally { setAl(null); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setList(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (e) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    setAl('del-' + id);
    try { await deleteNotification(id); setList(prev => prev.filter(n => n.id !== id)); toast.success('Deleted'); }
    catch (e) { toast.error('Failed'); }
    finally { setAl(null); }
  };

  const getLink = (n) => {
    if (n.referenceType === 'booking' && n.referenceId) return '/bookings/' + n.referenceId;
    if (n.type.startsWith('PAYMENT') && n.referenceId) return '/payments/' + n.referenceId;
    if (n.type.startsWith('REVIEW')) return '/my-reviews';
    if (n.type.startsWith('DISPUTE') && n.referenceId) return '/disputes/' + n.referenceId;
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-500 text-sm mt-1">Stay updated with your activity</p>
            </div>
            {list.some(n => !n.isRead) && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition">
                <FaCheckDouble size={16} /> Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}</div>
          ) : list.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <FaBell size={40} className="mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
              <p className="text-gray-500 text-sm">{search || filter ? 'No matching notifications found' : 'You\'re all caught up!'}</p>
            </div>
          ) : (
            list.map(n => (
              <div key={n.id} className={`flex items-start gap-4 bg-white rounded-xl border p-4 transition-all hover:shadow-sm ${n.isRead ? 'border-gray-100' : 'border-primary-200 bg-primary-50/30'}`}>
                <span className="text-xl mt-1">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm ${n.isRead ? 'font-medium text-gray-900' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                      {!n.isRead && <span className="inline-block w-2 h-2 rounded-full bg-primary-500 ml-1" />}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n.id)} disabled={al === n.id}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition" title="Mark Read">
                          {al === n.id ? <span className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin block" /> : <FaCheck size={12} />}
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} disabled={al === 'del-' + n.id}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                        {al === 'del-' + n.id ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" /> : <FaTrash size={12} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(n.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  {getLink(n) && (
                    <Link to={getLink(n)} className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block" onClick={() => handleMarkRead(n.id)}>
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={!pagination.hasPrevious || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Previous
              </button>
              <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNext || loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

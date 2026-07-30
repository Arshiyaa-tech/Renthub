import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBell, FaCheckDouble, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getUnreadNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
import { formatDate, getInitials } from '../utils/helpers';

const TYPE_ICONS = {
  BOOKING_REQUEST: '📅', BOOKING_CONFIRMED: '✅', BOOKING_REJECTED: '❌',
  BOOKING_CANCELLED: '🚫', BOOKING_COMPLETED: '🎉',
  PAYMENT_AUTHORIZED: '💳', PAYMENT_CAPTURED: '💰', PAYMENT_REFUNDED: '🔄',
  REVIEW_RECEIVED: '⭐', DISPUTE_CREATED: '⚠️', DISPUTE_UPDATED: '📋',
  SYSTEM: '🔔',
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState({ count: 0, recent: [] });
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchUnread = useCallback(async () => {
    try {
      const res = await getUnreadNotifications();
      if (res.success) setUnread(res.data);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { fetchUnread(); }, [fetchUnread]);

  // Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try { await markAsRead(id); fetchUnread(); } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All marked as read');
      setUnread({ count: 0, recent: [] });
    } catch (e) { toast.error('Failed'); }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-all" title="Notifications">
        <FaBell size={18} />
        {unread.count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse">
            {unread.count > 9 ? '9+' : unread.count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread.count > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                  <FaCheckDouble size={12} /> Mark All Read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600"><FaTimes size={14} /></button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {unread.recent.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaBell size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              unread.recent.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50" onClick={() => handleMarkRead(n.id)}>
                  <span className="text-lg mt-1">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 truncate">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(n.createdAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-3 text-center">
            <button onClick={handleViewAll} className="text-sm font-medium text-primary-600 hover:text-primary-700">View All Notifications</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

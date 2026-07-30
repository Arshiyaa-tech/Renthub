import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { HiChartBar, HiUsers, HiCurrencyRupee, HiStar, HiShieldExclamation, HiSearch, HiDownload, HiRefresh, HiCheck, HiBan, HiTrash, HiEye } from 'react-icons/hi';
import { FaBox, FaCalendarCheck, FaList, FaCreditCard, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  getAdminDashboard, getAdminUsers, verifyUser, suspendUser, reactivateUser, deleteUser,
  getAdminListings, deleteAdminListing, toggleListingStatus,
  getAdminBookings, updateAdminBooking,
  getAdminPayments, getAdminReviews, deleteAdminReview,
  exportAdminData,
} from '../services/adminService';
import { formatDate, formatPrice, getInitials, getPlaceholderImage } from '../utils/helpers';

const TABS = [
  { id: 'overview', label: 'Overview', icon: HiChartBar },
  { id: 'users', label: 'Users', icon: HiUsers },
  { id: 'listings', label: 'Listings', icon: FaList },
  { id: 'bookings', label: 'Bookings', icon: FaCalendarCheck },
  { id: 'payments', label: 'Payments', icon: FaCreditCard },
  { id: 'reviews', label: 'Reviews', icon: FaStar },
  { id: 'disputes', label: 'Disputes', icon: FaExclamationTriangle },
];

const BSS = {
  PENDING: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-green-100 text-green-700', COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700', REJECTED: 'bg-red-100 text-red-700',
};
const PSS = {
  PENDING: 'bg-yellow-100 text-yellow-700', AUTHORIZED: 'bg-blue-100 text-blue-700',
  CAPTURED: 'bg-green-100 text-green-700', REFUNDED: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700',
};

const MiniBarChart = ({ data, color = 'primary', h = 40 }) => {
  const max = Math.max(...data, 1);
  const cm = { primary: 'bg-primary-500', blue: 'bg-blue-500', green: 'bg-green-500', orange: 'bg-orange-500', purple: 'bg-purple-500' };
  return (
    <div className="flex items-end gap-1" style={{ height: h + 'px' }}>
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${cm[color]} opacity-70 hover:opacity-100 transition-opacity`}
          style={{ height: Math.max((v / max) * h, 2) + 'px' }}
          title={v.toString()}
        />
      ))}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
    <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
      <Icon className={color} size={22} />
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Stars = ({ r }) =>
  r ? (
    <span className="text-yellow-500">{'★'.repeat(Math.round(r))} <span className="text-gray-500 text-sm">{r.toFixed(1)}</span></span>
  ) : (
    <span className="text-gray-400 text-sm">—</span>
  );

const LoadingRow = ({ cols }) => (
  <tr><td colSpan={cols} className="p-4">
    <div className="animate-pulse space-y-3">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-gray-200 rounded" />)}
    </div>
  </td></tr>
);

const EmptyRow = ({ cols, msg }) => (
  <tr><td colSpan={cols} className="text-center py-12 text-gray-500">{msg}</td></tr>
);
const PaginationBar = ({ pagination, page, setPage, loading }) => {
  if (!pagination || !pagination.total) return null;
  const from = pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.pageSize) + 1;
  const to = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{' '}
        <span className="font-medium">{pagination.total}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={!pagination.hasPrevious || loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>
        <span className="px-3 py-1.5 text-sm text-gray-700">
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!pagination.hasNext || loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [sq, setSq] = useState('');
  const [fs, setFs] = useState('');
  const [fr, setFr] = useState('');
  const [sb, setSb] = useState('newest');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Helper to get current pagination info
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [pg, setPg] = useState({}); // pagination metadata per tab: { users: {...}, listings: {...} }
  const [dl, setDl] = useState(false);
  const [al, setAl] = useState(null);
  const [cm, setCm] = useState(null);

  useEffect(() => { if (activeTab === 'overview' && !db) fD(); }, [activeTab]);

  const fD = async () => {
    setLoading(true);
    try { const r = await getAdminDashboard(); if (r.success) setDb(r.data); }
    catch (e) { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const fTD = useCallback(async () => {
    setDl(true);
    try {
      const p = {};
      if (sq) p.search = sq;
      if (fs) p.status = fs;
      if (fr) p.role = fr;
      if (sb) p.sort = sb;
      let r;
      p.page = page;
      p.pageSize = pageSize;
      const tab = activeTab;
      switch (tab) {
        case 'users': r = await getAdminUsers(p); if (r.success) { setUsers(r.data); setPg(prev => ({ ...prev, users: r.pagination })); } break;
        case 'listings': r = await getAdminListings(p); if (r.success) { setListings(r.data); setPg(prev => ({ ...prev, listings: r.pagination })); } break;
        case 'bookings': r = await getAdminBookings(p); if (r.success) { setBookings(r.data); setPg(prev => ({ ...prev, bookings: r.pagination })); } break;
        case 'payments': r = await getAdminPayments(p); if (r.success) { setPayments(r.data); setPg(prev => ({ ...prev, payments: r.pagination })); } break;
        case 'reviews': r = await getAdminReviews(p); if (r.success) { setReviews(r.data); setPg(prev => ({ ...prev, reviews: r.pagination })); } break;
        default: break;
      }
      // Auto-navigate to previous page if current page is now empty
      if (r?.data?.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (e) { toast.error('Failed to load'); }
    finally { setDl(false); }
  }, [activeTab, sq, fs, fr, sb, page]);

  useEffect(() => { if (activeTab !== 'overview') fTD(); }, [activeTab, fTD]);
  useEffect(() => { setPage(1); }, [sq, fs, fr, sb, activeTab]);

  const actionHandlers = {
    verifyUser: (id) => verifyUser(id),
    suspendUser: (id) => suspendUser(id),
    reactivateUser: (id) => reactivateUser(id),
    deleteUser: (id) => deleteUser(id),
    deleteListing: (id) => deleteAdminListing(id),
    toggleListing: (id) => toggleListingStatus(id),
    updateBooking: (id, extra) => updateAdminBooking(id, extra),
    deleteReview: (id) => deleteAdminReview(id),
  };

  const hA = async (action, id, extra) => {
    setAl(id + action);
    try {
      const fn = actionHandlers[action];
      if (!fn) throw new Error('Unknown action: ' + action);
      const r = extra !== undefined ? await fn(id, extra) : await fn(id);
      if (r?.success) {
        toast.success(r.message || 'Done');
        setCm(null);
        fTD();
        if (activeTab === 'overview') fD();
      }
    } catch (e) { toast.error(e.response?.data?.message || e.message || 'Failed'); }
    finally { setAl(null); }
  };

  const hE = async (type) => {
    try {
      const blob = await exportAdminData(type, { status: fs || undefined });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'renthub_' + type + '_' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(type + ' exported');
    } catch (e) { toast.error('Export failed'); }
  };

  const ConfirmModal = () => {
    if (!cm) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setCm(null)}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <HiBan size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{cm.title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">{cm.message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCm(null)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Cancel</button>
            <button onClick={() => hA(cm.action, cm.id, cm.extra)}
              disabled={al === cm.id + cm.action}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
              {al === cm.id + cm.action ? 'Processing...' : cm.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ===== Overview Tab =====
  const renderOverview = () => {
    if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>;
    if (!db) return <div className="text-center py-20 text-gray-500">Failed to load. <button onClick={fD} className="text-primary-600 hover:underline">Retry</button></div>;
    const s = db.stats;
    const ch = db.charts;
    const to = db.topOwners;
    const tl = db.topListings;
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={s.users.total} icon={HiUsers} color="text-blue-600" bg="bg-blue-50" sub={s.users.owners + ' Owners | ' + s.users.renters + ' Renters'} />
          <StatCard label="Verified" value={s.users.verified} icon={HiCheck} color="text-green-600" bg="bg-green-50" sub={s.users.suspended + ' Suspended'} />
          <StatCard label="Active Listings" value={s.listings.active} icon={FaBox} color="text-indigo-600" bg="bg-indigo-50" sub={s.listings.unavailable + ' Unavailable'} />
          <StatCard label="Total Bookings" value={s.bookings.total} icon={FaCalendarCheck} color="text-primary-600" bg="bg-primary-50" sub={s.bookings.pending + ' Pending'} />
          <StatCard label="Completed" value={s.bookings.completed} icon={HiCheck} color="text-green-600" bg="bg-green-50" sub={s.bookings.cancelled + ' Cancelled'} />
          <StatCard label="Revenue" value={formatPrice(s.revenue.total)} icon={HiCurrencyRupee} color="text-accent-600" bg="bg-orange-50" sub={formatPrice(s.revenue.platformEarnings) + ' fees'} />
          <StatCard label="Avg Rating" value={s.reviews.averageRating} icon={HiStar} color="text-yellow-500" bg="bg-yellow-50" sub={s.reviews.total + ' Reviews'} />
          <StatCard label="Open Disputes" value={s.disputes.open} icon={HiShieldExclamation} color="text-red-600" bg="bg-red-50" sub={s.disputes.resolved + ' Resolved'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-3">Revenue</h3>
            <MiniBarChart data={ch.monthlyRevenue} color="green" h={80} />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-3">Bookings</h3>
            <MiniBarChart data={ch.monthlyBookings} color="primary" h={80} />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => <span key={i}>{m}</span>)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-3">Categories</h3>
            {(ch.categoryDistribution || []).slice(0, 8).map((c, i) => {
              const mx = Math.max(...ch.categoryDistribution.map(x => x.count), 1);
              return (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-gray-600 w-28 truncate">{c.category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-primary-500 rounded-full h-2" style={{ width: Math.min((c.count / mx) * 100, 100) + '%' }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{c.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-4">Top Owners</h3>
            {to && to.length > 0 ? to.slice(0, 5).map((o, i) => (
              <div key={o.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">{getInitials(o.fullName)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{o.fullName}</p>
                  <p className="text-xs text-gray-500 truncate">{o.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(o.totalRevenue)}</p>
                  <Stars r={o.averageRating} />
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">No data</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold mb-4">Top Rentals</h3>
            {tl && tl.length > 0 ? tl.slice(0, 5).map((l, i) => (
              <div key={l.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                <img src={l.imageUrls?.[0] || getPlaceholderImage(l.category)} alt={l.title} className="w-8 h-8 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <p className="text-xs text-gray-500">{l.ownerName} | {l.bookingCount} bookings</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(l.dailyRate)}/d</p>
                  <Stars r={l.averageRating} />
                </div>
              </div>
            )) : <p className="text-sm text-gray-500 text-center py-4">No data</p>}
          </div>
        </div>
      </div>
    );
  };

  // ===== Users Tab =====
  const renderUsers = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Listings</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dl ? <LoadingRow cols={8} /> : users.length === 0 ? <EmptyRow cols={8} msg="No users found" /> : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">{getInitials(u.fullName)}</div>
                    <span className="font-medium">{u.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'OWNER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">{u.isVerified ? <HiCheck className="text-green-500" size={18} /> : <HiBan className="text-red-400" size={18} />}</td>
                <td className="px-4 py-3">{u.totalListings || 0}</td>
                <td className="px-4 py-3"><Stars r={u.averageRating} /></td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(u.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {!u.isVerified && (
                      <button onClick={() => hA('verifyUser', u.id)} disabled={al === u.id + 'verifyUser'}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Verify">
                        {al === u.id + 'verifyUser' ? (
                          <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin block" />
                        ) : <HiCheck size={16} />}
                      </button>
                    )}
                    {u.isVerified && (
                      <button onClick={() => setCm({ title: 'Suspend User', message: 'Suspend ' + u.fullName + '?', action: 'suspendUser', id: u.id, confirmText: 'Suspend' })}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Suspend"><HiBan size={16} /></button>
                    )}
                    {!u.isVerified && (
                      <button onClick={() => hA('reactivateUser', u.id)} disabled={al === u.id + 'reactivateUser'}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Reactivate">
                        {al === u.id + 'reactivateUser' ? (
                          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin block" />
                        ) : <HiRefresh size={16} />}
                      </button>
                    )}
                    <button onClick={() => setCm({ title: 'Delete User', message: 'Delete ' + u.fullName + '?', action: 'deleteUser', id: u.id, confirmText: 'Delete' })}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><HiTrash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pg.users} page={page} setPage={setPage} loading={dl} />
    </div>
  );

  // ===== Listings Tab =====
  const renderListings = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rate</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Bookings</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dl ? <LoadingRow cols={8} /> : listings.length === 0 ? <EmptyRow cols={8} msg="No listings found" /> : listings.map(l => (
              <tr key={l.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={l.imageUrls?.[0] || getPlaceholderImage(l.category)} alt={l.title} className="w-10 h-10 rounded-lg object-cover" />
                    <span className="font-medium">{l.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.owner?.fullName}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{l.category}</span></td>
                <td className="px-4 py-3 font-medium">{formatPrice(l.dailyRate)}<span className="text-gray-500 text-xs">/day</span></td>
                <td className="px-4 py-3">{l.isAvailable ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-red-500 text-xs font-medium">Inactive</span>}</td>
                <td className="px-4 py-3">{l.bookingCount}</td>
                <td className="px-4 py-3"><Stars r={l.averageRating} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => hA('toggleListing', l.id)} disabled={al === l.id + 'toggleListing'}
                      className={`p-1.5 rounded-lg transition ${l.isAvailable ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                      title={l.isAvailable ? 'Disable' : 'Enable'}>
                      {al === l.id + 'toggleListing' ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block" />
                      ) : l.isAvailable ? <HiBan size={16} /> : <HiCheck size={16} />}
                    </button>
                    <Link to={'/listings/' + l.id} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><HiEye size={16} /></Link>
                    <button onClick={() => setCm({ title: 'Delete Listing', message: 'Delete "' + l.title + '"?', action: 'deleteListing', id: l.id, confirmText: 'Delete' })}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><HiTrash size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pg.listings} page={page} setPage={setPage} loading={dl} />
    </div>
  );

  // ===== Bookings Tab =====
  const renderBookings = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Renter</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Dates</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dl ? <LoadingRow cols={8} /> : bookings.length === 0 ? <EmptyRow cols={8} msg="No bookings found" /> : bookings.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={b.listing?.imageUrls?.[0] || getPlaceholderImage()} alt={b.listing?.title} className="w-8 h-8 rounded object-cover" />
                    <span className="text-xs font-medium">{b.listing?.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{b.renter?.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{b.owner?.fullName}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {formatDate(b.startDate, { month: 'short', day: 'numeric' })} - {formatDate(b.endDate, { month: 'short', day: 'numeric' })}
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(b.totalAmount)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BSS[b.status] || 'bg-gray-100'}`}>{b.status}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PSS[b.payment?.status] || 'bg-gray-100'}`}>{b.payment?.status || 'N/A'}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {b.status === 'PENDING' && (
                      <>
                        <button onClick={() => hA('updateBooking', b.id, 'CONFIRMED')} disabled={al === b.id + 'updateBooking'}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Confirm">
                          {al === b.id + 'updateBooking' ? (
                            <span className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin block" />
                          ) : <HiCheck size={16} />}
                        </button>
                        <button onClick={() => hA('updateBooking', b.id, 'CANCELLED')} disabled={al === b.id + 'updateBooking'}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Cancel"><HiBan size={16} /></button>
                      </>
                    )}
                    {(b.status === 'CONFIRMED' || b.status === 'ACTIVE') && (
                      <button onClick={() => hA('updateBooking', b.id, 'COMPLETED')} disabled={al === b.id + 'updateBooking'}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Complete">
                        {al === b.id + 'updateBooking' ? (
                          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin block" />
                        ) : <HiCheck size={16} />}
                      </button>
                    )}
                    <Link to={'/bookings/' + b.id} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" title="View"><HiEye size={16} /></Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pg.bookings} page={page} setPage={setPage} loading={dl} />
    </div>
  );

  // ===== Payments Tab =====
  const renderPayments = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Deposit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fees</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Booking</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dl ? <LoadingRow cols={8} /> : payments.length === 0 ? <EmptyRow cols={8} msg="No payments found" /> : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{(p.paymentIntentId || '').slice(-12) || '—'}</td>
                <td className="px-4 py-3">{p.listing?.title}</td>
                <td className="px-4 py-3 font-medium">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3 text-gray-600">{formatPrice(p.securityDeposit)}</td>
                <td className="px-4 py-3 text-gray-600">{formatPrice(p.platformFee)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PSS[p.status] || 'bg-gray-100'}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.createdAt, { month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={'/bookings/' + p.bookingId} className="p-1.5 text-blue-600 hover:bg-blue-50 inline-block rounded-lg" title="View"><HiEye size={16} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pg.payments} page={page} setPage={setPage} loading={dl} />
    </div>
  );

  // ===== Reviews Tab =====
  const renderReviews = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Review</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reviewee</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Listing</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dl ? <LoadingRow cols={7} /> : reviews.length === 0 ? <EmptyRow cols={7} msg="No reviews found" /> : reviews.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 max-w-xs">
                  <p className="font-medium text-xs truncate">{r.title}</p>
                  <p className="text-gray-500 text-xs truncate">{r.comment}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-xs">{getInitials(r.reviewer?.fullName)}</div>
                    <span className="text-xs">{r.reviewer?.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-xs">{getInitials(r.reviewee?.fullName)}</div>
                    <span className="text-xs">{r.reviewee?.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{r.listing?.title}</td>
                <td className="px-4 py-3"><Stars r={r.rating} /></td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.createdAt, { month: 'short', day: 'numeric' })}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setCm({ title: 'Delete Review', message: 'Delete review by ' + r.reviewer?.fullName + '?', action: 'deleteReview', id: r.id, confirmText: 'Delete' })}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><HiTrash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar pagination={pg.reviews} page={page} setPage={setPage} loading={dl} />
    </div>
  );

  // ===== Disputes Tab =====
  const renderDisputes = () => (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-3">Manage disputes in the dedicated page</p>
      <Link to="/admin/disputes" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition">
        <HiShieldExclamation size={18} /> Dispute Management
      </Link>
    </div>
  );

  // ===== Filters =====
  const statusOptions = activeTab === 'users'
    ? [{ value: '', label: 'All Roles' }, { value: 'OWNER', label: 'Owners' }, { value: 'RENTER', label: 'Renters' }]
    : activeTab === 'listings'
    ? [{ value: '', label: 'All' }, { value: 'true', label: 'Available' }, { value: 'false', label: 'Unavailable' }]
    : activeTab === 'bookings'
    ? [{ value: '', label: 'All Status' }, ...Object.keys(BSS).map(s => ({ value: s, label: s }))]
    : activeTab === 'reviews'
    ? [{ value: '', label: 'All Ratings' }, { value: '5', label: '5 Star' }, { value: '4', label: '4 Star' }, { value: '3', label: '3 Star' }, { value: '2', label: '2 Star' }, { value: '1', label: '1 Star' }]
    : [];

  const sortOptions = [
    { value: 'newest', label: 'Newest' }, { value: 'oldest', label: 'Oldest' },
    ...(activeTab === 'listings' ? [{ value: 'price_asc', label: 'Price ↑' }, { value: 'price_desc', label: 'Price ↓' }] : []),
    ...(activeTab === 'users' || activeTab === 'listings' ? [{ value: 'alphabetical', label: 'A-Z' }] : []),
  ];

  const Filters = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" value={sq} onChange={e => setSq(e.target.value)} placeholder={'Search ' + activeTab + '...'}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
      </div>
      {statusOptions.length > 1 && (
        <select value={fs || fr} onChange={e => { const v = e.target.value; setFs(v); setFr(activeTab === 'users' ? v : ''); }}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
          {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
      <select value={sb} onChange={e => setSb(e.target.value)}
        className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
        {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {activeTab !== 'overview' && activeTab !== 'disputes' && (
        <button onClick={() => hE(activeTab)}
          className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition flex items-center gap-2">
          <HiDownload size={16} /> Export CSV
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your RentHub marketplace</p>
            </div>
            <button onClick={() => { if (activeTab === 'overview') fD(); else fTD(); }}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition" title="Refresh">
              <HiRefresh size={20} className={(loading || dl) ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white rounded-xl p-1.5 border border-gray-200">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setSq(''); setFs(''); setFr(''); setSb('newest'); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {activeTab !== 'overview' && activeTab !== 'disputes' && <Filters />}

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'listings' && renderListings()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'reviews' && renderReviews()}
        {activeTab === 'disputes' && renderDisputes()}
      </div>

      <ConfirmModal />
    </div>
  );
};

export default AdminDashboard;

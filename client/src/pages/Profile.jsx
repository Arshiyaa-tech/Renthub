import { useState, useEffect } from 'react';
import { HiUser, HiMail, HiPhone, HiLocationMarker, HiCamera, HiPhotograph, HiStar, HiBell, HiHeart, HiShieldCheck, HiBadgeCheck, HiExclamation, HiClock, HiShieldExclamation } from 'react-icons/hi';
import useAuth from '../hooks/useAuth';
import { getInitials } from '../utils/helpers';
import { getMyReviews } from '../services/reviewService';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/notificationService';
import { getWishlist } from '../services/wishlistService';
import { getIdentityStatus, createIdentitySession } from '../services/identityService';
import { getMyInsuranceHistory } from '../services/insuranceService';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

/**
 * Profile page — displays and edits user profile.
 *
 * Features:
 * - Shows real user data from AuthContext
 * - Editable fields: name, phone, bio, location, profileImage
 * - Email is read-only (not changeable)
 * - Avatar with user initials
 * - Save changes via API
 */
const Profile = () => {
  const { user, loading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reviewStats, setReviewStats] = useState({ receivedCount: 0, averageRating: 0 });
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [wishlistStats, setWishlistStats] = useState({ count: 0, categories: [], recentItems: [] });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [identityStatus, setIdentityStatus] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [insuranceHistory, setInsuranceHistory] = useState([]);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    location: '',
    bio: '',
    profileImage: '',
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || '',
        profileImage: user.profileImage || '',
      });
      fetchReviewStats();
      fetchNotifPrefs();
      fetchWishlistStats();
      fetchIdentityStatus();
      fetchInsuranceHistory();
    }
  }, [user]);

  const fetchReviewStats = async () => {
    try {
      const res = await getMyReviews();
      if (res.success) {
        setReviewStats({
          receivedCount: res.data.stats?.receivedCount || 0,
          averageRating: res.data.stats?.averageRating || 0,
        });
      }
    } catch (e) { /* ignore */ }
  };

  const fetchNotifPrefs = async () => {
    try {
      const res = await getNotificationPreferences();
      if (res.success) setNotifPrefs(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchWishlistStats = async () => {
    try {
      const res = await getWishlist();
      if (res.success && res.data) {
        const items = res.data;
        const categories = [...new Set(items.map(w => w.listing?.category).filter(Boolean))];
        const recentItems = items.slice(0, 3).map(w => ({
          id: w.listing?.id,
          title: w.listing?.title,
          image: w.listing?.imageUrls?.[0],
          category: w.listing?.category,
        }));
        setWishlistStats({ count: items.length, categories, recentItems });
      }
    } catch (e) { /* ignore */ }
  };

  const fetchIdentityStatus = async () => {
    try {
      const res = await getIdentityStatus();
      if (res.success) setIdentityStatus(res.data);
    } catch (e) { /* ignore */ }
  };

  const fetchInsuranceHistory = async () => {
    setInsuranceLoading(true);
    try {
      const res = await getMyInsuranceHistory();
      if (res.success && res.data) setInsuranceHistory(res.data);
    } catch (e) { /* ignore */ }
    finally { setInsuranceLoading(false); }
  };

  const handleVerifyIdentity = async () => {
    setIdentityLoading(true);
    try {
      const res = await createIdentitySession();
      if (res.success) {
        if (res.data.status === 'VERIFIED') {
          toast.success('Identity already verified!');
          setIdentityStatus(res.data);
        } else if (res.data.url) {
          // Open Stripe Identity verification in a new tab
          window.open(res.data.url, '_blank');
          toast.success('Verification session opened. Complete verification in the new tab.');
        }
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to start verification');
    } finally {
      setIdentityLoading(false);
    }
  };

  const handlePrefToggle = async (field) => {
    if (!notifPrefs) return;
    const newVal = !notifPrefs[field];
    setNotifPrefs(prev => ({ ...prev, [field]: newVal }));
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences({ [field]: newVal });
    } catch (e) {
      setNotifPrefs(prev => ({ ...prev, [field]: !newVal }));
      toast.error('Failed to update preference');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile({
      fullName: formData.fullName,
      phone: formData.phone || undefined,
      location: formData.location || undefined,
      bio: formData.bio || undefined,
      profileImage: formData.profileImage || undefined,
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Please log in to view your profile.</p>
      </div>
    );
  }

  const initials = getInitials(user.fullName);
  const memberDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 bg-gradient-to-r from-primary-600 to-primary-800" />

          <div className="px-8 pb-8">
            {/* Avatar + Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 mb-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-lg">
                  <div className="w-full h-full rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-3xl font-bold">
                    {initials}
                  </div>
                </div>
              </div>

              <div className="flex-1 pt-4 sm:pt-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                    <p className="text-gray-500">Member since {memberDate}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-block px-3 py-0.5 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 capitalize">
                        {user.role?.toLowerCase()}
                      </span>
                      {/* Identity Verification Badge */}
                      {identityStatus?.verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 text-xs font-semibold rounded-full bg-green-50 text-green-700">
                          <HiBadgeCheck size={14} /> Identity Verified
                        </span>
                      ) : identityStatus?.status === 'PENDING' || identityStatus?.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700">
                          <HiClock size={14} /> Verification Pending
                        </span>
                      ) : identityStatus?.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-700">
                          <HiExclamation size={14} /> Verification Failed
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2">
                      <StarRating rating={reviewStats.averageRating} reviewCount={reviewStats.receivedCount} size="sm" />
                    </div>
                  </div>
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isEditing
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="fullName" value={formData.fullName} onChange={handleChange}
                    readOnly={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'bg-white'}`} />
                </div>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input value={user.email} readOnly className="input-field pl-10 bg-gray-50 cursor-default" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <div className="relative">
                  <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="phone" value={formData.phone} onChange={handleChange}
                    readOnly={!isEditing}
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'bg-white'}`} />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <div className="relative">
                  <HiLocationMarker className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="location" value={formData.location} onChange={handleChange}
                    readOnly={!isEditing} placeholder="Add your location"
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'bg-white'}`} />
                </div>
              </div>

              {/* Profile Image URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Profile Image URL</label>
                <div className="relative">
                  <HiPhotograph className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="profileImage" value={formData.profileImage} onChange={handleChange}
                    readOnly={!isEditing} placeholder="https://example.com/avatar.jpg"
                    className={`input-field pl-10 ${!isEditing ? 'bg-gray-50 cursor-default' : 'bg-white'}`} />
                </div>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                <textarea name="bio" rows={3} value={formData.bio} onChange={handleChange}
                  readOnly={!isEditing} placeholder="Tell us about yourself..."
                  className={`input-field resize-none ${!isEditing ? 'bg-gray-50 cursor-default' : 'bg-white'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Identity Verification Section */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <HiShieldCheck className="text-primary-600" size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Identity Verification</h2>
                <p className="text-sm text-gray-500">Verify your identity to book high-value items</p>
              </div>
            </div>
          </div>
          <div className="px-8 py-6">
            {identityStatus?.verified ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                <HiBadgeCheck className="text-green-600 flex-shrink-0" size={32} />
                <div>
                  <p className="font-semibold text-green-800">Identity Verified</p>
                  {identityStatus.verifiedAt && (
                    <p className="text-sm text-green-600">
                      Verified on {new Date(identityStatus.verifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Listings with a security deposit of $500+ or daily rate of $200+ require identity verification.
                  Your identity is verified securely through Stripe Identity.
                </p>
                <button onClick={handleVerifyIdentity} disabled={identityLoading}
                  className="btn-primary inline-flex items-center gap-2">
                  {identityLoading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : identityStatus?.status === 'PENDING' || identityStatus?.status === 'PROCESSING' ? (
                    'Continue Verification'
                  ) : (
                    'Verify Identity'
                  )}
                </button>
                {identityStatus?.status === 'FAILED' && (
                  <p className="text-xs text-red-500 mt-2">Previous verification failed. Please try again with a valid government ID.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Wishlist Stats */}
        {wishlistStats.count > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <HiHeart className="text-red-500" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Wishlist</h2>
                  <p className="text-sm text-gray-500">{wishlistStats.count} {wishlistStats.count === 1 ? 'item' : 'items'} saved</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6">
              {wishlistStats.categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Favorite Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {wishlistStats.categories.map(cat => (
                      <span key={cat} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium capitalize">
                        {cat.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {wishlistStats.recentItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Recently Saved</p>
                  <div className="flex flex-wrap gap-3">
                    {wishlistStats.recentItems.map(item => (
                      <a key={item.id} href={'/listings/' + item.id}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl hover:bg-primary-50 transition-all text-sm text-gray-700 hover:text-primary-700">
                        <span className="text-base">📌</span>
                        <span className="font-medium truncate max-w-[120px]">{item.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Insurance History Section */}
        {insuranceHistory.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <HiShieldExclamation className="text-green-500" size={24} />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Damage Protection History</h2>
                  <p className="text-sm text-gray-500">{insuranceHistory.length} {insuranceHistory.length === 1 ? 'policy' : 'policies'}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 space-y-4">
              {insuranceHistory.map(policy => (
                <div key={policy.id} className="flex items-start gap-4 p-4 bg-green-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <HiShieldCheck className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-green-800 text-sm truncate">{policy.planName}</p>
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{policy.status}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-0.5">
                      Policy #{policy.policyNumber} · Premium: ${policy.premium} · Coverage: ${policy.coverageAmount}
                    </p>
                    <p className="text-xs text-green-500 mt-0.5">
                      Created: {new Date(policy.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                    {policy.booking && (
                      <Link to={'/bookings/' + policy.booking.id}
                        className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2 font-medium">
                        View Booking →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-6">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <HiBell className="text-primary-600" size={24} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-500">Manage how and when you receive notifications</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 space-y-5">
            {/* Channel Preferences */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Channels</h3>
              <div className="space-y-3">
                {[
                  { key: 'inAppEnabled', label: 'In-App Notifications', desc: 'Receive notifications within the app' },
                  { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Receive notifications via text message' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => handlePrefToggle(key)}
                      disabled={savingPrefs || !notifPrefs}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        notifPrefs?.[key] ? 'bg-primary-600' : 'bg-gray-300'
                      } ${savingPrefs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        notifPrefs?.[key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Category Preferences */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Notification Categories</h3>
              <div className="space-y-3">
                {[
                  { key: 'bookingNotifications', label: 'Booking Updates', desc: 'Booking requests, confirmations, cancellations' },
                  { key: 'paymentNotifications', label: 'Payment Updates', desc: 'Payment authorizations, captures, refunds' },
                  { key: 'reviewNotifications', label: 'Review Updates', desc: 'New reviews and ratings' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotions, tips, and platform updates' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => handlePrefToggle(key)}
                      disabled={savingPrefs || !notifPrefs}
                      className={`relative w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        notifPrefs?.[key] ? 'bg-primary-600' : 'bg-gray-300'
                      } ${savingPrefs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        notifPrefs?.[key] ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

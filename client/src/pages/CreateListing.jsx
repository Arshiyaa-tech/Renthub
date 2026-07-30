import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiPlus, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { CATEGORIES, CONDITIONS } from '../utils/constants';
import { createListing, updateListing, getListingById } from '../services/listingService';

/**
 * Create Listing page.
 * Professional form with image URLs, condition enum, all validation.
 */
const CreateListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = Boolean(editId);
  const [loadingListing, setLoadingListing] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', category: '', condition: 'GOOD',
    dailyRate: '', securityDeposit: '', location: '', isAvailable: true,
  });
  const [imageUrls, setImageUrls] = useState(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageUrlChange = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const addImageUrl = () => {
    if (imageUrls.length < 8) setImageUrls([...imageUrls, '']);
  };

  const removeImageUrl = (index) => {
    if (imageUrls.length > 1) setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim() || formData.title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.description.trim() || formData.description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.dailyRate || Number(formData.dailyRate) <= 0) newErrors.dailyRate = 'Daily rate must be greater than 0';
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    const validUrls = imageUrls.filter((u) => u.trim());
    if (validUrls.length === 0) newErrors.imageUrls = 'At least one image URL is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load existing listing for edit mode
  useEffect(() => {
    if (editId) {
      loadListing(editId);
    }
  }, [editId]);

  const loadListing = async (id) => {
    setLoadingListing(true);
    try {
      const response = await getListingById(id);
      const listing = response.data;
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || '',
        condition: listing.condition || 'GOOD',
        dailyRate: listing.dailyRate?.toString() || '',
        securityDeposit: listing.securityDeposit?.toString() || '',
        location: listing.location || '',
        isAvailable: listing.isAvailable !== false,
      });
      setImageUrls(listing.imageUrls?.length > 0 ? listing.imageUrls : ['']);
    } catch (error) {
      toast.error('Failed to load listing for editing');
      navigate('/my-listings');
    } finally {
      setLoadingListing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...formData,
      dailyRate: Number(formData.dailyRate),
      securityDeposit: Number(formData.securityDeposit) || 0,
      imageUrls: imageUrls.filter((u) => u.trim()),
    };

    setIsSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateListing(editId, payload);
        toast.success('Listing updated successfully!');
      } else {
        result = await createListing(payload);
        toast.success('Listing published successfully!');
      }

      if (result.success) {
        navigate('/my-listings');
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} listing`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      title: '', description: '', category: '', condition: 'GOOD',
      dailyRate: '', securityDeposit: '', location: '', isAvailable: true,
    });
    setImageUrls(['']);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Listing' : 'Create Listing'}</h1>
          <p className="text-gray-600 mt-2">{isEditing ? 'Update your rental item' : 'List your item for rent'}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Sony A7 III Camera with Lens"
                  className={`input-field ${errors.title ? 'border-red-500' : ''}`} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea name="description" rows={5} value={formData.description} onChange={handleChange}
                  placeholder="Describe your item in detail (condition, what's included, usage guidelines...)"
                  className={`input-field resize-none ${errors.description ? 'border-red-500' : ''}`} />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className={`input-field ${errors.category ? 'border-red-500' : ''}`}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition <span className="text-red-500">*</span></label>
                  <select name="condition" value={formData.condition} onChange={handleChange} className="input-field">
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location <span className="text-red-500">*</span></label>
                <input name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Mumbai, Maharashtra"
                  className={`input-field ${errors.location ? 'border-red-500' : ''}`} />
                {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing (₹)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Rate <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input name="dailyRate" type="number" value={formData.dailyRate} onChange={handleChange} placeholder="1500"
                    className={`input-field pl-8 ${errors.dailyRate ? 'border-red-500' : ''}`} />
                </div>
                {errors.dailyRate && <p className="text-red-500 text-xs mt-1">{errors.dailyRate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input name="securityDeposit" type="number" value={formData.securityDeposit} onChange={handleChange} placeholder="2000" className="input-field pl-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Image URLs */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Photos</h2>
            <p className="text-sm text-gray-500 mb-4">Enter image URLs (at least 1). First will be used as cover.</p>
            {errors.imageUrls && <p className="text-red-500 text-sm mb-4">{errors.imageUrls}</p>}

            <div className="space-y-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input type="url" value={url} onChange={(e) => handleImageUrlChange(index, e.target.value)}
                    placeholder={`Image URL ${index + 1}`} className="input-field flex-1" />
                  {imageUrls.length > 1 && (
                    <button type="button" onClick={() => removeImageUrl(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <HiX size={18} />
                    </button>
                  )}
                </div>
              ))}
              {imageUrls.length < 8 && (
                <button type="button" onClick={addImageUrl}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  <HiPlus size={16} /> Add another URL
                </button>
              )}
            </div>

            {/* Preview thumbnails */}
            {imageUrls.filter(Boolean).length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-4">
                {imageUrls.filter(Boolean).map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400 text-xs">Invalid</div>'; }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <div>
                <p className="font-medium text-gray-900">Available for rent</p>
                <p className="text-sm text-gray-500">Uncheck to mark as unavailable</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {loadingListing ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <button type="submit" disabled={isSubmitting}
              className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2">
              {isSubmitting ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {isEditing ? 'Updating...' : 'Publishing...'}</>
              ) : (<><HiPlus size={20} /> {isEditing ? 'Update Listing' : 'Publish Listing'}</>)}
            </button>
          )}
            <button type="button" onClick={handleReset}
              className="px-8 py-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;

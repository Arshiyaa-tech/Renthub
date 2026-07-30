import api from './api';

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminUsers = async (params = {}) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const verifyUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/verify`);
  return response.data;
};

export const suspendUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/suspend`);
  return response.data;
};

export const reactivateUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/reactivate`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getAdminListings = async (params = {}) => {
  const response = await api.get('/admin/listings', { params });
  return response.data;
};

export const deleteAdminListing = async (id) => {
  const response = await api.delete(`/admin/listings/${id}`);
  return response.data;
};

export const toggleListingStatus = async (id) => {
  const response = await api.patch(`/admin/listings/${id}/status`);
  return response.data;
};

export const getAdminBookings = async (params = {}) => {
  const response = await api.get('/admin/bookings', { params });
  return response.data;
};

export const updateAdminBooking = async (id, status) => {
  const response = await api.patch(`/admin/bookings/${id}`, { status });
  return response.data;
};

export const getAdminPayments = async (params = {}) => {
  const response = await api.get('/admin/payments', { params });
  return response.data;
};

export const getAdminReviews = async (params = {}) => {
  const response = await api.get('/admin/reviews', { params });
  return response.data;
};

export const deleteAdminReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export const exportAdminData = async (type, params = {}) => {
  const response = await api.get(`/admin/export/${type}`, { params, responseType: 'blob' });
  return response.data;
};

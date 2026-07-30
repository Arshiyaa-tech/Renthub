import api from './api';

/**
 * Service layer for booking-related API calls.
 */

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  return response.data;
};

export const getOwnerBookings = async () => {
  const response = await api.get('/bookings/owner');
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await api.patch(`/bookings/${id}/status`, { status });
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const getBookedDates = async (listingId) => {
  const response = await api.get(`/bookings/booked-dates/${listingId}`);
  return response.data;
};

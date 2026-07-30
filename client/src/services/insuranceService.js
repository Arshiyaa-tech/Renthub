import api from './api';

export const getInsurancePlans = async () => {
  const response = await api.get('/insurance/plans');
  return response.data;
};

export const getPolicyForBooking = async (bookingId) => {
  const response = await api.get('/insurance/policy/' + bookingId);
  return response.data;
};

export const getMyInsuranceHistory = async () => {
  const response = await api.get('/insurance/my');
  return response.data;
};

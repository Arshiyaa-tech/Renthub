import api from './api';

export const createPaymentIntent = async (bookingId) => {
  const response = await api.post('/payments/create-intent', { bookingId });
  return response.data;
};

export const confirmPayment = async (bookingId, paymentIntentId) => {
  const response = await api.post('/payments/confirm', { bookingId, paymentIntentId });
  return response.data;
};

export const capturePayment = async (bookingId) => {
  const response = await api.post('/payments/capture', { bookingId });
  return response.data;
};

export const refundPayment = async (bookingId, reason) => {
  const response = await api.post('/payments/refund', { bookingId, reason });
  return response.data;
};

export const getMyPayments = async () => {
  const response = await api.get('/payments/my');
  return response.data;
};

export const getPaymentById = async (id) => {
  const response = await api.get(`/payments/${id}`);
  return response.data;
};

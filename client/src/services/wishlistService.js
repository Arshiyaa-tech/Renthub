import api from './api';

export const getWishlist = async (params = {}) => {
  const response = await api.get('/wishlist', { params });
  return response.data;
};

export const addToWishlist = async (listingId) => {
  const response = await api.post('/wishlist', { listingId });
  return response.data;
};

export const removeFromWishlist = async (listingId) => {
  const response = await api.delete('/wishlist/' + listingId);
  return response.data;
};

export const checkWishlist = async (listingId) => {
  const response = await api.get('/wishlist/check/' + listingId);
  return response.data;
};

export const getWishlistCount = async () => {
  const response = await api.get('/wishlist/count');
  return response.data;
};

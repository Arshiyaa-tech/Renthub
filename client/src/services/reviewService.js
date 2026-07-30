import api from './api';
export const createReview = async (data) => {
  const response = await api.post('/reviews', data);
  return response.data;
};
export const getListingReviews = async (listingId, sort) => {
  const params = sort ? { sort } : {};
  const response = await api.get('/reviews/listing/' + listingId, { params });
  return response.data;
};
export const getUserReviews = async (userId) => {
  const response = await api.get('/reviews/user/' + userId);
  return response.data;
};
export const getMyReviews = async () => {
  const response = await api.get('/reviews/my');
  return response.data;
};
export const getReviewById = async (id) => {
  const response = await api.get('/reviews/' + id);
  return response.data;
};
export const updateReview = async (id, data) => {
  const response = await api.put('/reviews/' + id, data);
  return response.data;
};
export const deleteReview = async (id) => {
  const response = await api.delete('/reviews/' + id);
  return response.data;
};

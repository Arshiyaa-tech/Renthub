import api from './api';

/**
 * Service layer for listing-related API calls.
 * Matches the backend REST API structure.
 */

export const getListings = async (params = {}) => {
  const response = await api.get('/listings', { params });
  return response.data;
};

export const getListingById = async (id) => {
  const response = await api.get(`/listings/${id}`);
  return response.data;
};

export const createListing = async (listingData) => {
  const response = await api.post('/listings', listingData);
  return response.data;
};

export const updateListing = async (id, listingData) => {
  const response = await api.put(`/listings/${id}`, listingData);
  return response.data;
};

export const deleteListing = async (id) => {
  const response = await api.delete(`/listings/${id}`);
  return response.data;
};

export const getMyListings = async () => {
  const response = await api.get('/listings/my');
  return response.data;
};

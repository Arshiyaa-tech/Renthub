import api from './api';

export const createIdentitySession = async () => {
  const response = await api.post('/identity/create-session');
  return response.data;
};

export const getIdentityStatus = async () => {
  const response = await api.get('/identity/status');
  return response.data;
};

export const checkListingIdentity = async (listingId) => {
  const response = await api.get('/identity/check-listing/' + listingId);
  return response.data;
};

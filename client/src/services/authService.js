import api from './api';

/**
 * Service layer for authentication-related API calls.
 * All functions return the full response data object.
 */

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/auth/profile', profileData);
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

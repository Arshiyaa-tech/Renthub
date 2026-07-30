import api from './api';

export const createDispute = async (data) => {
  const response = await api.post('/disputes', data);
  return response.data;
};

export const getMyDisputes = async () => {
  const response = await api.get('/disputes/my');
  return response.data;
};

export const getDisputeById = async (id) => {
  const response = await api.get('/disputes/' + id);
  return response.data;
};

export const updateDispute = async (id, data) => {
  const response = await api.put('/disputes/' + id, data);
  return response.data;
};

export const deleteDispute = async (id) => {
  const response = await api.delete('/disputes/' + id);
  return response.data;
};

// Admin API calls
export const getAllDisputes = async (params = {}) => {
  const response = await api.get('/admin/disputes', { params });
  return response.data;
};

export const updateDisputeStatus = async (id, data) => {
  const response = await api.patch('/admin/disputes/' + id + '/status', data);
  return response.data;
};
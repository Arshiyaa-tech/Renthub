import api from './api';

export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

export const getUnreadNotifications = async () => {
  const response = await api.get('/notifications/unread');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export const getNotificationPreferences = async () => {
  const response = await api.get('/notifications/preferences');
  return response.data;
};

export const updateNotificationPreferences = async (data) => {
  const response = await api.put('/notifications/preferences', data);
  return response.data;
};

export const adminSendNotification = async (data) => {
  const response = await api.post('/admin/notifications/send', data);
  return response.data;
};

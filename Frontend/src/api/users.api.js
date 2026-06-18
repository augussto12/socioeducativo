import client from './client';

export const getAdminUsers = (params = {}) =>
  client.get('/admin/users', { params });

export const getAdminUser = (id) =>
  client.get(`/admin/users/${id}`);

export const createAdminUser = (payload) =>
  client.post('/admin/users', payload);

export const updateAdminUser = (id, payload) =>
  client.put(`/admin/users/${id}`, payload);

export const disableAdminUser = (id) =>
  client.patch(`/admin/users/${id}/disable`);

export const enableAdminUser = (id) =>
  client.patch(`/admin/users/${id}/enable`);

export const deleteAdminUser = (id) =>
  client.delete(`/admin/users/${id}`);

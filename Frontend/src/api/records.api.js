import client from './client';

export const getPublicRecordById = (id) =>
  client.get(`/records/public/${id}`);

export const getAdminRecords = (params = {}) =>
  client.get('/admin/records', { params });

export const getAdminRecord = (id) =>
  client.get(`/admin/records/${id}`);

export const updateAdminRecord = (id, payload) =>
  client.put(`/admin/records/${id}`, payload);

export const changeAdminRecordStatus = (id, payload) =>
  client.patch(`/admin/records/${id}/status`, payload);

export const deleteAdminRecord = (id) =>
  client.delete(`/admin/records/${id}`);

import client from './client';

export const downloadFile = (id) =>
  client.get(`/files/${id}`, { responseType: 'blob' });

export const deleteFile = (id) =>
  client.delete(`/files/${id}`);

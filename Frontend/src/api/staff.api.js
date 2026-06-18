import client from './client';

export const getMyProjects = () =>
  client.get('/my/projects');

export const getMyProject = (id) =>
  client.get(`/my/projects/${id}`);

export const getMyRecords = (params = {}) =>
  client.get('/my/records', { params });

export const getMyProjectRecords = (projectId, params = {}) =>
  client.get(`/my/projects/${projectId}/records`, { params });

export const createMyProjectRecord = (projectId, payload) =>
  client.post(`/my/projects/${projectId}/records`, payload);

export const getMyRecord = (id) =>
  client.get(`/my/records/${id}`);

export const updateMyRecord = (id, payload) =>
  client.put(`/my/records/${id}`, payload);

export const deleteMyRecord = (id) =>
  client.delete(`/my/records/${id}`);

export const uploadMyRecordFile = (recordId, formData, onUploadProgress) =>
  client.post(`/my/records/${recordId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

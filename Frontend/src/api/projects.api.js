import client from './client';

export const getPublicProjects = () =>
  client.get('/projects/public');

export const getPublicProjectBySlug = (slug) =>
  client.get(`/projects/public/${slug}`);

export const getPublicProjectRecords = (slug) =>
  client.get(`/projects/public/${slug}/records`);

export const getAdminProjects = () =>
  client.get('/admin/projects');

export const getAdminProject = (id) =>
  client.get(`/admin/projects/${id}`);

export const createAdminProject = (payload) =>
  client.post('/admin/projects', payload);

export const updateAdminProject = (id, payload) =>
  client.put(`/admin/projects/${id}`, payload);

export const deleteAdminProject = (id) =>
  client.delete(`/admin/projects/${id}`);

export const addAdminProjectMember = (projectId, payload) =>
  client.post(`/admin/projects/${projectId}/members`, payload);

export const removeAdminProjectMember = (projectId, userId) =>
  client.delete(`/admin/projects/${projectId}/members/${userId}`);

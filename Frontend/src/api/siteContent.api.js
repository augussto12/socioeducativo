import client from './client';

export const getSiteContent = () =>
  client.get('/site-content');

export const getSiteContentByKey = (key) =>
  client.get(`/site-content/${key}`);

export const updateAdminSiteContent = (key, payload) =>
  client.put(`/admin/site-content/${key}`, payload);

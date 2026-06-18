import client from './client';

export const getAdminDashboard = () =>
  client.get('/admin/dashboard');

export const getAuditLogs = (params = {}) =>
  client.get('/admin/audit-logs', { params });

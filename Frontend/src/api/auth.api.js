import client from './client';

export const login = (username, password) =>
  client.post('/auth/login', { username, password });

export const refreshToken = () =>
  client.post('/auth/refresh');

export const logout = () =>
  client.post('/auth/logout');

export const getMe = () =>
  client.get('/auth/me');

export const changePassword = (currentPassword, newPassword) =>
  client.put('/auth/change-password', { currentPassword, newPassword });

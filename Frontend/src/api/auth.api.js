import client from './client';

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

export const refreshToken = () =>
  client.post('/auth/refresh');

export const logout = () =>
  client.post('/auth/logout');

export const getMe = () =>
  client.get('/auth/me', { skipAuthRedirect: true });

export const changePassword = (currentPassword, newPassword) =>
  client.put('/auth/change-password', { currentPassword, newPassword });

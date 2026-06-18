import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as loginApi,
  getMe,
  logout as logoutApi,
  changePassword as changePasswordApi,
  refreshToken,
} from '../api/auth.api';
import { clearAccessToken, setAccessToken } from '../api/tokenStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await refreshToken();
      if (data.accessToken) setAccessToken(data.accessToken);
      setUser(data.user || null);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await changePasswordApi(currentPassword, newPassword);
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.user) setUser(data.user);
    return data;
  };

  const value = {
    user,
    login,
    logout,
    changePassword,
    loading,
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'STAFF',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;

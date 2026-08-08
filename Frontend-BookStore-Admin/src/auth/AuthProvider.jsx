import { useMemo, useState } from 'react';
import { api } from '../api/client';
import { AuthContext } from './authContext';

function readStoredUser() {
  const raw = localStorage.getItem('admin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('admin_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [user, setUser] = useState(readStoredUser);

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.user?.role !== 'admin') {
      throw new Error('Tài khoản không có quyền admin');
    }
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAdmin: Boolean(token && user?.role === 'admin'),
      login,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

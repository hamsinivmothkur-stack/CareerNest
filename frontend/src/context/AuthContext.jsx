import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('careernest_user') || localStorage.getItem('applytrack_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => 
    localStorage.getItem('careernest_token') || localStorage.getItem('applytrack_token') || null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Sync state if storage changes or 401 occurs
  useEffect(() => {
    const handleAuthChange = () => {
      const storedToken = localStorage.getItem('careernest_token') || localStorage.getItem('applytrack_token');
      const storedUser = localStorage.getItem('careernest_user') || localStorage.getItem('applytrack_user');
      setToken(storedToken);
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('careernest_token') || localStorage.getItem('applytrack_token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('careernest_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('careernest_token', res.token);
      localStorage.setItem('careernest_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register(name, email, password);
    if (res.success && res.token) {
      localStorage.setItem('careernest_token', res.token);
      localStorage.setItem('careernest_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('careernest_token');
    localStorage.removeItem('careernest_user');
    localStorage.removeItem('applytrack_token');
    localStorage.removeItem('applytrack_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

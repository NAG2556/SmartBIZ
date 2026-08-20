import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  demoLogin: () => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('smartbiz_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smartbiz_token');
      if (storedToken) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('smartbiz_token');
          localStorage.removeItem('smartbiz_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await authApi.login(credentials);
      localStorage.setItem('smartbiz_token', data.access_token);
      localStorage.setItem('smartbiz_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    await login({ email: 'ravi@smartbiz.ai', password: 'password123' });
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const data = await authApi.register(payload);
      localStorage.setItem('smartbiz_token', data.access_token);
      localStorage.setItem('smartbiz_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('smartbiz_token');
    localStorage.removeItem('smartbiz_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('smartbiz_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, demoLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/apiClient';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAsDev: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('sad_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('sad_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('sad_user');
        localStorage.removeItem('sad_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const loginAsDev = async (email: string) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/dev-login', { email });
      if (res.data?.success) {
        setUser(res.data.user);
        localStorage.setItem('sad_user', JSON.stringify(res.data.user));
        localStorage.setItem('sad_token', res.data.token);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      localStorage.removeItem('sad_user');
      localStorage.removeItem('sad_token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginAsDev, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

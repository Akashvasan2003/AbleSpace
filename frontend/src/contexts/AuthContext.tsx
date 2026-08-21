'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import api from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  title?: string | null;
  username?: string | null;
  provider?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'title' | 'username' | 'avatar'>>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  useEffect(() => {
    let isMounted = true;
    const token = Cookies.get('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => { if (isMounted) setUser(res.data); })
        .catch(() => { Cookies.remove('token'); })
        .finally(() => { if (isMounted) setLoading(false); });
    } else {
      queueMicrotask(() => {
        if (isMounted) setLoading(false);
      });
    }
    return () => { isMounted = false; };
  }, []);

  const handleAuth = async (endpoint: string, data?: object) => {
    const res = await api.post(endpoint, data);
    Cookies.set('token', res.data.token, { expires: 7 });
    setUser(res.data.user);
  };

  const updateProfile = async (data: Partial<Pick<User, 'name' | 'title' | 'username' | 'avatar'>>) => {
    const res = await api.patch('/auth/profile', data);
    setUser(res.data);
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      login: (email, password) => handleAuth('/auth/login', { email, password }),
      register: (name, email, password) => handleAuth('/auth/register', { name, email, password }),
      guestLogin: () => handleAuth('/auth/guest'),
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      logout: () => { Cookies.remove('token'); setUser(null); window.location.href = '/login'; },
      updateProfile,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios.js';

const AuthContext = createContext();

// ✅ Safe JSON parser — "undefined", "", null kabhi crash nahi karega
const safeParse = (raw) => {
  if (!raw || raw === 'undefined' || raw === 'null') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => safeParse(localStorage.getItem('user')));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      // ✅ Token bhi validate karo
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    // ✅ Safety check — token aaya ya nahi
    if (!data?.token || !data?.user) {
      throw new Error('Invalid login response');
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
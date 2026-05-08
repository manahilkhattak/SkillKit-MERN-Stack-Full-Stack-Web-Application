import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const Ctx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sk_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sk_token');
    if (token) {
      api.get('/auth/me')
        .then(r => { setUser(r.data.user); localStorage.setItem('sk_user', JSON.stringify(r.data.user)); })
        .catch(() => { localStorage.removeItem('sk_token'); localStorage.removeItem('sk_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('sk_token', token);
    localStorage.setItem('sk_user', JSON.stringify(userData));
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem('sk_token'); localStorage.removeItem('sk_user'); setUser(null);
  };
  const isAdmin = user?.role === 'admin';

  return <Ctx.Provider value={{ user, loading, login, logout, isAdmin }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);

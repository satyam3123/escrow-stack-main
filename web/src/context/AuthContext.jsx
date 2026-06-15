import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const TOKEN_KEY = 'es_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate a stored token on boot and hydrate the user.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { user } = await api.me(token);
        if (active) setUser(user);
      } catch {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  const persist = useCallback((tok, usr) => {
    localStorage.setItem(TOKEN_KEY, tok);
    setToken(tok);
    setUser(usr);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { token, user } = await api.login(email, password);
      persist(token, user);
    },
    [persist],
  );

  const register = useCallback(
    async (email, password) => {
      const { token, user } = await api.register(email, password);
      persist(token, user);
    },
    [persist],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

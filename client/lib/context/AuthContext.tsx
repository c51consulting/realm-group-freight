'use client';

/**
 * AuthContext — global authentication state.
 *
 * Provides: user, token, login(), register(), logout(), loading
 * Persists the JWT in localStorage via lib/client.ts helpers.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { auth as authApi, getToken, setToken, clearToken } from '../client';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

interface RegisterPayload {
  email: string;
  password: string;
  businessName?: string;
  abn?: string;
  phone?: string;
  role?: string;
  address?: object;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = getToken();
    if (stored) {
      setTokenState(stored);
      authApi
        .me()
        .then((u) => setUser(u))
        .catch(() => {
          clearToken();
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setTokenState(res.token);
    // Fetch full profile
    const fullUser = await authApi.me();
    setUser(fullUser);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload);
    setToken(res.token);
    setTokenState(res.token);
    const fullUser = await authApi.me();
    setUser(fullUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, UserProfile } from '../types/api';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  setTokens,
  clearTokens,
  getStoredUser,
  setStoredUser,
  getRefreshToken,
} from './api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await apiLogin(data);
      setTokens(res.access_token, res.refresh_token);
      setStoredUser(res.user);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await apiRegister(data);
      setTokens(res.access_token, res.refresh_token);
      setStoredUser(res.user);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await apiLogout({ refresh_token: refreshToken });
      } catch {
        // ignore logout errors
      }
    }
    clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

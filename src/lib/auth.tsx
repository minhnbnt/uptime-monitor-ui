import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, UserProfile } from '../types/api';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  initAuth,
  setTokens,
  clearTokens,
  setStoredUser,
  getRefreshToken,
  attemptRefresh,
} from './api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    initAuth().then((u) => {
      if (u) setUser(u);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setSessionExpired(false);
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
    setSessionExpired(false);
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

  const refreshTokenFn = useCallback(async () => {
    const success = await attemptRefresh();
    if (success) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser) as UserProfile);
      }
    }
    return success;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionExpired, login, register, logout, refreshToken: refreshTokenFn }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

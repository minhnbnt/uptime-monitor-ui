import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from './api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  sessionExpired: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_KEY = ['auth', 'user'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [sessionExpired, setSessionExpired] = useState(false);

  const userQuery = useQuery({
    queryKey: AUTH_KEY,
    queryFn: () => initAuth(),
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    const handler = () => {
      qc.setQueryData(AUTH_KEY, null);
      setSessionExpired(true);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [qc]);

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => apiLogin(data),
    onSuccess: (res) => {
      setTokens(res.access_token, res.refresh_token);
      setStoredUser(res.user);
      qc.setQueryData(AUTH_KEY, res.user);
      setSessionExpired(false);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => apiRegister(data),
    onSuccess: (res) => {
      setTokens(res.access_token, res.refresh_token);
      setStoredUser(res.user);
      qc.setQueryData(AUTH_KEY, res.user);
      setSessionExpired(false);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await apiLogout({ refresh_token: refreshToken });
        } catch {
          // ignore
        }
      }
      clearTokens();
    },
    onSuccess: () => {
      qc.setQueryData(AUTH_KEY, null);
    },
  });

  const user = userQuery.data ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: userQuery.isLoading || loginMutation.isPending || registerMutation.isPending,
        sessionExpired,
        login: async (data) => { await loginMutation.mutateAsync(data); },
        register: async (data) => { await registerMutation.mutateAsync(data); },
        logout: () => logoutMutation.mutateAsync(),
      }}
    >
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

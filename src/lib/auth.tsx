import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { LoginRequest, RegisterRequest, UserProfile } from '../types/api';
import { setAccessToken, clearTokens, setStoredUser } from './tokens';
import { ApiError } from './api';
import { getAuthClient, sessionToUser, toUserProfile } from './auth-client';

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
  const auth = getAuthClient();

  useEffect(() => {
    let mounted = true;

    auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        clearTokens();
      } else if (data.session) {
        setAccessToken(data.session.access_token);
        const profile = sessionToUser(data.session);
        if (profile) {
          setStoredUser(profile);
          setUser(profile);
        }
      } else {
        clearTokens();
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearTokens();
        setUser(null);
        setSessionExpired(false);
        return;
      }

      setAccessToken(session.access_token);
      const profile = sessionToUser(session);
      if (profile) {
        setStoredUser(profile);
        setUser(profile);
        setSessionExpired(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [auth]);

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, [auth]);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setSessionExpired(false);
    try {
      const { data: authData, error } = await auth.signInWithPassword({
        email: data.login,
        password: data.password,
      });
      if (error) throw new ApiError(400, 'auth_error', error.message);
      const profile = authData.user ? toUserProfile(authData.user) : null;
      if (!profile || !authData.session) throw new ApiError(400, 'auth_error', 'Login failed');
      setAccessToken(authData.session.access_token);
      setStoredUser(profile);
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setSessionExpired(false);
    try {
      const { data: authData, error } = await auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            name: data.name,
            full_name: data.name,
          },
        },
      });
      if (error) throw new ApiError(400, 'auth_error', error.message);
      const profile = authData.user ? toUserProfile(authData.user) : null;
      if (profile) {
        setUser(profile);
        setStoredUser(profile);
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const logout = useCallback(async () => {
    try {
      await auth.signOut();
    } catch {
      // ignore logout errors
    }
    clearTokens();
    setUser(null);
  }, [auth]);

  const refreshTokenFn = useCallback(async () => {
    try {
      const { data, error } = await auth.refreshSession();
      if (error || !data.session) return false;
      const profile = sessionToUser(data.session);
      if (profile) {
        setAccessToken(data.session.access_token);
        setStoredUser(profile);
        setUser(profile);
      }
      return true;
    } catch {
      clearTokens();
      return false;
    }
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

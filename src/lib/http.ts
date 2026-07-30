import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, setStoredUser } from './tokens';
import type { AuthResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) throw error;
    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;
        try {
          const { data } = await axios.post<AuthResponse>(
            `${BASE_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken },
          );
          setTokens(data.access_token, data.refresh_token);
          setStoredUser(data.user);
          return true;
        } catch {
          clearTokens();
          return false;
        }
      })();
    }

    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (!refreshed) {
      clearTokens();
      window.dispatchEvent(new CustomEvent('session-expired'));
      throw error;
    }

    original.headers.Authorization = `Bearer ${getAccessToken()}`;
    return http(original);
  },
);

export default http;

import axios from 'axios';
import { getAccessToken, setAccessToken, clearTokens, setStoredUser } from './tokens';
import { getAuthClient, sessionToUser } from './auth-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const http = axios.create({ baseURL: BASE_URL });

http.interceptors.request.use((config) => {
  return (async () => {
    let token = getAccessToken();
    if (!token) {
      const { data } = await getAuthClient().getSession();
      token = data.session?.access_token ?? null;
      if (token) {
        setAccessToken(token);
        const user = sessionToUser(data.session);
        if (user) setStoredUser(user);
      }
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  })();
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
        try {
          const { data, error } = await getAuthClient().refreshSession();
          if (error || !data.session) return false;
          setAccessToken(data.session.access_token);
          const user = sessionToUser(data.session);
          if (user) setStoredUser(user);
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

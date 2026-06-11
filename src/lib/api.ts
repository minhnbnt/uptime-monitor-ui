import type {
  AuthResponse,
  ServerListResponse,
  ServerResponse,
  ServerOntimeListResponse,
  CreateServerRequest,
  UpdateServerRequest,
  SetCheckMethodRequest,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UserProfile,
  ServerObject,
  ServerWithOntime,
  TestEndpointRequest,
  TestEndpointResponse,
} from '../types/api';

const BASE_URL = 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function getItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeItem(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getAccessToken(): string | null {
  return getItem('access_token');
}

export function getRefreshToken(): string | null {
  return getItem('refresh_token');
}

export function setTokens(access: string, refresh: string) {
  setItem('access_token', access);
  setItem('refresh_token', refresh);
}

export function clearTokens() {
  removeItem('access_token');
  removeItem('refresh_token');
  removeItem('user');
}

export function getStoredUser(): UserProfile | null {
  const raw = getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserProfile) {
  setItem('user', JSON.stringify(user));
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshTokenRequest),
      });
      if (!res.ok) {
        clearTokens();
        return false;
      }
      const data = await res.json() as AuthResponse;
      setTokens(data.access_token, data.refresh_token);
      setStoredUser(data.user);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `HTTP ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiLogin(data: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function apiRegister(data: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function apiLogout(data: RefreshTokenRequest): Promise<void> {
  return request<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function apiListServers(page = 1, perPage = 20, status?: string): Promise<ServerListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (status) params.set('status', status);
  return request<ServerListResponse>(`/api/v1/servers?${params}`);
}

export function apiCreateServer(data: CreateServerRequest): Promise<ServerResponse> {
  return request<ServerResponse>('/api/v1/servers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function apiGetServer(id: number): Promise<ServerResponse> {
  return request<ServerResponse>(`/api/v1/servers/${id}`);
}

export function apiUpdateServer(id: number, data: UpdateServerRequest): Promise<ServerResponse> {
  return request<ServerResponse>(`/api/v1/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function apiDeleteServer(id: number): Promise<void> {
  return request<void>(`/api/v1/servers/${id}`, { method: 'DELETE' });
}

export function apiSetCheckMethod(id: number, data: SetCheckMethodRequest): Promise<ServerResponse> {
  return request<ServerResponse>(`/api/v1/servers/${id}/check_method`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function apiListServersOntime(page = 1, perPage = 20): Promise<ServerOntimeListResponse> {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  return request<ServerOntimeListResponse>(`/api/v1/servers/ontime?${params}`);
}

export function apiTestEndpoint(data: TestEndpointRequest): Promise<TestEndpointResponse> {
  return request<TestEndpointResponse>('/api/v1/test-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export type { ServerObject, ServerWithOntime, UserProfile };

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
  SearchServersResponse,
  ImportServersResponse,
  NotificationConfig,
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

export class SessionExpiredError extends Error {
  constructor() {
    super('Session expired');
    this.name = 'SessionExpiredError';
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

export async function initAuth(): Promise<UserProfile | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken } satisfies RefreshTokenRequest),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json() as AuthResponse;
    setTokens(data.access_token, data.refresh_token);
    setStoredUser(data.user);
    return data.user;
  } catch {
    clearTokens();
    return null;
  }
}

let refreshPromise: Promise<boolean> | null = null;

export async function attemptRefresh(): Promise<boolean> {
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
  const headers: Record<string, string> = {};

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Merge with provided headers
  const providedHeaders = options.headers as Record<string, string> | undefined;
  if (providedHeaders) {
    Object.assign(headers, providedHeaders);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      clearTokens();
      window.dispatchEvent(new CustomEvent('session-expired'));
      throw new SessionExpiredError();
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

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
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

export function apiSearchServers(
  query: string,
  page = 1,
  perPage = 20,
  sortBy = 'name',
  sortOrder = 'asc',
): Promise<SearchServersResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  return request<SearchServersResponse>(`/api/v1/servers/search?${params}`);
}

export async function apiExportServers(
  query?: string,
  status?: string,
  from?: string,
  to?: string,
  sortBy = 'name',
  sortOrder = 'asc',
): Promise<Blob> {
  const params = new URLSearchParams({
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  if (query) params.set('q', query);
  if (status) params.set('status', status);
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/v1/servers/export?${params}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `HTTP ${res.status}`,
    );
  }
  return res.blob();
}

export function apiImportServers(file: File): Promise<ImportServersResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${BASE_URL}/api/v1/servers/import`, {
    method: 'POST',
    headers,
    body: formData,
  }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const err = body?.error;
      throw new ApiError(
        res.status,
        err?.code ?? 'UNKNOWN',
        err?.message ?? `HTTP ${res.status}`,
      );
    }
    return res.json() as Promise<ImportServersResponse>;
  });
}

export async function apiGetImportTemplate(): Promise<Blob> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/v1/servers/import`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const err = body?.error;
    throw new ApiError(
      res.status,
      err?.code ?? 'UNKNOWN',
      err?.message ?? `HTTP ${res.status}`,
    );
  }
  return res.blob();
}

export function apiGetNotificationConfig(): Promise<NotificationConfig> {
  return request<NotificationConfig>('/api/v1/notifications/config');
}

export function apiUpdateNotificationConfig(config: NotificationConfig): Promise<void> {
  return request<void>('/api/v1/notifications/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
}

export function apiSendReport(): Promise<void> {
  return request<void>('/api/v1/notifications/send-report', {
    method: 'POST',
  });
}

export type { ServerObject, ServerWithOntime, UserProfile };

import http from './http';
import { getRefreshToken, setTokens, clearTokens, setStoredUser } from './tokens';
import type {
  AuthResponse,
  ServerListResponse,
  ServerResponse,
  ServerOntimeListResponse,
  ServerOntimeResponse,
  CreateServerRequest,
  UpdateServerRequest,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UserProfile,
  ServerObject,
  ServerWithOntime,
  ServerCountResponse,
  TestEndpointRequest,
  TestEndpointResponse,
  SearchServersResponse,
  ImportServersResponse,
  NotificationConfig,
  CalculateUptimeRequest,
  UptimeResponse,
} from '../types/api';

export type UiStatus = 'online' | 'offline' | 'unknown';

export function toUiStatus(status: ServerObject['monitor_status']): UiStatus {
  if (status === 'ON') return 'online';
  if (status === 'OFF') return 'offline';
  return 'unknown';
}

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



export async function initAuth(): Promise<UserProfile | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await http.post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    } satisfies RefreshTokenRequest);
    setTokens(data.access_token, data.refresh_token);
    setStoredUser(data.user);
    return data.user;
  } catch {
    clearTokens();
    return null;
  }
}

export async function attemptRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await http.post<AuthResponse>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    } satisfies RefreshTokenRequest);
    setTokens(data.access_token, data.refresh_token);
    setStoredUser(data.user);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function apiLogin(data: LoginRequest): Promise<AuthResponse> {
  return http.post('/api/v1/auth/login', data).then((r) => r.data);
}

export function apiRegister(data: RegisterRequest): Promise<AuthResponse> {
  return http.post('/api/v1/auth/register', data).then((r) => r.data);
}

export function apiLogout(data: RefreshTokenRequest): Promise<void> {
  return http.post('/api/v1/auth/logout', data);
}

export function apiListServers(page = 1, perPage = 20): Promise<ServerListResponse> {
  return http.get('/api/v1/servers', { params: { page, per_page: perPage } }).then((r) => r.data);
}

export function apiCreateServer(data: CreateServerRequest): Promise<ServerResponse> {
  return http.post('/api/v1/servers', data).then((r) => r.data);
}

export function apiGetServer(id: number): Promise<ServerResponse> {
  return http.get(`/api/v1/servers/${id}`).then((r) => r.data);
}

export function apiUpdateServer(id: number, data: UpdateServerRequest): Promise<ServerResponse> {
  return http.put(`/api/v1/servers/${id}`, data).then((r) => r.data);
}

export function apiDeleteServer(id: number): Promise<void> {
  return http.delete(`/api/v1/servers/${id}`);
}

export function apiGetServerOntime(id: number): Promise<ServerOntimeResponse> {
  return http.get(`/api/v1/servers/ontime/${id}`).then((r) => r.data);
}

export function apiListServersOntime(page = 1, perPage = 20): Promise<ServerOntimeListResponse> {
  return http.get('/api/v1/servers/ontime', { params: { page, per_page: perPage } }).then((r) => r.data);
}

export function apiCountServers(): Promise<ServerCountResponse> {
  return http.get('/api/v1/servers/count').then((r) => r.data);
}

export function apiTestEndpoint(data: TestEndpointRequest): Promise<TestEndpointResponse> {
  return http.post('/api/v1/test-endpoint', data).then((r) => r.data);
}

export function apiSearchServers(
  query: string,
  page = 1,
  perPage = 20,
  sortBy = 'score',
  sortOrder = 'desc',
): Promise<SearchServersResponse> {
  return http.get('/api/v1/servers/search', {
    params: { q: query, page, per_page: perPage, sort_by: sortBy, sort_order: sortOrder },
  }).then((r) => r.data);
}

export async function apiExportServers(
  query?: string,
  from?: string,
  to?: string,
  sortBy = 'name',
  sortOrder = 'asc',
): Promise<Blob> {
  const { data } = await http.get('/api/v1/servers/export', {
    params: { q: query, from, to, sort_by: sortBy, sort_order: sortOrder },
    responseType: 'blob',
  });
  return data;
}

export function apiImportServers(file: File): Promise<ImportServersResponse> {
  const formData = new FormData();
  formData.append('file', file);
  return http.post('/api/v1/servers/import', formData).then((r) => r.data);
}

export async function apiGetImportTemplate(): Promise<Blob> {
  const { data } = await http.get('/api/v1/servers/import', { responseType: 'blob' });
  return data;
}

export function apiGetNotificationConfig(): Promise<NotificationConfig> {
  return http.get('/api/v1/notifications/config').then((r) => r.data);
}

export function apiUpdateNotificationConfig(config: NotificationConfig): Promise<void> {
  return http.put('/api/v1/notifications/config', config);
}

export function apiCalculateUptime(
  serverId: number,
  data: CalculateUptimeRequest,
): Promise<UptimeResponse> {
  return http.post(`/api/v1/servers/ontime/${serverId}/range`, data).then((r) => r.data);
}

export function apiSendReport(): Promise<void> {
  return http.post('/api/v1/notifications/send-report');
}

export type { ServerObject, ServerWithOntime, UserProfile };

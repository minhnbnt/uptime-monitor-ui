export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface ServerObject {
  id: number;
  name: string;
  monitor_status: 'ON' | 'OFF' | null;
  endpoint: Endpoint | null;
  created_at: string;
  updated_at: string;
  ontime_stats?: OntimeStats[];
}

export interface CreateServerRequest {
  name: string;
}

export interface UpdateServerRequest {
  name?: string;
}

export interface ServerResponse {
  data: ServerObject;
}

export interface ServerListResponse {
  data: ServerObject[];
  meta: PaginationMeta;
}

export type CheckMethodType = 'push' | 'pull';

export type HttpMethod =
  | 'GET' | 'POST' | 'PUT' | 'DELETE'
  | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

export interface Endpoint {
  url: string;
  interval: number;
  timeout: number;
  method: HttpMethod;
  expected_code: number;
  body_check_expr?: string;
}

export interface SetCheckMethodRequest {
  method: CheckMethodType;
  endpoint: Endpoint;
}

export interface OntimeStats {
  date: string;
  stats: number;
}

export interface ServerWithOntime {
  server_id: number;
  ontime_stats: OntimeStats[];
}

export interface ServerOntimeListResponse {
  data: ServerWithOntime[];
  meta: PaginationMeta;
}

export interface ServerCountResponse {
  total: number;
  online: number;
  offline: number;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: UserProfile;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface TestEndpointRequest {
  url: string;
  method: HttpMethod;
  timeout?: number;
  expected_code?: number;
  body_check_expr?: string;
}

export interface TestEndpointResponse {
  success: boolean;
  status_code: number;
  error?: string;
}

export type SearchServersResponse = ServerListResponse;

export interface ImportServersResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors?: string[];
}

export interface NotificationConfig {
  from_date?: string;
  to_date?: string;
  digest_time?: string;
}

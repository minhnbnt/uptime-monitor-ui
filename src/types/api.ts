export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export type ServerKind = 'Pod' | 'Deployment' | 'StatefulSet' | 'DaemonSet' | 'ReplicaSet';

export interface ServerObject {
  id: number;
  name: string;
  namespace: string;
  kind: ServerKind;
  object_id: string;
  container_name?: string;
  interval?: number;
  timeout?: number;
  monitor_status: 'ON' | 'OFF' | null;
  created_at: string;
  updated_at: string;
  ontime_stats?: OntimeStats[];
}

export interface CreateServerRequest {
  name: string;
  namespace: string;
  kind: ServerKind;
  object_id: string;
  container_name?: string;
  interval?: number;
  timeout?: number;
}

export interface UpdateServerRequest {
  name?: string;
  namespace?: string;
  kind?: ServerKind;
  object_id?: string;
  container_name?: string;
  interval?: number;
  timeout?: number;
}

export interface ServerResponse {
  data: ServerObject;
}

export interface ServerListResponse {
  data: ServerObject[];
  meta: PaginationMeta;
}

export interface OntimeStats {
  date: string;
  stats: number;
  to?: string;
}

export interface ServerWithOntime {
  server_id: number;
  ontime_stats: OntimeStats[];
}

export interface ServerOntimeResponse {
  data: ServerWithOntime;
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
  namespace: string;
  object_id: string;
  kind: ServerKind;
  container_name?: string;
  timeout?: number;
}

export interface TestEndpointResponse {
  running: boolean;
  error?: string;
}

export type SearchServersResponse = ServerListResponse;

export interface ImportServerSuccess {
  row: number;
  name: string;
  server_id: number;
}

export interface ImportServerRowError {
  row: number;
  message: string;
}

export interface ImportServersResponse {
  success_count: number;
  successes: ImportServerSuccess[];
  failed_count: number;
  failed: ImportServerRowError[];
}

export interface CalculateUptimeRequest {
  from: string;
  to: string;
  resolution?: string;
}

export interface IntervalResult {
  from: string;
  to: string;
  uptime: number;
}

export interface UptimeResponse {
  server_id: number;
  uptime: number;
  from: string;
  to: string;
  total_seconds: number;
  online_seconds: number;
  intervals: IntervalResult[];
}

export interface NotificationConfig {
  from_date?: string;
  to_date?: string;
  digest_time?: string;
}

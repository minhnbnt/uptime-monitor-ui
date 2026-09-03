import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiListServers,
  apiGetServer,
  apiCreateServer,
  apiUpdateServer,
  apiDeleteServer,
  apiSetCheckMethod,
  apiListServersOntimeByIds,
  apiGetServersStatuses,
  apiCountServers,
  apiListSessions,
  apiRevokeSession,
  apiSearchServers,
  apiGetNotificationConfig,
  apiUpdateNotificationConfig,
  apiSendReport,
  apiCreateAgentSession,
  apiTestEndpoint,
  apiCalculateUptime,
  toUiStatus,
} from './api';
import type { UiStatus } from './api';
import type {
  CreateServerRequest,
  UpdateServerRequest,
  SetCheckMethodRequest,
  NotificationConfig,
  TestEndpointRequest,
  CalculateUptimeRequest,
} from '../types/api';

export const queryKeys = {
  servers: (page: number, perPage: number) => ['servers', page, perPage] as const,
  server: (id: number) => ['server', id] as const,
  serverOntime: (ids: number[]) => ['serverOntime', ids.sort().join(',')] as const,
  serverStatuses: (ids: number[]) => ['serverStatuses', ids.sort().join(',')] as const,
  serverCount: ['serverCount'] as const,
  sessions: (page: number) => ['sessions', page] as const,
  search: (q: string, page: number, sortBy: string, sortOrder: string) =>
    ['search', q, page, sortBy, sortOrder] as const,
  notificationConfig: ['notificationConfig'] as const,
  uptime: (id: number, from: string, to: string, resolution: string) =>
    ['uptime', id, from, to, resolution] as const,
};

export function useServers(page: number, perPage = 20) {
  return useQuery({
    queryKey: queryKeys.servers(page, perPage),
    queryFn: () => apiListServers(page, perPage),
    staleTime: 30_000,
  });
}

export function useServer(id: number) {
  return useQuery({
    queryKey: queryKeys.server(id),
    queryFn: () => apiGetServer(id),
    staleTime: 30_000,
  });
}

export function useServerCount() {
  return useQuery({
    queryKey: queryKeys.serverCount,
    queryFn: () => apiCountServers(),
    staleTime: 30_000,
  });
}

export function useServerOntime(ids: number[]) {
  return useQuery({
    queryKey: queryKeys.serverOntime(ids),
    queryFn: () => apiListServersOntimeByIds(ids),
    enabled: ids.length > 0,
    staleTime: 30_000,
  });
}

export function useServerStatuses(ids: number[]): Record<number, UiStatus> {
  const { data } = useQuery({
    queryKey: queryKeys.serverStatuses(ids),
    queryFn: () => apiGetServersStatuses(ids),
    enabled: ids.length > 0,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  if (!data) return {};
  const map: Record<number, UiStatus> = {};
  for (const item of data.data) {
    map[item.server_id] = toUiStatus(item.status);
  }
  return map;
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServerRequest) => apiCreateServer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.invalidateQueries({ queryKey: queryKeys.serverCount });
    },
  });
}

export function useUpdateServer(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateServerRequest) => apiUpdateServer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.server(id) });
      qc.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDeleteServer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.invalidateQueries({ queryKey: queryKeys.serverCount });
    },
  });
}

export function useSetCheckMethod(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetCheckMethodRequest) => apiSetCheckMethod(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.server(id) });
    },
  });
}

export function useSessions(page = 1) {
  return useQuery({
    queryKey: queryKeys.sessions(page),
    queryFn: () => apiListSessions(page),
    staleTime: 10_000,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRevokeSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useSearchServers(
  query: string,
  page = 1,
  perPage = 20,
  sortBy = 'name',
  sortOrder = 'asc',
) {
  return useQuery({
    queryKey: queryKeys.search(query, page, sortBy, sortOrder),
    queryFn: () => apiSearchServers(query, page, perPage, sortBy, sortOrder),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}

export function useNotificationConfig() {
  return useQuery({
    queryKey: queryKeys.notificationConfig,
    queryFn: () => apiGetNotificationConfig(),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: NotificationConfig) => apiUpdateNotificationConfig(config),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notificationConfig });
    },
  });
}

export function useTestEndpoint() {
  return useMutation({
    mutationFn: (data: TestEndpointRequest) => apiTestEndpoint(data),
  });
}

export function useCalculateUptime(id: number) {
  return useMutation({
    mutationFn: (data: CalculateUptimeRequest) => apiCalculateUptime(id, data),
  });
}

export function useSendReport() {
  return useMutation({
    mutationFn: () => apiSendReport(),
  });
}

export function useCreateAgentSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiCreateAgentSession(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  apiListServers,
  apiGetServer,
  apiGetServerOntime,
  apiListServersOntime,
  apiCountServers,
  apiSearchServers,
  apiGetNotificationConfig,
  apiCreateServer,
  apiCreateK8sObject,
  apiUpdateServer,
  apiDeleteServer,
  apiDeleteK8sObject,
  apiUpdateNotificationConfig,
  apiSendReport,
  apiTestEndpoint,
  apiCalculateUptime,
  ApiError,
} from './api';
import type {
  CreateServerRequest,
  CreateK8sObjectRequest,
  UpdateServerRequest,
  TestEndpointRequest,
  CalculateUptimeRequest,
} from '../types/api';

const stale30s = { staleTime: 30 * 1000 };

export function useServers(page: number) {
  return useQuery({
    queryKey: ['servers', page],
    queryFn: () => apiListServers(page, 20),
    ...stale30s,
  });
}

export function useServer(id: number | undefined) {
  return useQuery({
    queryKey: ['server', id],
    queryFn: () => apiGetServer(id!),
    enabled: !!id,
    ...stale30s,
  });
}

export function useServerOntime(id: number | undefined) {
  return useQuery({
    queryKey: ['server', id, 'ontime'],
    queryFn: () => apiGetServerOntime(id!),
    enabled: !!id,
    ...stale30s,
  });
}

export function useServersOntimeList(page: number) {
  return useQuery({
    queryKey: ['servers', 'ontime', page],
    queryFn: () => apiListServersOntime(page, 20),
    ...stale30s,
  });
}

export function useServerCount() {
  return useQuery({
    queryKey: ['servers', 'count'],
    queryFn: apiCountServers,
    ...stale30s,
  });
}

export function useSearchServers(
  query: string,
  page: number,
  sortBy: string,
  sortOrder: string,
) {
  return useQuery({
    queryKey: ['servers', 'search', query, page, sortBy, sortOrder],
    queryFn: () => apiSearchServers(query, page, 20, sortBy, sortOrder),
    enabled: !!query.trim(),
    ...stale30s,
  });
}

export function useNotificationConfig() {
  return useQuery({
    queryKey: ['notification-config'],
    queryFn: apiGetNotificationConfig,
    ...stale30s,
  });
}

export function useCreateServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServerRequest) => apiCreateServer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useCreateK8sObject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateK8sObjectRequest) => apiCreateK8sObject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useUpdateServer(id: number | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateServerRequest) => apiUpdateServer(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['servers'] });
      qc.invalidateQueries({ queryKey: ['server', id] });
    },
  });
}

export function useDeleteServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiDeleteServer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }),
  });
}

export function useDeleteK8sObject() {
  return useMutation({
    mutationFn: ({ namespace, objectId }: { namespace: string; objectId: string }) =>
      apiDeleteK8sObject(namespace, objectId),
  });
}

export function useTestEndpoint() {
  return useMutation({
    mutationFn: (data: TestEndpointRequest) => apiTestEndpoint(data),
  });
}

export function useUpdateNotificationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Parameters<typeof apiUpdateNotificationConfig>[0]) =>
      apiUpdateNotificationConfig(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-config'] }),
  });
}

export function useSendReport() {
  return useMutation({
    mutationFn: apiSendReport,
  });
}

export function useCalculateUptime(serverId: number | undefined) {
  return useMutation({
    mutationFn: (data: CalculateUptimeRequest) => apiCalculateUptime(serverId!, data),
  });
}

export { ApiError };

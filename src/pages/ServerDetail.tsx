import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useServer, useServerOntime, useDeleteServer, useDeleteK8sObject } from '../lib/queries';
import { ApiError, toUiStatus } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import OntimeChart from '../components/OntimeChart';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serverId = id ? Number(id) : undefined;

  const { data: serverRes, isLoading, error } = useServer(serverId);
  const { data: ontimeRes } = useServerOntime(serverId);
  const deleteMutation = useDeleteServer();
  const deletePodMutation = useDeleteK8sObject();

  const server = serverRes?.data ?? null;
  const queryError = error instanceof ApiError && error.status === 404
    ? 'Server not found'
    : error instanceof Error ? error.message : '';

  const [podOffer, setPodOffer] = useState<{ namespace: string; objectId: string } | null>(null);
  const [podError, setPodError] = useState('');

  const handleDelete = async () => {
    if (!server || !window.confirm(`Delete server "${server.name}"? This action cannot be undone.`)) return;

    const { namespace, object_id: objectId, managed, kind } = server;

    try {
      await deleteMutation.mutateAsync(server.id);
      // If this was a managed pod created by the system, offer to delete it too.
      if (managed && kind === 'Pod' && namespace && objectId) {
        setPodError('');
        setPodOffer({ namespace, objectId });
      } else {
        navigate('/');
      }
    } catch {
      // error handled by mutation state
    }
  };

  const handleAcceptPodDelete = async () => {
    if (!podOffer) return;
    try {
      await deletePodMutation.mutateAsync({ namespace: podOffer.namespace, objectId: podOffer.objectId });
      setPodOffer(null);
      navigate('/');
    } catch (err) {
      setPodError(err instanceof ApiError ? err.message : 'Failed to delete pod');
    }
  };

  const handleDismissPodDelete = () => {
    setPodOffer(null);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (queryError || !server) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {queryError || 'Server not found'}
        </div>
        <Link to="/" className="mt-4 inline-block text-sm text-success hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Pod deletion suggestion after server delete */}
      {podOffer && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-warning">
                Server deleted. Delete the pod too?
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                The pod <span className="font-mono">{podOffer.namespace}/{podOffer.objectId}</span> is still in the cluster.
              </p>
              {podError && (
                <p className="mt-1 text-xs text-danger">{podError}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDismissPodDelete}
                disabled={deletePodMutation.isPending}
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-60"
              >
                Dismiss
              </button>
              <button
                onClick={handleAcceptPodDelete}
                disabled={deletePodMutation.isPending}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletePodMutation.isPending ? <LoadingSpinner size="sm" /> : null}
                Delete Pod
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/servers/${server.id}/edit`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger/10 px-3.5 py-2 text-sm font-medium text-danger transition-all duration-200 hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Server info card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{server.name}</h1>
              <StatusBadge status={toUiStatus(server.monitor_status)} />
            </div>
            <p className="mt-1 text-sm text-slate-500">ID: {server.id}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-surface-elevated p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Created</p>
            <p className="mt-1 text-sm text-text-primary">
              {new Date(server.created_at).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-surface-elevated p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Updated</p>
            <p className="mt-1 text-sm text-text-primary">
              {new Date(server.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* K8s identity */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Kubernetes Resource</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Namespace</p>
            <p className="mt-1 text-sm text-text-primary font-mono">{server.namespace}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Kind</p>
            <p className="mt-1 text-sm text-text-primary">{server.kind}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Object Name</p>
            <p className="mt-1 truncate text-sm text-text-primary font-mono">{server.object_id}</p>
          </div>
          {server.container_name && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Container</p>
              <p className="mt-1 text-sm text-text-primary font-mono">{server.container_name}</p>
            </div>
          )}
          {server.interval != null && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Interval</p>
              <p className="mt-1 text-sm text-text-primary">{server.interval}s</p>
            </div>
          )}
          {server.timeout != null && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Timeout</p>
              <p className="mt-1 text-sm text-text-primary">{server.timeout}s</p>
            </div>
          )}
        </div>

        {server.http_config && (
          <div className="mt-4 rounded-lg bg-success/10 p-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-xs font-medium uppercase tracking-wider text-success">HTTP Check</p>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <p className="text-sm text-text-primary">
                <span className="text-slate-500">Endpoint:</span>{' '}
                <span className="font-mono">
                  {server.http_config.method ?? 'GET'} :{server.http_config.port}
                  {server.http_config.endpoint_path || '/'}
                </span>
              </p>
              {server.http_config.expected_code != null && (
                <p className="text-sm text-text-primary">
                  <span className="text-slate-500">Expected status:</span> {server.http_config.expected_code}
                </p>
              )}
              {server.http_config.body_check_expr && (
                <p className="truncate text-sm text-text-primary" title={server.http_config.body_check_expr}>
                  <span className="text-slate-500">Body check:</span>{' '}
                  <span className="font-mono">{server.http_config.body_check_expr}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ontime chart */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Uptime (Last 30 Days)</h2>
          <Link
            to={`/servers/${server.id}/uptime-range`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Custom Range
          </Link>
        </div>
        <OntimeChart data={ontimeRes?.data?.ontime_stats ?? []} height={250} />
      </div>
    </div>
  );
}

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useServer, useServerOntime, useDeleteServer } from '../lib/queries';
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

  const server = serverRes?.data ?? null;
  const queryError = error instanceof ApiError && error.status === 404
    ? 'Server not found'
    : error instanceof Error ? error.message : '';

  const handleDelete = async () => {
    if (!server || !window.confirm(`Delete server "${server.name}"? This action cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(server.id);
      navigate('/');
    } catch (err) {
      // error handled by mutation state
    }
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

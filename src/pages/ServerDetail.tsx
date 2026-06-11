import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGetServer, apiDeleteServer, apiListServersOntime } from '../lib/api';
import { ApiError } from '../lib/api';
import type { ServerObject, ServerWithOntime } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import OntimeChart from '../components/OntimeChart';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<ServerObject | null>(null);
  const [ontimeData, setOntimeData] = useState<ServerWithOntime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    Promise.all([
      apiGetServer(Number(id)),
      apiListServersOntime(1, 30),
    ])
      .then(([serverRes, ontimeRes]) => {
        setServer(serverRes.data);
        const found = ontimeRes.data.find((s) => s.server.id === Number(id));
        if (found) setOntimeData(found);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError('Server not found');
        } else {
          setError(err.message ?? 'Failed to load server');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!server || !window.confirm(`Delete server "${server.name}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await apiDeleteServer(server.id);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error || 'Server not found'}
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
            to={`/servers/${server.id}/check-method`}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Check Method
          </Link>
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
            disabled={deleting}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger/10 px-3.5 py-2 text-sm font-medium text-danger transition-all duration-200 hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Server info card */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">{server.name}</h1>
              <StatusBadge status={server.status} />
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

      {/* Endpoint info */}
      {server.endpoint && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Endpoint</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">URL</p>
              <p className="mt-1 truncate text-sm text-text-primary font-mono">{server.endpoint.url}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Method</p>
              <p className="mt-1 text-sm text-text-primary">{server.endpoint.method}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Expected Code</p>
              <p className="mt-1 text-sm text-text-primary">{server.endpoint.expected_code}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Interval</p>
              <p className="mt-1 text-sm text-text-primary">{server.endpoint.interval}s</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Timeout</p>
              <p className="mt-1 text-sm text-text-primary">{server.endpoint.timeout}s</p>
            </div>
          </div>
        </div>
      )}

      {/* Ontime chart */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Uptime (Last 30 Days)</h2>
        <OntimeChart data={ontimeData?.ontime_stats ?? []} height={250} />
      </div>
    </div>
  );
}

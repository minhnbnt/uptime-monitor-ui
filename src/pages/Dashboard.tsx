import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiListServers, apiListServersOntime, apiCountServers, toUiStatus } from '../lib/api';
import type { ServerObject, ServerWithOntime, ServerOntimeListResponse, PaginationMeta, ServerCountResponse } from '../types/api';

import StatusBadge from '../components/StatusBadge';
import OntimeChart from '../components/OntimeChart';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

function avg(stats: { stats: number }[]) {
  if (!stats || stats.length === 0) return null;
  return stats.reduce((s, d) => s + d.stats, 0) / stats.length;
}

export default function Dashboard() {
  const [servers, setServers] = useState<ServerObject[]>([]);
  const [ontime, setOntime] = useState<Record<number, ServerWithOntime['ontime_stats']>>({});
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 20, total: 0 });
  const [count, setCount] = useState<ServerCountResponse>({ total: 0, online: 0, offline: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([apiListServers(page, 20), apiCountServers()])
      .then(([res, counts]) => {
        setServers(res.data);
        setMeta(res.meta);
        setCount(counts);
      })
      .catch((err) => setError(err.message ?? 'Failed to load servers'))
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    if (servers.length === 0) return;
    apiListServersOntime(page, 20)
      .then((res: ServerOntimeListResponse) => {
        const map: Record<number, ServerWithOntime['ontime_stats']> = {};
        for (const o of res.data) map[o.server_id] = o.ontime_stats;
        setOntime(map);
      })
      .catch(() => {});
  }, [servers, page]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor your servers' uptime for the last 30 days
          </p>
        </div>
        <Link
          to="/servers/new"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Server
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && servers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <svg className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
          <p className="text-lg font-medium text-slate-400">No servers yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first server to start monitoring</p>
          <Link
            to="/servers/new"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Server
          </Link>
        </div>
      )}

      {!loading && !error && servers.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Servers</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{meta.total}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Online</p>
              <p className="mt-1 text-2xl font-bold text-success">
                {count.online}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Offline</p>
              <p className="mt-1 text-2xl font-bold text-danger">
                {count.offline}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Unknown</p>
              <p className="mt-1 text-2xl font-bold text-slate-400">
                {Math.max(0, meta.total - count.online - count.offline)}
              </p>
            </div>
          </div>

          {/* Server cards */}
          <div className="space-y-4">
            {servers.map((server) => {
              const stats = ontime[server.id] ?? [];
              const avgUptime = avg(stats);
              return (
                <Link
                  key={server.id}
                  to={`/servers/${server.id}`}
                  className="block cursor-pointer rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-slate-600 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-lg font-semibold text-text-primary">
                          {server.name}
                        </h3>
                        <StatusBadge status={toUiStatus(server.monitor_status)} />
                      </div>
                      {server.endpoint && (
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {server.endpoint.url}
                        </p>
                      )}
                    </div>
                    {avgUptime !== null && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-success">
                          {avgUptime.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500">30-day avg</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <OntimeChart data={stats} height={120} />
                  </div>
                </Link>
              );
            })}
          </div>

          <Pagination
            page={meta.page}
            perPage={meta.per_page}
            total={meta.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

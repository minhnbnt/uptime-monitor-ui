import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetServer, apiCalculateUptime, ApiError } from '../lib/api';
import type { ServerObject, UptimeResponse } from '../types/api';
import OntimeChart from '../components/OntimeChart';
import LoadingSpinner from '../components/LoadingSpinner';

function getUptimeColor(value: number): string {
  if (value >= 100) return '#15803D';
  if (value >= 98) return '#22C55E';
  if (value >= 95) return '#F97316';
  return '#EF4444';
}

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}

function resolutionMs(r: string): number {
  const m = r.match(/^(\d+)(m|h)$/);
  if (!m) return 15 * 60 * 1000;
  const n = Number(m[1]);
  return m[2] === 'h' ? n * 3600 * 1000 : n * 60 * 1000;
}

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ServerUptimeRange() {
  const { id } = useParams<{ id: string }>();
  const serverId = id ? Number(id) : undefined;

  const [server, setServer] = useState<ServerObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const now = new Date();
  const [calcFrom, setCalcFrom] = useState(toLocalInput(new Date(now.getTime() - 24 * 60 * 60 * 1000)));
  const [calcTo, setCalcTo] = useState(toLocalInput(now));
  const [calcResolution, setCalcResolution] = useState('15m');
  const [calcResult, setCalcResult] = useState<UptimeResponse | null>(null);
  const [lastCalcResolution, setLastCalcResolution] = useState('15m');
  const [calcError, setCalcError] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!serverId) return;
    apiGetServer(serverId)
      .then((res) => { setServer(res.data); setLoadError(''); })
      .catch((err) => { setLoadError(err instanceof ApiError ? err.message : 'Failed to load server'); })
      .finally(() => setLoading(false));
  }, [serverId]);

  const handleCalculate = useCallback(async () => {
    if (!serverId) return;
    setCalcError('');

    const from = new Date(calcFrom);
    const to = new Date(calcTo);

    if (from >= to) { setCalcError('From must be before To'); return; }
    if (to > new Date()) { setCalcError('To cannot be in the future'); return; }
    if (to.getTime() - from.getTime() > 90 * 24 * 60 * 60 * 1000) {
      setCalcError('Range cannot exceed 90 days'); return;
    }

    setCalculating(true);
    try {
      const result = await apiCalculateUptime(serverId, {
        from: from.toISOString(),
        to: to.toISOString(),
        resolution: calcResolution,
      });
      setCalcResult(result);
      setLastCalcResolution(calcResolution);
    } catch (err) {
      setCalcError(err instanceof ApiError ? err.message : 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  }, [serverId, calcFrom, calcTo, calcResolution]);

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  if (loadError || !server) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError || 'Server not found'}
        </div>
        <Link to="/" className="mt-4 inline-block text-sm text-success hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={`/servers/${server.id}`}
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {server.name}
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Custom Time Range</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">From</label>
            <input
              type="datetime-local"
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value)}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">To</label>
            <input
              type="datetime-local"
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value)}
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1">Resolution</label>
            <input
              type="text"
              value={calcResolution}
              onChange={(e) => setCalcResolution(e.target.value)}
              placeholder="e.g. 15m, 1h, 30m"
              className="rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-text-primary w-24 font-mono"
            />
          </div>
          <button
            onClick={handleCalculate}
            disabled={calculating}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {calculating ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {calcError && (
          <div className="mt-3 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">{calcError}</div>
        )}

        {calcResult && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Uptime{calcResult.partial ? ' (partial range)' : ''}
                </p>
                {calcResult.has_data === false ? (
                  <p className="mt-1 text-2xl font-bold text-slate-500">No data</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold" style={{ color: getUptimeColor(calcResult.uptime) }}>
                    {calcResult.uptime.toFixed(2)}%
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-surface-elevated p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Online</p>
                {calcResult.has_data === false ? (
                  <p className="mt-1 text-2xl font-bold text-slate-500">—</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-success">
                    {formatSeconds(calcResult.online_seconds)}
                  </p>
                )}
              </div>
            </div>
            {(() => {
              const resMs = resolutionMs(lastCalcResolution);
              const pts: { date: string; stats: number; has_data: boolean; unknown_seconds: number }[] = [];
              for (let i = 0; i < calcResult.intervals.length; i++) {
                const iv = calcResult.intervals[i];
                const fromMs = new Date(iv.from).getTime();
                const toMs = new Date(iv.to).getTime();
                const isLast = i === calcResult.intervals.length - 1;
                pts.push({ date: iv.from, stats: iv.uptime, has_data: iv.has_data ?? true, unknown_seconds: 0 });
                if (isLast) {
                  pts.push({ date: iv.to, stats: iv.uptime, has_data: iv.has_data ?? true, unknown_seconds: 0 });
                } else if (toMs - fromMs > resMs) {
                  pts.push({ date: new Date(toMs - resMs).toISOString(), stats: iv.uptime, has_data: iv.has_data ?? true, unknown_seconds: 0 });
                }
              }
              return <OntimeChart data={pts} height={200} />;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

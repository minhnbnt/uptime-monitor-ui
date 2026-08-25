import { useCallback, useEffect, useState } from 'react';
import { apiListSessions, apiCreateAgentSession, apiRevokeSession } from '../lib/api';
import type { SessionInfo, SessionListResponse } from '../types/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

function errMsg(err: unknown, fallback: string): string {
  return (err instanceof Error) ? err.message : fallback;
}

const SCOPE_LABELS: Record<string, string> = {
  app: 'Web',
  ping: 'Agent',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SettingsSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apply = useCallback((res: SessionListResponse) => {
    setSessions(res.data);
    setMeta(res.meta);
    setPage(res.meta.page);
    setError('');
  }, []);

  useEffect(() => {
    apiListSessions(1)
      .then(apply)
      .catch((err) => setError(errMsg(err, 'Failed to load sessions')))
      .finally(() => setLoading(false));
  }, [apply]);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      apply(await apiListSessions(targetPage));
    } catch (err) {
      setError(errMsg(err, 'Failed to load sessions'));
    } finally {
      setLoading(false);
    }
  }, [apply]);

  const flash = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await apiCreateAgentSession();
      setAgentToken(res.refresh_token);
      setCopied(false);
      await load(page);
    } catch (err) {
      setError((err instanceof Error) ? err.message : 'Failed to create agent session');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    setError('');
    try {
      await apiRevokeSession(id);
      flash('Session revoked');
      if (sessions.length === 1 && page > 1) {
        await load(page - 1);
      } else {
        await load(page);
      }
    } catch (err) {
      setError((err instanceof Error) ? err.message : 'Failed to revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async () => {
    if (!agentToken) return;
    try {
      await navigator.clipboard.writeText(agentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. non-secure context)
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Sessions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your active login sessions and agent access
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? <LoadingSpinner size="sm" /> : null}
          New Agent Session
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{success}</div>
      )}

      {agentToken && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-text-primary">Agent Refresh Token</h3>
          <p className="mt-1 text-xs text-slate-400">
            Paste this into your agent configuration. It won&apos;t be shown again.
          </p>
          <code className="mt-3 block max-h-32 overflow-y-auto break-all rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-xs text-slate-300">
            {agentToken}
          </code>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            >
              {copied ? 'Copied!' : 'Copy Token'}
            </button>
            <button
              type="button"
              onClick={() => setAgentToken(null)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <ul className="divide-y divide-border">
              {sessions.map((session) => (
                <li key={session.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {session.scopes.map((scope) => (
                        <span
                          key={scope}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            scope === 'ping'
                              ? 'bg-amber-400/10 text-amber-300'
                              : 'bg-emerald-400/10 text-emerald-300'
                          }`}
                        >
                          {SCOPE_LABELS[scope] ?? scope}
                        </span>
                      ))}
                      {session.current && (
                        <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Created {formatDate(session.created_at)} · Expires{' '}
                      {formatDate(session.expires_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(session.id)}
                    disabled={session.current || revokingId !== null}
                    title={
                      session.current
                        ? 'You cannot revoke the session you are currently using'
                        : undefined
                    }
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                  >
                    {revokingId === session.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Pagination
            page={page}
            perPage={meta.per_page}
            total={meta.total}
            onPageChange={(p) => load(p)}
          />
        </>
      )}
    </div>
  );
}

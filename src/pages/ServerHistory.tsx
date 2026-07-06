import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGetServer } from '../lib/api';
import type { ServerObject } from '../types/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface ServerEvent {
  id: number;
  timestamp: string;
  status: 'active' | 'inactive' | 'error';
  duration_seconds: number;
  response_time_ms?: number;
  error_message?: string;
}

export default function ServerHistory() {
  const { id } = useParams<{ id: string }>();
  const [server, setServer] = useState<ServerObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!id) return;

    apiGetServer(Number(id))
      .then((res) => {
        setServer(res.data);
        setError('');
      })
      .catch((err) => setError(err.message ?? 'Failed to load server'))
      .finally(() => setLoading(false));
  }, [id]);

  const [mockEvents] = useState<ServerEvent[]>(() => {
    const now = Date.now();
    return [
      {
        id: 1,
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        duration_seconds: 3600,
        response_time_ms: 145,
      },
      {
        id: 2,
        timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        status: 'error',
        duration_seconds: 600,
        error_message: 'Connection timeout',
      },
      {
        id: 3,
        timestamp: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        duration_seconds: 7200,
        response_time_ms: 123,
      },
      {
        id: 4,
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        status: 'inactive',
        duration_seconds: 3600,
        error_message: 'Server unreachable',
      },
      {
        id: 5,
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        duration_seconds: 86400,
        response_time_ms: 156,
      },
    ];
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'inactive':
        return 'text-danger';
      case 'error':
        return 'text-warning';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10';
      case 'inactive':
        return 'bg-danger/10';
      case 'error':
        return 'bg-warning/10';
      default:
        return 'bg-slate-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="mx-auto max-w-lg text-center">
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/servers/${server.id}`}
          className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Server
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Event History</h1>
        <p className="mt-1 text-sm text-slate-400">
          View status changes and events for {server.name}
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="mb-4 text-sm font-semibold text-text-primary">Filters</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-400">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-slate-900 px-3 py-2 text-text-primary transition-colors duration-200 hover:border-slate-700 focus:border-success focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      {mockEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-16">
          <svg className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium text-slate-400">No events found</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your date filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mockEvents.map((event, idx) => (
            <div key={event.id} className="relative">
              {/* Timeline line */}
              {idx !== mockEvents.length - 1 && (
                <div className="absolute left-6 top-16 h-12 w-0.5 bg-gradient-to-b from-slate-700 to-slate-800" />
              )}

              {/* Event card */}
              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="relative flex w-12 flex-col items-center pt-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 border-border ${getStatusBgColor(event.status)}`}
                  />
                </div>

                {/* Event content */}
                <div className="flex-1 rounded-lg border border-border bg-surface p-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold uppercase tracking-wide ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      {event.error_message && (
                        <p className="mt-2 text-sm text-slate-400">{event.error_message}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-300">
                        {formatDuration(event.duration_seconds)}
                      </p>
                      {event.response_time_ms !== undefined && (
                        <p className="text-xs text-slate-500">
                          {event.response_time_ms}ms response
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

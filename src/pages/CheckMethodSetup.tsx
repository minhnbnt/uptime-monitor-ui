import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiGetServer, apiSetCheckMethod } from '../lib/api';
import { ApiError } from '../lib/api';
import type { ServerObject, CheckMethodType, Endpoint, HttpMethod } from '../types/api';
import EndpointForm from '../components/EndpointForm';
import LoadingSpinner from '../components/LoadingSpinner';

function defaultEndpoint(): Endpoint {
  return {
    url: '',
    interval: 30,
    timeout: 10,
    method: 'GET' as HttpMethod,
    expected_code: 200,
  };
}

function PushInstructions({ serverId }: { serverId: number }) {
  const apiUrl = `${window.location.origin}/api/v1/ping/events`;
  const curl = [
    `curl -X POST ${apiUrl} \\`,
    `  -H "Authorization: Bearer <AGENT_TOKEN>" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '[{"id": ${serverId}, "status": "ON"}]'`,
  ].join('\n');
  const sampleResponse = [
    '{',
    '  "next_time": 1756200000000,',
    '  "stale_at": 1756200030000,',
    '  "accepted": [' + serverId + '],',
    '  "errors": []',
    '}',
  ].join('\n');

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface-elevated p-5">
      <h2 className="text-sm font-semibold text-text-primary">Push setup guide</h2>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">1. Get an agent API key</p>
        <p className="text-sm text-slate-400">
          Go to{' '}
          <Link to="/settings/sessions" className="text-success hover:underline">
            Settings → Sessions
          </Link>
          , click <span className="text-slate-200">Create Agent Session</span> and copy the token it shows.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">2. Push a status update</p>
        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-300">
          <code>{curl}</code>
        </pre>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(curl)}
          className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors duration-200 hover:bg-slate-700 hover:text-slate-100"
        >
          Copy command
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-300">3. Example response</p>
        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs leading-relaxed text-slate-300">
          <code>{sampleResponse}</code>
        </pre>
        <ul className="list-inside list-disc space-y-1 text-xs text-slate-500">
          <li><span className="text-slate-300">next_time</span> — unix ms when this session may push again.</li>
          <li><span className="text-slate-300">stale_at</span> — push again before this or the servers go UNKNOWN.</li>
          <li><span className="text-slate-300">accepted</span> / <span className="text-slate-300">errors</span> — which server IDs were recorded and which failed (with a reason).</li>
        </ul>
      </div>

      <ul className="list-inside list-disc space-y-1 text-xs text-slate-500">
        <li><span className="text-slate-300">status</span> accepts ON or OFF only; anything else is rejected per item.</li>
        <li>One batch per 30s window per session — pushing earlier returns 429 with the next allowed time.</li>
        <li>If nothing arrives before <span className="text-slate-300">stale_at</span> (returned in each response), the servers go UNKNOWN until you push again.</li>
      </ul>
    </div>
  );
}

export default function CheckMethodSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [server, setServer] = useState<ServerObject | null>(null);
  const [method, setMethod] = useState<CheckMethodType>('pull');
  const [endpoint, setEndpoint] = useState<Endpoint>(defaultEndpoint);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiGetServer(Number(id))
      .then((res) => {
        setServer(res.data);
        if (res.data.endpoint) {
          setEndpoint(res.data.endpoint);
          setMethod('pull');
        } else {
          setMethod('push');
        }
      })
      .catch((err) => setError(err.message ?? 'Failed to load server'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!server) return;
    setError('');
    setSaving(true);
    try {
      const body = method === 'push' ? { method } : { method, endpoint };
      await apiSetCheckMethod(server.id, body);
      navigate(`/servers/${server.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update check method');
      }
    } finally {
      setSaving(false);
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
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/servers/${server.id}`}
          className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Check Method</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure how {server.name} is monitored
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <EndpointForm
          method={method}
          endpoint={endpoint}
          onMethodChange={setMethod}
          onEndpointChange={setEndpoint}
        />

        {method === 'push' && <PushInstructions serverId={server.id} />}

        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <div className="flex gap-3">
            <Link
              to={`/servers/${server.id}`}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || (method === 'pull' && !endpoint.url.trim())}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <LoadingSpinner size="sm" /> : null}
              Save Configuration
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

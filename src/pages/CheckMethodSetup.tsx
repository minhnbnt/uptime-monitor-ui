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
      await apiSetCheckMethod(server.id, { method, endpoint });
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

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            to={`/servers/${server.id}`}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !endpoint.url.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <LoadingSpinner size="sm" /> : null}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

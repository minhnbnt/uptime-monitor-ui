import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useServer, useUpdateServer } from '../lib/queries';
import { ApiError } from '../lib/api';
import type { HttpConfig, ServerKind, ServerObject } from '../types/api';
import { cleanHttpConfig } from '../types/api';
import LoadingSpinner from '../components/LoadingSpinner';
import K8sConfigForm from '../components/K8sConfigForm';

function EditForm({ server }: { server: ServerObject }) {
  const navigate = useNavigate();
  const updateMutation = useUpdateServer(server.id);

  const [name, setName] = useState(server.name);
  const [namespace, setNamespace] = useState(server.namespace);
  const [kind, setKind] = useState<ServerKind>(server.kind);
  const [objectId, setObjectId] = useState(server.object_id);
  const [containerName, setContainerName] = useState(server.container_name ?? '');
  const [interval, setInterval] = useState(server.interval ?? 30);
  const [timeout, setTimeout] = useState(server.timeout ?? 10);
  const [httpConfig, setHttpConfig] = useState<HttpConfig | null>(server.http_config ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (httpConfig && !httpConfig.port) {
      setError('Port is required when HTTP Check is enabled');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await updateMutation.mutateAsync({
        name: name.trim(),
        namespace: namespace.trim(),
        kind,
        object_id: objectId.trim(),
        container_name: containerName.trim() || undefined,
        interval,
        timeout,
        http_config: httpConfig ? cleanHttpConfig(httpConfig) : null,
      });
      navigate(`/servers/${res.data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update server');
    } finally {
      setSaving(false);
    }
  };

  const handleK8sChange = (fields: { namespace?: string; kind?: ServerKind; object_id?: string; container_name?: string; interval?: number; timeout?: number; http_config?: HttpConfig | null }) => {
    if (fields.namespace !== undefined) setNamespace(fields.namespace);
    if (fields.kind !== undefined) setKind(fields.kind);
    if (fields.object_id !== undefined) setObjectId(fields.object_id);
    if (fields.container_name !== undefined) setContainerName(fields.container_name);
    if (fields.interval !== undefined) setInterval(fields.interval);
    if (fields.timeout !== undefined) setTimeout(fields.timeout);
    if (fields.http_config !== undefined) setHttpConfig(fields.http_config);
  };

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
        <h1 className="text-2xl font-bold text-text-primary">Edit Server</h1>
        <p className="mt-1 text-sm text-slate-400">{server.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {/* Server Name */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
            Server Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            required
            minLength={1}
            maxLength={255}
          />
        </div>

        {/* K8s Config */}
        <K8sConfigForm
          namespace={namespace}
          kind={kind}
          objectId={objectId}
          containerName={containerName}
          interval={interval}
          timeout={timeout}
          httpConfig={httpConfig}
          managed={server.managed}
          onChange={handleK8sChange}
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
            disabled={saving || !name.trim() || !namespace.trim() || !objectId.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <LoadingSpinner size="sm" /> : null}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ServerEdit() {
  const { id } = useParams<{ id: string }>();
  const serverId = id ? Number(id) : undefined;

  const { data: serverRes, isLoading, error: loadError } = useServer(serverId);
  const server = serverRes?.data ?? null;

  if (isLoading) {
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
          {(loadError instanceof Error ? loadError.message : null) || 'Server not found'}
        </div>
        <Link to="/" className="mt-4 inline-block text-sm text-success hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return <EditForm key={server.id} server={server} />;
}

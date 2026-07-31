import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateK8sObject } from '../lib/queries';
import { ApiError } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import K8sConfigForm from '../components/K8sConfigForm';
import type { ContainerSpec, HttpConfig, ServerKind } from '../types/api';
import { cleanHttpConfig } from '../types/api';

export default function PodCreate() {
  const navigate = useNavigate();
  const createMutation = useCreateK8sObject();
  const [name, setName] = useState('');
  const [namespace, setNamespace] = useState('default');
  const [objectId, setObjectId] = useState('');
  const [containerName, setContainerName] = useState('');
  const [containers, setContainers] = useState<ContainerSpec[]>([{ name: 'container-1', image: '' }]);
  const [interval, setInterval] = useState(30);
  const [timeout, setTimeout] = useState(10);
  const [httpConfig, setHttpConfig] = useState<HttpConfig | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !namespace.trim() || !objectId.trim()) return;
    if (httpConfig && !httpConfig.port) {
      setError('Port is required when HTTP Check is enabled');
      return;
    }
    if (containers.some((c) => !c.name.trim() || !c.image.trim())) {
      setError('Each container requires a name and image');
      return;
    }
    setError('');
    try {
      const res = await createMutation.mutateAsync({
        name: name.trim(),
        namespace: namespace.trim(),
        object_id: objectId.trim(),
        containers: containers.map((c) => ({ name: c.name.trim(), image: c.image.trim() })),
        container_name: containerName.trim() || undefined,
        interval,
        timeout,
        http_config: httpConfig ? cleanHttpConfig(httpConfig) : undefined,
      });
      navigate(`/servers/${res.data.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create pod');
    }
  };

  const handleK8sChange = (fields: { namespace?: string; kind?: ServerKind; object_id?: string; container_name?: string; interval?: number; timeout?: number; http_config?: HttpConfig | null }) => {
    if (fields.namespace !== undefined) setNamespace(fields.namespace);
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
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Create Pod</h1>
        <p className="mt-1 text-sm text-slate-400">Create a pod in the cluster and start monitoring it</p>
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
            placeholder="My Web Server"
            required
            minLength={1}
            maxLength={255}
            autoFocus
          />
        </div>

        {/* K8s Config */}
        <K8sConfigForm
          namespace={namespace}
          kind="Pod"
          objectId={objectId}
          containerName={containerName}
          containers={containers}
          interval={interval}
          timeout={timeout}
          httpConfig={httpConfig}
          showKind={false}
          showTest={false}
          onChange={handleK8sChange}
          onContainersChange={setContainers}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Link
            to="/"
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim() || !namespace.trim() || !objectId.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? <LoadingSpinner size="sm" /> : null}
            Create Pod
          </button>
        </div>
      </form>
    </div>
  );
}

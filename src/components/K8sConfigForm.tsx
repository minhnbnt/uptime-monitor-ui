import { useState } from 'react';
import type { HttpConfig, ServerKind, TestEndpointRequest } from '../types/api';
import { cleanHttpConfig } from '../types/api';
import { useTestEndpoint } from '../lib/queries';

const KINDS: ServerKind[] = ['Pod', 'Deployment', 'StatefulSet', 'DaemonSet', 'ReplicaSet', 'Service'];
const HTTP_KINDS: ServerKind[] = ['Service', 'Pod', 'StatefulSet'];
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];

interface Props {
  namespace: string;
  kind: ServerKind;
  objectId: string;
  containerName: string;
  interval: number;
  timeout: number;
  httpConfig: HttpConfig | null;
  onChange: (fields: { namespace?: string; kind?: ServerKind; object_id?: string; container_name?: string; interval?: number; timeout?: number; http_config?: HttpConfig | null }) => void;
}

export default function K8sConfigForm({ namespace, kind, objectId, containerName, interval, timeout, httpConfig, onChange }: Props) {
  const testMutation = useTestEndpoint();
  const [testResult, setTestResult] = useState<{ running: boolean; error?: string } | null>(null);

  const setHttpConfig = (patch: Partial<HttpConfig>) => {
    onChange({ http_config: { ...(httpConfig ?? { port: 80, method: 'GET' }), ...patch } });
  };

  const handleTest = async () => {
    setTestResult(null);
    try {
      const req: TestEndpointRequest = { namespace, object_id: objectId, kind };
      if (!httpConfig && containerName) req.container_name = containerName;
      if (timeout) req.timeout = timeout;
      if (httpConfig) req.http_config = cleanHttpConfig(httpConfig);
      const res = await testMutation.mutateAsync(req);
      setTestResult({ running: res.running, error: res.error });
    } catch {
      setTestResult({ running: false, error: 'Failed to connect to server' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Namespace */}
      <div>
        <label htmlFor="k8s-namespace" className="mb-1.5 block text-sm font-medium text-slate-300">
          Namespace
        </label>
        <input
          id="k8s-namespace"
          type="text"
          value={namespace}
          onChange={(e) => onChange({ namespace: e.target.value })}
          placeholder="default"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          required
        />
      </div>

      {/* Kind */}
      <div>
        <label htmlFor="k8s-kind" className="mb-1.5 block text-sm font-medium text-slate-300">
          Kind
        </label>
        <select
          id="k8s-kind"
          value={kind}
          onChange={(e) => onChange({ kind: e.target.value as ServerKind })}
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
        >
          {KINDS.filter((k) => !httpConfig || HTTP_KINDS.includes(k)).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Object ID */}
      <div>
        <label htmlFor="k8s-object-id" className="mb-1.5 block text-sm font-medium text-slate-300">
          Object Name
        </label>
        <input
          id="k8s-object-id"
          type="text"
          value={objectId}
          onChange={(e) => onChange({ object_id: e.target.value })}
          placeholder="my-app"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          The name of the k8s resource (e.g. pod name, deployment name)
        </p>
      </div>

      {/* HTTP Check */}
      <div className="rounded-lg border border-border bg-surface-elevated/50 p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={!!httpConfig}
            onChange={(e) => onChange({ http_config: e.target.checked ? { port: 80, method: 'GET' } : null })}
            className="h-4 w-4 cursor-pointer rounded border-border bg-surface-elevated accent-success"
          />
          <div>
            <p className="text-sm font-medium text-slate-300">HTTP Check</p>
            <p className="text-xs text-slate-500">
              HTTP GET health check via in-cluster DNS (Service, Pod, StatefulSet)
            </p>
          </div>
        </label>

        {httpConfig && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="http-port" className="mb-1.5 block text-sm font-medium text-slate-300">
                Port
              </label>
              <input
                id="http-port"
                type="number"
                min={1}
                max={65535}
                value={httpConfig.port || ''}
                onChange={(e) => setHttpConfig({ port: Math.max(1, parseInt(e.target.value) || 0) })}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
                required
              />
            </div>
            <div>
              <label htmlFor="http-path" className="mb-1.5 block text-sm font-medium text-slate-300">
                Endpoint Path <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="http-path"
                type="text"
                value={httpConfig.endpoint_path ?? ''}
                onChange={(e) => setHttpConfig({ endpoint_path: e.target.value })}
                placeholder="/health"
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              />
            </div>

            <div>
              <label htmlFor="http-method" className="mb-1.5 block text-sm font-medium text-slate-300">
                Method
              </label>
              <select
                id="http-method"
                value={httpConfig.method ?? 'GET'}
                onChange={(e) => setHttpConfig({ method: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="http-expected-code" className="mb-1.5 block text-sm font-medium text-slate-300">
                Expected Status Code <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="http-expected-code"
                type="number"
                min={100}
                max={599}
                value={httpConfig.expected_code ?? ''}
                onChange={(e) => setHttpConfig({ expected_code: parseInt(e.target.value) || undefined })}
                placeholder="200"
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              />
            </div>

            <div>
              <label htmlFor="http-body-check" className="mb-1.5 block text-sm font-medium text-slate-300">
                Body Check Expression <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="http-body-check"
                type="text"
                value={httpConfig.body_check_expr ?? ''}
                onChange={(e) => setHttpConfig({ body_check_expr: e.target.value })}
                placeholder='e.g. contains("ok")'
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              />
            </div>
          </div>
        )}
      </div>

      {/* Container Name */}
      {!httpConfig && (
      <div>
        <label htmlFor="k8s-container" className="mb-1.5 block text-sm font-medium text-slate-300">
          Container Name <span className="text-slate-500">(optional)</span>
        </label>
        <input
          id="k8s-container"
          type="text"
          value={containerName}
          onChange={(e) => onChange({ container_name: e.target.value })}
          placeholder="Leave empty to check all containers"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
        />
      </div>
      )}

      {/* Interval + Timeout */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="k8s-interval" className="mb-1.5 block text-sm font-medium text-slate-300">
            Interval (seconds)
          </label>
          <input
            id="k8s-interval"
            type="number"
            min={1}
            value={interval}
            onChange={(e) => onChange({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          />
        </div>
        <div>
          <label htmlFor="k8s-timeout" className="mb-1.5 block text-sm font-medium text-slate-300">
            Timeout (seconds)
          </label>
          <input
            id="k8s-timeout"
            type="number"
            min={1}
            value={timeout}
            onChange={(e) => onChange({ timeout: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          />
        </div>
      </div>

      {/* Test connection */}
      <div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testMutation.isPending || !namespace || !objectId}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-slate-700 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testMutation.isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Testing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Test Connection
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            testResult.running
              ? 'bg-success/10 text-success'
              : 'bg-danger/10 text-danger'
          }`}>
            {testResult.error ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>{testResult.error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {testResult.running ? (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">
                  {testResult.running ? 'Running' : 'Not Running'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

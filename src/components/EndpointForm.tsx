import { useState } from 'react';
import type { CheckMethodType, Endpoint, HttpMethod } from '../types/api';
import { apiTestEndpoint } from '../lib/api';

interface Props {
  method: CheckMethodType;
  endpoint: Endpoint;
  onMethodChange: (method: CheckMethodType) => void;
  onEndpointChange: (endpoint: Endpoint) => void;
}

const HTTP_METHODS: HttpMethod[] = [
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE',
];

export default function EndpointForm({ method, endpoint, onMethodChange, onEndpointChange }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; statusCode: number; error?: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiTestEndpoint({
        url: endpoint.url,
        method: endpoint.method,
        timeout: endpoint.timeout,
        expected_code: endpoint.expected_code,
      });
      setTestResult({
        success: res.success,
        statusCode: res.status_code,
        error: res.error,
      });
    } catch {
      setTestResult({
        success: false,
        statusCode: 0,
        error: 'Failed to connect to server',
      });
    } finally {
      setTesting(false);
    }
  };

  const set = (field: keyof Endpoint, value: string | number) => {
    onEndpointChange({ ...endpoint, [field]: value });
  };

  return (
    <div className="space-y-5">
      {/* Check method type */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Check Method
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-600 line-through"
          >
            Push
            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
              In Development
            </span>
          </button>
          <button
            type="button"
            onClick={() => onMethodChange('pull')}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              method === 'pull'
                ? 'bg-success text-white'
                : 'bg-surface-elevated text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Pull
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Monitor pulls data from your endpoint periodically
        </p>
      </div>

      {/* Endpoint URL */}
      <div>
        <label htmlFor="ep-url" className="mb-1.5 block text-sm font-medium text-slate-300">
          Endpoint URL
        </label>
        <input
          id="ep-url"
          type="url"
          value={endpoint.url}
          onChange={(e) => set('url', e.target.value)}
          placeholder="https://example.com/health"
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          required
        />
      </div>

      {/* HTTP Method */}
      <div>
        <label htmlFor="ep-method" className="mb-1.5 block text-sm font-medium text-slate-300">
          HTTP Method
        </label>
        <select
          id="ep-method"
          value={endpoint.method}
          onChange={(e) => set('method', e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Interval + Timeout */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="ep-interval" className="mb-1.5 block text-sm font-medium text-slate-300">
            Interval (seconds)
          </label>
          <input
            id="ep-interval"
            type="number"
            min={1}
            value={endpoint.interval}
            onChange={(e) => set('interval', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          />
        </div>
        <div>
          <label htmlFor="ep-timeout" className="mb-1.5 block text-sm font-medium text-slate-300">
            Timeout (seconds)
          </label>
          <input
            id="ep-timeout"
            type="number"
            min={1}
            value={endpoint.timeout}
            onChange={(e) => set('timeout', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
          />
        </div>
      </div>

      {/* Expected code */}
      <div>
        <label htmlFor="ep-code" className="mb-1.5 block text-sm font-medium text-slate-300">
          Expected Status Code
        </label>
        <input
          id="ep-code"
          type="number"
          min={100}
          max={599}
          value={endpoint.expected_code}
          onChange={(e) => set('expected_code', Math.min(599, Math.max(100, parseInt(e.target.value) || 200)))}
          className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
        />
      </div>

      {/* Test endpoint */}
      <div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !endpoint.url}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors duration-200 hover:bg-slate-700 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testing ? (
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
              Test Endpoint
            </>
          )}
        </button>

        {testResult && (
          <div className={`mt-3 rounded-lg px-4 py-3 text-sm ${
            testResult.success
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
                {testResult.success ? (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-medium">
                  {testResult.success ? 'Success' : 'Failed'}
                </span>
                <span className="text-slate-500">·</span>
                <span>Status: {testResult.statusCode}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

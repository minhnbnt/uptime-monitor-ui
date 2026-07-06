import { useEffect, useState } from 'react';
import { apiGetNotificationConfig, apiUpdateNotificationConfig, apiSendReport } from '../lib/api';
import type { NotificationConfig } from '../types/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SettingsNotifications() {
  const [config, setConfig] = useState<NotificationConfig>({
    from_date: '',
    to_date: '',
    digest_time: '08:00',
  });
  const [loading, setLoading] = useState(true);
  const [configReady, setConfigReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  useEffect(() => {
    apiGetNotificationConfig()
      .then((res) => {
        setConfig(res);
        setConfigReady(true);
        setError('');
      })
      .catch((err) => {
        if (err.status !== 404) {
          setError(err.message ?? 'Failed to load notification settings');
        } else {
          setError('');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await apiUpdateNotificationConfig(config);
      setSuccess('Notification settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError((err instanceof Error) ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof NotificationConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSendReport = async () => {
    setReportError('');
    setReportSuccess('');
    setSendingReport(true);
    try {
      await apiSendReport();
      setReportSuccess('Report sent successfully! Check your email.');
      setTimeout(() => setReportSuccess(''), 5000);
    } catch (err) {
      setReportError((err instanceof Error) ? err.message : 'Failed to send report');
    } finally {
      setSendingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Notification Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure daily digest email schedule
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-border bg-surface p-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="from_date" className="mb-2 block text-sm font-medium text-slate-300">
                From Date
              </label>
              <input
                id="from_date"
                type="date"
                value={config.from_date ?? ''}
                onChange={(e) => updateField('from_date', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              />
              <p className="mt-2 text-xs text-slate-400">
                Start date for the daily digest range
              </p>
            </div>

            <div>
              <label htmlFor="to_date" className="mb-2 block text-sm font-medium text-slate-300">
                To Date
              </label>
              <input
                id="to_date"
                type="date"
                value={config.to_date ?? ''}
                onChange={(e) => updateField('to_date', e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              />
              <p className="mt-2 text-xs text-slate-400">
                End date for the daily digest range
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="digest_time" className="mb-2 block text-sm font-medium text-slate-300">
              Digest Time
            </label>
            <input
              id="digest_time"
              type="time"
              value={config.digest_time ?? ''}
              onChange={(e) => updateField('digest_time', e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            />
            <p className="mt-2 text-xs text-slate-400">
              Time of day to send the daily digest email
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
          <button
            type="reset"
            onClick={() => {
              setError('');
              setSuccess('');
            }}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <LoadingSpinner size="sm" /> : null}
            Save Settings
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-sm font-semibold text-text-primary">Send Report Now</h3>
        <p className="mt-1 text-xs text-slate-400">
          Trigger a one-time report email immediately
        </p>

        {reportError && (
          <div className="mt-3 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{reportError}</div>
        )}
        {reportSuccess && (
          <div className="mt-3 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">{reportSuccess}</div>
        )}

        {!configReady && (
          <p className="mt-3 text-xs text-slate-500">
            Please save your notification settings before sending a report.
          </p>
        )}
        <button
          type="button"
          onClick={handleSendReport}
          disabled={sendingReport || !configReady}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingReport ? <LoadingSpinner size="sm" /> : null}
          {sendingReport ? 'Sending...' : 'Send Report Now'}
        </button>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
        <h3 className="text-sm font-semibold text-text-primary">About Daily Digest</h3>
        <ul className="mt-2 space-y-2 text-xs text-slate-400">
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-success">✓</span>
            <span>A daily summary email of server status changes will be sent at the configured time</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-success">✓</span>
            <span>Set both From Date and To Date to enable the digest</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-success">✓</span>
            <span>Leave dates empty to disable the daily digest</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

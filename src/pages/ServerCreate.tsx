import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateServer } from '../lib/queries';
import { ApiError } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ServerCreate() {
  const navigate = useNavigate();
  const createMutation = useCreateServer();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim() },
      {
        onSuccess: (res) => navigate(`/servers/${res.data.id}`),
        onError: () => {},
      },
    );
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
        <h1 className="text-2xl font-bold text-text-primary">Add Server</h1>
        <p className="mt-1 text-sm text-slate-400">Create a new server to monitor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        {createMutation.error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {createMutation.error instanceof ApiError
              ? createMutation.error.message
              : 'Failed to create server'}
          </div>
        )}

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

        <div className="flex items-center justify-end gap-3">
          <Link
            to="/"
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending ? <LoadingSpinner size="sm" /> : null}
            Create Server
          </button>
        </div>
      </form>
    </div>
  );
}

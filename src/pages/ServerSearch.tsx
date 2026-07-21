import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiSearchServers, toUiStatus } from '../lib/api';
import type { ServerObject, PaginationMeta } from '../types/api';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

type SortBy = 'name' | 'created_at' | 'score';
type SortOrder = 'asc' | 'desc';

export default function ServerSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortBy>((searchParams.get('sort_by') as SortBy) || 'score');
  const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('sort_order') as SortOrder) || 'desc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [data, setData] = useState<ServerObject[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 20, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setData([]);
      return;
    }

    setLoading(true);
    setError('');
    apiSearchServers(query, page, 20, sortBy, sortOrder)
      .then((res) => {
        setData(res.data);
        setMeta(res.meta);
      })
      .catch((err) => setError(err.message ?? 'Failed to search servers'))
      .finally(() => setLoading(false));
  }, [query, page, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      q: query,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: '1',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams({
      q: query,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: String(newPage),
    });
  };

  const handleSortChange = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Search Servers</h1>
        <p className="mt-1 text-sm text-slate-400">
          Find and filter servers by name or other criteria
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <div>
          <label htmlFor="query" className="mb-2 block text-sm font-medium text-slate-300">
            Search Query
          </label>
          <div className="flex gap-2">
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter server name..."
              className="flex-1 rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoadingSpinner size="sm" /> : null}
              Search
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sort-by" className="mb-2 block text-sm font-medium text-slate-300">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortBy)}
              className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            >
              <option value="name">Name</option>
              <option value="created_at">Created Date</option>
              <option value="score">Score</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="mb-2 block text-sm font-medium text-slate-300">
              Order
            </label>
            <div className="flex gap-2">
              {(['asc', 'desc'] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  onClick={() => setSortOrder(order)}
                  className={`flex-1 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    sortOrder === order
                      ? 'bg-success text-white'
                      : 'bg-surface-elevated text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {order === 'asc' ? '↑ Ascending' : '↓ Descending'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!query.trim() && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <svg className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium text-slate-400">Enter a search query</p>
          <p className="mt-1 text-sm text-slate-500">Search for servers by name or other criteria</p>
        </div>
      )}

      {query.trim() && loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {query.trim() && !loading && !error && data.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <svg className="mb-4 h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 118 0 4 4 0 01-8 0zm0 0c0-1.657.895-3.095 2.236-3.864" />
          </svg>
          <p className="text-lg font-medium text-slate-400">No servers found</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your search criteria</p>
        </div>
      )}

      {query.trim() && !loading && !error && data.length > 0 && (
        <>
          {/* Results info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Found <span className="font-semibold text-text-primary">{meta.total}</span> server{meta.total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Results list */}
          <div className="space-y-3">
            {data.map((server) => (
              <Link
                key={server.id}
                to={`/servers/${server.id}`}
                className="block rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-slate-600 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-text-primary">
                      {server.name}
                    </h3>
                    {server.endpoint && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {server.endpoint.url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={toUiStatus(server.monitor_status)} />
                    <span className="text-xs text-slate-500">
                      {new Date(server.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {meta.total > 20 && (
            <Pagination
              page={meta.page}
              perPage={meta.per_page}
              total={meta.total}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

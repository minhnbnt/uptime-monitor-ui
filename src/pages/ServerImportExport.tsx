import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiExportServers, apiImportServers, apiGetImportTemplate } from "../lib/api";
import type { ImportServersResponse } from "../types/api";
import LoadingSpinner from "../components/LoadingSpinner";

type Tab = "import" | "export";

export default function ServerImportExport() {
  const [tab, setTab] = useState<Tab>("export");

  const [exportQuery, setExportQuery] = useState("");
  const [exportSortBy, setExportSortBy] = useState("name");
  const [exportSortOrder, setExportSortOrder] = useState("asc");

  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportServersResponse | null>(null);

  const exportMutation = useMutation({
    mutationFn: () =>
      apiExportServers(exportQuery || undefined, undefined, undefined, exportSortBy, exportSortOrder),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `servers-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const templateMutation = useMutation({
    mutationFn: () => apiGetImportTemplate(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "servers-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => apiImportServers(file),
    onSuccess: (result) => {
      setImportResult(result);
      setImportFile(null);
    },
  });

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    exportMutation.reset();
    exportMutation.mutate();
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    importMutation.reset();
    setImportResult(null);
    importMutation.mutate(importFile);
  };

  const exportError = exportMutation.error?.message;
  const templateError = templateMutation.error?.message;
  const importError = importMutation.error?.message;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Import & Export</h1>
        <p className="mt-1 text-sm text-slate-400">Bulk import or export your servers</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(["export", "import"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setImportResult(null); }}
            className={`cursor-pointer px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              tab === t ? "border-b-2 border-success text-success" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "export" && (
        <form onSubmit={handleExport} className="space-y-4 rounded-xl border border-border bg-surface p-6">
          {exportError && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{exportError}</div>
          )}

          <div>
            <label htmlFor="export-q" className="mb-1.5 block text-sm font-medium text-slate-300">Search</label>
            <input
              id="export-q"
              type="text"
              value={exportQuery}
              onChange={(e) => setExportQuery(e.target.value)}
              placeholder="Filter by server name..."
              className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary placeholder-slate-500 transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="export-sort-by" className="mb-1.5 block text-sm font-medium text-slate-300">Sort By</label>
              <select
                id="export-sort-by"
                value={exportSortBy}
                onChange={(e) => setExportSortBy(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              >
                <option value="name">Name</option>
                <option value="created_at">Created At</option>
              </select>
            </div>
            <div>
              <label htmlFor="export-sort-order" className="mb-1.5 block text-sm font-medium text-slate-300">Order</label>
              <select
                id="export-sort-order"
                value={exportSortOrder}
                onChange={(e) => setExportSortOrder(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary transition-colors duration-200 focus:border-success focus:outline-none focus:ring-1 focus:ring-success"
              >
                <option value="asc">ASC</option>
                <option value="desc">DESC</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={exportMutation.isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportMutation.isPending ? <LoadingSpinner size="sm" /> : null}
              Export
            </button>
          </div>
        </form>
      )}

      {tab === "import" && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Import Servers</h3>
              <p className="mt-1 text-xs text-slate-400">Upload an Excel file to bulk-import servers</p>
            </div>
            <button
              type="button"
              onClick={() => templateMutation.mutate()}
              disabled={templateMutation.isPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-slate-700"
            >
              {templateMutation.isPending ? <LoadingSpinner size="sm" /> : null}
              Download Template
            </button>
          </div>

          {templateError && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{templateError}</div>
          )}

          <form onSubmit={handleImport} className="space-y-4">
            {importError && (
              <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{importError}</div>
            )}

            {importResult && (
              <div className={`rounded-lg px-4 py-3 text-sm ${importResult.failed_count === 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {importResult.failed_count === 0 ? (
                  <p>Successfully imported {importResult.success_count} server(s).</p>
                ) : (
                  <div>
                    <p>Imported {importResult.success_count} server(s). {importResult.failed_count} failed.</p>
                    {importResult.failed.length > 0 && (
                      <ul className="mt-2 list-inside list-disc space-y-1">
                        {importResult.failed.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="import-file" className="mb-1.5 block text-sm font-medium text-slate-300">Excel File</label>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setImportFile(file); importMutation.reset(); setImportResult(null); }
                }}
                className="w-full rounded-lg border border-border bg-surface-elevated px-3.5 py-2.5 text-sm text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-success/20 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-success"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={importMutation.isPending || !importFile}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importMutation.isPending ? <LoadingSpinner size="sm" /> : null}
                Import
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import {
  apiExportServers,
  apiImportServers,
  apiGetImportTemplate,
} from "../lib/api";
import type { ImportServersResponse } from "../types/api";
import LoadingSpinner from "../components/LoadingSpinner";

type Tab = "import" | "export";

export default function ServerImportExport() {
  const [tab, setTab] = useState<Tab>("export");

  // Export state
  const [exportQuery, setExportQuery] = useState("");
  const [exportSortBy, setExportSortBy] = useState("name");
  const [exportSortOrder, setExportSortOrder] = useState("asc");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState("");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] =
    useState<ImportServersResponse | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError("");
    setExportLoading(true);
    try {
      const blob = await apiExportServers(
        exportQuery || undefined,
        undefined,
        undefined,
        exportSortBy,
        exportSortOrder,
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `servers-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Failed to export servers",
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setTemplateError("");
    setTemplateLoading(true);
    try {
      const blob = await apiGetImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "servers-template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setTemplateError(
        err instanceof Error ? err.message : "Failed to download template",
      );
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImportError("");
    setImportResult(null);
    setImportLoading(true);
    try {
      const result = await apiImportServers(importFile);
      setImportResult(result);
      setImportFile(null);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to import servers",
      );
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportError("");
      setImportResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Import & Export
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Bulk import or export your servers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(["export", "import"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setImportResult(null);
              setImportError("");
            }}
            className={`cursor-pointer px-4 py-3 text-sm font-medium transition-colors duration-200 ${
              tab === t
                ? "border-b-2 border-success text-success"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Export Tab */}
      {tab === "export" && (
        <form
          onSubmit={handleExport}
          className="space-y-4 rounded-xl border border-border bg-surface p-6"
        >
          {exportError && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {exportError}
            </div>
          )}

          <div>
            <label
              htmlFor="export-q"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              Search
            </label>
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
              <label
                htmlFor="export-sort-by"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Sort By
              </label>
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
              <label
                htmlFor="export-sort-order"
                className="mb-1.5 block text-sm font-medium text-slate-300"
              >
                Order
              </label>
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

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={exportLoading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportLoading ? <LoadingSpinner size="sm" /> : null}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Servers
            </button>
          </div>
        </form>
      )}

      {/* Import Tab */}
      {tab === "import" && (
        <div className="space-y-4">
          {/* Template Download */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Import Template
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Download a template file to see the required format
                </p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                disabled={templateLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {templateLoading ? <LoadingSpinner size="sm" /> : null}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Template
              </button>
            </div>
            {templateError && (
              <div className="mt-3 rounded-lg bg-danger/10 px-4 py-3 text-xs text-danger">
                {templateError}
              </div>
            )}
          </div>

          {/* File Upload */}
          <form
            onSubmit={handleImport}
            className="space-y-4 rounded-xl border border-border bg-surface p-6"
          >
            <div>
              <label
                htmlFor="file"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Select File
              </label>
              <div className="relative">
                <input
                  id="file"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-elevated px-6 py-8 transition-colors duration-200 hover:border-slate-500 hover:bg-slate-800"
                >
                  <svg
                    className="mb-2 h-8 w-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-text-primary">
                    {importFile
                      ? importFile.name
                      : "Choose a file or drag and drop"}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    CSV or XLSX format
                  </span>
                </label>
              </div>
            </div>

            {importError && (
              <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {importError}
              </div>
            )}

            {importResult && (
              <div className="rounded-lg bg-success/10 px-4 py-3">
                <p className="text-sm font-semibold text-success">
                  Import completed!
                </p>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  <p>
                    Imported:{" "}
                    <span className="font-semibold text-success">
                      {importResult.imported}
                    </span>
                  </p>
                  <p>
                    Failed:{" "}
                    <span className="font-semibold text-danger">
                      {importResult.failed}
                    </span>
                  </p>
                </div>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 rounded bg-danger/20 px-3 py-2">
                    <p className="text-xs font-medium text-danger">Errors:</p>
                    <ul className="mt-1 space-y-1">
                      {importResult.errors.map((err, idx) => (
                        <li key={idx} className="text-xs text-danger/90">
                          • {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {importFile && (
                <button
                  type="button"
                  onClick={() => setImportFile(null)}
                  className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
              <button
                type="submit"
                disabled={!importFile || importLoading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importLoading ? <LoadingSpinner size="sm" /> : null}
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Import Servers
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

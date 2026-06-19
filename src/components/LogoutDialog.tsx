import { useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LogoutDialogProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function LogoutDialog({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}: LogoutDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-lg border border-border"
        role="alertdialog"
        aria-labelledby="logout-title"
        aria-describedby="logout-description"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10">
            <svg className="h-6 w-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2m0-2v2m0-4v2m0-4v2m0-4a9 9 0 110 18 9 9 0 010-18z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 id="logout-title" className="text-lg font-semibold text-text-primary">
              Logout
            </h2>
            <p id="logout-description" className="mt-1 text-sm text-slate-400">
              Are you sure you want to logout from your account?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 bg-surface-elevated hover:bg-slate-700 hover:text-slate-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : null}
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

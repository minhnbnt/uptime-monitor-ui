import type { UiStatus } from '../lib/api';

interface Props {
  status: UiStatus;
}

const STYLES: Record<UiStatus, { label: string; badge: string; dot: string }> = {
  online: {
    label: 'Online',
    badge: 'bg-success/10 text-success',
    dot: 'bg-success',
  },
  offline: {
    label: 'Offline',
    badge: 'bg-danger/10 text-danger',
    dot: 'bg-danger',
  },
  unknown: {
    label: 'Unknown',
    badge: 'bg-slate-500/10 text-slate-400',
    dot: 'bg-slate-500',
  },
};

export default function StatusBadge({ status }: Props) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

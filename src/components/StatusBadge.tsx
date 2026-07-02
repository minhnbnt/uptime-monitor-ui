import type { ServerStatus } from '../types/api';

interface Props {
  status: ServerStatus;
}

export default function StatusBadge({ status }: Props) {
  const online = status === 'online';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        online
          ? 'bg-success/10 text-success'
          : 'bg-warning/10 text-warning'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-warning'}`}
      />
      {status}
    </span>
  );
}

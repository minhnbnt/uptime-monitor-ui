import { useEffect, useState } from 'react';
import { apiGetServersStatuses, toUiStatus } from './api';
import type { UiStatus } from './api';

export function useServerStatuses(ids: number[]): Record<number, UiStatus> {
  const [statuses, setStatuses] = useState<Record<number, UiStatus>>({});
  const key = ids.join(',');

  useEffect(() => {
    if (!key) return;

    let stale = false;
    apiGetServersStatuses(key.split(',').map(Number))
      .then((res) => {
        if (stale) return;
        const map: Record<number, UiStatus> = {};
        for (const item of res.data) {
          map[item.server_id] = toUiStatus(item.status);
        }
        setStatuses(map);
      })
      .catch(() => {});

    return () => {
      stale = true;
    };
  }, [key]);

  return statuses;
}

import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/app/store/useStore';
import { ORDER_POLL_INTERVAL } from '@/lib/constants';
import type { Notification } from '@/types';

/**
 * Polls GET /notifications every ORDER_POLL_INTERVAL ms while a user is signed in
 * and pushes the result into the UI store. Upgradeable to SSE / push later without
 * touching callers.
 */
export function useNotificationPoll() {
  const { user, setNotifications } = useStore();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const data = await api.get<{ success: boolean; notifications: Notification[] }>('/notifications');
        if (!cancelled && data?.notifications) {
          setNotifications(data.notifications);
        }
      } catch {
        // swallow — poll will retry on the next tick
      }
    };

    fetchOnce();
    const id = setInterval(fetchOnce, ORDER_POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user, setNotifications]);
}

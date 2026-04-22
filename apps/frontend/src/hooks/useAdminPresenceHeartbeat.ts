import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ADMIN_PRESENCE_HEARTBEAT } from '@/lib/constants';
import type { AdminPresence, AdminPresenceState } from '@/types';

export interface UseAdminPresenceHeartbeatResult {
  presence: AdminPresence | null;
  state: AdminPresenceState;
  setState: (next: AdminPresenceState) => Promise<void>;
}

/**
 * Keeps the admin's presence row warm by PUT-ing `/api/live-chat/admin/presence`
 * every `ADMIN_PRESENCE_HEARTBEAT` ms. Only two states can be manually set:
 * `available` and `away`. `offline` is inferred backend-side from heartbeat
 * timeout and cannot be written by the client.
 *
 * Enable only when the admin panel is mounted (e.g. mount the hook in
 * AdminLayout). When the component unmounts the interval is torn down and
 * the backend will naturally expire the presence row to `offline`.
 */
export function useAdminPresenceHeartbeat(enabled: boolean): UseAdminPresenceHeartbeatResult {
  const [presence, setPresence] = useState<AdminPresence | null>(null);
  const [state, setLocalState] = useState<AdminPresenceState>('available');

  const push = async (next: AdminPresenceState) => {
    try {
      const res = await api.put<{ success: boolean; presence: AdminPresence }>(
        '/live-chat/admin/presence',
        { state: next },
      );
      setPresence(res.presence);
    } catch {
      // transient — next tick will retry
    }
  };

  const setState = async (next: AdminPresenceState) => {
    if (next === 'offline') return; // cannot manually set offline
    setLocalState(next);
    await push(next);
  };

  useEffect(() => {
    if (!enabled) return;

    void push(state);
    const id = setInterval(() => { void push(state); }, ADMIN_PRESENCE_HEARTBEAT);

    return () => { clearInterval(id); };
    // `state` intentionally included so changing between available/away
    // updates the heartbeat payload immediately.
  }, [enabled, state]);

  return { presence, state, setState };
}

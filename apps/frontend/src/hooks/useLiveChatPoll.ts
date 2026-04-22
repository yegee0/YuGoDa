import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api, ApiError } from '@/lib/api';
import { CHAT_POLL_INTERVAL } from '@/lib/constants';
import type { ChatMessage } from '@/types';

export interface UseLiveChatPollResult {
  messages: ChatMessage[];
  /** True when backend has returned 410 Gone (customer reading own deleted conversation). */
  gone: boolean;
  /** Prepend/reset messages — used when switching conversations or loading history. */
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

/**
 * Polls `GET /api/live-chat/conversations/{id}/messages?since={epochMs}` at
 * `CHAT_POLL_INTERVAL`. Stops polling when `conversationId` is null, `paused`
 * is true, or the backend returns 410 (conversation soft-deleted from the
 * customer's side — the receipt view takes over).
 *
 * Uses the cursor `?since=` pattern so each poll only returns newly-created
 * messages. The cursor is the `createdAt` epoch-ms of the last known message;
 * new messages are appended by ID (deduped).
 */
export function useLiveChatPoll(
  conversationId: string | null,
  paused: boolean,
): UseLiveChatPollResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gone, setGone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  messagesRef.current = messages;

  useEffect(() => {
    setMessages([]);
    setGone(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || paused || gone) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const last = messagesRef.current[messagesRef.current.length - 1];
        const since = last ? new Date(last.createdAt).getTime() : 0;
        const res = await api.get<{ success: boolean; messages: ChatMessage[] }>(
          `/live-chat/conversations/${conversationId}/messages?since=${since}`,
        );
        if (cancelled) return;
        if (res.messages && res.messages.length > 0) {
          setMessages(prev => {
            const seen = new Set(prev.map(m => m.id));
            const fresh = res.messages.filter(m => !seen.has(m.id));
            return fresh.length === 0 ? prev : [...prev, ...fresh];
          });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 410) {
          setGone(true);
        }
      }
    };

    void poll();
    timerRef.current = setInterval(poll, CHAT_POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [conversationId, paused, gone]);

  return { messages, gone, setMessages };
}

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Client } from '@stomp/stompjs';
import { api, ApiError } from '@/lib/api';
import { createStompClient } from '@/lib/wsClient';
import type { ChatMessage } from '@/types';

export interface UseLiveChatPollResult {
  messages: ChatMessage[];
  /** True when the backend signals the conversation has ended (archived / customer_deleted). */
  gone: boolean;
  /** Prepend/reset messages — used when switching conversations or loading history. */
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
}

/**
 * Real-time chat messages via WebSocket (STOMP).
 *
 * On mount:  loads full history once with GET /live-chat/conversations/{id}/messages?since=0
 * Ongoing:   subscribes to /topic/chat.{conversationId} for instant message delivery
 *            subscribes to /topic/chat.status.{conversationId} for gone detection
 *
 * Stops when conversationId is null, paused is true, or the backend pushes
 * status=archived / status=customer_deleted.
 */
export function useLiveChatPoll(
  conversationId: string | null,
  paused: boolean,
): UseLiveChatPollResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gone, setGone] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Reset state when the target conversation changes
  useEffect(() => {
    setMessages([]);
    setGone(false);
  }, [conversationId]);

  // One-shot: load full message history via REST
  useEffect(() => {
    if (!conversationId || paused) return;
    let cancelled = false;
    api.get<{ success: boolean; messages: ChatMessage[] }>(
      `/live-chat/conversations/${conversationId}/messages?since=0`,
    )
      .then(res => { if (!cancelled) setMessages(res.messages || []); })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 410) setGone(true);
      });
    return () => { cancelled = true; };
  }, [conversationId, paused]);

  // Real-time: WebSocket subscriptions
  useEffect(() => {
    if (!conversationId || paused || gone) return;

    const client = createStompClient();
    clientRef.current = client;

    client.onConnect = () => {
      // New messages pushed by the backend after sendMessage()
      client.subscribe(`/topic/chat.${conversationId}`, (frame) => {
        const msg: ChatMessage = JSON.parse(frame.body);
        setMessages(prev =>
          prev.some(m => m.id === msg.id) ? prev : [...prev, msg],
        );
      });

      // Conversation ended — flip to gone so the receipt view takes over
      client.subscribe(`/topic/chat.status.${conversationId}`, (frame) => {
        const { status } = JSON.parse(frame.body) as { status: string };
        if (status === 'archived' || status === 'customer_deleted') {
          setGone(true);
        }
      });
    };

    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [conversationId, paused, gone]);

  return { messages, gone, setMessages };
}

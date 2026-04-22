import { useEffect, useRef } from 'react';
import { formatTime } from '@/lib/formatters';
import type { ChatMessage } from '@/types';

export interface ChatMessageListProps {
  messages: ChatMessage[];
  currentUserRole: 'customer' | 'admin';
  emptyLabel?: string;
}

/**
 * Renders a vertical scrollable chat thread for live support. Messages from
 * `currentUserRole` align right (forest); the other party aligns left (white).
 *
 * SECURITY: `message.content` is intentionally rendered as plain text via JSX
 * interpolation. Do not add `dangerouslySetInnerHTML` or any HTML parser —
 * support messages can contain arbitrary user/admin input and React's default
 * escaping is the only XSS barrier here.
 */
export function ChatMessageList({ messages, currentUserRole, emptyLabel }: ChatMessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0 && emptyLabel) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-6">
        <p className="text-xs text-[#8FA396] dark:text-white/50 font-medium">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F5F0E8] dark:bg-[#0F2A1C]">
      {messages.map(msg => {
        const isMine = msg.senderRole === currentUserRole;
        return (
          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%]">
              <div className={`p-3 rounded-2xl text-xs font-medium ${
                isMine
                  ? 'bg-[#1B5E52] text-white rounded-tr-none'
                  : 'bg-white dark:bg-[#111] text-[#1B1B1B] dark:text-white rounded-tl-none shadow-sm border border-[#E8E0D5] dark:border-white/10'
              }`}>
                {msg.content}
              </div>
              <p className={`text-[9px] mt-1 text-[#8FA396] dark:text-white/40 ${isMine ? 'text-right' : 'text-left'}`}>
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

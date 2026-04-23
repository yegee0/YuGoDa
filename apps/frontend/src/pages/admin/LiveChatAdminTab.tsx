import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, Inbox } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CHAT_POLL_INTERVAL, CHAT_QUEUE_POLL_INTERVAL } from '@/lib/constants';
import { formatTime } from '@/lib/formatters';
import { ChatMessageList } from '@/components/shared';
import { useLiveChatPoll } from '@/hooks/useLiveChatPoll';
import type { AdminResolution, ChatConversation } from '@/types';

interface QueuedResponse {
  success: boolean;
  queued: ChatConversation[];
  active: ChatConversation | Record<string, never>;
}

export default function LiveChatAdminTab() {
  const { t } = useTranslation();

  const [queued, setQueued] = useState<ChatConversation[]>([]);
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { messages, setMessages } = useLiveChatPoll(active ? active.id : null, false);

  const queueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQueue = async () => {
    try {
      const res = await api.get<QueuedResponse>('/live-chat/conversations/queued');
      setQueued(res.queued || []);
      const hasActive = res.active && Object.keys(res.active).length > 0;
      setActive(hasActive ? (res.active as ChatConversation) : null);
    } catch {
      // transient
    }
  };

  useEffect(() => {
    void loadQueue();
    queueTimerRef.current = setInterval(loadQueue, CHAT_QUEUE_POLL_INTERVAL);
    return () => {
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    };
  }, []);

  const flashToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const handleClaim = async (id: string) => {
    if (claiming) return;
    setClaiming(id);
    try {
      const res = await api.post<{ success: boolean; conversation: ChatConversation }>(
        `/live-chat/conversations/${id}/assign`,
        {},
      );
      setActive(res.conversation);
      setMessages([]);
      await loadQueue();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        flashToast(t('admin_live_chat_already_claimed'));
        await loadQueue();
      } else {
        flashToast(t('live_chat_generic_error'));
      }
    } finally {
      setClaiming(null);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || sending || !active) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await api.post(`/live-chat/conversations/${active.id}/messages`, { content });
      // next poll tick will pick up the message
    } catch (err: unknown) {
      setDraft(content);
      flashToast(err instanceof Error ? err.message : t('live_chat_generic_error'));
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async (resolution: Exclude<AdminResolution, null>) => {
    if (!active || ending) return;
    setEnding(true);
    try {
      const res = await api.post<{ success: boolean; conversation: ChatConversation }>(
        `/live-chat/conversations/${active.id}/end`,
        { resolution },
      );
      setActive(null);
      setMessages([]);
      setShowEndModal(false);
      flashToast(t('admin_live_chat_closed_toast', { id: res.conversation.id.slice(-8) }));
      await loadQueue();
    } catch {
      flashToast(t('live_chat_generic_error'));
    } finally {
      setEnding(false);
    }
  };

  return (
    <motion.div
      key="live-chat"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="h-[600px] flex flex-col"
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        {/* Queue list */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-[#E8E0D5] dark:border-white/10 p-4 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="w-4 h-4 text-[#1B5E52]" />
            <h4 className="font-black text-sm text-[#1B1B1B] dark:text-white">
              {t('admin_live_chat_queue_heading')}
            </h4>
            <span className="ml-auto text-[10px] font-black text-[#8FA396] dark:text-white/50">
              {queued.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {queued.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-4">
                <p className="text-xs text-[#8FA396] dark:text-white/50 font-medium">
                  {t('admin_live_chat_empty_queue')}
                </p>
              </div>
            ) : (
              queued.map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#F5F0E8] dark:bg-[#0F2A1C] border border-[#E8E0D5] dark:border-white/10"
                >
                  <p className="text-[11px] font-black text-[#1B1B1B] dark:text-white">
                    {t('admin_live_chat_conversation_id', { id: c.id.slice(-8) })}
                  </p>
                  <p className="text-[10px] text-[#8FA396] dark:text-white/50 mt-0.5">
                    {formatTime(c.createdAt)}
                  </p>
                  <button
                    onClick={() => handleClaim(c.id)}
                    disabled={claiming === c.id || active !== null}
                    className="mt-2 w-full py-1.5 bg-[#1B5E52] text-white rounded-full text-[11px] font-black hover:bg-[#164d43] transition-colors disabled:opacity-50"
                  >
                    {claiming === c.id ? t('admin_live_chat_claiming') : t('admin_live_chat_claim')}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active chat */}
        <div className="md:col-span-2 bg-white dark:bg-[#111] rounded-2xl border border-[#E8E0D5] dark:border-white/10 flex flex-col min-h-0 overflow-hidden">
          {active ? (
            <>
              <div className="p-3 border-b border-[#E8E0D5] dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#1B5E52]" />
                  <span className="text-xs font-black text-[#1B1B1B] dark:text-white">
                    {t('admin_live_chat_conversation_id', { id: active.id.slice(-8) })}
                  </span>
                </div>
                <button
                  onClick={() => setShowEndModal(true)}
                  className="text-[10px] font-black text-eco-secondary hover:underline"
                >
                  {t('admin_live_chat_end')}
                </button>
              </div>
              <ChatMessageList
                messages={messages}
                currentUserRole="admin"
                emptyLabel={t('live_chat_active_empty')}
              />
              <div className="p-3 border-t border-[#E8E0D5] dark:border-white/10">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('live_chat_placeholder')}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    className="w-full bg-white border border-[#E8E0D5] rounded-full py-2 pl-4 pr-10 text-xs outline-none focus:border-[#1B5E52] text-[#1B1B1B] placeholder:text-gray-400 font-medium"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B5E52] disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div>
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                <p className="font-bold text-[#8FA396] dark:text-white/50 text-sm">
                  {t('admin_live_chat_no_active')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End with resolution modal */}
      {showEndModal && active && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !ending && setShowEndModal(false)} />
          <div className="relative z-10 bg-white dark:bg-[#111] rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-black text-base text-[#1B1B1B] dark:text-white mb-1">
              {t('admin_live_chat_end_modal_title')}
            </h3>
            <p className="text-xs text-[#8FA396] dark:text-white/60 mb-4">
              {t('admin_live_chat_end_modal_body')}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleEnd('solved')}
                disabled={ending}
                className="w-full py-2.5 rounded-full bg-[#1B5E52] text-white font-black text-xs hover:bg-[#164d43] transition-colors disabled:opacity-50"
              >
                {t('live_chat_receipt_resolution_solved')}
              </button>
              <button
                onClick={() => handleEnd('still_investigating')}
                disabled={ending}
                className="w-full py-2.5 rounded-full bg-amber-500 text-white font-black text-xs hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {t('live_chat_receipt_resolution_investigating')}
              </button>
              <button
                onClick={() => setShowEndModal(false)}
                disabled={ending}
                className="w-full py-2.5 rounded-full border border-[#E8E0D5] dark:border-white/20 text-[#1B1B1B] dark:text-white font-black text-xs hover:bg-[#F5F0E8] dark:hover:bg-white/5 transition-colors"
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-[#1B1B1B] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}
    </motion.div>
  );
}

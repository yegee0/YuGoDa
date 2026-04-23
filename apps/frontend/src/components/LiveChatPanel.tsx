import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { X, Send, MessageCircle, ShieldAlert } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { CHAT_POLL_INTERVAL } from '@/lib/constants';
import { formatDate, formatTime } from '@/lib/formatters';
import { useLiveChatPoll } from '@/hooks/useLiveChatPoll';
import { ChatMessageList } from '@/components/shared';
import type { ChatAvailability, ChatConversation, AdminResolution } from '@/types';

interface LiveChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type PanelView = 'start' | 'queued' | 'active' | 'receipt';

export default function LiveChatPanel({ isOpen, onClose }: LiveChatPanelProps) {
  const { t } = useTranslation();

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [lastReceipt, setLastReceipt] = useState<ChatConversation | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ChatConversation | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isActive = conversation?.status === 'active';
  const { messages, gone } = useLiveChatPoll(
    isActive && conversation ? conversation.id : null,
    !isOpen,
  );

  const view: PanelView = useMemo(() => {
    if (viewingReceipt) return 'receipt';
    if (!conversation) return 'start';
    if (conversation.status === 'queued') return 'queued';
    if (conversation.status === 'active') return 'active';
    return 'receipt';
  }, [conversation, viewingReceipt]);

  // Poll availability + active conversation meta while panel is open.
  const metaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!isOpen) {
      if (metaTimerRef.current) clearInterval(metaTimerRef.current);
      metaTimerRef.current = null;
      return;
    }

    let cancelled = false;

    const loadMeta = async () => {
      try {
        const [myRes, availRes] = await Promise.all([
          api.get<{ success: boolean; conversation: ChatConversation | null; queuePosition?: number }>(
            '/live-chat/conversations/my',
          ),
          api.get<{ success: boolean } & ChatAvailability>('/live-chat/availability'),
        ]);
        if (cancelled) return;
        setConversation(myRes.conversation);
        setQueuePosition(typeof myRes.queuePosition === 'number' ? myRes.queuePosition : null);
        setAvailableAdmins(typeof availRes.availableAdmins === 'number' ? availRes.availableAdmins : 0);
      } catch {
        // transient; keep prior state
      }
    };

    void loadMeta();
    metaTimerRef.current = setInterval(loadMeta, CHAT_POLL_INTERVAL);

    // One-shot fetch for the most-recent ended conversation so StartView can
    // offer "View last chat" when the user has no active/queued conversation.
    // Null result means "no prior chats" — handled as clean empty state, not
    // an error toast.
    api.get<{ success: boolean; conversation: ChatConversation | null }>(
      '/live-chat/conversations/my-last-receipt',
    )
      .then(res => { if (!cancelled) setLastReceipt(res.conversation); })
      .catch(() => { /* endpoint unavailable — StartView just won't show the link */ });

    return () => {
      cancelled = true;
      if (metaTimerRef.current) clearInterval(metaTimerRef.current);
      metaTimerRef.current = null;
    };
  }, [isOpen]);

  // If messages hook reports 410 (customer reading deleted conversation),
  // flip conversation.status locally to surface the receipt view.
  useEffect(() => {
    if (gone && conversation && conversation.status !== 'customer_deleted') {
      setConversation({ ...conversation, status: 'customer_deleted' });
    }
  }, [gone, conversation]);

  const handleStart = async () => {
    if (!initialMessage.trim() || starting) return;
    setStarting(true);
    setErrorMsg('');
    try {
      const res = await api.post<{ success: boolean; conversation: ChatConversation; queuePosition?: number }>(
        '/live-chat/conversations',
        { initialMessage: initialMessage.trim() },
      );
      setConversation(res.conversation);
      setQueuePosition(typeof res.queuePosition === 'number' ? res.queuePosition : null);
      setInitialMessage('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('live_chat_generic_error'));
    } finally {
      setStarting(false);
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || sending || !conversation) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await api.post(`/live-chat/conversations/${conversation.id}/messages`, { content });
      // The next poll tick will pick up the newly-created message.
    } catch (err: unknown) {
      setDraft(content);
      if (err instanceof ApiError && err.status === 409) {
        // conversation already ended — refresh meta so the view transitions
        const refreshed = await api.get<{ success: boolean; conversation: ChatConversation | null }>(
          '/live-chat/conversations/my',
        );
        setConversation(refreshed.conversation);
      } else {
        setErrorMsg(err instanceof Error ? err.message : t('live_chat_generic_error'));
      }
    } finally {
      setSending(false);
    }
  };

  const handleEnd = async () => {
    if (!conversation || ending) return;
    if (!window.confirm(t('live_chat_end_confirm'))) return;
    setEnding(true);
    try {
      const res = await api.post<{ success: boolean; conversation: ChatConversation }>(
        `/live-chat/conversations/${conversation.id}/end`,
        {},
      );
      setConversation(res.conversation);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('live_chat_generic_error'));
    } finally {
      setEnding(false);
    }
  };

  const resetAndClose = () => {
    setConversation(null);
    setViewingReceipt(null);
    setQueuePosition(null);
    setDraft('');
    setInitialMessage('');
    setErrorMsg('');
    onClose();
  };

  const showLastReceipt = () => {
    if (lastReceipt) setViewingReceipt(lastReceipt);
  };

  const dismissReceipt = () => {
    setViewingReceipt(null);
    setConversation(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-[100] w-full md:w-96 h-[70vh] md:h-[520px] bg-white dark:bg-[#111] rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#E8E0D5] dark:border-white/10 overflow-hidden flex flex-col"
      >
        <div className="p-4 bg-[#1B5E52] text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#748f2b] rounded-full animate-pulse" />
            <span className="font-black text-sm">{t('live_chat_title')}</span>
          </div>
          <button onClick={resetAndClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {view === 'start' && (
          <StartView
            availableAdmins={availableAdmins}
            initialMessage={initialMessage}
            setInitialMessage={setInitialMessage}
            onStart={handleStart}
            starting={starting}
            errorMsg={errorMsg}
            lastReceiptAvailable={lastReceipt !== null}
            onShowLastReceipt={showLastReceipt}
          />
        )}

        {view === 'queued' && conversation && (
          <QueuedView queuePosition={queuePosition} />
        )}

        {view === 'active' && conversation && (
          <ActiveView
            messages={messages}
            draft={draft}
            setDraft={setDraft}
            onSend={handleSend}
            onEnd={handleEnd}
            sending={sending}
            ending={ending}
            errorMsg={errorMsg}
          />
        )}

        {view === 'receipt' && (viewingReceipt || conversation) && (
          <ReceiptView
            conversation={(viewingReceipt ?? conversation)!}
            onClose={viewingReceipt ? dismissReceipt : resetAndClose}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Start view ─────────────────────────────────────────────
interface StartViewProps {
  availableAdmins: number | null;
  initialMessage: string;
  setInitialMessage: (v: string) => void;
  onStart: () => void;
  starting: boolean;
  errorMsg: string;
  lastReceiptAvailable: boolean;
  onShowLastReceipt: () => void;
}
function StartView({ availableAdmins, initialMessage, setInitialMessage, onStart, starting, errorMsg, lastReceiptAvailable, onShowLastReceipt }: StartViewProps) {
  const { t } = useTranslation();
  const noAdmins = availableAdmins !== null && availableAdmins === 0;

  return (
    <div className="flex-1 p-4 flex flex-col gap-3 bg-[#F5F0E8] dark:bg-[#0F2A1C]">
      <div className="bg-white dark:bg-[#111] rounded-2xl p-4 border border-[#E8E0D5] dark:border-white/10">
        <p className="text-xs font-bold text-[#1B1B1B] dark:text-white">
          {t('live_chat_start_prompt')}
        </p>
        {availableAdmins !== null && !noAdmins && (
          <p className="text-[11px] text-[#8FA396] dark:text-white/50 mt-1">
            {t('live_chat_admins_online', { count: availableAdmins })}
          </p>
        )}
        {noAdmins && (
          <p className="text-[11px] text-eco-secondary mt-1 font-bold">
            {t('live_chat_no_admin')}
          </p>
        )}
      </div>

      {lastReceiptAvailable && (
        <button
          type="button"
          onClick={onShowLastReceipt}
          className="text-[11px] font-bold text-[#1B5E52] dark:text-eco-lime underline underline-offset-2 hover:no-underline self-start"
        >
          {t('live_chat_view_last_receipt')}
        </button>
      )}

      <textarea
        value={initialMessage}
        onChange={e => setInitialMessage(e.target.value)}
        placeholder={t('live_chat_placeholder')}
        rows={4}
        className="w-full bg-white border border-[#E8E0D5] rounded-2xl p-3 text-xs outline-none focus:border-[#1B5E52] text-[#1B1B1B] placeholder:text-gray-400 font-medium resize-none"
      />

      {errorMsg && (
        <p className="text-[11px] text-eco-secondary font-bold">{errorMsg}</p>
      )}

      <button
        onClick={onStart}
        disabled={!initialMessage.trim() || starting || noAdmins}
        className="w-full py-3 bg-[#1B5E52] text-white rounded-full font-black text-xs hover:bg-[#164d43] transition-colors disabled:opacity-50"
      >
        {starting ? t('live_chat_starting') : t('live_chat_start_button')}
      </button>
    </div>
  );
}

// ── Queued view ────────────────────────────────────────────
function QueuedView({ queuePosition }: { queuePosition: number | null }) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#F5F0E8] dark:bg-[#0F2A1C]">
      <div className="w-16 h-16 rounded-full bg-[#1B5E52]/10 flex items-center justify-center mb-4">
        <MessageCircle className="w-7 h-7 text-[#1B5E52]" />
      </div>
      <p className="text-base font-black text-[#1B1B1B] dark:text-white mb-2 text-center">
        {t('live_chat_queued_title')}
      </p>
      <p className="text-xs text-[#8FA396] dark:text-white/60 text-center">
        {queuePosition && queuePosition > 0
          ? t('live_chat_queue_label', { count: queuePosition })
          : t('live_chat_queue_waiting')}
      </p>
    </div>
  );
}

// ── Active view ────────────────────────────────────────────
interface ActiveViewProps {
  messages: import('@/types').ChatMessage[];
  draft: string;
  setDraft: (v: string) => void;
  onSend: () => void;
  onEnd: () => void;
  sending: boolean;
  ending: boolean;
  errorMsg: string;
}
function ActiveView({ messages, draft, setDraft, onSend, onEnd, sending, ending, errorMsg }: ActiveViewProps) {
  const { t } = useTranslation();
  return (
    <>
      <ChatMessageList
        messages={messages}
        currentUserRole="customer"
        emptyLabel={t('live_chat_active_empty')}
      />
      {errorMsg && (
        <p className="px-4 py-1 text-[10px] text-eco-secondary font-bold bg-white dark:bg-[#111]">{errorMsg}</p>
      )}
      <div className="p-3 border-t border-[#E8E0D5] dark:border-white/10 bg-white dark:bg-[#111]">
        <button
          onClick={onEnd}
          disabled={ending}
          className="w-full mb-2 py-1.5 bg-eco-secondary/10 text-eco-secondary rounded-full text-[10px] font-black hover:bg-eco-secondary/20 transition-colors disabled:opacity-50"
        >
          {t('live_chat_end_button')}
        </button>
        <div className="relative">
          <input
            type="text"
            placeholder={t('live_chat_placeholder')}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
                e.preventDefault();
                onSend();
              }
            }}
            className="w-full bg-white border border-[#E8E0D5] rounded-full py-2 pl-4 pr-10 text-xs outline-none focus:border-[#1B5E52] text-[#1B1B1B] placeholder:text-gray-400 font-medium"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim() || sending}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B5E52] disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ── Receipt view ───────────────────────────────────────────
const RESOLUTION_I18N: Record<Exclude<AdminResolution, null>, string> = {
  solved: 'live_chat_receipt_resolution_solved',
  still_investigating: 'live_chat_receipt_resolution_investigating',
};

interface ReceiptViewProps {
  conversation: ChatConversation;
  onClose: () => void;
}
function ReceiptView({ conversation, onClose }: ReceiptViewProps) {
  const { t } = useTranslation();
  const shortId = conversation.id.slice(-8);
  const resolutionKey = conversation.adminResolution
    ? RESOLUTION_I18N[conversation.adminResolution]
    : 'live_chat_receipt_resolution_other';

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#F5F0E8] dark:bg-[#0F2A1C]">
      <div className="w-16 h-16 rounded-full bg-eco-secondary/10 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7 text-eco-secondary" />
      </div>
      <h3 className="text-lg font-black text-[#1B1B1B] dark:text-white text-center mb-4">
        {t('live_chat_receipt_title')}
      </h3>
      <div className="w-full bg-white dark:bg-[#111] rounded-2xl p-4 border border-[#E8E0D5] dark:border-white/10 space-y-2">
        <ReceiptRow label={t('live_chat_receipt_id', { id: shortId })} />
        <ReceiptRow label={t('live_chat_receipt_status', { status: t(resolutionKey) })} />
        {conversation.createdAt && (
          <ReceiptRow
            label={t('live_chat_receipt_started', {
              time: `${formatDate(conversation.createdAt)} ${formatTime(conversation.createdAt)}`,
            })}
          />
        )}
        {conversation.endedAt && (
          <ReceiptRow
            label={t('live_chat_receipt_ended', {
              time: `${formatDate(conversation.endedAt)} ${formatTime(conversation.endedAt)}`,
            })}
          />
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-4 px-6 py-2 bg-[#1B5E52] text-white rounded-full font-black text-xs hover:bg-[#164d43] transition-colors"
      >
        {t('live_chat_receipt_close')}
      </button>
    </div>
  );
}

function ReceiptRow({ label }: { label: string }) {
  return <p className="text-xs text-[#1B1B1B] dark:text-white font-medium">{label}</p>;
}

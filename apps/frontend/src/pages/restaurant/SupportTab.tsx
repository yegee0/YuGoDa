import React, { useState, useEffect, useRef } from 'react';
import { Send, Headset, Lock, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import type { SupportMessage, Dispute } from '@/types';

export interface SupportTabProps {}

export default function SupportTab(_props: SupportTabProps) {
  const { t } = useTranslation();
  const { user } = useStore();
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState('');
  // activeDispute: the full Dispute object so we can read its status
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const supportPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // prevent polling from restoring old messages while the new-ticket clean-slate is showing
  const newTicketModeRef = useRef(false);
  const supportEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supportEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [supportMessages]);

  useEffect(() => {
    if (!user) return;

    const fetchSupportThread = async () => {
      try {
        const disputesRes = await api.get('/disputes').catch(() => ({ disputes: [] }));
        const disputes: Dispute[] = (disputesRes as { disputes: Dispute[] }).disputes || [];

        let currentDispute: Dispute | null = null;
        if (disputes.length > 0) {
          // prefer the open dispute; fall back to the most recent one
          const sorted = [...disputes].sort(
            (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          );
          currentDispute = sorted.find(d => d.status === 'open') ?? sorted[0];
          setActiveDispute(currentDispute);
          // a new open dispute appeared (e.g. after creating a new ticket) — exit new-ticket mode
          if (sorted.find(d => d.status === 'open')) {
            newTicketModeRef.current = false;
            setShowNewTicketForm(false);
          }
        }

        // While the clean-slate new-ticket form is open, don't restore old messages
        if (newTicketModeRef.current) return;

        // Fetch messages only from the active dispute (keeps the thread scoped to current ticket)
        const allMsgs: SupportMessage[] = [];
        if (currentDispute) {
          try {
            const msgRes = await api.get(`/disputes/${currentDispute.id}/messages`);
            ((msgRes as { messages: Array<{ id: string; message: string; senderRole: string; createdAt: string }> }).messages || [])
              .forEach(m => allMsgs.push({
                id: m.id,
                text: m.message,
                sender: m.senderRole === 'admin' ? 'admin' : 'restaurant',
                time: new Date(m.createdAt).toLocaleTimeString(),
                createdAt: m.createdAt,
              }));
          } catch { /* silent */ }
        }
        allMsgs.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
        setSupportMessages(allMsgs);
      } catch { /* silent */ }
      finally {
        setLoading(false);
      }
    };

    fetchSupportThread();
    supportPollingRef.current = setInterval(fetchSupportThread, 10000);
    return () => { if (supportPollingRef.current) clearInterval(supportPollingRef.current); };
  }, [user]);

  const isClosed = activeDispute?.status === 'closed' || activeDispute?.status === 'resolved';
  // show the input form when the dispute is active OR when restaurant chose to open a new ticket
  const showForm = !isClosed || showNewTicketForm;

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;

    const text = supportInput.trim();
    const now = new Date().toISOString();
    // Optimistic UI
    setSupportMessages(prev => [
      ...prev,
      { id: String(Date.now()), text, sender: 'restaurant', time: new Date(now).toLocaleTimeString(), createdAt: now },
    ]);
    setSupportInput('');

    try {
      if (activeDispute && activeDispute.status === 'open') {
        // append to the existing open dispute thread
        await api.post(`/disputes/${activeDispute.id}/messages`, { message: text });
      } else {
        // no open dispute (first ticket, or starting fresh after closure) — create a new one
        const res = await api.post('/disputes', {
          subject: 'Partner Support Request',
          message: text,
          priority: 'medium',
        }) as { dispute?: Dispute };
        if (res.dispute) {
          newTicketModeRef.current = false;
          setActiveDispute(res.dispute);
          setShowNewTicketForm(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div key="support" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div
        className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm flex flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}
      >
        {/* Chat header */}
        <div className="p-5 border-b border-[#E8E0D5] flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <Headset className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1B1B1B] text-sm">{t('rest_support_chat_admin_team')}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isClosed && !showNewTicketForm ? (
                <>
                  <Lock className="w-3 h-3 text-[#8FA396]" />
                  <p className="text-xs text-[#8FA396]">
                    {activeDispute?.status === 'resolved'
                      ? t('rest_support_chat_resolved')
                      : t('rest_support_chat_locked')}
                  </p>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <p className="text-xs text-[#8FA396]">{t('rest_support_chat_typing_reply')}</p>
                </>
              )}
            </div>
          </div>
          {activeDispute && (
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                activeDispute.status === 'open'
                  ? 'bg-amber-100 text-amber-700'
                  : activeDispute.status === 'resolved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {activeDispute.status}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F5F0E8]/50">
          {!loading && supportMessages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[75%] bg-white border border-[#E8E0D5] rounded-2xl rounded-tl-none p-4 shadow-sm">
                <p className="text-sm text-[#1B1B1B]">{t('rest_support_chat_welcome')}</p>
              </div>
            </div>
          )}
          {supportMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'restaurant' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl p-4 ${
                  msg.sender === 'restaurant'
                    ? 'bg-[#1B5E52] text-white rounded-tr-none'
                    : 'bg-white border border-[#E8E0D5] text-[#1B1B1B] rounded-tl-none shadow-sm'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className={`text-[10px] mt-1.5 block ${msg.sender === 'restaurant' ? 'text-white/60' : 'text-[#8FA396]'}`}>
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          <div ref={supportEndRef} />
        </div>

        {/* Input — locked banner + new-ticket button, or active form */}
        <div className="p-4 border-t border-[#E8E0D5] bg-white">
          {!showForm ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5]">
                <Lock className="w-4 h-4 text-[#8FA396] shrink-0" />
                <p className="text-xs text-[#8FA396] font-medium">
                  {activeDispute?.status === 'resolved'
                    ? t('rest_support_chat_resolved')
                    : t('rest_support_chat_locked')}
                </p>
              </div>
              <button
                onClick={() => { newTicketModeRef.current = true; setShowNewTicketForm(true); setSupportMessages([]); }}
                className="flex items-center gap-1.5 px-3 py-3 bg-[#1B5E52] text-white rounded-xl text-xs font-semibold hover:bg-[#164d43] transition-colors shrink-0 shadow-sm shadow-[#1B5E52]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('rest_support_chat_new_ticket')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendSupport} className="flex gap-3">
              <input
                type="text"
                value={supportInput}
                onChange={e => setSupportInput(e.target.value)}
                placeholder={t('rest_support_chat_placeholder')}
                className="flex-1 bg-[#F5F0E8] rounded-xl px-4 py-3 text-sm text-[#1B1B1B] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1B5E52]/20 border border-transparent focus:border-[#1B5E52]/20"
              />
              <button
                type="submit"
                disabled={!supportInput.trim()}
                className="w-11 h-11 bg-[#1B5E52] text-white rounded-xl flex items-center justify-center hover:bg-[#164d43] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#1B5E52]/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Ticket as TicketIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/formatters';
import { TICKET_PRIORITY_CONFIG, TICKET_STATUS_CONFIG } from '@/lib/constants';
import type { Dispute, DisputeMessage, Ticket, TicketStatus } from '@/types';

export interface SupportTabProps {
  disputes: Dispute[];
  onUpdateDisputeStatus: (disputeId: string, status: string) => void;
}

export default function SupportTab({ disputes, onUpdateDisputeStatus }: SupportTabProps) {
  const { t } = useTranslation();
  const [chatDispute, setChatDispute] = useState<Dispute | null>(null);
  const [chatMessages, setChatMessages] = useState<DisputeMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Only auto-scroll when the message count actually grows (new messages arrived).
  // This avoids jumping the admin to the bottom while reading older messages.
  useEffect(() => {
    if (chatMessages.length > prevMessageCountRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = chatMessages.length;
  }, [chatMessages]);

  // Poll for new messages every 5 s while the chat modal is open so restaurant
  // replies appear immediately.
  useEffect(() => {
    if (!chatDispute) return;
    const poll = async () => {
      try {
        const res = await api.get(`/disputes/${chatDispute.id}/messages`);
        setChatMessages(res.messages || []);
      } catch { /* silent */ }
    };
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [chatDispute?.id]);

  useEffect(() => {
    let cancelled = false;
    api.get<{ success: boolean; tickets: Ticket[] }>('/tickets')
      .then(res => { if (!cancelled && res?.tickets) setTickets(res.tickets); })
      .catch(() => { /* silent — empty list stays */ });
    return () => { cancelled = true; };
  }, []);

  const handleUpdateTicketStatus = async (ticket: Ticket, status: TicketStatus) => {
    const prev = tickets;
    setTickets(prev.map(x => x.id === ticket.id ? { ...x, status } : x));
    try {
      await api.put<{ success: boolean; ticket: Ticket }>(`/tickets/${ticket.id}/status`, { status });
    } catch {
      setTickets(prev);
      toast.error(t('profile_save_failed'));
    }
  };

  const openChat = async (dispute: Dispute) => {
    setChatDispute(dispute);
    setChatInput('');
    try {
      const res = await api.get(`/disputes/${dispute.id}/messages`);
      setChatMessages(res.messages || []);
    } catch {
      setChatMessages([{
        id: 'initial',
        senderRole: 'restaurant',
        message: dispute.message,
        createdAt: dispute.createdAt,
      }]);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!chatInput.trim() || !chatDispute) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await api.post(`/disputes/${chatDispute.id}/messages`, { message: text });
      setChatMessages(prev => [...prev, res.message]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const openTicketCount = tickets.filter(t => t.status === 'open').length;
  const resolvedTicketCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <>
      <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
        {/* ── Customer support tickets (from /api/tickets) ─────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">{t('admin_support_col_open')}</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{openTicketCount}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">{t('admin_support_col_resolved')}</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{resolvedTicketCount}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">{t('admin_support_col_total')}</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{tickets.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E0D5] flex items-center gap-2">
            <TicketIcon className="w-4 h-4 text-[#1B5E52]" />
            <h3 className="font-bold text-[#1B1B1B]">{t('admin_support_tickets_heading')}</h3>
            <span className="text-xs text-[#8FA396] font-medium">({tickets.length})</span>
          </div>
          {tickets.length === 0 ? (
            <div className="py-16 text-center">
              <TicketIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-[#8FA396]">{t('admin_support_tickets_empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F0E8]">
              {tickets.map(tk => {
                const statusCfg = TICKET_STATUS_CONFIG[tk.status];
                const prioCfg = TICKET_PRIORITY_CONFIG[tk.priority];
                return (
                  <div key={tk.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#F5F0E8] transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${statusCfg.cls}`}>
                          {t(statusCfg.labelKey)}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${prioCfg.activeCls}`}>
                          {tk.priority}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-[#F5F0E8] text-[#5C6B63]">
                          {tk.category}
                        </span>
                      </div>
                      <p className="font-bold text-sm text-[#1B1B1B] truncate">{tk.subject}</p>
                      <p className="text-xs text-[#8FA396] truncate mt-0.5">{tk.description}</p>
                      <p className="text-[10px] text-[#8FA396] mt-1">
                        {tk.orderRef ? `${tk.orderRef} · ` : ''}{formatDate(tk.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {tk.status === 'open' && (
                        <button
                          onClick={() => handleUpdateTicketStatus(tk, 'in_progress')}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors"
                        >
                          {t('admin_ticket_action_in_progress')}
                        </button>
                      )}
                      {(tk.status === 'open' || tk.status === 'in_progress') && (
                        <>
                          <button
                            onClick={() => handleUpdateTicketStatus(tk, 'resolved')}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                          >
                            {t('admin_ticket_action_resolve')}
                          </button>
                          <button
                            onClick={() => handleUpdateTicketStatus(tk, 'closed')}
                            className="px-3 py-1.5 bg-[#F5F0E8] text-[#1B1B1B] rounded-lg text-xs font-bold hover:bg-[#E8E0D5] transition-colors"
                          >
                            {t('admin_ticket_action_close')}
                          </button>
                        </>
                      )}
                      {(tk.status === 'resolved' || tk.status === 'closed') && (
                        <button
                          onClick={() => handleUpdateTicketStatus(tk, 'open')}
                          className="px-3 py-1.5 bg-[#1B5E52] text-white rounded-lg text-xs font-bold hover:bg-[#164d43] transition-colors"
                        >
                          {t('admin_ticket_action_reopen')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Restaurant disputes (legacy /api/disputes — unchanged) ─ */}
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h3 className="font-bold text-[#1B1B1B]">{t('admin_support_disputes_heading')}</h3>
          </div>
          {disputes.length === 0 ? (
            <div className="py-20 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-[#8FA396]">{t('admin_support_disputes_empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F0E8]">
              {disputes.map(d => (
                <div key={d.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#F5F0E8] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        d.status === 'open' ? 'bg-amber-100 text-amber-600' :
                        d.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>{d.status}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                        d.priority === 'high' ? 'bg-red-100 text-red-600' :
                        d.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>{d.priority}</span>
                    </div>
                    <p className="font-bold text-sm text-[#1B1B1B] truncate">{d.subject}</p>
                    <p className="text-xs text-[#8FA396] truncate mt-0.5">{d.message}</p>
                    <p className="text-[10px] text-[#8FA396] mt-1">{d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => openChat(d)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {t('admin_support_action_message')}
                    </button>
                    {d.status === 'open' && (
                      <>
                        <button
                          onClick={() => onUpdateDisputeStatus(d.id, 'resolved')}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                        >
                          {t('admin_support_action_resolve')}
                        </button>
                        <button
                          onClick={() => onUpdateDisputeStatus(d.id, 'closed')}
                          className="px-3 py-1.5 bg-[#F5F0E8] text-[#1B1B1B] rounded-lg text-xs font-bold hover:bg-[#E8E0D5] transition-colors"
                        >
                          {t('admin_support_action_close')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Chat Modal */}
      {chatDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" style={{ height: '560px', maxHeight: '90vh' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E8E0D5] flex items-center justify-between bg-white">
              <div className="min-w-0">
                <h3 className="font-bold text-[#1B1B1B]">{t('admin_support_chat_title')}</h3>
                <p className="text-xs text-[#8FA396] mt-0.5 truncate">{chatDispute.subject}</p>
              </div>
              <button
                onClick={() => setChatDispute(null)}
                className="w-8 h-8 rounded-xl bg-[#F5F0E8] flex items-center justify-center hover:bg-[#E8E0D5] transition-colors flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-[#8FA396]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F5F0E8]">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.senderRole === 'admin' ? 'bg-[#1B5E52] text-white rounded-tr-none' : 'bg-white border border-[#E8E0D5] rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <span className={`text-[10px] mt-1.5 block ${msg.senderRole === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#E8E0D5] bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendAdminMessage()}
                  placeholder={t('admin_support_chat_placeholder')}
                  className="flex-1 bg-white border border-[#E8E0D5] rounded-xl px-4 py-2.5 text-sm text-[#1B1B1B] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#1B5E52]/20"
                />
                <button
                  onClick={handleSendAdminMessage}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 rounded-xl bg-[#1B5E52] text-white flex items-center justify-center hover:bg-[#164d43] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

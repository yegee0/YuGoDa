import React, { useState, useEffect, useRef } from 'react';
import { Send, Headset } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import type { SupportMessage, Dispute } from '@/types';

export interface SupportTabProps {}

export default function SupportTab(_props: SupportTabProps) {
  const { user } = useStore();
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [latestDisputeId, setLatestDisputeId] = useState<string | null>(null);
  const supportPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supportEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { supportEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [supportMessages]);

  useEffect(() => {
    if (!user) return;
    const fetchSupportThread = async () => {
      try {
        const disputesRes = await api.get('/disputes').catch(() => ({ disputes: [] }));
        const disputes: Dispute[] = (disputesRes as { disputes: Dispute[] }).disputes || [];
        if (disputes.length === 0) return;
        const allMsgs: SupportMessage[] = [];
        for (const d of disputes) {
          try {
            const msgRes = await api.get(`/disputes/${d.id}/messages`);
            ((msgRes as { messages: Array<{ id: string; message: string; senderRole: string; createdAt: string }> }).messages || []).forEach(m => allMsgs.push({
              id: m.id, text: m.message,
              sender: m.senderRole === 'admin' ? 'admin' : 'restaurant',
              time: new Date(m.createdAt).toLocaleTimeString(),
              createdAt: m.createdAt,
            }));
          } catch { /* silent */ }
        }
        allMsgs.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime());
        if (allMsgs.length > 0) setSupportMessages(allMsgs);
        const sorted = [...disputes].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setLatestDisputeId(sorted[0].id);
      } catch { /* silent */ }
    };
    fetchSupportThread();
    supportPollingRef.current = setInterval(fetchSupportThread, 10000);
    return () => { if (supportPollingRef.current) clearInterval(supportPollingRef.current); };
  }, [user]);

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const text = supportInput.trim();
    const now = new Date().toISOString();
    setSupportMessages(prev => [...prev, { id: String(Date.now()), text, sender: 'restaurant', time: new Date(now).toLocaleTimeString(), createdAt: now }]);
    setSupportInput('');
    try {
      const res = await api.post('/disputes', { subject: 'Partner Support Request', message: text, priority: 'medium' }) as { dispute?: { id: string } };
      if (res.dispute?.id) setLatestDisputeId(res.dispute.id);
    } catch (err) { console.error(err); }
  };

  return (
    <motion.div key="support" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {/* Chat header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
            <Headset className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Admin Support Team</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-xs text-gray-400">Typically replies in a few minutes</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-black/20">
          {supportMessages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[75%] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-none p-4 shadow-sm">
                <p className="text-sm dark:text-white">Welcome to Partner Support! How can we help you today?</p>
              </div>
            </div>
          )}
          {supportMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'restaurant' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-4 ${
                msg.sender === 'restaurant'
                  ? 'bg-[#1A4D2E] text-white rounded-tr-none'
                  : 'bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 dark:text-white rounded-tl-none shadow-sm'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className={`text-[10px] mt-1.5 block ${msg.sender === 'restaurant' ? 'text-white/60' : 'text-gray-400'}`}>{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={supportEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#111]">
          <form onSubmit={handleSendSupport} className="flex gap-3">
            <input
              type="text"
              value={supportInput}
              onChange={e => setSupportInput(e.target.value)}
              placeholder="Type your message to the admin team..."
              className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 text-sm dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 border border-transparent focus:border-[#1A4D2E]/20"
            />
            <button
              type="submit"
              disabled={!supportInput.trim()}
              className="w-11 h-11 bg-[#1A4D2E] text-white rounded-xl flex items-center justify-center hover:bg-[#133b23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#1A4D2E]/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

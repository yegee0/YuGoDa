import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '@/lib/api';
import type { Dispute, DisputeMessage } from '@/types';

export interface SupportTabProps {
  disputes: Dispute[];
  onUpdateDisputeStatus: (disputeId: string, status: string) => void;
}

export default function SupportTab({ disputes, onUpdateDisputeStatus }: SupportTabProps) {
  const [chatDispute, setChatDispute] = useState<Dispute | null>(null);
  const [chatMessages, setChatMessages] = useState<DisputeMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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

  return (
    <>
      <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">Open Tickets</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{disputes.filter(d => d.status === 'open').length}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">Resolved</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{disputes.filter(d => d.status === 'resolved').length}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm">
            <p className="text-xs text-[#8FA396] font-medium mb-1">Total Tickets</p>
            <h3 className="text-2xl font-black text-[#1B1B1B]">{disputes.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E8E0D5]">
            <h3 className="font-bold text-[#1B1B1B]">Support Tickets</h3>
          </div>
          {disputes.length === 0 ? (
            <div className="py-20 text-center">
              <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-[#8FA396]">No support tickets yet</p>
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
                      Message
                    </button>
                    {d.status === 'open' && (
                      <>
                        <button
                          onClick={() => onUpdateDisputeStatus(d.id, 'resolved')}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => onUpdateDisputeStatus(d.id, 'closed')}
                          className="px-3 py-1.5 bg-[#F5F0E8] text-[#1B1B1B] rounded-lg text-xs font-bold hover:bg-[#E8E0D5] transition-colors"
                        >
                          Close
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
                <h3 className="font-bold text-[#1B1B1B]">Message Conversation</h3>
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
                  placeholder="Type a message..."
                  className="flex-1 bg-[#F5F0E8] border border-[#E8E0D5] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1B5E52]/20"
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

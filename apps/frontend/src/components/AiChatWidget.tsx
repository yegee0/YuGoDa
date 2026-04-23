import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChatWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input and seed greeting when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
      if (messages.length === 0) {
        setMessages([{ role: 'assistant', content: t('ai_chat_greeting') }]);
      }
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const updated: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(updated);
    setInput('');
    setIsTyping(true);

    try {
      // Send all prior turns as history so the model has context
      const history = updated.slice(0, -1).slice(-10);
      const res = await api.post<{ reply: string }>('/chat/message', { message: text, history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('ai_chat_error') }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto w-[340px] sm:w-[380px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#E8E0D5]"
            style={{ backgroundColor: '#ffffff' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3.5 shrink-0"
              style={{ background: 'linear-gradient(135deg, #1B5E52 0%, #2d7a6a 100%)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-none">YuGoDa Assistant</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('ai_chat_powered_by')}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#FAFAF8' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-0.5" style={{ backgroundColor: 'rgba(27,94,82,0.1)' }}>
                      <Bot className="w-3.5 h-3.5 text-[#1B5E52]" />
                    </div>
                  )}
                  <div
                    className="max-w-[76%] px-3.5 py-2.5 text-sm leading-relaxed"
                    style={{
                      backgroundColor: msg.role === 'user' ? '#1B5E52' : '#ffffff',
                      color: msg.role === 'user' ? '#ffffff' : '#1B1B1B',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: msg.role === 'assistant' ? '1px solid #E8E0D5' : 'none',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(27,94,82,0.1)' }}>
                    <Bot className="w-3.5 h-3.5 text-[#1B5E52]" />
                  </div>
                  <div
                    className="px-3.5 py-3"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #E8E0D5', borderRadius: '18px 18px 18px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: '#8FA396', animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid #E8E0D5', backgroundColor: '#ffffff' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                placeholder={t('ai_chat_placeholder')}
                className="flex-1 rounded-xl px-3.5 py-2.5 text-sm text-[#1B1B1B] focus:outline-none transition-all"
                style={{
                  backgroundColor: '#F5F0E8',
                  border: '1px solid transparent',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(27,94,82,0.3)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'transparent'; }}
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1B5E52' }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#164d43'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1B5E52'; }}
              >
                {isTyping
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(o => !o)}
        className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl text-white font-black text-sm shadow-xl transition-colors"
        style={{ background: isOpen ? '#164d43' : 'linear-gradient(135deg, #1B5E52 0%, #748f2b 100%)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen
            ? <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5" />
              </motion.span>
            : <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>{t('ai_chat_open')}</span>
              </motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

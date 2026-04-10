import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Bot, User, X, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import type { Order } from '@/types';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function FoodChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm YuGoBot. I can help you find the perfect surprise bag or suggest what to eat based on your preferences. What are you in the mood for?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<ReturnType<typeof genAI.chats.create> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Fetch order history when chatbot opens and build context-aware system prompt
  useEffect(() => {
    if (!isOpen) return;
    api.get('/orders').then((data: { orders?: Order[] }) => {
      const recentOrders = (data.orders || []).slice(0, 10);
      const orderContext = recentOrders.length > 0
        ? `\n\nThe user's recent orders:\n${recentOrders.map(o =>
            `- ${o.restaurantName || 'Unknown restaurant'}: ${o.items?.map(i => i.name).join(', ') || 'surprise bag'} (${o.status})`
          ).join('\n')}\n\nBased on their order history, you can suggest similar items they might enjoy or recommend healthier alternatives if they've been ordering frequently. Encourage variety and eco-friendly choices.`
        : '';

      chatRef.current = genAI.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are YuGoBot, a helpful assistant for a food waste prevention platform called YuGoDa. Your goal is to help users find surplus food bags, suggest meals based on their cravings, and encourage eco-friendly eating habits. Keep responses concise, friendly, and use emojis occasionally. If asked about specific bags, mention that they can find them in the 'Discover' tab.${orderContext}`,
        },
      });
    }).catch(() => {
      // Fallback: init without order history
      if (!chatRef.current) {
        chatRef.current = genAI.chats.create({
          model: "gemini-3-flash-preview",
          config: {
            systemInstruction: "You are YuGoBot, a helpful assistant for a food waste prevention platform called YuGoDa. Your goal is to help users find surplus food bags, suggest meals based on their cravings, and encourage eco-friendly eating habits. Keep responses concise, friendly, and use emojis occasionally. If asked about specific bags, mention that they can find them in the 'Discover' tab.",
          },
        });
      }
    });
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: input });
      const text = response.text || "I'm sorry, I couldn't process that.";

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-24 right-4 md:right-6 w-14 h-14 md:w-16 md:h-16 bg-[#FF9F1C] text-white rounded-full shadow-2xl flex items-center justify-center z-[200] group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageCircle className="w-7 h-7 relative z-10" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full scale-110"
          />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40, x: 20 }}
            className="fixed bottom-24 right-3 md:right-6 w-[calc(100vw-24px)] max-w-[380px] h-[500px] md:h-[550px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden z-[201] border border-gray-200"
          >
            {/* Header */}
            <div className="bg-[#1B5E52] p-5 flex justify-between items-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">YuGoBot AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="hover:bg-white/10 p-2 rounded-xl transition-colors relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth bg-[#F9F9F9]">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${m.role === 'user' ? 'bg-[#FF9F1C]' : 'bg-[#1B5E52]'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-[#FF9F1C] text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 items-center bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B5E52]" />
                    <span className="text-xs font-medium text-gray-500 italic">EcoBot is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-5 bg-white border-t border-gray-100">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about surplus food..."
                    className="w-full bg-gray-100 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-[#1B5E52]/20 outline-none transition-all pr-12"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-12 h-12 bg-[#1B5E52] text-white rounded-2xl flex items-center justify-center hover:bg-[#164d43] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#1B5E52]/20 transition-all shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-medium uppercase tracking-widest">
                Powered by Gemini AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

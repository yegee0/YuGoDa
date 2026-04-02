import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { LayoutDashboard, Map as MapIcon, Heart, HelpCircle, MessageCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import FoodChatbot from '@/components/FoodChatbot';
import ConsentNotice from '@/components/ConsentNotice';
import SupportTicketModal from '@/components/SupportTicketModal';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1] || 'discover';

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<any[]>([{ role: 'model', text: 'Hi! I am EcoBot. How can I help you save food today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);

  return (
    <div className="min-h-screen bg-eco-bg flex font-sans transition-colors duration-300">
      <Sidebar>
        {(isSidebarCollapsed) => (
          <>
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Discover"
              active={currentView === 'discover'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/discover')}
            />
            <SidebarItem
              icon={<MapIcon className="w-5 h-5" />}
              label="Browse Map"
              active={currentView === 'browse'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/browse')}
            />
            <SidebarItem
              icon={<Heart className="w-5 h-5" />}
              label="Favorites"
              active={currentView === 'favorites'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/favorites')}
            />

            <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              <SidebarItem
                icon={<HelpCircle className="w-5 h-5" />}
                label="Help Center"
                active={false}
                collapsed={isSidebarCollapsed}
                onClick={() => setShowHelpCenter(true)}
              />
              <SidebarItem
                icon={<MessageCircle className="w-5 h-5" />}
                label="Live Chat"
                active={false}
                collapsed={isSidebarCollapsed}
                onClick={() => setShowLiveChat(true)}
              />
            </div>
          </>
        )}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden relative z-[10]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Help Center Modal */}
      <AnimatePresence>
        {showHelpCenter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHelpCenter(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-eco-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-eco-border flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">{t('Help Center')}</h3>
                <button onClick={() => setShowHelpCenter(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                  <h4 className="font-bold dark:text-white sticky top-0 bg-eco-surface py-2">{t('Common Topics')}</h4>
                  <div className="space-y-3">
                    {[
                      { q: 'How do surprise bags work?', a: 'Restaurants pack surplus food into "Surprise Bags" at a fraction of the cost. You reserve it, pick it up, and enjoy!' },
                      { q: 'Where is my order?', a: 'You can track your order in real-time on the Discover tab after confirming your payment.' },
                      { q: 'Payment methods in Turkey?', a: 'We support all major credit/debit cards via Iyzico, as well as YuGoPay wallet balance.' },
                      { q: 'Refund policy?', a: 'If a bag is unavailable or quality is poor, contact us within 2 hours of pickup.' }
                    ].map((faq, i) => (
                      <details key={i} className="group bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 cursor-pointer">
                        <summary className="font-bold text-sm list-none flex justify-between items-center dark:text-gray-200">
                          {faq.q} <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-[#1A4D2E]/5 rounded-2xl border border-[#1A4D2E]/10">
                    <h4 className="font-bold text-[#1A4D2E] mb-2">{t('Need more help?')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('Our support team is available 24/7.')}</p>
                    <div className="space-y-2">
                      <button onClick={() => { setShowHelpCenter(false); setShowTicketModal(true); }} className="w-full py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold">{t('Open a Ticket')}</button>
                      <button onClick={() => { setShowHelpCenter(false); setShowLiveChat(true); }} className="w-full py-2 border border-[#1A4D2E] text-[#1A4D2E] rounded-xl text-xs font-bold">{t('Chat with Us')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Chat Modal */}
      <AnimatePresence>
        {showLiveChat && (
          <div className="fixed bottom-8 right-8 z-[100] w-80 h-[450px] bg-eco-surface rounded-3xl shadow-2xl border border-eco-border overflow-hidden flex flex-col">
            <div className="p-4 bg-[#1A4D2E] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-bold text-sm">{isEscalated ? t('Live Agent (Active)') : t('YuGoBot AI')}</span>
              </div>
              <button onClick={() => setShowLiveChat(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-[#0A0A0A] font-sans">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[80%] shadow-sm ${m.role === 'user' ? 'bg-[#1A4D2E] text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isBotLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              {isEscalated && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-200 dark:border-yellow-900/30 text-[10px] text-yellow-700 dark:text-yellow-600 text-center font-bold">
                  {t('You are now in the queue for a live representative.')}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-eco-border bg-white dark:bg-[#1A1A1A]">
              {!isEscalated && chatMessages.length > 3 && (
                <button
                  onClick={() => setIsEscalated(true)}
                  className="w-full mb-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-bold hover:bg-orange-200 transition-colors uppercase tracking-wider"
                >
                  {t('Talk to a Human')}
                </button>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('Type a message...')}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      const msg = chatInput;
                      setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
                      setChatInput('');

                      if (!isEscalated) {
                        setIsBotLoading(true);
                        setTimeout(() => {
                          setChatMessages(prev => [...prev, { role: 'model', text: 'I understand you are asking about ' + msg + '. Could you please clarify or would you like to speak with an agent?' }]);
                          setIsBotLoading(false);
                        }, 1000);
                      }
                    }
                  }}
                  className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2 pl-4 pr-10 text-xs outline-none dark:text-white"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1A4D2E]">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <FoodChatbot />
      <ConsentNotice />
      <SupportTicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} />
    </div>
  );
}

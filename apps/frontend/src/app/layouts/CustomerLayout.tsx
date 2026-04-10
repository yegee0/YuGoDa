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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([{ role: 'model', text: 'Hi! I am EcoBot. How can I help you save food today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen app-leaf-bg flex transition-colors duration-300">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)}>
        {(isSidebarCollapsed) => (
          <>
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Discover"
              active={currentView === 'discover'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/discover')}
            />
            <SidebarItem
              icon={<MapIcon className="w-5 h-5" />}
              label="Browse Map"
              active={currentView === 'browse'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/browse')}
            />
            <SidebarItem
              icon={<Heart className="w-5 h-5" />}
              label="Favorites"
              active={currentView === 'favorites'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/favorites')}
            />

            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,180,80,0.13)' }}>
              <SidebarItem
                icon={<HelpCircle className="w-5 h-5" />}
                label="Help Center"
                active={false}
                collapsed={isSidebarCollapsed}
                onClick={() => { setShowHelpCenter(true); setMobileNavOpen(false); }}
              />
              <SidebarItem
                icon={<MessageCircle className="w-5 h-5" />}
                label="Live Chat"
                active={false}
                collapsed={isSidebarCollapsed}
                onClick={() => { setShowLiveChat(true); setMobileNavOpen(false); }}
              />
            </div>
          </>
        )}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuOpen={() => setMobileNavOpen(true)} />
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
              className="absolute inset-0 bg-[#1B1B1B]/50 backdrop-blur-sm"
              onClick={() => setShowHelpCenter(false)}
            />
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 md:p-6 border-b border-[#E8E0D5] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="font-black text-lg md:text-xl text-[#1B1B1B]">{t('Help Center')}</h3>
                <button onClick={() => setShowHelpCenter(false)} className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors text-[#8FA396]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  <h4 className="font-black text-[#1B1B1B] sticky top-0 bg-white py-2 text-sm">{t('Common Topics')}</h4>
                  <div className="space-y-2">
                    {[
                      { q: 'How do surprise bags work?', a: 'Restaurants pack surplus food into "Surprise Bags" at a fraction of the cost. You reserve it, pick it up, and enjoy!' },
                      { q: 'Where is my order?', a: 'You can track your order in real-time on the Discover tab after confirming your payment.' },
                      { q: 'Payment methods in Turkey?', a: 'We support all major credit/debit cards via Iyzico, as well as YuGoPay wallet balance.' },
                      { q: 'Refund policy?', a: 'If a bag is unavailable or quality is poor, contact us within 2 hours of pickup.' }
                    ].map((faq, i) => (
                      <details key={i} className="group bg-[#F5F0E8] rounded-2xl p-4 cursor-pointer">
                        <summary className="font-bold text-sm list-none flex justify-between items-center text-[#1B1B1B]">
                          {faq.q} <ChevronRight className="w-4 h-4 shrink-0 group-open:rotate-90 transition-transform text-[#8FA396]" />
                        </summary>
                        <p className="mt-2 text-xs text-[#8FA396] leading-relaxed">{faq.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-5 md:p-6 bg-[#1B5E52]/6 rounded-2xl border border-[#1B5E52]/12">
                    <h4 className="font-black text-[#1B5E52] mb-2 text-sm">{t('Need more help?')}</h4>
                    <p className="text-sm text-[#8FA396] mb-4 font-medium">{t('Our support team is available 24/7.')}</p>
                    <div className="space-y-2">
                      <button onClick={() => { setShowHelpCenter(false); setShowTicketModal(true); }} className="w-full py-2.5 bg-[#1B5E52] text-white rounded-full text-xs font-black hover:bg-[#164d43] transition-colors">{t('Open a Ticket')}</button>
                      <button onClick={() => { setShowHelpCenter(false); setShowLiveChat(true); }} className="w-full py-2.5 border-2 border-[#1B5E52] text-[#1B5E52] rounded-full text-xs font-black hover:bg-[#1B5E52]/6 transition-colors">{t('Chat with Us')}</button>
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
          <div className="fixed bottom-0 right-0 md:bottom-8 md:right-8 z-[100] w-full md:w-80 h-[60vh] md:h-[450px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-[#E8E0D5] overflow-hidden flex flex-col">
            <div className="p-4 bg-[#1B5E52] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#748f2b] rounded-full animate-pulse" />
                <span className="font-black text-sm">{isEscalated ? t('Live Agent (Active)') : t('YuGoBot AI')}</span>
              </div>
              <button onClick={() => setShowLiveChat(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F5F0E8]">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${m.role === 'user'
                    ? 'bg-[#1B5E52] text-white rounded-tr-none font-medium'
                    : 'bg-white text-[#1B1B1B] rounded-tl-none shadow-sm font-medium border border-[#E8E0D5]'
                    }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isBotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-[#E8E0D5] flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#8FA396] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#8FA396] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#8FA396] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              {isEscalated && (
                <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] text-[10px] text-[#8FA396] text-center font-bold">
                  {t('You are now in the queue for a live representative.')}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#E8E0D5] bg-white">
              {!isEscalated && chatMessages.length > 3 && (
                <button
                  onClick={() => setIsEscalated(true)}
                  className="w-full mb-2 py-1.5 bg-[#ad3115]/10 text-[#ad3115] rounded-full text-[10px] font-black hover:bg-[#ad3115]/20 transition-colors"
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
                  className="w-full bg-[#F5F0E8] border border-[#E8E0D5] rounded-full py-2 pl-4 pr-10 text-xs outline-none focus:border-[#1B5E52] transition-colors text-[#1B1B1B] font-medium"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B5E52]">
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

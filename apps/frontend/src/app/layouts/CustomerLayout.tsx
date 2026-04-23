import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { LayoutDashboard, Map as MapIcon, Heart, HelpCircle, MessageCircle, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import ConsentNotice from '@/components/ConsentNotice';
import SupportTicketModal from '@/components/SupportTicketModal';
import LiveChatPanel from '@/components/LiveChatPanel';
import { AccountStatusBanner } from '@/components/shared';
import { useStore } from '@/app/store/useStore';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1] || 'discover';
  const { userProfile } = useStore();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden app-leaf-bg flex transition-colors duration-300">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)}>
        {(isSidebarCollapsed) => (
          <>
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5" />}
              label={t('Discover')}
              active={currentView === 'discover'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/discover')}
            />
            <SidebarItem
              icon={<MapIcon className="w-5 h-5" />}
              label={t('Browse Map')}
              active={currentView === 'browse'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/browse')}
            />
            <SidebarItem
              icon={<Heart className="w-5 h-5" />}
              label={t('Favorites')}
              active={currentView === 'favorites'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/favorites')}
            />

            <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,180,80,0.13)' }}>
              <SidebarItem
                icon={<HelpCircle className="w-5 h-5" />}
                label={t('Help Center')}
                active={false}
                collapsed={isSidebarCollapsed}
                onClick={() => { setShowHelpCenter(true); setMobileNavOpen(false); }}
              />
              <SidebarItem
                icon={<MessageCircle className="w-5 h-5" />}
                label={t('Live Chat')}
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
        <AccountStatusBanner status={userProfile?.accountStatus} />
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
                  <h4 className="font-black text-[#1B1B1B] sticky top-0 bg-white py-2 text-sm">{t('help_common_topics')}</h4>
                  <div className="space-y-2">
                    {[
                      { q: t('help_faq_1_q'), a: t('help_faq_1_a') },
                      { q: t('help_faq_2_q'), a: t('help_faq_2_a') },
                      { q: t('help_faq_3_q'), a: t('help_faq_3_a') },
                      { q: t('help_faq_4_q'), a: t('help_faq_4_a') },
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
                    <h4 className="font-black text-[#1B5E52] mb-2 text-sm">{t('help_need_more_help')}</h4>
                    <p className="text-sm text-[#8FA396] mb-4 font-medium">{t('help_support_24_7')}</p>
                    <div className="space-y-2">
                      <button onClick={() => { setShowHelpCenter(false); setShowTicketModal(true); }} className="w-full py-2.5 bg-[#1B5E52] text-white rounded-full text-xs font-black hover:bg-[#164d43] transition-colors">{t('help_open_ticket')}</button>
                      <button onClick={() => { setShowHelpCenter(false); setShowLiveChat(true); }} className="w-full py-2.5 border-2 border-[#1B5E52] text-[#1B5E52] rounded-full text-xs font-black hover:bg-[#1B5E52]/6 transition-colors">{t('help_chat_with_us')}</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LiveChatPanel isOpen={showLiveChat} onClose={() => setShowLiveChat(false)} />

      <ConsentNotice />
      <SupportTicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} />
    </div>
  );
}

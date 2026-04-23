import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarSection } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { LayoutDashboard, Users, Store, DollarSign, MessageSquare, MessageCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[2] || 'dashboard';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden app-leaf-bg flex font-sans transition-colors duration-300">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)}>
        {(isSidebarCollapsed) => (
          <>
            <SidebarSection label={t('nav_section_platform')} collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
              label={t('nav_dashboard')}
              active={currentView === 'dashboard'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/dashboard')}
            />
            <SidebarItem
              icon={<Users className="w-5 h-5 shrink-0" />}
              label={t('nav_customers')}
              active={currentView === 'customers'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/customers')}
            />
            <SidebarItem
              icon={<Store className="w-5 h-5 shrink-0" />}
              label={t('nav_stores')}
              active={currentView === 'stores'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/stores')}
            />
            <SidebarItem
              icon={<DollarSign className="w-5 h-5 shrink-0" />}
              label={t('nav_transactions')}
              active={currentView === 'transactions'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/transactions')}
            />

            <SidebarSection label={t('nav_section_support')} collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<MessageSquare className="w-5 h-5 shrink-0" />}
              label={t('nav_support_queue')}
              sublabel={t('nav_sublabel_restaurants')}
              active={currentView === 'support'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/support')}
            />
            <SidebarItem
              icon={<MessageCircle className="w-5 h-5 shrink-0" />}
              label={t('Live Chat')}
              sublabel={t('nav_sublabel_customers')}
              active={currentView === 'live-chat'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/live-chat')}
            />

            <SidebarSection label={t('nav_section_system')} collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<Settings className="w-5 h-5 shrink-0" />}
              label={t('nav_settings')}
              active={currentView === 'settings'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/settings')}
            />
          </>
        )}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuOpen={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-hidden relative">
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
    </div>
  );
}

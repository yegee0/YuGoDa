import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarSection } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { LayoutDashboard, Users, Store, DollarSign, MessageSquare, MessageCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[2] || 'dashboard';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen app-leaf-bg flex font-sans transition-colors duration-300">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)}>
        {(isSidebarCollapsed) => (
          <>
            <SidebarSection label="Platform" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
              label="Dashboard"
              active={currentView === 'dashboard'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/dashboard')}
            />
            <SidebarItem
              icon={<Users className="w-5 h-5 shrink-0" />}
              label="Customers"
              active={currentView === 'customers'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/customers')}
            />
            <SidebarItem
              icon={<Store className="w-5 h-5 shrink-0" />}
              label="Stores"
              active={currentView === 'stores'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/stores')}
            />
            <SidebarItem
              icon={<DollarSign className="w-5 h-5 shrink-0" />}
              label="Transactions"
              active={currentView === 'transactions'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/transactions')}
            />

            <SidebarSection label="Support" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<MessageSquare className="w-5 h-5 shrink-0" />}
              label="Support Queue"
              active={currentView === 'support'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/support')}
            />
            <SidebarItem
              icon={<MessageCircle className="w-5 h-5 shrink-0" />}
              label="Live Chat"
              active={currentView === 'live-chat'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/admin/live-chat')}
            />

            <SidebarSection label="System" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<Settings className="w-5 h-5 shrink-0" />}
              label="Settings"
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

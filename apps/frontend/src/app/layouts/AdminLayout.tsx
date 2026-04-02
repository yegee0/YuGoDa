import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { ShieldCheck, LayoutDashboard, Users, Store, DollarSign, MessageSquare, MessageCircle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[2] || 'dashboard';

  return (
    <div className="min-h-screen bg-eco-bg flex font-sans transition-colors duration-300">
      <Sidebar>
        {(isSidebarCollapsed) => (
          <>
            <div className={`px-4 py-2 mt-2 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-wider ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              Platform
            </div>
            <SidebarItem
              icon={<LayoutDashboard className="w-5 h-5 shrink-0" />}
              label="Dashboard"
              active={currentView === 'dashboard'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/dashboard')}
            />
            <SidebarItem
              icon={<Users className="w-5 h-5 shrink-0" />}
              label="Customers"
              active={currentView === 'customers'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/customers')}
            />
            <SidebarItem
              icon={<Store className="w-5 h-5 shrink-0" />}
              label="Stores"
              active={currentView === 'stores'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/stores')}
            />
            <SidebarItem
              icon={<DollarSign className="w-5 h-5 shrink-0" />}
              label="Transactions"
              active={currentView === 'transactions'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/transactions')}
            />

            <div className={`px-4 py-2 mt-6 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-wider ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              Support
            </div>
            <SidebarItem
              icon={<MessageSquare className="w-5 h-5 shrink-0" />}
              label="Support Queue"
              active={currentView === 'support'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/support')}
            />
            <SidebarItem
              icon={<MessageCircle className="w-5 h-5 shrink-0" />}
              label="Live Chat"
              active={currentView === 'live-chat'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/live-chat')}
            />

            <div className={`px-4 py-2 mt-6 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-wider ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
              System
            </div>
            <SidebarItem
              icon={<Settings className="w-5 h-5 shrink-0" />}
              label="Settings"
              active={currentView === 'settings'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin/settings')}
            />
          </>
        )}
      </Sidebar>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
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

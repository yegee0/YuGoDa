import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem } from '@/widgets/layout/Sidebar';
import Header from '@/widgets/layout/Header';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1] || 'admin';

  return (
    <div className="min-h-screen bg-eco-bg flex font-sans transition-colors duration-300">
      <Sidebar>
        {(isSidebarCollapsed) => (
          <SidebarItem
            icon={<ShieldCheck className="w-5 h-5" />}
            label="Admin Panel"
            active={currentView === 'admin'}
            collapsed={isSidebarCollapsed}
            onClick={() => navigate('/admin')}
          />
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

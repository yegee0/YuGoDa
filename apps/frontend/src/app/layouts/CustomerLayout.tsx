import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem } from '@/widgets/layout/Sidebar';
import Header from '@/widgets/layout/Header';
import { LayoutDashboard, Map as MapIcon, Heart, HelpCircle, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.split('/')[1] || 'discover';

  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);

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

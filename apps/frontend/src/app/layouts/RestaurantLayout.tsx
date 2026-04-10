import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar, SidebarItem, SidebarSection } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Store, BarChart3, Package, Truck, Star, UserCircle, Headset } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function RestaurantLayout() {
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
            <SidebarSection label="Overview" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<BarChart3 className="w-5 h-5 shrink-0" />}
              label="Dashboard"
              active={currentView === 'dashboard'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/dashboard')}
            />

            <SidebarSection label="Operations" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<Package className="w-5 h-5 shrink-0" />}
              label="Orders"
              active={currentView === 'orders'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/orders')}
            />
            <SidebarItem
              icon={<Store className="w-5 h-5 shrink-0" />}
              label="Inventory"
              active={currentView === 'inventory'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/inventory')}
            />
            <SidebarItem
              icon={<Truck className="w-5 h-5 shrink-0" />}
              label="Drivers"
              active={currentView === 'drivers'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/drivers')}
            />

            <SidebarSection label="Engagement" collapsed={isSidebarCollapsed} />
            <SidebarItem
              icon={<Star className="w-5 h-5 shrink-0" />}
              label="Reviews"
              active={currentView === 'reviews'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/reviews')}
            />
            <SidebarItem
              icon={<Headset className="w-5 h-5 shrink-0" />}
              label="Support"
              active={currentView === 'support'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/support')}
            />
            <SidebarItem
              icon={<UserCircle className="w-5 h-5 shrink-0" />}
              label="Store Profile"
              active={currentView === 'profile'}
              collapsed={isSidebarCollapsed}
              onClick={() => handleNavClick('/restaurant/profile')}
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

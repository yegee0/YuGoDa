import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Languages, Sun, Moon, Bell, LogOut, User as UserIcon, Store, ShieldCheck, Heart } from 'lucide-react';
import { useStore } from '@/app/store/useStore';
import { authCustomer, authPartner, authAdmin } from '@/lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const { t, i18n } = useTranslation();
  const { user, userProfile, setUserProfile, setUser, notifications, isDarkMode, setIsDarkMode } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentView = location.pathname.split('/')[1] || 'discover';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await Promise.all([authCustomer.signOut(), authPartner.signOut(), authAdmin.signOut()]);
    setUser(null);
    setUserProfile(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <header className="h-16 bg-eco-surface border-b border-eco-border flex items-center justify-between px-8 z-40 transition-colors">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
          {currentView === 'discover' ? t('Discover') : t(currentView.replace('-', ' '))}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors flex items-center gap-2"
          >
            <Languages className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">{i18n.language}</span>
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-32 bg-eco-surface rounded-2xl shadow-xl border border-eco-border overflow-hidden z-[60]"
              >
                <div className="p-2">
                  {[
                    { code: 'en', name: 'English' },
                    { code: 'tr', name: 'Türkçe' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i18n.language === lang.code
                        ? 'bg-[#1A4D2E]/10 text-[#1A4D2E]'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1A1A1A]"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-eco-surface rounded-2xl shadow-xl border border-eco-border overflow-hidden z-[60]"
              >
                <div className="p-4 border-b border-eco-border flex justify-between items-center">
                  <span className="font-bold dark:text-white">Notifications</span>
                  {/* Mark all as read feature */}
                  <button className="text-xs text-[#1A4D2E] dark:text-[#2D6A4F] font-bold">Mark all as read</button>
                </div>
                <div className="max-h-[24rem] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!n.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white font-bold text-xs">
              {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-[10px] text-gray-500 capitalize mt-1">
                {userProfile?.role || 'Customer'}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-eco-surface rounded-2xl shadow-xl border border-eco-border overflow-hidden z-[60]"
              >
                <div className="p-2">

                  <button
                    onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserIcon className="w-4 h-4" /> Profile
                  </button>
                  {userProfile?.role === 'customer' && (
                    <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Heart className="w-4 h-4" /> Favorites
                    </button>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-gray-800" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Languages, Bell, LogOut, User as UserIcon, Heart, Menu } from 'lucide-react';
import { useStore } from '@/app/store/useStore';
import { authCustomer, authPartner, authAdmin } from '@/lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';

// ── colour tokens used only in this file ──────────────────────────
const H = {
  bg:         '#1b5e52',
  border:     'rgba(0,0,0,0.15)',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.75)',
  hover:      'rgba(255,255,255,0.12)',
  dropBg:     '#ffffff',
  dropBorder: 'rgba(0,0,0,0.12)',
  active:     'rgba(232,103,74,0.1)',
  activeTxt:  '#b85a30',
};

interface HeaderProps {
  onMenuOpen?: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { user, userProfile, setUserProfile, setUser, notifications } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const langRef    = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const currentView = location.pathname.split('/')[1] || 'discover';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current    && !langRef.current.contains(event.target as Node))    setShowLangMenu(false);
      if (notifRef.current   && !notifRef.current.contains(event.target as Node))   setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfileMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await Promise.all([authCustomer.signOut(), authPartner.signOut(), authAdmin.signOut()]);
    setUser(null);
    setUserProfile(null);
    setShowProfileMenu(false);
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── icon button helper ─────────────────────────────────────────
  const IconBtn = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => (
      <button
        ref={ref}
        {...props}
        className={`p-2 rounded-xl transition-colors ${props.className ?? ''}`}
        style={{ color: H.muted, ...props.style }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = H.hover; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
      />
    )
  );
  IconBtn.displayName = 'IconBtn';

  return (
    <header
      className="h-16 flex items-center justify-between px-4 md:px-6 z-40 shrink-0"
      style={{ backgroundColor: H.bg, borderBottom: `1px solid ${H.border}` }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {onMenuOpen && (
          <IconBtn onClick={onMenuOpen} className="md:hidden">
            <Menu className="w-5 h-5" />
          </IconBtn>
        )}
        {currentView !== 'discover' && (
          <h2 className="text-base md:text-lg font-black capitalize tracking-tight text-white">
            {t(currentView.replace('-', ' '))}
          </h2>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">

        {/* Language switcher */}
        <div className="relative" ref={langRef}>
          <IconBtn onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1.5">
            <Languages className="w-4 h-4" />
            <span className="text-xs font-bold uppercase hidden sm:inline" style={{ color: H.muted }}>
              {i18n.language}
            </span>
          </IconBtn>

          <AnimatePresence>
            {showLangMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-32 rounded-2xl shadow-2xl overflow-hidden z-[60] p-2"
                style={{ backgroundColor: H.dropBg, border: `1px solid ${H.dropBorder}` }}
              >
                {[
                  { code: 'en', name: 'English' },
                  { code: 'tr', name: 'Türkçe' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setShowLangMenu(false); }}
                    className="w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: i18n.language === lang.code ? H.active : 'transparent',
                      color: i18n.language === lang.code ? H.activeTxt : '#1B1B1B',
                    }}
                    onMouseEnter={(e) => { if (i18n.language !== lang.code) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
                    onMouseLeave={(e) => { if (i18n.language !== lang.code) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    {lang.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <IconBtn onClick={() => setShowNotifications(!showNotifications)} className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ad3115] rounded-full border-2" style={{ borderColor: H.bg }} />
            )}
          </IconBtn>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                style={{ backgroundColor: H.dropBg, border: `1px solid ${H.dropBorder}` }}
              >
                <div
                  className="p-4 flex justify-between items-center"
                  style={{ borderBottom: `1px solid ${H.dropBorder}` }}
                >
                  <span className="font-black text-sm" style={{ color: '#1B1B1B' }}>Notifications</span>
                  <button className="text-xs font-bold" style={{ color: '#1b5e52' }}>Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm font-medium" style={{ color: H.muted }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className="p-4 transition-colors"
                        style={{
                          borderBottom: `1px solid ${H.dropBorder}`,
                          backgroundColor: !n.read ? 'rgba(27,94,82,0.1)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = !n.read ? 'rgba(27,94,82,0.1)' : 'transparent'; }}
                      >
                        <p className="text-sm font-black" style={{ color: '#1B1B1B' }}>{n.title}</p>
                        <p className="text-xs mt-1" style={{ color: '#5C6B63' }}>{n.message}</p>
                        <p className="text-[10px] mt-1.5" style={{ color: '#8FA396' }}>
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

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 pr-2 md:pr-3 rounded-full transition-colors"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = H.hover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0"
              style={{ backgroundColor: '#ad3115', color: '#fff', boxShadow: '0 2px 8px rgba(173,49,21,0.4)' }}
            >
              {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-black leading-none" style={{ color: '#ffffff' }}>
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-[10px] capitalize mt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {userProfile?.role || 'Customer'}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl overflow-hidden z-[60] p-2"
                style={{ backgroundColor: H.dropBg, border: `1px solid ${H.dropBorder}` }}
              >
                <button
                  onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ color: '#1B1B1B' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <UserIcon className="w-4 h-4" /> Profile
                </button>
                {userProfile?.role === 'customer' && (
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                    style={{ color: '#1B1B1B' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                  >
                    <Heart className="w-4 h-4" /> Favorites
                  </button>
                )}
                <div className="my-1" style={{ borderTop: `1px solid ${H.dropBorder}` }} />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors text-red-400"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Store,
  ShieldCheck,
  FileText,
  Moon,
  Sun,
  Bell,
  LayoutDashboard,
  Map as MapIcon,
  Heart,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Languages,
  HelpCircle,
  MessageCircle,
  X
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { useStore } from './store/useStore';
import CustomerApp from './views/CustomerApp';
import RestaurantPortal from './views/StorePanel';
import AdminDashboard from './views/AdminPanel';
import ProfileView from './views/ProfileView';
import StorePage from './views/StorePage';
import CheckoutPage from './views/CheckoutPage';
import FoodChatbot from './components/FoodChatbot';
import CookieBanner from './components/CookieBanner';
import SupportTicketModal from './components/SupportTicketModal';
import Auth from './components/Auth';
import LandingPage from './views/LandingPage';
import RestaurantAuth from './views/RestaurantAuth';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { seedIfEmpty } from './lib/seedFirestore';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const { t, i18n } = useTranslation();
  const { user, setUser, userProfile, setUserProfile, setFavorites, setIsAuthReady, setNotifications, notifications, isDarkMode, setIsDarkMode, isAuthReady } = useStore();
  const [chatMessages, setChatMessages] = useState<any[]>([{ role: 'model', text: 'Hi! I am EcoBot. How can I help you save food today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isRTL = i18n.language === 'ar';
  const currentView = location.pathname.split('/')[1] || 'discover';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const profile = userDoc.data() as any;
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: profile.displayName || currentUser.displayName || 'User',
            role: profile.role || 'customer',
            favorites: profile.favorites || [],
            walletBalance: profile.walletBalance || 0,
            addresses: profile.addresses || []
          });
          setFavorites(profile.favorites || []);

          // Set initial view based on role
          if (profile.role === 'restaurant') navigate('/restaurant');
          if (profile.role === 'admin') navigate('/admin');
        } else {
          const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: currentUser.displayName || 'User',
            role: 'customer' as const,
            favorites: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: newProfile.displayName,
            role: 'customer',
            favorites: [],
            walletBalance: 0,
            addresses: []
          });
          setFavorites([]);
        }
      } else {
        setUserProfile(null);
        setFavorites([]);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setIsAuthReady, setFavorites, setUserProfile, navigate]);

  // Real-time notifications
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [user, setNotifications]);

  // Seed Firestore once on first run when auth is ready (or when user logs in)
  useEffect(() => {
    if (isAuthReady) {
      seedIfEmpty();
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await signOut(auth);
    setShowProfileMenu(false);
  };

  if (!user) {
    return (
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/business-auth" element={<RestaurantAuth />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-eco-bg flex font-sans transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={`bg-eco-surface border-r border-eco-border transition-all duration-300 flex flex-col z-50 ${isSidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-eco-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-eco-primary flex items-center justify-center text-white font-bold shrink-0">
              E
            </div>
            {!isSidebarCollapsed && (
              <span className="text-xl font-bold text-eco-primary dark:text-[#2D6A4F] tracking-tight">YuGoDa</span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard className="w-5 h-5" />}
            label={t('Discover')}
            active={currentView === 'discover'}
            collapsed={isSidebarCollapsed}
            onClick={() => navigate('/discover')}
          />
          <SidebarItem
            icon={<MapIcon className="w-5 h-5" />}
            label={t('Browse Map')}
            active={currentView === 'browse'}
            collapsed={isSidebarCollapsed}
            onClick={() => navigate('/browse')}
          />
          <SidebarItem
            icon={<Heart className="w-5 h-5" />}
            label={t('Favorites')}
            active={currentView === 'favorites'}
            collapsed={isSidebarCollapsed}
            onClick={() => navigate('/favorites')}
          />
          {(userProfile?.role === 'restaurant' || userProfile?.role === 'admin' || user?.email === 'yagizata05@gmail.com') && (
            <SidebarItem
              icon={<Store className="w-5 h-5" />}
              label={t('Partner Portal')}
              active={currentView === 'restaurant'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/restaurant')}
            />
          )}
          {(userProfile?.role === 'admin' || user?.email === 'yagizata05@gmail.com') && (
            <SidebarItem
              icon={<ShieldCheck className="w-5 h-5" />}
              label={t('Admin Panel')}
              active={currentView === 'admin'}
              collapsed={isSidebarCollapsed}
              onClick={() => navigate('/admin')}
            />
          )}

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <SidebarItem
              icon={<HelpCircle className="w-5 h-5" />}
              label={t('Help Center')}
              active={false}
              collapsed={isSidebarCollapsed}
              onClick={() => setShowHelpCenter(true)}
            />
            <SidebarItem
              icon={<MessageCircle className="w-5 h-5" />}
              label={t('Live Chat')}
              active={false}
              collapsed={isSidebarCollapsed}
              onClick={() => setShowLiveChat(true)}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-eco-border">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-eco-surface border-b border-eco-border flex items-center justify-between px-8 z-40 transition-colors">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {currentView === 'discover' ? t('Discover') : t(currentView.replace('-', ' '))}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
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
                        { code: 'ar', name: 'العربية' },
                        { code: 'es', name: 'Español' },
                        { code: 'pt', name: 'Português' }
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

            <div className="relative">
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
                      <button className="text-xs text-[#1A4D2E] dark:text-[#2D6A4F] font-bold">Mark all as read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
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

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white font-bold text-xs">
                  {userProfile?.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
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
                      {user?.email === 'yagizata05@gmail.com' && (
                        <>
                          <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Debug Roles
                          </div>
                          <button
                            onClick={() => { setUserProfile({ ...userProfile!, role: 'customer' }); setShowProfileMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${userProfile?.role === 'customer' ? 'bg-[#1A4D2E]/10 text-[#1A4D2E]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            <UserIcon className="w-4 h-4" /> Customer View
                          </button>
                          <button
                            onClick={() => { setUserProfile({ ...userProfile!, role: 'restaurant' }); setShowProfileMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${userProfile?.role === 'restaurant' ? 'bg-[#1A4D2E]/10 text-[#1A4D2E]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            <Store className="w-4 h-4" /> Restaurant View
                          </button>
                          <button
                            onClick={() => { setUserProfile({ ...userProfile!, role: 'admin' }); setShowProfileMenu(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${userProfile?.role === 'admin' ? 'bg-[#1A4D2E]/10 text-[#1A4D2E]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            <ShieldCheck className="w-4 h-4" /> Admin View
                          </button>
                          <hr className="my-1 border-gray-100 dark:border-gray-800" />
                        </>
                      )}
                      <button
                        onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <UserIcon className="w-4 h-4" /> Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Heart className="w-4 h-4" /> Favorites
                      </button>
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

        {/* Viewport */}
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
              <Routes location={location}>
                <Route path="/discover" element={<CustomerApp initialTab="discover" />} />
                <Route path="/browse" element={<CustomerApp initialTab="browse" />} />
                <Route path="/favorites" element={<CustomerApp initialTab="favorites" />} />
                <Route path="/store/:id" element={<StorePage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/restaurant" element={<RestaurantPortal />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/profile" element={<ProfileView />} />
                <Route path="/" element={<Navigate to="/discover" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <FoodChatbot />

      {/* Help Center Modal */}
      <AnimatePresence>
        {showHelpCenter && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHelpCenter(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-eco-surface rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-eco-border flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">{t('Help Center')}</h3>
                <button onClick={() => setShowHelpCenter(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                  <h4 className="font-bold dark:text-white sticky top-0 bg-eco-surface py-2">{t('Common Topics')}</h4>
                  <div className="space-y-3">
                    {[
                      { q: 'How do surprise bags work?', a: 'Restaurants pack surplus food into "Surprise Bags" at a fraction of the cost. You reserve it, pick it up, and enjoy!' },
                      { q: 'Where is my order?', a: 'You can track your order in real-time on the Discover tab after confirming your payment.' },
                      { q: 'Payment methods in Turkey?', a: 'We support all major credit/debit cards via Iyzico, as well as YuGoPay wallet balance.' },
                      { q: 'Refund policy?', a: 'If a bag is unavailable or quality is poor, contact us within 2 hours of pickup.' }
                    ].map((faq, i) => (
                      <details key={i} className="group bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 cursor-pointer">
                        <summary className="font-bold text-sm list-none flex justify-between items-center dark:text-gray-200">
                          {faq.q} <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="p-6 bg-[#1A4D2E]/5 rounded-2xl border border-[#1A4D2E]/10">
                    <h4 className="font-bold text-[#1A4D2E] mb-2">{t('Need more help?')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('Our support team is available 24/7.')}</p>
                    <div className="space-y-2">
                      <button onClick={() => { setShowHelpCenter(false); setShowTicketModal(true); }} className="w-full py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold">{t('Open a Ticket')}</button>
                      <button onClick={() => { setShowHelpCenter(false); setShowLiveChat(true); }} className="w-full py-2 border border-[#1A4D2E] text-[#1A4D2E] rounded-xl text-xs font-bold">{t('Chat with Us')}</button>
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
          <div className="fixed bottom-8 right-8 z-[100] w-80 h-[450px] bg-eco-surface rounded-3xl shadow-2xl border border-eco-border overflow-hidden flex flex-col">
            <div className="p-4 bg-[#1A4D2E] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="font-bold text-sm">{isEscalated ? t('Live Agent (Active)') : t('YuGoBot AI')}</span>
              </div>
              <button onClick={() => setShowLiveChat(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50 dark:bg-[#0A0A0A] font-sans">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[80%] shadow-sm ${m.role === 'user' ? 'bg-[#1A4D2E] text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-200 rounded-tl-none'
                    }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isBotLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              {isEscalated && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-200 dark:border-yellow-900/30 text-[10px] text-yellow-700 dark:text-yellow-600 text-center font-bold">
                  {t('You are now in the queue for a live representative.')}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-eco-border bg-white dark:bg-[#1A1A1A]">
              {!isEscalated && chatMessages.length > 3 && (
                <button
                  onClick={() => setIsEscalated(true)}
                  className="w-full mb-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-[10px] font-bold hover:bg-orange-200 transition-colors uppercase tracking-wider"
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
                  className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-2 pl-4 pr-10 text-xs outline-none dark:text-white"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1A4D2E]">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <FoodChatbot />
      <CookieBanner />
      <SupportTicketModal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} />
    </div>
  );
}

function SidebarItem({ icon, label, active, collapsed, onClick }: {
  icon: React.ReactNode,
  label: string,
  active: boolean,
  collapsed: boolean,
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all group ${active
        ? 'bg-[#1A4D2E] text-white shadow-lg shadow-[#1A4D2E]/20'
        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
    >
      <div className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-[#1A4D2E] dark:group-hover:text-[#2D6A4F]'} transition-colors`}>
        {icon}
      </div>
      {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
    </button>
  );
}



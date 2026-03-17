import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { authCustomer, authPartner, authAdmin } from '@/shared/lib/firebase';
import { useStore } from '@/app/store/useStore';
import { useTranslation } from 'react-i18next';

export function useAuthInit() {
  const { i18n } = useTranslation();
  const { setUser, setUserProfile, setIsAuthReady, isDarkMode } = useStore();

  const isRTL = i18n.language === 'ar';

  // RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  // Auth state listeners
  useEffect(() => {
    let isReadyCustomer = false;
    let isReadyPartner = false;
    let isReadyAdmin = false;

    const checkReady = () => {
      if (isReadyCustomer && isReadyPartner && isReadyAdmin) setIsAuthReady(true);
    };

    const handleAuth = (currentUser: any, role: 'customer' | 'restaurant' | 'admin') => {
      if (currentUser) {
        setUser(currentUser);
        setUserProfile({
          uid: currentUser.uid,
          email: currentUser.email!,
          displayName: currentUser.displayName || 'User',
          role: role,
          favorites: [],
          walletBalance: 0,
          addresses: [],
          notificationsEnabled: true,
          preferredLanguage: 'en'
        } as any);
      }
    };

    const handleSignOut = () => {
      // If NO ONE is logged into any of the 3 portals, completely wipe the memory.
      if (!authCustomer.currentUser && !authPartner.currentUser && !authAdmin.currentUser) {
        setUser(null);
        setUserProfile(null);
      }
    };

    const unsubC = onAuthStateChanged(authCustomer, (u) => { if (u) handleAuth(u, 'customer'); else handleSignOut(); isReadyCustomer = true; checkReady(); });
    const unsubP = onAuthStateChanged(authPartner, (u) => { if (u) handleAuth(u, 'restaurant'); else handleSignOut(); isReadyPartner = true; checkReady(); });
    const unsubA = onAuthStateChanged(authAdmin, (u) => { if (u) handleAuth(u, 'admin'); else handleSignOut(); isReadyAdmin = true; checkReady(); });

    return () => { unsubC(); unsubP(); unsubA(); };
  }, [setUser, setUserProfile, setIsAuthReady]);

  // Dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
}

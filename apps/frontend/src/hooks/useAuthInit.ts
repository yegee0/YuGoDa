import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { authCustomer, authPartner, authAdmin } from '@/lib/firebase';
import { useStore } from '@/app/store/useStore';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';

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

    const handleAuth = async (currentUser: any, role: 'customer' | 'restaurant' | 'admin') => {
      if (currentUser) {
        setUser(currentUser);
        // Varsayılan profil ayarla (API yanıtı gelene kadar)
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

        // Backend'den profil bilgilerini al
        try {
          const data = await api.get('/users/me');
          if (data.user) {
            setUserProfile({
              ...data.user,
              // Always trust the Firebase auth project as the source of truth for role.
              // e.g. signing in via authAdmin always yields role='admin' regardless of
              // what the backend DB may have stored.
              role: role,
              favorites: data.user.favorites || [],
              addresses: data.user.addresses || [],
              notificationsEnabled: data.user.notificationsEnabled ?? true,
              preferredLanguage: data.user.preferredLanguage || 'en',
            });
            if (data.user.favorites) {
              useStore.getState().setFavorites(data.user.favorites);
            }
          }
        } catch {
          // User not found in DB — auto-register so role is stored correctly
          try {
            const storeName = currentUser.displayName || currentUser.email?.split('@')[0] || 'My Restaurant';
            await api.post('/users/register', {
              displayName: currentUser.displayName || currentUser.email || 'User',
              email: currentUser.email,
              role: role,
              // Pass businessName for restaurant users so a store profile is auto-created
              ...(role === 'restaurant' && { businessName: storeName }),
            });
            // For restaurant users, also ensure a store profile exists
            if (role === 'restaurant') {
              await api.post('/stores', { name: storeName }).catch(() => {});
            }
            const retryData = await api.get('/users/me');
            if (retryData.user) {
              setUserProfile({
                ...retryData.user,
                role: role,
                favorites: retryData.user.favorites || [],
                addresses: retryData.user.addresses || [],
                notificationsEnabled: retryData.user.notificationsEnabled ?? true,
                preferredLanguage: retryData.user.preferredLanguage || 'en',
              });
              if (retryData.user.favorites) {
                useStore.getState().setFavorites(retryData.user.favorites);
              }
            }
          } catch {
            // Backend unreachable — continue with default profile
          }
        }
      }
    };

    // Track which portals actually have a signed-in user based on callback results,
    // NOT via .currentUser (which may still be null for other portals when the first fires).
    const signedIn = { customer: false, partner: false, admin: false };

    const handleSignOut = (portal: keyof typeof signedIn) => {
      signedIn[portal] = false;
      // Only clear state once every portal has confirmed no user.
      if (!signedIn.customer && !signedIn.partner && !signedIn.admin) {
        setUser(null);
        setUserProfile(null);
      }
    };

    const unsubC = onAuthStateChanged(authCustomer, (u) => { if (u) { signedIn.customer = true; handleAuth(u, 'customer'); } else { handleSignOut('customer'); } isReadyCustomer = true; checkReady(); });
    const unsubP = onAuthStateChanged(authPartner, (u) => { if (u) { signedIn.partner = true; handleAuth(u, 'restaurant'); } else { handleSignOut('partner'); } isReadyPartner = true; checkReady(); });
    const unsubA = onAuthStateChanged(authAdmin, (u) => { if (u) { signedIn.admin = true; handleAuth(u, 'admin'); } else { handleSignOut('admin'); } isReadyAdmin = true; checkReady(); });

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

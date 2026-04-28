import { useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { authCustomer, authPartner, authAdmin, getCustomerFcmToken, listenForegroundMessages, signOutAllProjects } from '@/lib/firebase';
import { useStore } from '@/app/store/useStore';
import { useTranslation } from 'react-i18next';
import { api, ApiError, setBannedHandler, markAuthInitialized } from '@/lib/api';

export function useAuthInit() {
  const { i18n } = useTranslation();
  const { setUser, setUserProfile, setIsAuthReady, isDarkMode } = useStore();
  // Prevents /users/register from firing twice when onAuthStateChanged emits
  // multiple callbacks during a Google sign-in popup (race condition guard).
  // useRef — not useState — so the flag update is synchronous and catches
  // back-to-back calls within the same event-loop turn.
  const registrationInFlightRef = useRef(false);

  const isRTL = i18n.language === 'ar';

  // RTL direction
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  // Register the banned-account handler once. Triggers on backend 403 +
  // "Account banned." — force a hard sign-out across all 3 Firebase projects
  // and route to /banned so the user can't linger in an authed shell.
  useEffect(() => {
    setBannedHandler(() => {
      void signOutAllProjects();
      setUser(null);
      setUserProfile(null);
      if (window.location.pathname !== '/banned') {
        window.location.assign('/banned');
      }
    });
    return () => { setBannedHandler(null); };
  }, [setUser, setUserProfile]);

  // Auth state listeners
  useEffect(() => {
    let isReadyCustomer = false;
    let isReadyPartner = false;
    let isReadyAdmin = false;

    const checkReady = () => {
      if (isReadyCustomer && isReadyPartner && isReadyAdmin) {
        setIsAuthReady(true);
        markAuthInitialized();
      }
    };

    const handleAuth = async (currentUser: User, role: 'customer' | 'restaurant' | 'admin') => {
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
        });

        // Backend'den profil bilgilerini al
        // For network / 5xx failures, retry up to 2 extra times with a back-off
        // before giving up — protects against transient connectivity blips and
        // slow cold-starts without masking definitive errors (4xx).
        const fetchProfile = async () => {
          let lastErr: unknown;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              return await api.get('/users/me');
            } catch (err) {
              lastErr = err;
              // Definitive HTTP response — don't retry, handle below
              if (err instanceof ApiError) throw err;
              if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1500));
            }
          }
          throw lastErr;
        };
        try {
          const data = await fetchProfile();
          if (data.user) {
            // Admin portal is gated: if the Firebase admin session belongs to a
            // DB row whose role isn't admin (e.g. a customer who authed via
            // /admin-auth), reject the session so the admin UI shell never
            // renders. Backend authorization is already safe (JwtAuthFilter
            // reads role from the DB); this closes the UX gap by sending
            // them to the same explainer used for confirmed-unseeded admins.
            if (role === 'admin' && data.user.role !== 'admin') {
              await authAdmin.signOut();
              if (window.location.pathname !== '/admin/not-provisioned') {
                window.location.assign('/admin/not-provisioned');
              }
              return;
            }
            setUserProfile({
              ...data.user,
              // Trust the Firebase auth project as the source of truth for role
              // on customer/partner portals. For admin we've already validated
              // DB agreement above.
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
          // Register FCM push token and foreground listener for customer accounts only
          if (role === 'customer') {
            listenForegroundMessages();
            getCustomerFcmToken().then(fcmToken => {
              if (fcmToken) api.put('/users/me', { fcmToken }).catch(() => {});
            }).catch(() => {});
          }
        } catch (err: unknown) {
          // 401 from /users/me means the session is definitively invalid —
          // api.ts already attempted a token refresh before throwing, so a
          // fresh Firebase token was tried and also rejected. This happens for
          // soft-deleted accounts (accountStatus = "deleted") and for any other
          // permanently revoked session. Keeping a stub profile visible is a
          // security bug; force a full sign-out immediately.
          if (err instanceof ApiError && err.status === 401) {
            await signOutAllProjects();
            setUser(null);
            setUserProfile(null);
            return;
          }
          // Non-404 errors (5xx, network): keep the optimistic profile and
          // continue — same pattern as customer/restaurant. Redirecting on every
          // transient error creates an infinite reload loop (window.location.assign
          // re-triggers onAuthStateChanged → handleAuth → same error → redirect…).
          if (!(err instanceof ApiError && err.status === 404)) {
            return;
          }
          // 404: user is not in the DB.
          // Admin accounts are provisioned on first sign-in, just like customer /
          // restaurant accounts. The backend allows role="admin" only when the JWT
          // issuer confirms the token comes from the yugoda-admin Firebase project,
          // so this is not a security hole.
          if (role === 'admin') {
            if (registrationInFlightRef.current) return;
            registrationInFlightRef.current = true;
            try {
              const [firstName = '', ...rest] = (currentUser.displayName || '').trim().split(/\s+/).filter(Boolean);
              const lastName = rest.join(' ');
              await api.post('/users/register', {
                displayName: currentUser.displayName || currentUser.email || 'Admin',
                firstName,
                lastName,
                email: currentUser.email,
                role: 'admin',
              });
              const retryData = await api.get('/users/me');
              if (retryData.user) {
                setUserProfile({
                  ...retryData.user,
                  role: 'admin',
                  favorites: retryData.user.favorites || [],
                  addresses: retryData.user.addresses || [],
                  notificationsEnabled: retryData.user.notificationsEnabled ?? true,
                  preferredLanguage: retryData.user.preferredLanguage || 'en',
                });
              }
            } catch {
              // Registration failed (backend unreachable or returned an error).
              // Keep the optimistic profile — same as the non-404 path above.
              // The admin panel will load with empty data; they can refresh once
              // the backend is available.
            } finally {
              registrationInFlightRef.current = false;
            }
            return;
          }
          // Customer/restaurant 404: auto-register
          if (registrationInFlightRef.current) return;
          registrationInFlightRef.current = true;
          try {
            const storeName = currentUser.displayName || currentUser.email?.split('@')[0] || 'My Restaurant';
            // Google OAuth yields a combined displayName like "Ahmet Yılmaz"; split on
            // first whitespace so firstName/lastName land in the DB on first login,
            // otherwise both stay empty until the user manually edits their profile.
            const [firstName = '', ...rest] = (currentUser.displayName || '').trim().split(/\s+/).filter(Boolean);
            const lastName = rest.join(' ');
            await api.post('/users/register', {
              displayName: currentUser.displayName || currentUser.email || 'User',
              firstName,
              lastName,
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
          } finally {
            registrationInFlightRef.current = false;
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

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/shared/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { useStore } from '@/app/store/useStore';
import { seedIfEmpty } from '@/shared/lib/seedFirestore';
import { useTranslation } from 'react-i18next';

// Pages
import LandingPage from '@/pages/LandingPage';
import Auth from '@/widgets/Auth';
import RestaurantAuth from '@/pages/RestaurantAuth';
import AdminAuth from '@/pages/AdminAuth';
import CustomerApp from '@/pages/CustomerApp';
import StorePage from '@/pages/StorePage';
import CheckoutPage from '@/pages/CheckoutPage';
import ProfileView from '@/pages/ProfileView';
import RestaurantPortal from '@/pages/StorePanel';
import AdminDashboard from '@/pages/AdminPanel';

// Layouts & Guards
import CustomerLayout from '@/app/layouts/CustomerLayout';
import RestaurantLayout from '@/app/layouts/RestaurantLayout';
import AdminLayout from '@/app/layouts/AdminLayout';
import ProtectedRoute from '@/app/routes/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const { i18n } = useTranslation();
  const { user, setUser, setUserProfile, setFavorites, setIsAuthReady, setNotifications, isDarkMode, isAuthReady } = useStore();
  const location = useLocation();

  const isRTL = i18n.language === 'ar';

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
        const debugRole = localStorage.getItem('debug_role') as any;

        if (userDoc.exists()) {
          const profile = userDoc.data() as any;
          const finalRole = debugRole || profile.role || 'customer';
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: profile.displayName || currentUser.displayName || 'User',
            role: finalRole,
            favorites: profile.favorites || [],
            walletBalance: profile.walletBalance || 0,
            addresses: profile.addresses || [],
            notificationsEnabled: profile.notificationsEnabled ?? true,
            preferredLanguage: profile.preferredLanguage || 'en'
          });
          setFavorites(profile.favorites || []);
        } else {
          const finalRole = debugRole || 'customer';
          const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: currentUser.displayName || 'User',
            role: finalRole,
            favorites: [],
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email!,
            displayName: newProfile.displayName,
            role: finalRole,
            favorites: [],
            walletBalance: 0,
            addresses: [],
            notificationsEnabled: true,
            preferredLanguage: 'en'
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
  }, [setUser, setIsAuthReady, setFavorites, setUserProfile]);

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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A4D2E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <Routes location={location}>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/business-auth" element={<RestaurantAuth />} />
      <Route path="/admin-auth" element={<AdminAuth />} />

      {/* Customer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/discover" element={<CustomerApp initialTab="discover" />} />
          <Route path="/browse" element={<CustomerApp initialTab="browse" />} />
          <Route path="/favorites" element={<CustomerApp initialTab="favorites" />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfileView />} />
        </Route>
      </Route>

      {/* Restaurant Routes */}
      <Route element={<ProtectedRoute allowedRoles={['restaurant']} />}>
        <Route element={<RestaurantLayout />}>
          <Route path="/restaurant" element={<RestaurantPortal />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

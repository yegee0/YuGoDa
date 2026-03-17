import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';

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

export default function AppRoutes() {
  const { isAuthReady } = useStore();
  const location = useLocation();

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

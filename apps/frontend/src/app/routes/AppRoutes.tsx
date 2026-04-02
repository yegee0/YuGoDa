import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';

// Pages
import LandingPage from '@/pages/LandingPage';
import Auth from '@/pages/CustomerAuth';
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
          <Route path="/restaurant" element={<Navigate to="/restaurant/dashboard" replace />} />
          <Route path="/restaurant/dashboard" element={<RestaurantPortal />} />
          <Route path="/restaurant/orders" element={<RestaurantPortal />} />
          <Route path="/restaurant/inventory" element={<RestaurantPortal />} />
          <Route path="/restaurant/drivers" element={<RestaurantPortal />} />
          <Route path="/restaurant/reviews" element={<RestaurantPortal />} />
          <Route path="/restaurant/support" element={<RestaurantPortal />} />
          <Route path="/restaurant/profile" element={<RestaurantPortal />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<AdminDashboard />} />
          <Route path="/admin/stores" element={<AdminDashboard />} />
          <Route path="/admin/transactions" element={<AdminDashboard />} />
          <Route path="/admin/support" element={<AdminDashboard />} />
          <Route path="/admin/live-chat" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

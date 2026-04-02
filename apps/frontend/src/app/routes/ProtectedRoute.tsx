import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';

interface ProtectedRouteProps {
  allowedRoles: Array<'customer' | 'restaurant' | 'admin' | string>;
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, isAuthReady } = useStore();

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eco-bg">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A4D2E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated but profile is still loading from the API
  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-eco-bg">
        <div className="animate-spin w-8 h-8 border-4 border-[#1A4D2E] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!allowedRoles.includes(userProfile.role)) {
    switch (userProfile.role) {
      case 'customer':
        return <Navigate to="/discover" replace />;
      case 'restaurant':
        return <Navigate to="/restaurant" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}

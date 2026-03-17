import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthInit } from '@/shared/hooks/useAuthInit';
import AppRoutes from '@/app/routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  useAuthInit();
  return <AppRoutes />;
}

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthInit } from '@/hooks/useAuthInit';
import { useNotificationPoll } from '@/hooks/useNotificationPoll';
import AppRoutes from '@/app/routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { borderRadius: '14px', fontWeight: 600, fontSize: '0.875rem' },
          success: { style: { background: '#1B5E52', color: '#fff' } },
          error:   { style: { background: '#dc2626', color: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}

function AppContent() {
  useAuthInit();
  useNotificationPoll();
  return <AppRoutes />;
}

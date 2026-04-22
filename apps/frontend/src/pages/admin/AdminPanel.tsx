import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import type { AdminUser, Transaction, StoreProfile, Dispute, ChartDataPoint } from '@/types';
import { DAY_NAMES_SHORT } from '@/lib/constants';

import DashboardTab from './DashboardTab';
import CustomersTab from './CustomersTab';
import StoresTab from './StoresTab';
import TransactionsTab from './TransactionsTab';
import SupportTab from './SupportTab';
import LiveChatAdminTab from './LiveChatAdminTab';
import SettingsTab from './SettingsTab';

export default function AdminPanel() {
  const { t } = useTranslation();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const { isDarkMode } = useStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('yugoda_settings') || '{}'); } catch { return {}; } })();

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    borderColor: isDarkMode ? '#333333' : '#F3F4F6',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };
  const itemStyle: React.CSSProperties = { color: isDarkMode ? '#10B981' : '#059669', fontWeight: 'bold' };

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [usersRes, storesRes, txRes] = await Promise.allSettled([
          api.get('/users'),
          api.get('/stores'),
          api.get('/transactions'),
        ]);

        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || []);
        if (storesRes.status === 'fulfilled') setStores(storesRes.value.stores || []);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value.transactions || []);
        const disputesRes = await api.get('/disputes').catch(() => ({ disputes: [] }));
        setDisputes(disputesRes.disputes || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    }

    fetchAdminData();
  }, []);

  const handleApproveStore = async (storeId: string, approved: boolean) => {
    try {
      await api.put(`/stores/${storeId}/approve`, { approved });
      setStores(stores.map(s => s.id === storeId ? { ...s, status: approved ? 'active' : 'rejected' } : s));
    } catch (error) {
      console.error('Error approving store:', error);
    }
  };

  const handleUpdateDisputeStatus = async (disputeId: string, status: string) => {
    try {
      await api.put(`/disputes/${disputeId}`, { status });
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status: status as Dispute['status'] } : d));
    } catch (error) {
      console.error('Error updating dispute:', error);
    }
  };

  const PAGE_KEYS: Record<string, { titleKey: string; subtitleKey: string }> = {
    'dashboard':    { titleKey: 'admin_page_dashboard_title',    subtitleKey: 'admin_page_dashboard_subtitle' },
    'customers':    { titleKey: 'admin_page_customers_title',    subtitleKey: 'admin_page_customers_subtitle' },
    'stores':       { titleKey: 'admin_page_stores_title',       subtitleKey: 'admin_page_stores_subtitle' },
    'transactions': { titleKey: 'admin_page_transactions_title', subtitleKey: 'admin_page_transactions_subtitle' },
    'support':      { titleKey: 'admin_page_support_title',      subtitleKey: 'admin_page_support_subtitle' },
    'live-chat':    { titleKey: 'admin_page_live_chat_title',    subtitleKey: 'admin_page_live_chat_subtitle' },
    'settings':     { titleKey: 'admin_page_settings_title',     subtitleKey: 'admin_page_settings_subtitle' },
  };

  const page = PAGE_KEYS[activeTab] || { titleKey: 'admin_page_fallback_title', subtitleKey: 'admin_page_fallback_subtitle' };
  const headerInfo = { title: t(page.titleKey), subtitle: t(page.subtitleKey) };

  const revenueData: ChartDataPoint[] = DAY_NAMES_SHORT.map((day, i) => {
    const dayTxs = transactions.filter(tx => {
      if (!tx.createdAt) return false;
      const d = new Date(tx.createdAt);
      return d.getDay() === (i + 1) % 7;
    });
    return {
      day,
      revenue: dayTxs.reduce((acc: number, tx: Transaction) => acc + (tx.amount || 0), 0),
      orders: dayTxs.length,
    };
  });

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#1b5e52' }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <h2 className="text-xl md:text-2xl font-black text-white mb-1">{headerInfo.title}</h2>
        <p className="text-sm mb-4 md:mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>{headerInfo.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-2 md:pt-4 pb-8">
        <AnimatePresence mode="wait">

          {activeTab === 'dashboard' && (
            <DashboardTab
              users={users}
              transactions={transactions}
              revenueData={revenueData}
              tooltipStyle={tooltipStyle}
              itemStyle={itemStyle}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersTab
              users={users}
              onUpdateUser={(uid, patch) => setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...patch } : u))}
            />
          )}

          {activeTab === 'stores' && (
            <StoresTab stores={stores} onApproveStore={handleApproveStore} onUpdateStore={(id, updates) => setStores(stores.map(s => s.id === id ? { ...s, ...updates } : s))} />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              transactions={transactions}
              revenueData={revenueData}
              tooltipStyle={tooltipStyle}
              itemStyle={itemStyle}
            />
          )}

          {activeTab === 'support' && (
            <SupportTab
              disputes={disputes}
              onUpdateDisputeStatus={handleUpdateDisputeStatus}
            />
          )}

          {activeTab === 'live-chat' && <LiveChatAdminTab />}

          {activeTab === 'settings' && (
            <SettingsTab
              initialPlatformCut={savedSettings.platformCut ?? 10}
              initialAutoApprove={savedSettings.autoApprove ?? false}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

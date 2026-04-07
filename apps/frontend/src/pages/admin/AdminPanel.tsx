import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import type { Transaction, StoreProfile, Dispute, ChartDataPoint } from '@/types';
import { DAY_NAMES_SHORT } from '@/lib/constants';

import DashboardTab from './DashboardTab';
import CustomersTab from './CustomersTab';
import StoresTab from './StoresTab';
import TransactionsTab from './TransactionsTab';
import SupportTab from './SupportTab';
import SettingsTab from './SettingsTab';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: string;
}

export default function AdminPanel() {
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

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'dashboard': { title: 'Admin Dashboard', subtitle: 'Platform overview and key metrics.' },
    'customers': { title: 'Customers', subtitle: 'Manage registered users and roles.' },
    'stores': { title: 'Partner Stores', subtitle: 'Approve or manage business partners.' },
    'transactions': { title: 'Transactions', subtitle: 'Global financial tracking and revenue.' },
    'support': { title: 'Support Queue', subtitle: 'Handle incoming support requests.' },
    'live-chat': { title: 'Live Chat', subtitle: 'Manage real-time customer communications.' },
    'settings': { title: 'Platform Settings', subtitle: 'Configure globals like platform fees.' },
  };

  const headerInfo = pageTitles[activeTab] || { title: 'Admin Panel', subtitle: 'Manage your platform.' };

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
    <div className="h-full flex flex-col overflow-hidden bg-white/50 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-2xl font-black text-[#1A4D2E] dark:text-emerald-500 mb-1">{headerInfo.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{headerInfo.subtitle}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pt-4 pb-8">
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
            <CustomersTab users={users} />
          )}

          {activeTab === 'stores' && (
            <StoresTab stores={stores} onApproveStore={handleApproveStore} />
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

          {/* Live Chat - inline placeholder */}
          {activeTab === 'live-chat' && (
            <motion.div key="live-chat" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-[600px] flex flex-col space-y-4">
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Live Chat Dashboard</h3>
                <p className="text-sm text-gray-400 mb-6">Manage incoming chat requests from customers.</p>
                <div className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border border-gray-100 dark:border-gray-800 border-dashed">
                     <div className="text-center">
                         <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                         <p className="font-bold text-gray-400 dark:text-gray-500">No active chats in queue</p>
                     </div>
                </div>
              </div>
            </motion.div>
          )}

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

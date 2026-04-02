import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '@/app/store/useStore';
import {
  Users, DollarSign, ShieldCheck, MessageSquare, Search,
  MoreVertical, CheckCircle, XCircle, ExternalLink, Activity,
  AlertCircle, Store, LayoutDashboard, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, Clock, Ban, Star, MessageCircle,
  Send, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { api } from '@/lib/api';

type Tab = 'dashboard' | 'customers' | 'stores' | 'transactions' | 'support';

export default function AdminPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const { isDarkMode } = useStore();

  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatDispute, setChatDispute] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const savedSettings = (() => { try { return JSON.parse(localStorage.getItem('yugoda_settings') || '{}'); } catch { return {}; } })();
  const [settingsPlatformCut, setSettingsPlatformCut] = useState(savedSettings.platformCut ?? 10);
  const [settingsAutoApprove, setSettingsAutoApprove] = useState(savedSettings.autoApprove ?? false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    borderColor: isDarkMode ? '#333333' : '#F3F4F6',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  };
  const itemStyle = { color: isDarkMode ? '#10B981' : '#059669', fontWeight: 'bold' };

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
      setDisputes(disputes.map(d => d.id === disputeId ? { ...d, status } : d));
    } catch (error) {
      console.error('Error updating dispute:', error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const openChat = async (dispute: any) => {
    setChatDispute(dispute);
    setChatInput('');
    try {
      const res = await api.get(`/disputes/${dispute.id}/messages`);
      setChatMessages(res.messages || []);
    } catch {
      setChatMessages([{
        id: 'initial',
        senderRole: 'restaurant',
        message: dispute.message,
        createdAt: dispute.createdAt,
      }]);
    }
  };

  const handleSendAdminMessage = async () => {
    if (!chatInput.trim() || !chatDispute) return;
    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await api.post(`/disputes/${chatDispute.id}/messages`, { message: text });
      setChatMessages(prev => [...prev, res.message]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('yugoda_settings', JSON.stringify({ platformCut: settingsPlatformCut, autoApprove: settingsAutoApprove }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };


  // Remove global stat cards, logic moved to components

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'dashboard': { title: 'Admin Dashboard', subtitle: 'Platform overview and key metrics.' },
    'customers': { title: 'Customers', subtitle: 'Manage registered users and roles.' },
    'stores': { title: 'Partner Stores', subtitle: 'Approve or manage business partners.' },
    'transactions': { title: 'Transactions', subtitle: 'Global financial tracking and revenue.' },
    'support': { title: 'Support Queue', subtitle: 'Handle incoming support requests.' },
    'live-chat': { title: 'Live Chat', subtitle: 'Manage real-time customer communications.' },
    'settings': { title: 'Platform Settings', subtitle: 'Configure globals like platform fees.' }
  };

  const headerInfo = pageTitles[activeTab] || { title: 'Admin Panel', subtitle: 'Manage your platform.' };

  const revenueData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const dayTxs = transactions.filter(tx => {
      if (!tx.createdAt) return false;
      const d = new Date(tx.createdAt);
      return d.getDay() === (i + 1) % 7;
    });
    return {
      day,
      revenue: dayTxs.reduce((acc: number, tx: any) => acc + (tx.amount || 0), 0),
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

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 {/* High Level Global Stats */}
                  <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Revenue</p>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">${transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}</h3>
                    </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Revenue (Last 7 Days)</h3>
                  <p className="text-xs text-gray-400 mb-4">Daily revenue overview</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
                        <Area type="monotone" dataKey="revenue" stroke="#1A4D2E" strokeWidth={2} fillOpacity={1} fill="url(#gr)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">Orders per Day</h3>
                  <p className="text-xs text-gray-400 mb-4">Weekly order volume</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
                        <Bar dataKey="orders" fill="#1A4D2E" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Recent Customers</h3>
                  <button onClick={() => navigate('/admin/customers')} className="text-xs text-[#1A4D2E] font-bold hover:underline">View All</button>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {users.slice(0, 5).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] font-bold text-sm">
                              {u.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{u.displayName || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                            u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                            u.role === 'restaurant' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>{u.role || 'customer'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-400">
                          {u.createdAt?.toDate?.().toLocaleDateString() || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── CUSTOMERS ── */}
          {activeTab === 'customers' && (
            <motion.div key="customers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Total Customers</p>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{users.filter(u => u.role === 'customer').length}</h3>
                    </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">All Customers ({users.length})</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 dark:text-white w-56"
                    />
                  </div>
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {users
                      .filter(u => (u.displayName || u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] font-bold">
                                {u.displayName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{u.displayName || 'Unknown'}</p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                              u.role === 'restaurant' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>{u.role || 'customer'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {u.createdAt?.toDate?.().toLocaleDateString() || '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ── STORES ── */}
          {activeTab === 'stores' && (
            <motion.div key="stores" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                        <Store className="w-5 h-5 text-violet-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Active Stores</p>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stores.filter(s => s.status === 'active').length}</h3>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pending Approvals</p>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stores.filter(s => s.status === 'pending').length}</h3>
                    </div>
                  </div>
              </div>
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">All Stores ({stores.length})</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-lg font-bold">
                      {stores.filter(s => s.status === 'pending').length} Pending
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-1 rounded-lg font-bold">
                      {stores.filter(s => s.status === 'active').length} Active
                    </span>
                  </div>
                </div>
                {stores.length === 0 ? (
                  <div className="py-20 text-center">
                    <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-400">No stores found</p>
                    <p className="text-xs text-gray-300 mt-1">Stores registered on the platform will appear here.</p>
                  </div>
                ) : (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {stores.map(store => (
                      <div key={store.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                              <Store className="w-5 h-5 text-[#1A4D2E]" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{store.name || 'Unnamed Store'}</h4>
                              <p className="text-xs text-gray-400">{store.category || 'Restaurant'}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                            store.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                            store.status === 'rejected' ? 'bg-red-100 text-red-500' :
                            'bg-amber-100 text-amber-600'
                          }`}>{store.status || 'pending'}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{store.description || 'No description provided.'}</p>
                        {(store.status === 'pending' || !store.status) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveStore(store.id, true)}
                              className="flex-1 py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D2E]/90 transition-colors flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleApproveStore(store.id, false)}
                              className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── TRANSACTIONS ── */}
          {activeTab === 'transactions' && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Revenue Overview</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis hide />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
                      <Area type="monotone" dataKey="revenue" stroke="#1A4D2E" strokeWidth={2} fillOpacity={1} fill="url(#gr2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white">Transaction History</h3>
                </div>
                {transactions.length === 0 ? (
                  <div className="py-20 text-center">
                    <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-400">No transactions yet</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-gray-400">#{tx.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${tx.amount?.toFixed(2) || '0.00'}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                              {tx.status || 'completed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400">
                            {tx.createdAt?.toDate?.().toLocaleString() || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SUPPORT ── */}
          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Open Tickets</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{disputes.filter(d => d.status === 'open').length}</h3>
                </div>
                <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Resolved</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{disputes.filter(d => d.status === 'resolved').length}</h3>
                </div>
                <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium mb-1">Total Tickets</p>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white">{disputes.length}</h3>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-gray-900 dark:text-white">Support Tickets</h3>
                </div>
                {disputes.length === 0 ? (
                  <div className="py-20 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="font-bold text-gray-400">No support tickets yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {disputes.map(d => (
                      <div key={d.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              d.status === 'open' ? 'bg-amber-100 text-amber-600' :
                              d.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-gray-100 text-gray-500'
                            }`}>{d.status}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              d.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                              d.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>{d.priority}</span>
                          </div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{d.subject}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{d.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => openChat(d)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Message
                          </button>
                          {d.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleUpdateDisputeStatus(d.id, 'resolved')}
                                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleUpdateDisputeStatus(d.id, 'closed')}
                                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── LIVE CHAT ── */}
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

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 max-w-2xl">
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">System Configuration</h3>
                <p className="text-sm text-gray-400 mb-6">Manage global platform fees and policies.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Platform Cut (%)</label>
                    <input
                      type="number"
                      value={settingsPlatformCut}
                      onChange={e => setSettingsPlatformCut(Number(e.target.value))}
                      className="w-full max-w-xs bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#1A4D2E] text-sm dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Auto-Approve Partner Stores</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settingsAutoApprove}
                        onChange={e => setSettingsAutoApprove(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1A4D2E]"></div>
                    </label>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className={`py-2.5 px-6 rounded-xl font-bold text-sm transition-colors ${settingsSaved ? 'bg-emerald-500 text-white' : 'bg-[#1A4D2E] text-white hover:bg-[#153e25]'}`}
                  >
                    {settingsSaved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── CHAT MODAL ── */}
      {chatDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-[#111] rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden" style={{ height: '560px' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">Message Conversation</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{chatDispute.subject}</p>
              </div>
              <button
                onClick={() => setChatDispute(null)}
                className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-[#0a0a0a]/50">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.senderRole === 'admin' ? 'bg-[#1A4D2E] text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 dark:text-white rounded-tl-none shadow-sm'}`}>
                    <p className="text-sm">{msg.message}</p>
                    <span className={`text-[10px] mt-1.5 block ${msg.senderRole === 'admin' ? 'text-white/60' : 'text-gray-400'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ''}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendAdminMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 dark:text-white"
                />
                <button
                  onClick={handleSendAdminMessage}
                  disabled={!chatInput.trim()}
                  className="w-10 h-10 rounded-xl bg-[#1A4D2E] text-white flex items-center justify-center hover:bg-[#153e25] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

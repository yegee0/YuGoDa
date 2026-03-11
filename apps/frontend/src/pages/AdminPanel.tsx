import React, { useState, useEffect } from 'react';
import {
  Users, DollarSign, ShieldCheck, MessageSquare, Search,
  MoreVertical, CheckCircle, XCircle, ExternalLink, Activity,
  AlertCircle, Store, LayoutDashboard, TrendingUp, Package,
  ArrowUpRight, ArrowDownRight, Clock, Ban, Star
} from 'lucide-react';
import { db } from '@/shared/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type Tab = 'dashboard' | 'customers' | 'stores' | 'transactions' | 'support';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTrans = onSnapshot(
      query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    const unsubStores = onSnapshot(collection(db, 'stores'), (snap) =>
      setStores(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubUsers(); unsubTrans(); unsubStores(); };
  }, []);

  const handleApproveStore = async (storeId: string, approved: boolean) => {
    await updateDoc(doc(db, 'stores', storeId), {
      status: approved ? 'active' : 'rejected',
      updatedAt: new Date()
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'customers',   label: 'Customers',    icon: <Users className="w-4 h-4" /> },
    { id: 'stores',      label: 'Stores',       icon: <Store className="w-4 h-4" /> },
    { id: 'transactions',label: 'Transactions', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'support',     label: 'Support',      icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const statCards = [
    {
      label: 'Total Revenue',
      value: `$${transactions.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString()}`,
      icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
      trend: '+12.5%', up: true
    },
    {
      label: 'Total Customers',
      value: users.filter(u => u.role === 'customer' || !u.role).length.toString(),
      icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10',
      trend: '+8.2%', up: true
    },
    {
      label: 'Active Stores',
      value: stores.filter(s => s.status === 'active').length.toString(),
      icon: Store, color: 'text-violet-500', bg: 'bg-violet-500/10',
      trend: '+3.1%', up: true
    },
    {
      label: 'Pending Approvals',
      value: stores.filter(s => s.status === 'pending').length.toString(),
      icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10',
      trend: '-2', up: false
    },
  ];

  // mock chart data
  const revenueData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    revenue: Math.floor(Math.random() * 3000) + 500,
    orders: Math.floor(Math.random() * 50) + 10,
  }));

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F8] dark:bg-[#0A0A0A] overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, manage your platform below.</p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${s.up ? 'text-emerald-500' : 'text-red-400'}`}>
                  {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {s.trend}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab Bar */}
        <div className="flex bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-2xl p-1 gap-1 w-fit shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1A4D2E] text-white shadow'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 pt-4 pb-8">
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
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
                        <Tooltip />
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
                        <Tooltip />
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
                  <button onClick={() => setActiveTab('customers')} className="text-xs text-[#1A4D2E] font-bold hover:underline">View All</button>
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
            <motion.div key="customers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
                      <Tooltip />
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
            <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-4">
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Support Management</h3>
                <p className="text-sm text-gray-400 mb-6">Manage external support channels and live interactions.</p>
                <div className="space-y-3">
                  <a href="https://wa.me/1234567890" target="_blank" className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-400">WhatsApp Support</p>
                      <p className="text-xs text-emerald-600">Direct line for urgent business queries</p>
                    </div>
                    <ExternalLink className="ml-auto w-4 h-4 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                  </a>

                  <a href="skype:echo123?chat" className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-all group">
                    <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900 dark:text-blue-400">Skype for Business</p>
                      <p className="text-xs text-blue-600">Video consultations for store owners</p>
                    </div>
                    <ExternalLink className="ml-auto w-4 h-4 text-blue-300 group-hover:text-blue-500 transition-colors" />
                  </a>

                  <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                    <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-purple-900 dark:text-purple-400">LiveChat Integration</p>
                      <p className="text-xs text-purple-600">Status: <span className="font-bold text-emerald-500">Online</span></p>
                    </div>
                    <button className="px-4 py-2 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-600 transition-colors">Manage</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Users, DollarSign, ShieldCheck, MessageSquare, Search, Filter, MoreVertical, CheckCircle, XCircle, ExternalLink, Activity, BarChart3, TrendingUp, AlertCircle, Store } from 'lucide-react';
import { db } from '@/shared/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdminPanel() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'approvals' | 'support'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTrans = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50)), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubStores = onSnapshot(collection(db, 'stores'), (snapshot) => {
      setStores(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubTrans();
      unsubStores();
    };
  }, []);

  const handleApproveStore = async (storeId: string, approved: boolean) => {
    try {
      await updateDoc(doc(db, 'stores', storeId), {
        status: approved ? 'active' : 'rejected',
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error approving store:', error);
    }
  };

  const stats = [
    { label: 'Total Revenue', value: '$12,450', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Users', value: users.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Approvals', value: stores.filter(s => s.status === 'pending').length.toString(), icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Support Tickets', value: '8', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F9F9] dark:bg-[#0A0A0A] overflow-hidden">
      {/* Stats Bar */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-[#111111] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t(stat.label)}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col gap-6">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Tabs & Search */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl">
              {(['users', 'transactions', 'approvals', 'support'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {t(tab.charAt(0).toUpperCase() + tab.slice(1))}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('Search...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#1A4D2E]/20 outline-none dark:text-white"
              />
            </div>
          </div>

          {/* Table/List View */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'users' && (
                <motion.table 
                  key="users"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full text-left border-collapse"
                >
                  <thead className="sticky top-0 bg-white dark:bg-[#111111] z-10">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                      <th className="px-6 py-4">{t('User')}</th>
                      <th className="px-6 py-4">{t('Role')}</th>
                      <th className="px-6 py-4">{t('Status')}</th>
                      <th className="px-6 py-4">{t('Joined')}</th>
                      <th className="px-6 py-4 text-right">{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {users.filter(u => u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-[#1A4D2E]">
                              {user.displayName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                            user.role === 'restaurant' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Active</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {user.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </motion.table>
              )}

              {activeTab === 'transactions' && (
                <motion.div 
                  key="transactions"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 space-y-6"
                >
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={transactions.slice(0, 10).reverse()}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey="createdAt" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="amount" stroke="#1A4D2E" fillOpacity={1} fill="url(#colorAmount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                        <th className="px-6 py-4">{t('Transaction ID')}</th>
                        <th className="px-6 py-4">{t('Amount')}</th>
                        <th className="px-6 py-4">{t('Status')}</th>
                        <th className="px-6 py-4">{t('Date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                      {transactions.map(tx => (
                        <tr key={tx.id} className="text-sm">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">#{tx.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${tx.amount?.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {tx.createdAt?.toDate().toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeTab === 'approvals' && (
                <motion.div 
                  key="approvals"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {stores.filter(s => s.status === 'pending').map(store => (
                    <div key={store.id} className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                            <Store className="w-6 h-6 text-[#1A4D2E]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{store.name}</h4>
                            <p className="text-xs text-gray-500">{store.category}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold uppercase">Pending</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{store.description}</p>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApproveStore(store.id, true)}
                          className="flex-1 py-2 bg-[#1A4D2E] text-white rounded-xl text-sm font-bold hover:bg-[#1A4D2E]/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" /> {t('Approve')}
                        </button>
                        <button 
                          onClick={() => handleApproveStore(store.id, false)}
                          className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> {t('Reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                  {stores.filter(s => s.status === 'pending').length === 0 && (
                    <div className="col-span-full py-20 text-center">
                      <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('No pending approvals')}</h3>
                      <p className="text-gray-500 text-sm">{t('All businesses have been processed.')}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'support' && (
                <motion.div 
                  key="support"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-8 max-w-2xl mx-auto space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Support Management')}</h3>
                    <p className="text-gray-500 mt-1">{t('Manage external support channels and live chat.')}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <a href="https://wa.me/1234567890" target="_blank" className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900 dark:text-emerald-400">WhatsApp Support</p>
                        <p className="text-xs text-emerald-600">Direct line for urgent business queries</p>
                      </div>
                      <ExternalLink className="ml-auto w-5 h-5 text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                    </a>

                    <a href="skype:echo123?chat" className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-900 dark:text-blue-400">Skype for Business</p>
                        <p className="text-xs text-blue-600">Video consultations for store owners</p>
                      </div>
                      <ExternalLink className="ml-auto w-5 h-5 text-blue-300 group-hover:text-blue-500 transition-colors" />
                    </a>

                    <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                      <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-purple-900 dark:text-purple-400">LiveChat Integration</p>
                        <p className="text-xs text-purple-600">Status: <span className="font-bold">Online</span></p>
                      </div>
                      <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-xs font-bold">Manage</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

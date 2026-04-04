import React, { useState } from 'react';
import { Users, Search, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: string;
}

export interface CustomersTabProps {
  users: AdminUser[];
}

export default function CustomersTab({ users }: CustomersTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
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
                <tr key={u.uid} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
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
                    {(u.createdAt as unknown as { toDate?: () => Date })?.toDate?.().toLocaleDateString() || '—'}
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
  );
}

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
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8FA396] font-medium mb-1">Total Customers</p>
              <h3 className="text-2xl font-black text-[#1B1B1B]">{users.filter(u => u.role === 'customer').length}</h3>
            </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5] flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-[#1B1B1B]">All Customers ({users.length})</h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA396]" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[#F5F0E8] border-none rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#1B5E52]/20 w-56"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[550px]">
          <thead>
            <tr className="text-xs font-bold text-[#8FA396] uppercase tracking-wider border-b border-[#E8E0D5]">
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {users
              .filter(u => (u.displayName || u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map(u => (
                <tr key={u.uid} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] font-bold">
                        {u.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1B1B1B]">{u.displayName || 'Unknown'}</p>
                        <p className="text-xs text-[#8FA396]">{u.email}</p>
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
                  <td className="px-6 py-4 text-xs text-[#8FA396]">
                    {(u.createdAt as unknown as { toDate?: () => Date })?.toDate?.().toLocaleDateString() || '—'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-[#F5F0E8] rounded-lg text-[#8FA396] transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>
    </motion.div>
  );
}

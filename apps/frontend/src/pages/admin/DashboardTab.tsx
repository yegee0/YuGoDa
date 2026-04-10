import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import type { Transaction, ChartDataPoint } from '@/types';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: string;
}

export interface DashboardTabProps {
  users: AdminUser[];
  transactions: Transaction[];
  revenueData: ChartDataPoint[];
  tooltipStyle: React.CSSProperties;
  itemStyle: React.CSSProperties;
}

export default function DashboardTab({
  users,
  transactions,
  revenueData,
  tooltipStyle,
  itemStyle,
}: DashboardTabProps) {
  const navigate = useNavigate();

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         {/* High Level Global Stats */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E0D5] shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F5F0E8] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#8FA396] font-medium mb-1">Total Revenue</p>
              <h3 className="text-2xl font-black text-[#1B1B1B]">${transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}</h3>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
          <h3 className="font-bold text-[#1B1B1B] mb-1">Revenue (Last 7 Days)</h3>
          <p className="text-xs text-[#8FA396] mb-4">Daily revenue overview</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E52" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1B5E52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#1B5E52" strokeWidth={2} fillOpacity={1} fill="url(#gr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
          <h3 className="font-bold text-[#1B1B1B] mb-1">Orders per Day</h3>
          <p className="text-xs text-[#8FA396] mb-4">Weekly order volume</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
                <Bar dataKey="orders" fill="#1B5E52" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5] flex items-center justify-between">
          <h3 className="font-bold text-[#1B1B1B]">Recent Customers</h3>
          <button onClick={() => navigate('/admin/customers')} className="text-xs text-[#1B5E52] font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead>
            <tr className="text-xs font-bold text-[#8FA396] uppercase tracking-wider border-b border-[#E8E0D5]">
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F0E8]">
            {users.slice(0, 5).map(u => (
              <tr key={u.uid} className="hover:bg-[#F5F0E8] transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] font-bold text-sm">
                      {u.displayName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1B1B1B]">{u.displayName || 'Unknown'}</p>
                      <p className="text-xs text-[#8FA396]">{u.email}</p>
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
                <td className="px-6 py-3 text-xs text-[#8FA396]">
                  {(u.createdAt as unknown as { toDate?: () => Date })?.toDate?.().toLocaleDateString() || '—'}
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

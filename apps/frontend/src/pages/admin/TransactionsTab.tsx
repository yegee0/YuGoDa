import React from 'react';
import { DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction, ChartDataPoint } from '@/types';

export interface TransactionsTabProps {
  transactions: Transaction[];
  revenueData: ChartDataPoint[];
  tooltipStyle: React.CSSProperties;
  itemStyle: React.CSSProperties;
}

export default function TransactionsTab({
  transactions,
  revenueData,
  tooltipStyle,
  itemStyle,
}: TransactionsTabProps) {
  return (
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
                    {(tx.createdAt as unknown as { toDate?: () => Date })?.toDate?.().toLocaleString() || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}

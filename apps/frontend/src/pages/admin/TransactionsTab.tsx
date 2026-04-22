import React from 'react';
import { DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction, ChartDataPoint } from '@/types';
import { TL, formatDate } from '@/lib/formatters';

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
  const { t } = useTranslation();
  return (
    <motion.div key="transactions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
        <h3 className="font-bold text-[#1B1B1B] mb-4">{t('admin_tx_revenue_overview')}</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E52" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B5E52" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.5)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#1B5E52" strokeWidth={2} fillOpacity={1} fill="url(#gr2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5]">
          <h3 className="font-bold text-[#1B1B1B]">{t('admin_tx_history')}</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="py-20 text-center">
            <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-[#8FA396]">{t('admin_tx_empty')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="text-xs font-bold text-[#8FA396] uppercase tracking-wider border-b border-[#E8E0D5]">
                <th className="px-6 py-4">{t('admin_tx_col_id')}</th>
                <th className="px-6 py-4">{t('admin_tx_col_amount')}</th>
                <th className="px-6 py-4">{t('admin_tx_col_commission')}</th>
                <th className="px-6 py-4">{t('admin_tx_col_restaurant_net')}</th>
                <th className="px-6 py-4">{t('admin_col_status')}</th>
                <th className="px-6 py-4">{t('admin_tx_col_date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F0E8]">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-[#F5F0E8] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-[#8FA396]">#{tx.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-bold text-[#1B1B1B]">{TL(tx.amount || 0)}</td>
                  <td className="px-6 py-4 text-sm text-orange-600 font-bold">{TL(tx.commissionAmount || 0)}</td>
                  <td className="px-6 py-4 text-sm text-emerald-600 font-bold">{TL(tx.restaurantAmount || 0)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                      {tx.status || t('admin_tx_status_completed')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8FA396]">
                    {tx.createdAt ? formatDate(tx.createdAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

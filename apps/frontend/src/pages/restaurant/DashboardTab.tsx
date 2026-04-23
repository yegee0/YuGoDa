import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Star, ShoppingBag, DollarSign, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useStore } from '@/app/store/useStore';
import type { Order, Review, ChartDataPoint } from '@/types';
import { StatCard, StatusBadge, TL } from './StorePanel';

export interface DashboardTabProps {
  orders: Order[];
  reviews: Review[];
  chartData: ChartDataPoint[];
  todaySales: number;
  activeOrders: number;
  avgRating: string;
  commissionRate?: number;
}

export default function DashboardTab({
  orders,
  reviews,
  chartData,
  todaySales,
  activeOrders,
  avgRating,
  commissionRate,
}: DashboardTabProps) {
  const { t } = useTranslation();
  const { isDarkMode } = useStore();
  const navigate = useNavigate();

  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    borderColor: isDarkMode ? '#2a2a2a' : '#F3F4F6',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  };

  return (
    <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('rest_dashboard_net_revenue')} value={TL(todaySales)}    icon={<DollarSign className="w-5 h-5" />}  color="bg-emerald-50 text-emerald-600" sub={t('rest_dashboard_net_revenue_sub', { rate: commissionRate ?? 15 })} />
        <StatCard label={t('rest_dashboard_active_orders')} value={activeOrders}    icon={<Package className="w-5 h-5" />}     color="bg-blue-50 text-blue-600"           sub={t('rest_dashboard_active_orders_sub')} />
        <StatCard label={t('rest_dashboard_total_orders')}  value={orders.length}   icon={<ShoppingBag className="w-5 h-5" />} color="bg-purple-50 text-purple-600"     sub={t('rest_dashboard_total_orders_sub')} />
        <StatCard label={t('rest_dashboard_avg_rating')}    value={avgRating}       icon={<Star className="w-5 h-5" />}        color="bg-amber-50 text-amber-500"         sub={t('rest_dashboard_avg_rating_sub', { count: reviews.length })} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-[#1B1B1B] text-sm">{t('rest_dashboard_weekly_revenue')}</h3>
              <p className="text-xs text-[#8FA396] mt-0.5">{t('rest_dashboard_weekly_revenue_sub')}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> {t('rest_dashboard_live')}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={192}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1B5E52" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B5E52" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.5)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="revenue" stroke="#1B5E52" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8E0D5] shadow-sm">
          <div className="mb-5">
            <h3 className="font-bold text-[#1B1B1B] text-sm">{t('rest_dashboard_order_volume')}</h3>
            <p className="text-xs text-[#8FA396] mt-0.5">{t('rest_dashboard_order_volume_sub')}</p>
          </div>
          <ResponsiveContainer width="100%" height={192}>
            <BarChart data={chartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.5)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="#1B5E52" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8E0D5] flex items-center justify-between">
          <h3 className="font-bold text-[#1B1B1B] text-sm">{t('rest_dashboard_recent_orders')}</h3>
          <button onClick={() => navigate('/restaurant/orders')} className="text-xs font-bold text-[#1B5E52] hover:underline flex items-center gap-1">
            {t('rest_dashboard_view_all')} <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-[#8FA396] font-bold">{t('rest_dashboard_no_orders')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E0D5]">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F5F0E8] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52]">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1B1B1B]">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-[#8FA396]">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="font-black text-sm text-[#1B1B1B]">{TL(order.price || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

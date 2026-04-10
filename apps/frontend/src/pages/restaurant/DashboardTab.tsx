import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Star, ShoppingBag, DollarSign, ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
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
        <StatCard label="Today's Net Revenue" value={TL(todaySales)}    icon={<DollarSign className="w-5 h-5" />}  color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" sub={`After ${commissionRate ?? 15}% commission`} />
        <StatCard label="Active Orders"     value={activeOrders}       icon={<Package className="w-5 h-5" />}     color="bg-blue-50 dark:bg-blue-900/20 text-blue-600"           sub="Pending + preparing" />
        <StatCard label="Total Orders"      value={orders.length}      icon={<ShoppingBag className="w-5 h-5" />} color="bg-purple-50 dark:bg-purple-900/20 text-purple-600"     sub="All time" />
        <StatCard label="Avg Rating"        value={avgRating}          icon={<Star className="w-5 h-5" />}        color="bg-amber-50 dark:bg-amber-900/20 text-amber-500"         sub={`${reviews.length} reviews`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Weekly Revenue</h3>
              <p className="text-xs text-gray-400 mt-0.5">Daily revenue this week</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> Live
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#1A4D2E" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A4D2E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1f1f1f' : '#f3f4f6'} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDarkMode ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="revenue" stroke="#1A4D2E" strokeWidth={2.5} fillOpacity={1} fill="url(#revGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Order Volume</h3>
            <p className="text-xs text-gray-400 mt-0.5">Daily orders this week</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1f1f1f' : '#f3f4f6'} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDarkMode ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" fill="#1A4D2E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Orders</h3>
          <button onClick={() => navigate('/restaurant/orders')} className="text-xs font-bold text-[#1A4D2E] hover:underline flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-bold">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={order.status} />
                  <span className="font-black text-sm text-gray-900 dark:text-white">{TL(order.price || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { Package, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import type { Order, OrderStatus } from '@/types';
import { StatusBadge, TL } from './StorePanel';

export interface OrdersTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, trackingInfo?: { estimatedPickupTime?: string; trackingNotes?: string }) => Promise<void>;
}

export default function OrdersTab({ orders, onUpdateOrderStatus }: OrdersTabProps) {
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { time: string; notes: string }>>({});

  const displayOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  return (
    <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Filter + stat */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-xl p-1 shadow-sm">
          {(['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setOrderFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                orderFilter === f
                  ? 'bg-[#1A4D2E] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f}
              {f !== 'all' && (
                <span className="ml-1 opacity-70">{orders.filter(o => o.status === f).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {displayOrders.length} order{displayOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border border-gray-100 dark:border-white/5">
          <Package className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
          <p className="font-bold text-gray-400 text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-gray-900 dark:text-white text-sm">#{order.id.slice(0, 8)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="font-black text-gray-900 dark:text-white">{TL(order.price || 0)}</p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => onUpdateOrderStatus(order.id, 'preparing')} className="px-4 py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold hover:bg-[#133b23] transition-colors">
                        Accept
                      </button>
                      <button onClick={() => onUpdateOrderStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        Decline
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => {
                        const info = trackingInputs[order.id];
                        onUpdateOrderStatus(order.id, 'ready', info ? { estimatedPickupTime: info.time || undefined, trackingNotes: info.notes || undefined } : undefined);
                      }}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button onClick={() => onUpdateOrderStatus(order.id, 'delivered')} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>

              {/* Tracking info inputs for active orders */}
              {(order.status === 'preparing' || order.status === 'ready') && (
                <div className="w-full pt-3 mt-3 border-t border-gray-50 dark:border-white/5 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="time"
                      value={trackingInputs[order.id]?.time ?? order.estimatedPickupTime ?? ''}
                      onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], time: e.target.value, notes: prev[order.id]?.notes ?? order.trackingNotes ?? '' } }))}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#1A4D2E]"
                      placeholder="Pickup time"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={trackingInputs[order.id]?.notes ?? order.trackingNotes ?? ''}
                      onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], notes: e.target.value, time: prev[order.id]?.time ?? order.estimatedPickupTime ?? '' } }))}
                      className="w-full px-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#1A4D2E]"
                      placeholder="Notes for customer..."
                    />
                  </div>
                </div>
              )}

              {/* Show existing tracking info for other statuses */}
              {order.status !== 'preparing' && order.status !== 'ready' && (order.estimatedPickupTime || order.trackingNotes) && (
                <div className="w-full pt-3 mt-3 border-t border-gray-50 dark:border-white/5 flex flex-wrap gap-3 text-xs text-gray-400">
                  {order.estimatedPickupTime && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pickup: {order.estimatedPickupTime}</span>
                  )}
                  {order.trackingNotes && (
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {order.trackingNotes}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

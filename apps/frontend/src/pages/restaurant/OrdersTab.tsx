import React, { useState } from 'react';
import { Package, Clock, FileText, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import type { Order, OrderStatus, Bag } from '@/types';
import { StatusBadge, TL } from './StorePanel';

export interface OrdersTabProps {
  orders: Order[];
  inventory: Bag[];
  coverImage?: string;
  onUpdateOrderStatus: (
    orderId: string,
    status: OrderStatus,
    trackingInfo?: { estimatedPickupTime?: string; trackingNotes?: string; deliveryCode?: string }
  ) => Promise<void>;
}

const FILTER_I18N: Record<string, string> = {
  all:        'rest_orders_filter_all',
  pending:    'rest_orders_filter_pending',
  preparing:  'rest_orders_filter_preparing',
  ready:      'rest_orders_filter_ready',
  delivering: 'rest_orders_filter_driving',
  delivered:  'rest_orders_filter_delivered',
  cancelled:  'rest_orders_filter_cancelled',
};

const FILTERS = ['all', 'pending', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'] as const;

export default function OrdersTab({ orders, inventory, coverImage, onUpdateOrderStatus }: OrdersTabProps) {
  const { t } = useTranslation();
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { time: string; notes: string }>>({});
  const [deliveryCodeInputs, setDeliveryCodeInputs] = useState<Record<string, string>>({});
  const [codeErrors, setCodeErrors] = useState<Record<string, string>>({});

  const displayOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

  const handleConfirmDelivery = async (order: Order) => {
    const code = (deliveryCodeInputs[order.id] || '').trim();
    if (!code) {
      setCodeErrors(prev => ({ ...prev, [order.id]: t('rest_orders_delivery_code_missing') }));
      return;
    }
    setCodeErrors(prev => ({ ...prev, [order.id]: '' }));
    const info = trackingInputs[order.id];
    await onUpdateOrderStatus(order.id, 'delivered', {
      ...(info?.time ? { estimatedPickupTime: info.time } : {}),
      ...(info?.notes ? { trackingNotes: info.notes } : {}),
      deliveryCode: code,
    });
  };

  return (
    <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Filter + stat */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-[#E8E0D5] rounded-xl p-1 shadow-sm flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setOrderFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                orderFilter === f
                  ? 'bg-[#1B5E52] text-white shadow-sm'
                  : 'text-[#8FA396] hover:text-gray-700'
              }`}
            >
              {t(FILTER_I18N[f])}
              {f !== 'all' && (
                <span className="ml-1 opacity-70">{orders.filter(o => o.status === f).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="text-sm text-[#8FA396] font-medium">
          {t(displayOrders.length === 1 ? 'rest_orders_count_one' : 'rest_orders_count_other', { count: displayOrders.length })}
        </div>
      </div>

      {displayOrders.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center border border-[#E8E0D5]">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-bold text-[#8FA396] text-sm">{t('rest_orders_empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayOrders.map(order => (
            <div key={order.id} className="bg-white border border-[#E8E0D5] rounded-2xl p-5 shadow-sm space-y-0">

              {/* Order header row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] overflow-hidden flex-shrink-0">
                    {(() => {
                      const bagImage = inventory.find(b => b.id === order.bagId)?.image
                        || inventory.find(b => b.id === order.bagId)?.storeCoverImage
                        || coverImage;
                      return bagImage
                        ? <img src={bagImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        : <Package className="w-5 h-5" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-[#1B1B1B] text-sm">#{order.id.slice(0, 8)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-[#8FA396]">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xs text-[#8FA396] mb-0.5">{t('rest_orders_col_total')}</p>
                    <p className="font-black text-[#1B1B1B]">{TL(order.price || 0)}</p>
                  </div>

                  {/* Status action buttons */}
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                          className="px-4 py-2 bg-[#1B5E52] text-white rounded-xl text-xs font-bold hover:bg-[#164d43] transition-colors"
                        >
                          {t('rest_orders_btn_approve')}
                        </button>
                        <button
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                        >
                          {t('rest_orders_btn_deny')}
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => {
                          const info = trackingInputs[order.id];
                          onUpdateOrderStatus(order.id, 'ready', info
                            ? { estimatedPickupTime: info.time || undefined, trackingNotes: info.notes || undefined }
                            : undefined);
                        }}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                      >
                        {t('rest_orders_btn_next')}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => {
                          const info = trackingInputs[order.id];
                          onUpdateOrderStatus(order.id, 'delivering', info
                            ? { estimatedPickupTime: info.time || undefined, trackingNotes: info.notes || undefined }
                            : undefined);
                        }}
                        className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors"
                      >
                        {t('rest_orders_btn_next')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracking info inputs for preparing / ready */}
              {(order.status === 'preparing' || order.status === 'ready') && (
                <div className="pt-3 mt-3 border-t border-[#E8E0D5] flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8FA396]" />
                    <input
                      type="time"
                      value={trackingInputs[order.id]?.time ?? order.estimatedPickupTime ?? ''}
                      onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], time: e.target.value, notes: prev[order.id]?.notes ?? order.trackingNotes ?? '' } }))}
                      className="px-3 py-1.5 bg-[#F5F0E8] border border-[#E8E0D5] rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#1B5E52]"
                      placeholder={t('rest_orders_pickup_time_placeholder')}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <FileText className="w-3.5 h-3.5 text-[#8FA396] flex-shrink-0" />
                    <input
                      type="text"
                      value={trackingInputs[order.id]?.notes ?? order.trackingNotes ?? ''}
                      onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...prev[order.id], notes: e.target.value, time: prev[order.id]?.time ?? order.estimatedPickupTime ?? '' } }))}
                      className="w-full px-3 py-1.5 bg-[#F5F0E8] border border-[#E8E0D5] rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#1B5E52]"
                      placeholder={t('rest_orders_notes_placeholder')}
                    />
                  </div>
                </div>
              )}

              {/* Driving → Delivered: delivery code verification */}
              {order.status === 'delivering' && (
                <div className="pt-3 mt-3 border-t border-[#E8E0D5] space-y-2">
                  <p className="text-xs font-bold text-[#8FA396] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    {t('rest_orders_delivery_code_prompt')}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="_ _ _ _"
                      value={deliveryCodeInputs[order.id] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setDeliveryCodeInputs(prev => ({ ...prev, [order.id]: val }));
                        setCodeErrors(prev => ({ ...prev, [order.id]: '' }));
                      }}
                      className={`w-28 px-3 py-2 text-center tracking-[0.5em] font-black text-base bg-[#F5F0E8] border rounded-xl focus:outline-none transition-colors text-[#1B1B1B] ${
                        codeErrors[order.id] ? 'border-red-400' : 'border-[#E8E0D5] focus:border-[#1B5E52]'
                      }`}
                    />
                    <button
                      onClick={() => handleConfirmDelivery(order)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                    >
                      {t('rest_orders_confirm_delivery')}
                    </button>
                  </div>
                  {codeErrors[order.id] && (
                    <p className="text-xs text-red-500">{codeErrors[order.id]}</p>
                  )}
                </div>
              )}

              {/* Show existing tracking info for terminal / non-input statuses */}
              {!['preparing', 'ready', 'delivering'].includes(order.status) && (order.estimatedPickupTime || order.trackingNotes) && (
                <div className="pt-3 mt-3 border-t border-[#E8E0D5] flex flex-wrap gap-3 text-xs text-[#8FA396]">
                  {order.estimatedPickupTime && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('rest_orders_pickup_label')}: {order.estimatedPickupTime}</span>
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { formatDate, TL } from '@/lib/formatters';
import { STATUS_CONFIG } from '@/lib/constants';
import type { Order, AdminUser } from '@/types';

export default function CustomerOrdersPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customer, setCustomer] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    Promise.allSettled([
      api.get<{ orders: Order[] }>('/orders'),
      api.get<{ users: AdminUser[] }>('/users'),
    ]).then(([ordersRes, usersRes]) => {
      if (ordersRes.status === 'fulfilled') {
        const all: Order[] = ordersRes.value.orders || [];
        setOrders(all.filter(o => o.userId === customerId));
      }
      if (usersRes.status === 'fulfilled') {
        const all: AdminUser[] = usersRes.value.users || [];
        setCustomer(all.find(u => u.uid === customerId) ?? null);
      }
    }).finally(() => setLoading(false));
  }, [customerId]);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#1b5e52' }}>
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <button
          onClick={() => navigate('/admin/customers')}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin_customers_back')}
        </button>
        <h2 className="text-xl md:text-2xl font-black text-white mb-1">
          {t('admin_customer_orders_title', { name: customer?.displayName || customer?.email || customerId })}
        </h2>
        <p className="text-sm mb-4 md:mb-6" style={{ color: 'rgba(255,255,255,0.72)' }}>
          {t('admin_customer_orders_subtitle', { count: orders.length })}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-2 md:pt-4 pb-8">
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#1B5E52] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="w-10 h-10 text-[#C5BDB5] mb-3" />
              <p className="text-[#8FA396] font-bold text-sm">{t('admin_customer_orders_empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="text-xs font-bold text-[#8FA396] uppercase tracking-wider border-b border-[#E8E0D5]">
                    <th className="px-6 py-4">{t('admin_col_order_id')}</th>
                    <th className="px-6 py-4">{t('admin_col_restaurant')}</th>
                    <th className="px-6 py-4">{t('admin_col_amount')}</th>
                    <th className="px-6 py-4">{t('admin_col_status')}</th>
                    <th className="px-6 py-4">{t('admin_col_joined')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F0E8]">
                  {orders.map(order => {
                    const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending'];
                    return (
                      <tr key={order.id} className="hover:bg-[#F5F0E8] transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-[#1B1B1B] font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1B1B1B]">
                          {order.restaurantName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#1B5E52]">
                          {TL(order.total ?? order.price ?? 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusCfg.cls}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#8FA396]">
                          {order.createdAt ? formatDate(order.createdAt) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

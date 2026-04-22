import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Store, Package, Truck, BarChart3, Plus,
  Star, UserCircle, Headset, CheckCircle, Edit3, Loader2,
  Hourglass, AlertTriangle,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Order, Bag, Driver, Review, StoreProfile, OperatingHours, ChartDataPoint, OrderStatus } from '@/types';
import { DAY_NAMES_SHORT, ORDER_POLL_INTERVAL } from '@/lib/constants';
import { StatusScreen } from '@/components/shared';

import DashboardTab from './DashboardTab';
import OrdersTab from './OrdersTab';
import InventoryTab from './InventoryTab';
import DriversTab from './DriversTab';
import ReviewsTab from './ReviewsTab';
import ProfileTab from './ProfileTab';
import SupportTab from './SupportTab';

// ── Shared helpers (re-exported from centralized modules) ─────
export { TL } from '@/lib/formatters';
export { StatCard } from '@/components/shared';
export { StatusBadge } from '@/components/shared';
export { STATUS_CONFIG as STATUS_CFG } from '@/lib/constants';

// ── Main component ────────────────────────────────────────────

export default function StorePanel() {
  const { t } = useTranslation();
  const { user } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  // ── Shared state ──
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<Bag[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [storeProfile, setStoreProfile] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Inventory modal trigger (owned here because header button controls it)
  const [showAddPackage, setShowAddPackage] = useState(false);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<StoreProfile | null>(null);
  const [schedule, setSchedule] = useState<OperatingHours[]>([
    { day: 'Monday',    isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Tuesday',   isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Wednesday', isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Thursday',  isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Friday',    isOpen: true,  open: '09:00', close: '23:00' },
    { day: 'Saturday',  isOpen: true,  open: '10:00', close: '23:00' },
    { day: 'Sunday',    isOpen: false, open: '09:00', close: '17:00' },
  ]);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sync editedProfile when storeProfile loads ──
  useEffect(() => {
    if (storeProfile) {
      setEditedProfile(storeProfile);
      if (storeProfile.operatingHours && Array.isArray(storeProfile.operatingHours)) {
        setSchedule(storeProfile.operatingHours);
      }
    }
  }, [storeProfile]);

  // ── Data fetching ──
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try { const res = await api.get('/orders') as { orders?: Order[] }; setOrders(res.orders || []); } catch { /* silent */ }
    };
    const fetchData = async () => {
      try {
        const [ordersRes, bagsRes, driversRes, storeRes] = await Promise.allSettled([
          api.get('/orders'),
          api.get(`/bags?restaurantId=${user.uid}&showAll=true`),
          api.get('/drivers').catch(() => ({ drivers: [] })),
          api.get(`/stores/${user.uid}`).catch(() => null),
        ]);
        if (ordersRes.status === 'fulfilled') setOrders((ordersRes.value as { orders?: Order[] }).orders || []);
        if (bagsRes.status === 'fulfilled') setInventory((bagsRes.value as { bags?: Bag[] }).bags || []);
        if (driversRes.status === 'fulfilled') setDrivers((driversRes.value as { drivers?: Driver[] })?.drivers || []);
        if (storeRes.status === 'fulfilled' && (storeRes.value as { store?: StoreProfile })?.store) {
          setStoreProfile((storeRes.value as { store: StoreProfile }).store);
        }
        const reviewsRes = await api.get(`/reviews?restaurantId=${user.uid}`).catch(() => ({ reviews: [] })) as { reviews?: Review[] };
        setReviews(reviewsRes.reviews || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
    pollingRef.current = setInterval(fetchOrders, ORDER_POLL_INTERVAL);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user]);

  // ── Shared handlers ──
  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    trackingInfo?: { estimatedPickupTime?: string; trackingNotes?: string; deliveryCode?: string }
  ) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status, ...trackingInfo });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, ...trackingInfo } : o));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('rest_toast_status_update_failed');
      toast.error(message);
      throw err;
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !editedProfile) return;
    setIsSavingProfile(true);
    try {
      await api.put(`/stores/${user.uid}`, { ...editedProfile, operatingHours: schedule });
      setStoreProfile({ ...editedProfile, operatingHours: schedule });
      setIsEditingProfile(false);
      toast.success(t('rest_toast_profile_saved'));
    } catch (err) {
      console.error(err);
      toast.error(t('rest_toast_profile_save_failed'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── Derived data ──
  const chartData: ChartDataPoint[] = DAY_NAMES_SHORT.map((day, i) => {
    const dayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).getDay() === (i + 1) % 7);
    return { day, revenue: dayOrders.reduce((acc, o) => acc + (o.price || 0), 0), orders: dayOrders.length };
  });

  const commissionRate = storeProfile?.commissionRate ?? 15;
  const todaySalesGross = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.price || 0), 0);
  const todaySales = todaySalesGross * (1 - commissionRate / 100);
  const activeOrders = orders.filter(o => (['pending', 'preparing', 'ready', 'delivering'] as OrderStatus[]).includes(o.status)).length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  // ── Page header config ──
  const PAGE_TITLES: Record<string, { titleKey: string; subKey: string; icon: React.ReactNode }> = {
    dashboard: { titleKey: 'rest_page_dashboard_title', subKey: 'rest_page_dashboard_sub', icon: <BarChart3 className="w-5 h-5" /> },
    orders:    { titleKey: 'rest_page_orders_title',    subKey: 'rest_page_orders_sub',    icon: <Package className="w-5 h-5" /> },
    inventory: { titleKey: 'rest_page_inventory_title', subKey: 'rest_page_inventory_sub', icon: <Store className="w-5 h-5" /> },
    drivers:   { titleKey: 'rest_page_drivers_title',   subKey: 'rest_page_drivers_sub',   icon: <Truck className="w-5 h-5" /> },
    reviews:   { titleKey: 'rest_page_reviews_title',   subKey: 'rest_page_reviews_sub',   icon: <Star className="w-5 h-5" /> },
    profile:   { titleKey: 'rest_page_profile_title',   subKey: 'rest_page_profile_sub',   icon: <UserCircle className="w-5 h-5" /> },
    support:   { titleKey: 'rest_page_support_title',   subKey: 'rest_page_support_sub',   icon: <Headset className="w-5 h-5" /> },
  };
  const pageCfg = PAGE_TITLES[activeTab] || PAGE_TITLES['dashboard'];
  const page = { title: t(pageCfg.titleKey), sub: t(pageCfg.subKey), icon: pageCfg.icon };

  // ── Loading ──
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1b5e52' }}>
        <Loader2 className="w-8 h-8 text-[#748f2b] animate-spin" />
      </div>
    );
  }

  // ── Under-review / rejected gate ──
  // Keep the `support` tab reachable so owners can message admins while they wait.
  const storeStatus = storeProfile?.status;
  if ((storeStatus === 'pending' || storeStatus === 'rejected') && activeTab !== 'support') {
    const isRejected = storeStatus === 'rejected';
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <StatusScreen
          tone={isRejected ? 'danger' : 'warning'}
          icon={isRejected ? <AlertTriangle className="w-10 h-10" /> : <Hourglass className="w-10 h-10" />}
          title={t(isRejected ? 'store_rejected_title' : 'store_review_title')}
          description={t(isRejected ? 'store_rejected_body' : 'store_review_body')}
          action={{ label: t('store_review_contact'), onClick: () => navigate('/restaurant/support') }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#1b5e52' }}>

      {/* Page header */}
      <div className="px-4 md:px-8 pt-4 md:pt-7 pb-4 md:pb-5 border-b flex items-center justify-between flex-shrink-0 gap-3"
           style={{ backgroundColor: '#1b5e52', borderColor: 'rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
               style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
            {page.icon}
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">{page.title}</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>{page.sub}</p>
          </div>
        </div>

        {/* Tab-specific action buttons */}
        {activeTab === 'inventory' && (
          <button
            onClick={() => setShowAddPackage(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1B5E52] text-white rounded-xl text-sm font-bold hover:bg-[#164d43] transition-colors shadow-sm shadow-[#1B5E52]/20"
          >
            <Plus className="w-4 h-4" /> {t('rest_action_create_package')}
          </button>
        )}
        {activeTab === 'profile' && (
          <button
            onClick={() => isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true)}
            disabled={isSavingProfile}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60 ${
              isEditingProfile
                ? 'bg-[#1B5E52] text-white hover:bg-[#164d43] shadow-sm shadow-[#1B5E52]/20'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {isEditingProfile
              ? isSavingProfile
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('rest_action_saving')}</>
                : <><CheckCircle className="w-4 h-4" /> {t('rest_action_save_changes')}</>
              : <><Edit3 className="w-4 h-4" /> {t('rest_action_edit_profile')}</>
            }
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <AnimatePresence mode="wait">

          {activeTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              reviews={reviews}
              chartData={chartData}
              todaySales={todaySales}
              activeOrders={activeOrders}
              avgRating={avgRating}
              commissionRate={commissionRate}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              inventory={inventory}
              coverImage={storeProfile?.coverImage}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={inventory}
              setInventory={setInventory}
              showAddPackage={showAddPackage}
              setShowAddPackage={setShowAddPackage}
            />
          )}

          {activeTab === 'drivers' && (
            <DriversTab
              drivers={drivers}
              deliveringOrders={orders.filter(o => o.status === 'delivering')}
              storeLocation={storeProfile?.location}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab reviews={reviews} avgRating={avgRating} />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              storeProfile={storeProfile}
              isEditingProfile={isEditingProfile}
              editedProfile={editedProfile}
              setEditedProfile={setEditedProfile}
              schedule={schedule}
              setSchedule={setSchedule}
              logoFileRef={logoFileRef}
              coverFileRef={coverFileRef}
            />
          )}

          {activeTab === 'support' && (
            <SupportTab />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

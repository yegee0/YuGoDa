import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Store, Package, Truck, BarChart3, Plus,
  Star, UserCircle, Headset, CheckCircle, Edit3, Loader2,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import type { Order, Bag, Driver, Review, StoreProfile, OperatingHours, ChartDataPoint, OrderStatus } from '@/types';
import { DAY_NAMES_SHORT, ORDER_POLL_INTERVAL } from '@/lib/constants';

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
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (err) { console.error(err); }
  };

  const handleUpdateProfile = async () => {
    if (!user || !editedProfile) return;
    try {
      await api.put(`/stores/${user.uid}`, { ...editedProfile, operatingHours: schedule });
      setStoreProfile({ ...editedProfile, operatingHours: schedule });
      setIsEditingProfile(false);
    } catch (err) { console.error(err); }
  };

  // ── Derived data ──
  const chartData: ChartDataPoint[] = DAY_NAMES_SHORT.map((day, i) => {
    const dayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).getDay() === (i + 1) % 7);
    return { day, revenue: dayOrders.reduce((acc, o) => acc + (o.price || 0), 0), orders: dayOrders.length };
  });

  const commissionRate = storeProfile?.commissionRate ?? 15;
  const todaySalesGross = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.price || 0), 0);
  const todaySales = todaySalesGross * (1 - commissionRate / 100);
  const activeOrders = orders.filter(o => (['pending', 'preparing', 'ready'] as OrderStatus[]).includes(o.status)).length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

  // ── Page header config ──
  const PAGE_TITLES: Record<string, { title: string; sub: string; icon: React.ReactNode }> = {
    dashboard: { title: 'Dashboard',       sub: 'Overview of your business performance',     icon: <BarChart3 className="w-5 h-5" /> },
    orders:    { title: 'Orders',          sub: 'Manage incoming and active orders',           icon: <Package className="w-5 h-5" /> },
    inventory: { title: 'Inventory',       sub: 'Manage your daily bags and availability',     icon: <Store className="w-5 h-5" /> },
    drivers:   { title: 'Drivers',         sub: 'Track and communicate with your fleet',       icon: <Truck className="w-5 h-5" /> },
    reviews:   { title: 'Reviews',         sub: 'Customer ratings and feedback',               icon: <Star className="w-5 h-5" /> },
    profile:   { title: 'Store Profile',   sub: 'Update your store info and schedule',         icon: <UserCircle className="w-5 h-5" /> },
    support:   { title: 'Support',         sub: 'Contact the admin team for help',             icon: <Headset className="w-5 h-5" /> },
  };
  const page = PAGE_TITLES[activeTab] || PAGE_TITLES['dashboard'];

  // ── Loading ──
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#1A4D2E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {/* Page header */}
      <div className="px-8 pt-7 pb-5 bg-white dark:bg-[#111] border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 text-[#1A4D2E] flex items-center justify-center">
            {page.icon}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{page.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{page.sub}</p>
          </div>
        </div>

        {/* Tab-specific action buttons */}
        {activeTab === 'inventory' && (
          <button
            onClick={() => setShowAddPackage(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A4D2E] text-white rounded-xl text-sm font-bold hover:bg-[#133b23] transition-colors shadow-sm shadow-[#1A4D2E]/20"
          >
            <Plus className="w-4 h-4" /> Create Package
          </button>
        )}
        {activeTab === 'profile' && (
          <button
            onClick={() => isEditingProfile ? handleUpdateProfile() : setIsEditingProfile(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isEditingProfile
                ? 'bg-[#1A4D2E] text-white hover:bg-[#133b23] shadow-sm shadow-[#1A4D2E]/20'
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}
          >
            {isEditingProfile ? <><CheckCircle className="w-4 h-4" /> Save Changes</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-8">
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
            <DriversTab drivers={drivers} />
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

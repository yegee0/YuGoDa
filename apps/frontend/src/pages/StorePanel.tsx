import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Store, Package, Clock, Truck, BarChart3, Plus, Filter,
  MessageSquare, Star, TrendingUp, UserCircle, Trash2, Send,
  Headset, CalendarDays, MapPin, CheckCircle, XCircle,
  ShoppingBag, Zap, Leaf, Edit3, X, Loader2, AlertCircle,
  ArrowUpRight, Users, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

const TL = (n: number) => `₺${(n || 0).toFixed(2)}`;

const CATEGORIES = [
  { id: 'Bakery',     label: 'Bakery',      emoji: '🥐' },
  { id: 'Hot Meals',  label: 'Hot Meals',   emoji: '🍱' },
  { id: 'Groceries',  label: 'Groceries',   emoji: '🛒' },
  { id: 'Café',       label: 'Café',        emoji: '☕' },
  { id: 'Vegan',      label: 'Vegan',       emoji: '🌱' },
  { id: 'Vegetarian', label: 'Vegetarian',  emoji: '🥗' },
  { id: 'Halal',      label: 'Halal',       emoji: '☪️' },
  { id: 'Gluten-Free',label: 'Gluten-Free', emoji: '🌾' },
  { id: 'Sushi',      label: 'Sushi',       emoji: '🍣' },
  { id: 'Pizza',      label: 'Pizza',       emoji: '🍕' },
  { id: 'Desserts',   label: 'Desserts',    emoji: '🍰' },
  { id: 'Smoothies',  label: 'Smoothies',   emoji: '🥤' },
];

const STORE_TYPES = [
  { id: 'Restaurant',   label: 'Restaurant',   emoji: '🍽️' },
  { id: 'Bakery',       label: 'Bakery',        emoji: '🥖' },
  { id: 'Supermarket',  label: 'Supermarket',   emoji: '🏪' },
  { id: 'Café',         label: 'Café',           emoji: '☕' },
  { id: 'Sushi Bar',    label: 'Sushi Bar',      emoji: '🍣' },
  { id: 'Pizzeria',     label: 'Pizzeria',       emoji: '🍕' },
];

const DIETARY_TAGS = ['Vegan', 'Vegetarian', 'Halal', 'Gluten-Free', 'Organic', 'Dairy-Free'];

// Parse "HH:MM - HH:MM" → { start, end }
function parsePickup(t: string) {
  const parts = (t || '').split(' - ');
  return { start: parts[0]?.trim() || '18:00', end: parts[1]?.trim() || '19:00' };
}
function formatPickup(start: string, end: string) { return `${start} - ${end}`; }

// ── Stat card ──────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number;
  icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Order status badge ──────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  preparing: { label: 'Preparing', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
  ready:     { label: 'Ready',     cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG['pending'];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function StorePanel() {
  const { t } = useTranslation();
  const { user, isDarkMode } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [storeProfile, setStoreProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '', description: '', category: 'Bakery',
    price: 5.99, discount: 0, available: 5, pickupTime: '18:00 - 19:00',
  });
  const [addPackageStatus, setAddPackageStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [addPackageError, setAddPackageError] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [editingBag, setEditingBag] = useState<any>(null);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [latestDisputeId, setLatestDisputeId] = useState<string | null>(null);
  const supportPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supportEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const [schedule, setSchedule] = useState([
    { day: 'Monday',    isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Tuesday',   isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Wednesday', isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Thursday',  isOpen: true,  open: '09:00', close: '22:00' },
    { day: 'Friday',    isOpen: true,  open: '09:00', close: '23:00' },
    { day: 'Saturday',  isOpen: true,  open: '10:00', close: '23:00' },
    { day: 'Sunday',    isOpen: false, open: '09:00', close: '17:00' },
  ]);

  useEffect(() => {
    if (storeProfile) {
      setEditedProfile(storeProfile);
      if (storeProfile.operatingHours && Array.isArray(storeProfile.operatingHours)) {
        setSchedule(storeProfile.operatingHours);
      }
    }
  }, [storeProfile]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try { const res = await api.get('/orders'); setOrders(res.orders || []); } catch { /* silent */ }
    };
    const fetchData = async () => {
      try {
        const [ordersRes, bagsRes, driversRes, storeRes] = await Promise.allSettled([
          api.get('/orders'),
          api.get(`/bags?restaurantId=${user.uid}&showAll=true`),
          api.get('/drivers').catch(() => ({ drivers: [] })),
          api.get(`/stores/${user.uid}`).catch(() => null),
        ]);
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.orders || []);
        if (bagsRes.status === 'fulfilled') setInventory(bagsRes.value.bags || []);
        if (driversRes.status === 'fulfilled') setDrivers((driversRes.value as any)?.drivers || []);
        if (storeRes.status === 'fulfilled' && (storeRes.value as any)?.store) {
          setStoreProfile((storeRes.value as any).store);
        }
        const reviewsRes = await api.get(`/reviews?restaurantId=${user.uid}`).catch(() => ({ reviews: [] }));
        setReviews(reviewsRes.reviews || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
    pollingRef.current = setInterval(fetchOrders, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user]);

  useEffect(() => { supportEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [supportMessages]);

  useEffect(() => {
    if (activeTab !== 'support' || !user) return;
    const fetchSupportThread = async () => {
      try {
        const disputesRes = await api.get('/disputes').catch(() => ({ disputes: [] }));
        const disputes: any[] = disputesRes.disputes || [];
        if (disputes.length === 0) return;
        const allMsgs: any[] = [];
        for (const d of disputes) {
          try {
            const msgRes = await api.get(`/disputes/${d.id}/messages`);
            (msgRes.messages || []).forEach((m: any) => allMsgs.push({
              id: m.id, text: m.message,
              sender: m.senderRole === 'admin' ? 'admin' : 'restaurant',
              time: new Date(m.createdAt).toLocaleTimeString(),
              createdAt: m.createdAt,
            }));
          } catch { /* silent */ }
        }
        allMsgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        if (allMsgs.length > 0) setSupportMessages(allMsgs);
        const sorted = [...disputes].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestDisputeId(sorted[0].id);
      } catch { /* silent */ }
    };
    fetchSupportThread();
    supportPollingRef.current = setInterval(fetchSupportThread, 10000);
    return () => { if (supportPollingRef.current) clearInterval(supportPollingRef.current); };
  }, [activeTab, user]);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
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

  const handleUpdatePackage = async () => {
    if (!editingBag) return;
    try {
      await api.put(`/bags/${editingBag.id}`, editingBag);
      setInventory(inventory.map(b => b.id === editingBag.id ? editingBag : b));
      setEditingBag(null);
    } catch (err) { console.error(err); }
  };

  const handleAddPackage = async () => {
    if (!user) return;
    setAddPackageStatus('loading');
    setAddPackageError('');
    try {
      const data = await api.post('/bags', {
        category: newPackage.category,
        description: newPackage.description || newPackage.name || newPackage.category,
        price: newPackage.price,
        originalPrice: parseFloat((newPackage.price * 3).toFixed(2)),
        discount: newPackage.discount,
        available: newPackage.available,
        pickupTime: newPackage.pickupTime,
        merchantType: newPackage.category,
      });
      if (data.bag) setInventory(prev => [data.bag, ...prev]);
      setAddPackageStatus('success');
      setTimeout(() => {
        setShowAddPackage(false);
        setAddPackageStatus('idle');
        setNewPackage({ name: '', description: '', category: 'Bakery', price: 5.99, discount: 0, available: 5, pickupTime: '18:00 - 19:00' });
      }, 1200);
    } catch (error: any) {
      setAddPackageStatus('error');
      setAddPackageError(error?.message || 'Failed to create package.');
    }
  };

  const handleDeletePackage = async (id: string) => {
    try { await api.delete(`/bags/${id}`); setInventory(inventory.filter(p => p.id !== id)); }
    catch (err) { console.error(err); }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportInput.trim()) return;
    const text = supportInput.trim();
    const now = new Date().toISOString();
    setSupportMessages(prev => [...prev, { id: Date.now(), text, sender: 'restaurant', time: new Date(now).toLocaleTimeString(), createdAt: now }]);
    setSupportInput('');
    try {
      const res = await api.post('/disputes', { subject: 'Partner Support Request', message: text, priority: 'medium' });
      if (res.dispute?.id) setLatestDisputeId(res.dispute.id);
    } catch (err) { console.error(err); }
  };

  const chartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
    const dayOrders = orders.filter(o => o.createdAt && new Date(o.createdAt).getDay() === (i + 1) % 7);
    return { day, revenue: dayOrders.reduce((acc: number, o: any) => acc + (o.price || 0), 0), orders: dayOrders.length };
  });

  const tooltipStyle = {
    backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
    borderColor: isDarkMode ? '#2a2a2a' : '#F3F4F6',
    color: isDarkMode ? '#FFFFFF' : '#111827',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  };

  const displayOrders = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const todaySales = orders.filter(o => o.status === 'delivered').reduce((acc, o) => acc + (o.price || 0), 0);
  const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1) : '—';

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

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors';
  const selectCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1A4D2E] transition-colors';
  const labelCls = 'text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block';

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#1A4D2E] animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">

      {/* ── Page header ── */}
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

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">

          {/* ═══════ DASHBOARD ═══════ */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Today's Revenue"   value={TL(todaySales)}     icon={<DollarSign className="w-5 h-5" />}  color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" sub="Delivered orders" />
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
          )}

          {/* ═══════ ORDERS ═══════ */}
          {activeTab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Filter + stat */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-xl p-1 shadow-sm">
                  {['all', 'pending', 'preparing', 'ready', 'delivered', 'cancelled'].map(f => (
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
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'preparing')} className="px-4 py-2 bg-[#1A4D2E] text-white rounded-xl text-xs font-bold hover:bg-[#133b23] transition-colors">
                                Accept
                              </button>
                              <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                Decline
                              </button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'ready')} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'ready' && (
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'delivered')} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ INVENTORY ═══════ */}
          {activeTab === 'inventory' && (
            <motion.div key="inventory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Active Bags"  value={inventory.filter(b => b.available > 0).length} icon={<Store className="w-5 h-5" />}   color="bg-[#1A4D2E]/10 text-[#1A4D2E]" />
                <StatCard label="Total Listed" value={inventory.length}                               icon={<Package className="w-5 h-5" />}  color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                <StatCard label="Sold Out"     value={inventory.filter(b => b.available === 0).length} icon={<Zap className="w-5 h-5" />}    color="bg-red-50 dark:bg-red-900/20 text-red-500" />
                <StatCard label="Food Saved"   value="42 kg"                                          icon={<Leaf className="w-5 h-5" />}    color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
              </div>

              {inventory.length === 0 ? (
                <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
                  <Store className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
                  <p className="font-bold text-gray-400 text-sm">No active listings</p>
                  <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Create your first surprise bag to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {inventory.map(bag => {
                    const discountPct = bag.discount > 0 ? bag.discount
                      : (bag.originalPrice > bag.price ? Math.round((1 - bag.price / bag.originalPrice) * 100) : 0);
                    return (
                      <div key={bag.id} className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm group">
                        <div className="relative h-32 bg-gradient-to-br from-[#1A4D2E]/10 to-[#1A4D2E]/5 overflow-hidden">
                          <img
                            src={bag.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80'}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {discountPct > 0 && (
                            <div className="absolute top-2 right-2 bg-[#1A4D2E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                              -{discountPct}%
                            </div>
                          )}
                          {bag.available === 0 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-black text-xs bg-black/60 px-3 py-1 rounded-full">Sold Out</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{bag.category} Bag</h4>
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                                <Clock className="w-3 h-3" /> {bag.pickupTime}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-[#1A4D2E] text-base">{TL(bag.price * (1 - (bag.discount || 0) / 100))}</p>
                              {bag.discount > 0 && <p className="text-xs line-through text-gray-300">{TL(bag.price)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-white/5">
                            <span className={`text-xs font-bold ${bag.available > 2 ? 'text-gray-500' : bag.available > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                              {bag.available} left
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingBag({ ...bag })}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 text-[#1A4D2E] hover:bg-[#1A4D2E]/15 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeletePackage(bag.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ DRIVERS ═══════ */}
          {activeTab === 'drivers' && (
            <motion.div key="drivers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              {drivers.length === 0 ? (
                <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
                  <Truck className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
                  <p className="font-bold text-gray-400 text-sm">No active drivers</p>
                </div>
              ) : (
                drivers.map(driver => (
                  <div key={driver.id} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#1A4D2E] text-white flex items-center justify-center font-black text-lg">
                        {(driver.name || 'D').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{driver.name}</h4>
                        <p className="text-xs text-gray-400">{driver.vehicleInfo} · <span className="capitalize">{driver.status}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 mb-0.5">Rating</p>
                        <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
                          <Star className="w-3 h-3 fill-amber-500" /> {driver.rating || '5.0'}
                        </div>
                      </div>
                      <button className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-[#1A4D2E] hover:bg-[#1A4D2E]/10 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ═══════ REVIEWS ═══════ */}
          {activeTab === 'reviews' && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Average Rating" value={`${avgRating} / 5.0`} icon={<Star className="w-5 h-5" />}        color="bg-amber-50 dark:bg-amber-900/20 text-amber-500" />
                <StatCard label="Total Reviews"  value={reviews.length}       icon={<MessageSquare className="w-5 h-5" />} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
                <StatCard
                  label="5-Star Reviews"
                  value={reviews.filter(r => r.rating === 5).length}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                  sub={`${reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === 5).length / reviews.length) * 100) : 0}%`}
                />
              </div>

              {reviews.length === 0 ? (
                <div className="bg-white dark:bg-[#111] rounded-2xl py-16 text-center border-2 border-dashed border-gray-100 dark:border-white/5">
                  <MessageSquare className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
                  <p className="font-bold text-gray-400 text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#1A4D2E]/10 text-[#1A4D2E] font-black text-sm flex items-center justify-center">
                            {(review.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{review.userName || 'Anonymous'}</p>
                            <p className="text-[10px] text-gray-400">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-white/10'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════ SUPPORT ═══════ */}
          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                {/* Chat header */}
                <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                    <Headset className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Admin Support Team</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <p className="text-xs text-gray-400">Typically replies in a few minutes</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-black/20">
                  {supportMessages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%] bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-2xl rounded-tl-none p-4 shadow-sm">
                        <p className="text-sm dark:text-white">Welcome to Partner Support! How can we help you today?</p>
                      </div>
                    </div>
                  )}
                  {supportMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'restaurant' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        msg.sender === 'restaurant'
                          ? 'bg-[#1A4D2E] text-white rounded-tr-none'
                          : 'bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 dark:text-white rounded-tl-none shadow-sm'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <span className={`text-[10px] mt-1.5 block ${msg.sender === 'restaurant' ? 'text-white/60' : 'text-gray-400'}`}>{msg.time}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={supportEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#111]">
                  <form onSubmit={handleSendSupport} className="flex gap-3">
                    <input
                      type="text"
                      value={supportInput}
                      onChange={e => setSupportInput(e.target.value)}
                      placeholder="Type your message to the admin team…"
                      className="flex-1 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 text-sm dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 border border-transparent focus:border-[#1A4D2E]/20"
                    />
                    <button
                      type="submit"
                      disabled={!supportInput.trim()}
                      className="w-11 h-11 bg-[#1A4D2E] text-white rounded-xl flex items-center justify-center hover:bg-[#133b23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-[#1A4D2E]/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ PROFILE ═══════ */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl space-y-5">

              {/* Store identity */}
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] overflow-hidden">
                      {(isEditingProfile ? editedProfile?.logo : storeProfile?.logo) ? (
                        <img src={isEditingProfile ? editedProfile.logo : storeProfile.logo} alt="logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Store className="w-8 h-8" />
                      )}
                    </div>
                    {isEditingProfile && (
                      <>
                        <button
                          type="button"
                          onClick={() => logoFileRef.current?.click()}
                          className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#1A4D2E] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#133b23] transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <input ref={logoFileRef} type="file" accept="image/*" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => setEditedProfile({ ...editedProfile, logo: reader.result as string });
                            reader.readAsDataURL(file);
                          }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editedProfile?.name || ''}
                        onChange={e => setEditedProfile({ ...editedProfile, name: e.target.value })}
                        className={inputCls}
                        placeholder="Store name"
                      />
                    ) : (
                      <>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">{storeProfile?.name || 'My Store'}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{storeProfile?.category || 'Restaurant'}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Cover image */}
                <div className="mb-4">
                  <label className={labelCls}>Cover Image <span className="normal-case font-normal text-gray-400">(shown on Discover &amp; store page)</span></label>
                  <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1A4D2E]/10 to-[#1A4D2E]/5 border-2 border-dashed border-gray-200 dark:border-white/10">
                    {(isEditingProfile ? editedProfile?.coverImage : storeProfile?.coverImage) ? (
                      <img
                        src={isEditingProfile ? editedProfile.coverImage : storeProfile.coverImage}
                        alt="cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                        <ShoppingBag className="w-8 h-8 opacity-30" />
                        <span className="text-xs">No cover image</span>
                      </div>
                    )}
                    {isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => coverFileRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-sm gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Change Photo
                      </button>
                    )}
                  </div>
                  <input ref={coverFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setEditedProfile({ ...editedProfile, coverImage: reader.result as string });
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Address</label>
                    {isEditingProfile ? (
                      <input type="text" value={editedProfile?.address || ''} onChange={e => setEditedProfile({ ...editedProfile, address: e.target.value })} className={inputCls} placeholder="Store address" />
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" /> {storeProfile?.address || 'Not set'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    {isEditingProfile ? (
                      <textarea rows={2} value={editedProfile?.description || ''} onChange={e => setEditedProfile({ ...editedProfile, description: e.target.value })} className={`${inputCls} resize-none`} placeholder="Describe your store" />
                    ) : (
                      <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {storeProfile?.description || 'No description'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dietary tags */}
                <div className="pt-2">
                  <label className={labelCls}>Dietary Options</label>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_TAGS.map(tag => {
                      const active = (isEditingProfile ? editedProfile?.dietaryTags : storeProfile?.dietaryTags || [])?.includes(tag);
                      return (
                        <button key={tag} type="button"
                          disabled={!isEditingProfile}
                          onClick={() => {
                            const current: string[] = editedProfile?.dietaryTags || [];
                            setEditedProfile({
                              ...editedProfile,
                              dietaryTags: active ? current.filter((t: string) => t !== tag) : [...current, tag],
                            });
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                            active
                              ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                              : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400'
                          } ${!isEditingProfile ? 'cursor-default' : 'hover:border-[#1A4D2E]/40 cursor-pointer'}`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-white dark:bg-[#111] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <CalendarDays className="w-4 h-4 text-[#1A4D2E]" />
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Weekly Schedule</h4>
                </div>
                <div className="space-y-2">
                  {schedule.map((slot, index) => {
                    if (!isEditingProfile && !slot.isOpen) return null;
                    return (
                      <div key={slot.day} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        slot.isOpen
                          ? 'bg-gray-50 dark:bg-white/3 border-gray-100 dark:border-white/5'
                          : 'bg-gray-50/50 dark:bg-black/10 border-gray-50 dark:border-white/3 opacity-60'
                      }`}>
                        <div className="flex items-center gap-3 w-36">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={slot.isOpen} disabled={!isEditingProfile}
                              onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, isOpen: e.target.checked } : s))}
                            />
                            <div className="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A4D2E]" />
                          </label>
                          <span className={`font-bold text-sm ${slot.isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{slot.day.slice(0, 3)}</span>
                        </div>
                        {slot.isOpen ? (
                          <div className="flex items-center gap-2">
                            <input type="time" value={slot.open} disabled={!isEditingProfile}
                              onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, open: e.target.value } : s))}
                              className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:border-[#1A4D2E] disabled:opacity-70"
                            />
                            <span className="text-gray-400 text-sm">—</span>
                            <input type="time" value={slot.close} disabled={!isEditingProfile}
                              onChange={e => setSchedule(schedule.map((s, i) => i === index ? { ...s, close: e.target.value } : s))}
                              className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm font-bold dark:text-white outline-none focus:border-[#1A4D2E] disabled:opacity-70"
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-bold">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Edit Bag Modal ── */}
      <AnimatePresence>
        {editingBag && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingBag(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Edit Package</h3>
                <button onClick={() => setEditingBag(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={editingBag.category} onChange={e => setEditingBag({ ...editingBag, category: e.target.value })} className={selectCls}>
                    {['Bakery','Vegan','Groceries','Hot Meals','Café','Halal','Gluten-Free','Desserts'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (₺)</label>
                    <input type="number" value={editingBag.price} onChange={e => setEditingBag({ ...editingBag, price: parseFloat(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Available</label>
                    <input type="number" value={editingBag.available} onChange={e => setEditingBag({ ...editingBag, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pickup Time</label>
                  <input type="text" value={editingBag.pickupTime || ''} onChange={e => setEditingBag({ ...editingBag, pickupTime: e.target.value })} className={inputCls} placeholder="18:00 - 19:00" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingBag(null)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">Cancel</button>
                <button onClick={handleUpdatePackage} className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#133b23] transition-colors">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Add Package Modal ── */}
      <AnimatePresence>
        {showAddPackage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }} />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md relative z-10 p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-gray-900 dark:text-white text-lg">Create Package</h3>
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {addPackageStatus === 'success' && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Package created!
                </div>
              )}
              {addPackageStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {addPackageError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Package Name</label>
                  <input type="text" placeholder="e.g. Today's Surprise Bag" value={newPackage.name} onChange={e => setNewPackage({ ...newPackage, name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <textarea placeholder="What's inside? (optional)" value={newPackage.description} onChange={e => setNewPackage({ ...newPackage, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={newPackage.category} onChange={e => setNewPackage({ ...newPackage, category: e.target.value })} className={selectCls}>
                    {['Bakery','Vegan','Groceries','Hot Meals','Café','Halal','Gluten-Free','Desserts'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Price (₺)</label>
                    <input type="number" value={newPackage.price} onChange={e => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Discount %</label>
                    <input type="number" min={0} max={100} value={newPackage.discount} onChange={e => setNewPackage({ ...newPackage, discount: parseInt(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Available</label>
                    <input type="number" value={newPackage.available} onChange={e => setNewPackage({ ...newPackage, available: parseInt(e.target.value) })} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Pickup Time</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={parsePickup(newPackage.pickupTime).start}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(e.target.value, parsePickup(newPackage.pickupTime).end) })}
                      className={inputCls} />
                    <span className="text-gray-400 font-bold flex-shrink-0">—</span>
                    <input type="time" value={parsePickup(newPackage.pickupTime).end}
                      onChange={e => setNewPackage({ ...newPackage, pickupTime: formatPickup(parsePickup(newPackage.pickupTime).start, e.target.value) })}
                      className={inputCls} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setShowAddPackage(false); setAddPackageStatus('idle'); setAddPackageError(''); }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl font-bold">
                  Cancel
                </button>
                <button onClick={handleAddPackage} disabled={addPackageStatus === 'loading' || addPackageStatus === 'success'}
                  className="flex-1 py-3 bg-[#1A4D2E] text-white rounded-xl font-bold hover:bg-[#133b23] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {addPackageStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Package'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

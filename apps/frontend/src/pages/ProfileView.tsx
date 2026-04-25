import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  User, Mail, Phone, Globe, MapPin, Camera, Save,
  Trash2, CheckCircle2, Wallet, Plus, Home, Briefcase,
  Heart, MoreHorizontal, Bell, X, Building2, Pencil,
  ShoppingBag, Clock, Package, CheckCircle, XCircle, Loader2, Truck,
  Star, ChevronDown
} from 'lucide-react';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Address, Order, CartItem, StoreProfile, UserProfile } from '@/types';

type Tab = 'profile' | 'addresses' | 'orders' | 'settings';

const TAG_ICON: Record<string, React.ReactNode> = {
  home:    <Home      className="w-4 h-4" />,
  work:    <Briefcase className="w-4 h-4" />,
  partner: <Heart     className="w-4 h-4" />,
  other:   <MoreHorizontal className="w-4 h-4" />,
};

const TAG_LABEL: Record<string, string> = {
  home: 'Home', work: 'Work', partner: 'Partner', other: 'Other',
};

export default function ProfileView() {
  const { t, i18n } = useTranslation();
  const { userProfile, setUserProfile, orders, setOrders, isAuthReady } = useStore();
  const [searchParams] = useSearchParams();
  const initialTab = (['profile', 'addresses', 'orders', 'settings'] as Tab[])
    .includes(searchParams.get('tab') as Tab)
    ? (searchParams.get('tab') as Tab)
    : 'profile';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [editingAddrIndex, setEditingAddrIndex] = useState<number | null>(null);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [inlineRating, setInlineRating] = useState(5);
  const [inlineComment, setInlineComment] = useState('');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  /** Store locations keyed by restaurantId — fetched on-demand for delivery ETA. */
  const [storeLocations, setStoreLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  /** Ticked every 30 s so delivery arrival times stay current. */
  const [now, setNow] = useState(() => new Date());

  const [formData, setFormData] = useState({
    firstName:    userProfile?.firstName    || '',
    lastName:     userProfile?.lastName     || '',
    displayName:  userProfile?.displayName  || '',
    email:        userProfile?.email        || '',
    countryCode:  userProfile?.countryCode  || '+90',
    mobileNumber: userProfile?.mobileNumber || '',
  });

  // Re-sync the form whenever userProfile lands a fresh value (DB GET, post-save
  // refresh, photo upload, etc.). Skipped while the user is actively editing so
  // we never clobber in-progress typing. Without this, a profile loaded after
  // ProfileView already mounted (common on Google redirect, where the page
  // reloads with auth state still resolving) would leave the form snapshotted
  // against the optimistic stub and submit stale values on save.
  useEffect(() => {
    if (isEditing || !userProfile) return;
    setFormData({
      firstName:    userProfile.firstName    || '',
      lastName:     userProfile.lastName     || '',
      displayName:  userProfile.displayName  || '',
      email:        userProfile.email        || '',
      countryCode:  userProfile.countryCode  || '+90',
      mobileNumber: userProfile.mobileNumber || '',
    });
  }, [userProfile, isEditing]);

  /* ── Handlers ─────────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      // DB is the source of truth for all profile fields, including email — the
      // Firebase auth identity stays as the OAuth login anchor and is decoupled
      // from this user-facing email column.
      const data = await api.put<{ success: boolean; user: UserProfile }>('/users/me', formData);
      // Use the backend's enriched response directly instead of merging with client formData —
      // prevents drift when the server normalizes/derives fields.
      if (data?.user) {
        setUserProfile(data.user);
      }
      setIsEditing(false);
      toast.success(t('profile_save_success'));
    } catch {
      toast.error(t('profile_save_failed'));
      // Do NOT flip isEditing off and do NOT mutate userProfile — let the user retry with their edits intact.
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setUserProfile({ ...userProfile, photoURL: base64 });
      api.put('/users/me', { photoURL: base64 }).catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAddress = (index: number) => {
    if (!userProfile) return;
    const updated = userProfile.addresses.filter((_, i) => i !== index);
    setUserProfile({ ...userProfile, addresses: updated });
    try { api.put('/users/me', { addresses: updated }).catch(() => {}); } catch {}
    toast.success(t('profile_address_removed'));
  };

  const openEditAddress = (index: number) => {
    setEditingAddrIndex(index);
    setEditingAddr({ ...userProfile!.addresses[index] });
  };

  const handleSaveEditedAddress = () => {
    if (!userProfile || editingAddrIndex === null) return;
    const updated = userProfile.addresses.map((a: Address, i: number) =>
      i === editingAddrIndex ? editingAddr! : a
    );
    setUserProfile({ ...userProfile, addresses: updated });
    try { api.put('/users/me', { addresses: updated }).catch(() => {}); } catch {}
    toast.success(t('profile_address_updated'));
    setEditingAddrIndex(null);
    setEditingAddr(null);
  };

  const handleTopUp = async () => {
    if (!userProfile) return;
    const newBalance = (userProfile.walletBalance || 0) + topUpAmount;
    setUserProfile({ ...userProfile, walletBalance: newBalance });
    api.put('/users/me', { walletBalance: newBalance }).catch(() => {});
    setShowWalletModal(false);
    toast.success(t('profile_wallet_topup_success', { amount: topUpAmount }));
  };

  const handleNotificationToggle = () => {
    if (!userProfile) return;
    const newValue = !userProfile.notificationsEnabled;
    setUserProfile({ ...userProfile, notificationsEnabled: newValue });
    api.put('/users/me', { notificationsEnabled: newValue }).catch(() => {});
  };

  const handleLanguageChange = (lang: string) => {
    if (!userProfile) return;
    i18n.changeLanguage(lang);
    setUserProfile({ ...userProfile, preferredLanguage: lang });
    api.put('/users/me', { preferredLanguage: lang }).catch(() => {});
  };

  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'orders' || !isAuthReady) return;
    setOrdersLoading(true);
    api.get('/orders').then((data: { orders?: Order[] }) => {
      setOrders(data.orders || []);
    }).catch(() => {
      toast.error(t('profile_orders_load_failed'));
    }).finally(() => setOrdersLoading(false));
  }, [tab, isAuthReady, setOrders]);

  // Fetch store locations for any 'delivering' orders so we can compute Haversine ETA.
  useEffect(() => {
    if (tab !== 'orders') return;
    const ids = [...new Set(
      orders
        .filter(o => o.status === 'delivering' && o.restaurantId && o.deliveryLat && o.deliveryLng)
        .map(o => o.restaurantId!)
        .filter(id => !storeLocations[id])
    )];
    ids.forEach(id => {
      api.get(`/stores/${id}`)
        .then((data: { store?: StoreProfile }) => {
          const loc = data.store?.location;
          if (loc) setStoreLocations(prev => ({ ...prev, [id]: loc }));
        })
        .catch(() => {});
    });
  }, [orders, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick every 30 s while any order is out for delivery so the arrival time stays fresh.
  useEffect(() => {
    const hasDelivering = orders.some(o => o.status === 'delivering');
    if (!hasDelivering) return;
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, [orders]);

  const computeETA = (pickupTime: string): string => {
    try {
      const [h, m] = pickupTime.split(':').map(Number);
      const base = new Date();
      const pickup = new Date(base);
      pickup.setHours(h, m, 0, 0);
      const diffMs = pickup.getTime() - base.getTime();
      if (diffMs <= 0) return 'Soon';
      const mins = Math.round(diffMs / 60000);
      if (mins < 60) return `~${mins} min`;
      const hours = Math.floor(mins / 60);
      const rem = mins % 60;
      return rem > 0 ? `~${hours}h ${rem}m` : `~${hours}h`;
    } catch { return ''; }
  };

  /** Haversine great-circle distance in km (same algorithm as DriversTab). */
  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  /**
   * For a 'delivering' order: compute the expected arrival clock time ("HH:MM")
   * by taking the Haversine distance (store → customer) ÷ 30 km/h and adding
   * that duration to the current time (`now` state ticks every 30 s).
   */
  const computeDeliveryArrival = (order: Order): string | null => {
    if (!order.deliveryLat || !order.deliveryLng || !order.restaurantId) return null;
    const storeLoc = storeLocations[order.restaurantId];
    if (!storeLoc) return null;
    const distKm = haversineKm(storeLoc.lat, storeLoc.lng, order.deliveryLat, order.deliveryLng);
    const etaMins = Math.max(1, Math.round((distKm / 30) * 60));
    const arrival = new Date(now.getTime() + etaMins * 60000);
    return `${String(arrival.getHours()).padStart(2, '0')}:${String(arrival.getMinutes()).padStart(2, '0')}`;
  };

  const handleInlineReview = async (order: Order) => {
    if (!order.restaurantId || inlineSubmitting) return;
    setInlineSubmitting(true);
    try {
      await api.post('/reviews', {
        restaurantId: order.restaurantId,
        orderId: order.id,
        rating: inlineRating,
        comment: inlineComment,
      });
      setReviewedOrderIds(prev => new Set(prev).add(order.id));
      setExpandedOrderId(null);
      setInlineRating(5);
      setInlineComment('');
      toast.success(t('Review submitted'));
    } catch {
      toast.error(t('profile_review_submit_failed'));
    } finally {
      setInlineSubmitting(false);
    }
  };

  const initials =
    userProfile?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ||
    userProfile?.email?.charAt(0).toUpperCase() || '?';

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="h-full overflow-y-auto relative z-[1]" style={{ backgroundColor: '#1b5e52' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

        {/* ── Hero card ── */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E8E0D5]">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[#1B5E52] to-[#2d7a6a]" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[#1B5E52] border-4 border-white flex items-center justify-center text-white text-2xl font-black shadow-xl overflow-hidden">
                  {userProfile?.photoURL
                    ? <img src={userProfile.photoURL} alt="avatar" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md border border-[#E8E0D5] flex items-center justify-center text-[#1B5E52]"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Wallet chip */}
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1B5E52]/10 rounded-full hover:bg-[#1B5E52]/15 transition-colors"
              >
                <Wallet className="w-4 h-4 text-[#1B5E52]" />
                <span className="font-black text-[#1B5E52] text-sm">₺{(userProfile?.walletBalance || 0).toFixed(2)}</span>
                <Plus className="w-3.5 h-3.5 text-[#1B5E52]" />
              </button>
            </div>

            <h2 className="font-black text-xl text-[#1B1B1B] leading-none">{userProfile?.displayName || 'User'}</h2>
            <p className="text-sm text-[#8FA396] font-medium mt-0.5">{userProfile?.email}</p>
            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest bg-[#F5F0E8] text-[#5C6B63] px-2.5 py-1 rounded-full">
              {userProfile?.role || 'customer'}
            </span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-sm border border-[#E8E0D5] overflow-x-auto">
          {(['profile', 'addresses', 'orders', 'settings'] as Tab[]).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 min-w-0 py-2.5 rounded-xl text-xs md:text-sm font-black capitalize transition-all whitespace-nowrap ${
                tab === tabKey
                  ? 'bg-[#1B5E52] text-white shadow-sm'
                  : 'text-[#8FA396] hover:text-[#5C6B63]'
              }`}
            >
              {tabKey === 'profile' ? t('profile_tab_profile') : tabKey === 'addresses' ? t('profile_tab_addresses') : tabKey === 'orders' ? t('profile_tab_orders') : t('profile_tab_settings')}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >

            {/* ══ PROFILE TAB ══ */}
            {tab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#1B1B1B]">{t('profile_personal_info')}</h3>
                  <button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isEditing
                        ? 'bg-[#1B5E52] text-white'
                        : 'bg-[#F5F0E8] text-[#5C6B63]'
                    }`}
                  >
                    {isEditing ? <><Save className="w-4 h-4" /> {saving ? t('profile_saving') : t('profile_save')}</> : <><User className="w-4 h-4" /> {t('profile_edit')}</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: t('profile_first_name'),   key: 'firstName',   icon: User,  type: 'text',  placeholder: 'John' },
                    { label: t('profile_last_name'),    key: 'lastName',    icon: User,  type: 'text',  placeholder: 'Doe' },
                    { label: t('profile_display_name'), key: 'displayName', icon: User,  type: 'text',  placeholder: 'johndoe' },
                  ].map(({ label, key, icon: Icon, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0BDB7]" />
                        <input
                          type={type}
                          disabled={!isEditing}
                          value={formData[key as keyof typeof formData]}
                          onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] disabled:opacity-50 transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">{t('profile_email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0BDB7]" />
                      <input
                        type="email"
                        disabled={!isEditing}
                        value={formData.email}
                        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] disabled:opacity-50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">{t('profile_phone')}</label>
                  <div className="flex gap-2">
                    <select
                      disabled={!isEditing}
                      value={formData.countryCode}
                      onChange={e => setFormData(f => ({ ...f, countryCode: e.target.value }))}
                      className="px-3 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] focus:outline-none focus:border-[#1B5E52] disabled:opacity-50"
                    >
                      <option value="+90">🇹🇷 +90</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0BDB7]" />
                      <input
                        type="tel" disabled={!isEditing}
                        value={formData.mobileNumber}
                        onChange={e => setFormData(f => ({ ...f, mobileNumber: e.target.value }))}
                        placeholder="5XX XXX XX XX"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] disabled:opacity-50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ ADDRESSES TAB ══ */}
            {tab === 'addresses' && (
              <div className="space-y-3">
                {(!userProfile?.addresses || userProfile.addresses.length === 0) ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                    <MapPin className="w-10 h-10 text-[#B0BDB7] mx-auto mb-3" />
                    <p className="font-bold text-[#8FA396] text-sm">{t('profile_no_addresses')}</p>
                    <p className="text-xs text-[#B0BDB7] mt-1">{t('profile_add_address_hint')}</p>
                  </div>
                ) : (
                  userProfile.addresses.map((addr: Address, i: number) => {
                    const tag = addr.tag || 'other';
                    const label = addr.addressLabel || addr.label || t('profile_saved_address');
                    const details = [addr.apartment, addr.floor && `${t('profile_floor_prefix')} ${addr.floor}`, addr.unit && `${t('profile_unit_prefix')} ${addr.unit}`]
                      .filter(Boolean).join(' · ');
                    const isEditingThis = editingAddrIndex === i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden"
                      >
                        {/* Card header — always visible */}
                        <div className="p-4 flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tag === 'home'    ? 'bg-blue-50   text-blue-500'   :
                            tag === 'work'    ? 'bg-purple-50 text-purple-500' :
                            tag === 'partner' ? 'bg-pink-50   text-pink-500'   :
                            'bg-[#F5F0E8] text-[#8FA396]'
                          }`}>
                            {TAG_ICON[tag]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-[#1B1B1B] text-sm">{label}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-[#8FA396] bg-[#F5F0E8] px-2 py-0.5 rounded-full">
                                {t(`profile_tag_${tag}`)}
                              </span>
                            </div>
                            {details && <p className="text-xs text-[#8FA396]">{details}</p>}
                            {addr.phone && (
                              <p className="text-xs text-[#8FA396] mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{addr.phone}
                              </p>
                            )}
                            {addr.company && (
                              <p className="text-xs text-[#8FA396] mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />{addr.company}
                              </p>
                            )}
                            {addr.deliveryNote && (
                              <p className="text-xs text-[#8FA396] mt-1 italic">"{addr.deliveryNote}"</p>
                            )}
                          </div>
                          {/* Change + Delete buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => isEditingThis ? (setEditingAddrIndex(null), setEditingAddr(null)) : openEditAddress(i)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isEditingThis
                                  ? 'bg-[#F5F0E8] text-[#8FA396]'
                                  : 'bg-[#1B5E52]/10 text-[#1B5E52] hover:bg-[#1B5E52]/15'
                              }`}
                            >
                              <Pencil className="w-3 h-3" />
                              {isEditingThis ? t('Cancel') : t('profile_addr_change')}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(i)}
                              className="p-1.5 text-[#B0BDB7] hover:text-red-400 transition-colors rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline edit form */}
                        <AnimatePresence>
                          {isEditingThis && editingAddr && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-[#E8E0D5]"
                            >
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { key: 'addressLabel', label: t('profile_addr_label_field'), placeholder: t('profile_addr_neighbourhood_ph') },
                                    { key: 'apartment',    label: t('profile_addr_apartment'),   placeholder: t('profile_addr_building_ph') },
                                    { key: 'unit',         label: t('profile_addr_unit'),        placeholder: t('profile_addr_no_ph') },
                                    { key: 'floor',        label: t('profile_addr_floor'),       placeholder: t('profile_addr_floor_ph') },
                                    { key: 'company',      label: t('profile_addr_company'),     placeholder: t('profile_addr_optional_ph') },
                                    { key: 'phone',        label: t('profile_addr_phone'),       placeholder: '+90 5XX…' },
                                  ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                      <label className="text-[10px] font-bold text-[#8FA396] uppercase tracking-wide mb-1 block">{label}</label>
                                      <input
                                        type="text"
                                        value={editingAddr[key] || ''}
                                        onChange={e => setEditingAddr(a => a ? { ...a, [key]: e.target.value } : a)}
                                        placeholder={placeholder}
                                        className="w-full px-3 py-2 rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] text-xs text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] transition-colors"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-[#8FA396] uppercase tracking-wide mb-1 block">{t('profile_delivery_note')}</label>
                                  <textarea
                                    rows={2}
                                    value={editingAddr.deliveryNote || ''}
                                    onChange={e => setEditingAddr(a => a ? { ...a, deliveryNote: e.target.value } : a)}
                                    placeholder={t('profile_delivery_note_ph')}
                                    className="w-full px-3 py-2 rounded-lg bg-[#F5F0E8] border border-[#E8E0D5] text-xs text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] transition-colors resize-none"
                                  />
                                </div>
                                {/* Tag selector */}
                                <div className="flex gap-2">
                                  {(['home','work','partner','other'] as const).map(tagType => (
                                    <button
                                      key={tagType}
                                      type="button"
                                      onClick={() => setEditingAddr(a => a ? { ...a, tag: tagType } : a)}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                                        editingAddr.tag === tagType
                                          ? 'bg-[#1B5E52] border-[#1B5E52] text-white'
                                          : 'bg-[#F5F0E8] border-[#E8E0D5] text-[#8FA396]'
                                      }`}
                                    >
                                      {TAG_ICON[tagType]}
                                      {t(`profile_tag_${tagType}`)}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={handleSaveEditedAddress}
                                  className="w-full py-2.5 bg-[#1B5E52] text-white rounded-xl text-sm font-bold hover:bg-[#164d43] transition-colors"
                                >
                                  {t('profile_addr_save')}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* ══ ORDERS TAB ══ */}
            {tab === 'orders' && (
              <div className="space-y-3">
                {ordersLoading ? (
                  <div className="bg-white rounded-3xl p-12 flex items-center justify-center shadow-sm">
                    <Loader2 className="w-8 h-8 text-[#1B5E52] animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                    <ShoppingBag className="w-10 h-10 text-[#B0BDB7] mx-auto mb-3" />
                    <p className="font-bold text-[#8FA396] text-sm">{t('No orders yet')}</p>
                    <p className="text-xs text-[#B0BDB7] mt-1">{t('Your order history will appear here')}</p>
                  </div>
                ) : (
                  orders.map((order: Order, i: number) => {
                    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                      pending:    { label: t('order_status_pending'),    color: 'text-amber-500 bg-amber-50',       icon: <Clock className="w-3.5 h-3.5" /> },
                      confirmed:  { label: t('order_status_confirmed'),  color: 'text-blue-500 bg-blue-50',         icon: <Package className="w-3.5 h-3.5" /> },
                      preparing:  { label: t('order_status_preparing'),  color: 'text-indigo-500 bg-indigo-50',     icon: <Loader2 className="w-3.5 h-3.5" /> },
                      ready:      { label: t('order_status_ready'),      color: 'text-[#1B5E52] bg-[#1B5E52]/10',  icon: <Package className="w-3.5 h-3.5" /> },
                      picked_up:  { label: t('order_status_picked_up'),  color: 'text-violet-500 bg-violet-50',     icon: <Package className="w-3.5 h-3.5" /> },
                      delivering: { label: t('order_status_delivering'), color: 'text-cyan-500 bg-cyan-50',         icon: <Truck className="w-3.5 h-3.5" /> },
                      delivered:  { label: t('order_status_delivered'),  color: 'text-emerald-600 bg-emerald-50',   icon: <CheckCircle className="w-3.5 h-3.5" /> },
                      cancelled:  { label: t('order_status_cancelled'),  color: 'text-red-500 bg-red-50',           icon: <XCircle className="w-3.5 h-3.5" /> },
                    };
                    const sc = statusConfig[order.status] || statusConfig['pending'];
                    const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                    const time = order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <motion.div
                        key={order.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden"
                      >
                        {/* Clickable header — toggles expanded detail */}
                        <div
                          className="p-4 cursor-pointer select-none"
                          onClick={() => {
                            const newId = expandedOrderId === order.id ? null : order.id;
                            setExpandedOrderId(newId);
                            if (newId !== expandedOrderId) { setInlineRating(5); setInlineComment(''); }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#1B5E52]/10 flex items-center justify-center text-[#1B5E52] flex-shrink-0">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#1B1B1B] leading-tight">
                                  {order.restaurantName || 'Order'}
                                </p>
                                <p className="text-xs text-[#8FA396] mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {date}{time ? ` · ${time}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${sc.color}`}>
                                {sc.icon}
                                {sc.label}
                              </span>
                              {order.status === 'delivering' && (() => {
                                const arrival = computeDeliveryArrival(order);
                                return (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-600">
                                    <Truck className="w-3 h-3" />
                                    {arrival ? `~${arrival}` : t('profile_on_the_way')}
                                  </span>
                                );
                              })()}
                              {['pending','preparing','ready'].includes(order.status) && order.estimatedPickupTime && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                                  <Clock className="w-3 h-3" />
                                  {computeETA(order.estimatedPickupTime)}
                                </span>
                              )}
                              <ChevronDown className={`w-4 h-4 text-[#8FA396] transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {/* Footer — always visible */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8E0D5]">
                            <div className="flex items-center gap-3 text-xs text-[#8FA396]">
                              {order.deliveryType && <span className="capitalize">{order.deliveryType}</span>}
                              {order.paymentMethod && <span className="capitalize">{order.paymentMethod}</span>}
                            </div>
                            <span className="font-black text-sm text-[#1B1B1B]">
                              ₺{(order.total ?? order.price ?? 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Expandable detail */}
                        <AnimatePresence>
                          {expandedOrderId === order.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#E8E0D5]">

                                {/* All items */}
                                {order.items && order.items.length > 0 && (
                                  <div className="space-y-1">
                                    {order.items.map((item: CartItem, j: number) => (
                                      <div key={j} className="flex items-center justify-between text-xs text-[#8FA396]">
                                        <span className="truncate">{item.quantity}× {item.name}</span>
                                        <span className="font-semibold ml-2 flex-shrink-0">₺{(item.price * item.quantity).toFixed(2)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Delivery Code */}
                                {order.status === 'delivering' && order.deliveryCode && (
                                  <div className="px-4 py-3 bg-amber-50 rounded-xl border border-amber-200/60">
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">{t('profile_delivery_code')}</p>
                                    <p className="text-2xl font-black text-amber-700 tracking-[0.4em]">{order.deliveryCode}</p>
                                    <p className="text-xs text-amber-600/80 mt-1">{t('profile_delivery_code_hint')}</p>
                                  </div>
                                )}

                                {/* Tracking info */}
                                {(order.estimatedPickupTime || order.trackingNotes) && (
                                  <div className="flex flex-wrap gap-3 text-xs text-[#8FA396] px-3 py-2 bg-[#F5F0E8] rounded-xl">
                                    {order.estimatedPickupTime && (
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('profile_pickup_prefix')} {order.estimatedPickupTime}</span>
                                    )}
                                    {order.trackingNotes && <span>{order.trackingNotes}</span>}
                                  </div>
                                )}

                                {/* Inline review form for delivered & unreviewed orders */}
                                {order.status === 'delivered' && !reviewedOrderIds.has(order.id) && (
                                  <div className="pt-2 border-t border-[#E8E0D5]">
                                    <p className="text-xs font-bold text-[#8FA396] mb-3">{t('profile_rate_experience')}</p>
                                    <div className="flex gap-1 mb-3">
                                      {[1, 2, 3, 4, 5].map(s => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={e => { e.stopPropagation(); setInlineRating(s); }}
                                          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                                        >
                                          <Star className={`w-6 h-6 ${s <= inlineRating ? 'fill-amber-400 text-amber-400' : 'text-[#B0BDB7]'}`} />
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={inlineComment}
                                      onChange={e => setInlineComment(e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      placeholder={t('profile_review_ph')}
                                      className="w-full px-3 py-2 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-xs text-[#1B1B1B] placeholder-[#B0BDB7] focus:outline-none focus:border-[#1B5E52] transition-colors resize-none mb-2"
                                    />
                                    <button
                                      onClick={e => { e.stopPropagation(); handleInlineReview(order); }}
                                      disabled={inlineSubmitting}
                                      className="w-full py-2.5 bg-[#1B5E52] text-white rounded-xl text-xs font-bold hover:bg-[#164d43] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {inlineSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('profile_submitting')}</> : t('Submit Review')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}

            {/* ══ SETTINGS TAB ══ */}
            {tab === 'settings' && (
              <div className="space-y-3">

                {/* Language */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <p className="text-xs font-bold text-[#8FA396] uppercase tracking-widest px-5 pt-5 pb-2">{t('profile_lang_section')}</p>
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'tr', name: 'Türkçe',  flag: '🇹🇷' },
                  ].map((lang, idx) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${
                        idx < 1 ? 'border-b border-[#E8E0D5]' : ''
                      } ${i18n.language === lang.code ? 'bg-[#1B5E52]/5' : 'hover:bg-[#F5F0E8]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className={`font-medium text-sm ${i18n.language === lang.code ? 'text-[#1B5E52] font-bold' : 'text-[#5C6B63]'}`}>
                          {lang.name}
                        </span>
                      </div>
                      {i18n.language === lang.code && <CheckCircle2 className="w-4 h-4 text-[#1B5E52]" />}
                    </button>
                  ))}
                </div>

                {/* Notifications */}
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${userProfile?.notificationsEnabled ? 'bg-[#1B5E52]/10 text-[#1B5E52]' : 'bg-[#F5F0E8] text-[#8FA396]'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#1B1B1B]">{t('Notifications')}</p>
                      <p className="text-xs text-[#8FA396]">{userProfile?.notificationsEnabled ? t('profile_notif_enabled') : t('profile_notif_disabled')}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleNotificationToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      userProfile?.notificationsEnabled ? 'bg-[#1B5E52]' : 'bg-[#E8E0D5]'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      userProfile?.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Account info */}
                <div className="bg-white rounded-2xl px-5 py-4 shadow-sm space-y-3">
                  <p className="text-xs font-bold text-[#8FA396] uppercase tracking-widest">{t('profile_account_section')}</p>
                  <div className="flex items-center gap-3 text-sm text-[#8FA396]">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>{t('profile_member_since', { year: new Date().getFullYear() })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#8FA396]">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="capitalize">{t('profile_account_role', { role: userProfile?.role || 'customer' })}</span>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Wallet Top-Up Modal ── */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-[#1B1B1B] text-lg">{t('profile_wallet_topup_title')}</h3>
                  <p className="text-xs text-[#8FA396] mt-0.5">{t('profile_wallet_current')} <span className="font-bold text-[#1B5E52]">₺{(userProfile?.walletBalance || 0).toFixed(2)}</span></p>
                </div>
                <button onClick={() => setShowWalletModal(false)} className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#8FA396]" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[50, 100, 200, 500, 1000, 2000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                      topUpAmount === amount
                        ? 'bg-[#1B5E52] border-[#1B5E52] text-white'
                        : 'bg-[#F5F0E8] border-[#E8E0D5] text-[#5C6B63]'
                    }`}
                  >
                    ₺{amount}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-xs font-bold text-[#8FA396] uppercase tracking-wide mb-1.5 block">{t('profile_wallet_custom')}</label>
                <input
                  type="number" min={1}
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border border-[#E8E0D5] text-sm text-[#1B1B1B] focus:outline-none focus:border-[#1B5E52]"
                />
              </div>

              <button
                onClick={handleTopUp}
                className="w-full py-3.5 bg-[#1B5E52] text-white rounded-2xl font-bold hover:bg-[#164d43] transition-colors"
              >
                {t('profile_wallet_add', { amount: topUpAmount })}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

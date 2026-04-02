import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Phone, Globe, MapPin, Camera, Save,
  Trash2, CheckCircle2, Wallet, Plus, Home, Briefcase,
  Heart, MoreHorizontal, Bell, X, Building2, Pencil,
  ShoppingBag, Clock, ChevronRight, Package, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

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
  const { userProfile, setUserProfile, orders, setOrders } = useStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [editingAddrIndex, setEditingAddrIndex] = useState<number | null>(null);
  const [editingAddr, setEditingAddr] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName:    userProfile?.firstName    || '',
    lastName:     userProfile?.lastName     || '',
    displayName:  userProfile?.displayName  || '',
    email:        userProfile?.email        || '',
    countryCode:  userProfile?.countryCode  || '+90',
    mobileNumber: userProfile?.mobileNumber || '',
  });

  /* ── Handlers ─────────────────────────────────────────── */
  const handleSaveProfile = async () => {
    if (!userProfile) return;
    setSaving(true);
    try {
      const data = await api.put('/users/me', formData);
      setUserProfile({ ...userProfile, ...(data.user || formData) });
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch {
      // save locally anyway
      setUserProfile({ ...userProfile, ...formData });
      setIsEditing(false);
      toast.success('Profile updated!');
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
    toast.success('Address removed');
  };

  const openEditAddress = (index: number) => {
    setEditingAddrIndex(index);
    setEditingAddr({ ...userProfile!.addresses[index] });
  };

  const handleSaveEditedAddress = () => {
    if (!userProfile || editingAddrIndex === null) return;
    const updated = userProfile.addresses.map((a: any, i: number) =>
      i === editingAddrIndex ? editingAddr : a
    );
    setUserProfile({ ...userProfile, addresses: updated });
    try { api.put('/users/me', { addresses: updated }).catch(() => {}); } catch {}
    toast.success('Address updated!');
    setEditingAddrIndex(null);
    setEditingAddr(null);
  };

  const handleTopUp = async () => {
    if (!userProfile) return;
    const newBalance = (userProfile.walletBalance || 0) + topUpAmount;
    setUserProfile({ ...userProfile, walletBalance: newBalance });
    api.put('/users/me', { walletBalance: newBalance }).catch(() => {});
    setShowWalletModal(false);
    toast.success(`₺${topUpAmount} added to wallet`);
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
    if (tab !== 'orders' || orders.length > 0) return;
    setOrdersLoading(true);
    api.get('/orders/my').then((data: any) => {
      setOrders(data.orders || []);
    }).catch(() => {
      // keep empty, show empty state
    }).finally(() => setOrdersLoading(false));
  }, [tab]);

  const initials =
    userProfile?.displayName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ||
    userProfile?.email?.charAt(0).toUpperCase() || '?';

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] relative z-[1]">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero card ── */}
        <div className="bg-white dark:bg-[#111] rounded-3xl overflow-hidden shadow-sm">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-[#1A4D2E] to-[#2d6a4f]" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-[#1A4D2E] border-4 border-white dark:border-[#111] flex items-center justify-center text-white text-2xl font-black shadow-xl overflow-hidden">
                  {userProfile?.photoURL
                    ? <img src={userProfile.photoURL} alt="avatar" className="w-full h-full object-cover" />
                    : initials}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-[#1a1a1a] rounded-full shadow-md border border-gray-100 dark:border-white/10 flex items-center justify-center text-[#1A4D2E]"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Wallet chip */}
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 rounded-xl hover:bg-[#1A4D2E]/15 transition-colors"
              >
                <Wallet className="w-4 h-4 text-[#1A4D2E]" />
                <span className="font-black text-[#1A4D2E] text-sm">₺{(userProfile?.walletBalance || 0).toFixed(2)}</span>
                <Plus className="w-3.5 h-3.5 text-[#1A4D2E]" />
              </button>
            </div>

            <h2 className="font-black text-xl text-gray-900 dark:text-white leading-none">{userProfile?.displayName || 'User'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{userProfile?.email}</p>
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">
              {userProfile?.role || 'customer'}
            </span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white dark:bg-[#111] rounded-2xl p-1 shadow-sm">
          {(['profile', 'addresses', 'orders', 'settings'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                tab === t
                  ? 'bg-[#1A4D2E] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {t === 'profile' ? 'Profile' : t === 'addresses' ? 'Addresses' : t === 'orders' ? 'Orders' : 'Settings'}
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
              <div className="bg-white dark:bg-[#111] rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 dark:text-white">Personal Information</h3>
                  <button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    disabled={saving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isEditing
                        ? 'bg-[#1A4D2E] text-white'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isEditing ? <><Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}</> : <><User className="w-4 h-4" /> Edit</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'First Name',    key: 'firstName',   icon: User,  type: 'text',  placeholder: 'John' },
                    { label: 'Last Name',     key: 'lastName',    icon: User,  type: 'text',  placeholder: 'Doe' },
                    { label: 'Display Name',  key: 'displayName', icon: User,  type: 'text',  placeholder: 'johndoe' },
                  ].map(({ label, key, icon: Icon, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">{label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                          type={type}
                          disabled={!isEditing}
                          value={(formData as any)[key]}
                          onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] disabled:opacity-50 transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="email" disabled value={formData.email}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Phone</label>
                  <div className="flex gap-2">
                    <select
                      disabled={!isEditing}
                      value={formData.countryCode}
                      onChange={e => setFormData(f => ({ ...f, countryCode: e.target.value }))}
                      className="px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1A4D2E] disabled:opacity-50"
                    >
                      <option value="+90">🇹🇷 +90</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+49">🇩🇪 +49</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input
                        type="tel" disabled={!isEditing}
                        value={formData.mobileNumber}
                        onChange={e => setFormData(f => ({ ...f, mobileNumber: e.target.value }))}
                        placeholder="5XX XXX XX XX"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] disabled:opacity-50 transition-colors"
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
                  <div className="bg-white dark:bg-[#111] rounded-3xl p-12 text-center shadow-sm">
                    <MapPin className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto mb-3" />
                    <p className="font-bold text-gray-400 text-sm">No saved addresses yet</p>
                    <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Confirm a location on the map to save one</p>
                  </div>
                ) : (
                  userProfile.addresses.map((addr: any, i: number) => {
                    const tag = addr.tag || 'other';
                    const label = addr.addressLabel || addr.label || 'Saved Address';
                    const details = [addr.apartment, addr.floor && `Floor ${addr.floor}`, addr.unit && `Unit ${addr.unit}`]
                      .filter(Boolean).join(' · ');
                    const isEditingThis = editingAddrIndex === i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white dark:bg-[#111] rounded-2xl shadow-sm overflow-hidden"
                      >
                        {/* Card header — always visible */}
                        <div className="p-4 flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tag === 'home'    ? 'bg-blue-50   dark:bg-blue-900/20   text-blue-500'   :
                            tag === 'work'    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-500' :
                            tag === 'partner' ? 'bg-pink-50   dark:bg-pink-900/20   text-pink-500'   :
                            'bg-gray-100 dark:bg-white/5 text-gray-500'
                          }`}>
                            {TAG_ICON[tag]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-gray-900 dark:text-white text-sm">{label}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                {TAG_LABEL[tag] || tag}
                              </span>
                            </div>
                            {details && <p className="text-xs text-gray-500 dark:text-gray-400">{details}</p>}
                            {addr.phone && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{addr.phone}
                              </p>
                            )}
                            {addr.company && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <Building2 className="w-3 h-3" />{addr.company}
                              </p>
                            )}
                            {addr.deliveryNote && (
                              <p className="text-xs text-gray-400 mt-1 italic">"{addr.deliveryNote}"</p>
                            )}
                          </div>
                          {/* Change + Delete buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => isEditingThis ? (setEditingAddrIndex(null), setEditingAddr(null)) : openEditAddress(i)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isEditingThis
                                  ? 'bg-gray-100 dark:bg-white/5 text-gray-500'
                                  : 'bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 text-[#1A4D2E] hover:bg-[#1A4D2E]/15'
                              }`}
                            >
                              <Pencil className="w-3 h-3" />
                              {isEditingThis ? 'Cancel' : 'Change'}
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(i)}
                              className="p-1.5 text-gray-300 hover:text-red-400 dark:text-white/20 dark:hover:text-red-400 transition-colors rounded-lg"
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
                              className="overflow-hidden border-t border-gray-100 dark:border-white/5"
                            >
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  {[
                                    { key: 'addressLabel', label: 'Address Label', placeholder: 'Neighbourhood' },
                                    { key: 'apartment',    label: 'Apartment',     placeholder: 'Building name' },
                                    { key: 'unit',         label: 'Unit',          placeholder: 'No' },
                                    { key: 'floor',        label: 'Floor',         placeholder: 'Floor no' },
                                    { key: 'company',      label: 'Company',       placeholder: 'Optional' },
                                    { key: 'phone',        label: 'Phone',         placeholder: '+90 5XX…' },
                                  ].map(({ key, label, placeholder }) => (
                                    <div key={key}>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">{label}</label>
                                      <input
                                        type="text"
                                        value={editingAddr[key] || ''}
                                        onChange={e => setEditingAddr((a: any) => ({ ...a, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors"
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">Delivery Note</label>
                                  <textarea
                                    rows={2}
                                    value={editingAddr.deliveryNote || ''}
                                    onChange={e => setEditingAddr((a: any) => ({ ...a, deliveryNote: e.target.value }))}
                                    placeholder="Door code, directions…"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-300 focus:outline-none focus:border-[#1A4D2E] transition-colors resize-none"
                                  />
                                </div>
                                {/* Tag selector */}
                                <div className="flex gap-2">
                                  {(['home','work','partner','other'] as const).map(t => (
                                    <button
                                      key={t}
                                      type="button"
                                      onClick={() => setEditingAddr((a: any) => ({ ...a, tag: t }))}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                                        editingAddr.tag === t
                                          ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                                          : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400'
                                      }`}
                                    >
                                      {TAG_ICON[t]}
                                      {TAG_LABEL[t]}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={handleSaveEditedAddress}
                                  className="w-full py-2.5 bg-[#1A4D2E] text-white rounded-xl text-sm font-bold hover:bg-[#133b23] transition-colors"
                                >
                                  Save Changes
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
                  <div className="bg-white dark:bg-[#111] rounded-3xl p-12 flex items-center justify-center shadow-sm">
                    <Loader2 className="w-8 h-8 text-[#1A4D2E] animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white dark:bg-[#111] rounded-3xl p-12 text-center shadow-sm">
                    <ShoppingBag className="w-10 h-10 text-gray-200 dark:text-white/10 mx-auto mb-3" />
                    <p className="font-bold text-gray-400 text-sm">No orders yet</p>
                    <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Your order history will appear here</p>
                  </div>
                ) : (
                  orders.map((order: any, i: number) => {
                    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                      pending:   { label: 'Pending',    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',   icon: <Clock className="w-3.5 h-3.5" /> },
                      confirmed: { label: 'Confirmed',  color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',     icon: <Package className="w-3.5 h-3.5" /> },
                      ready:     { label: 'Ready',      color: 'text-[#1A4D2E] bg-[#1A4D2E]/10',                  icon: <Package className="w-3.5 h-3.5" /> },
                      completed: { label: 'Completed',  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                      cancelled: { label: 'Cancelled',  color: 'text-red-500 bg-red-50 dark:bg-red-900/20',       icon: <XCircle className="w-3.5 h-3.5" /> },
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
                        className="bg-white dark:bg-[#111] rounded-2xl shadow-sm overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E] flex-shrink-0">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
                                  {order.restaurantName || 'Order'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {date}{time ? ` · ${time}` : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${sc.color}`}>
                              {sc.icon}
                              {sc.label}
                            </span>
                          </div>

                          {/* Items */}
                          {order.items && order.items.length > 0 && (
                            <div className="space-y-1 mb-3">
                              {order.items.slice(0, 3).map((item: any, j: number) => (
                                <div key={j} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                  <span className="truncate">{item.quantity}× {item.name}</span>
                                  <span className="font-semibold ml-2 flex-shrink-0">₺{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <p className="text-xs text-gray-400">+{order.items.length - 3} more items</p>
                              )}
                            </div>
                          )}

                          {/* Footer row */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                              {order.deliveryType && (
                                <span className="capitalize">{order.deliveryType}</span>
                              )}
                              {order.paymentMethod && (
                                <span className="capitalize">{order.paymentMethod}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-gray-900 dark:text-white">
                                ₺{(order.total ?? order.price ?? 0).toFixed(2)}
                              </span>
                              {order.status === 'completed' && (
                                <button className="flex items-center gap-1 text-xs font-bold text-[#1A4D2E] hover:underline">
                                  Rate <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
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
                <div className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-5 pt-5 pb-2">Language</p>
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'tr', name: 'Türkçe',  flag: '🇹🇷' },
                  ].map((lang, idx) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${
                        idx < 1 ? 'border-b border-gray-50 dark:border-white/5' : ''
                      } ${i18n.language === lang.code ? 'bg-[#1A4D2E]/5 dark:bg-[#1A4D2E]/10' : 'hover:bg-gray-50 dark:hover:bg-white/3'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className={`font-medium text-sm ${i18n.language === lang.code ? 'text-[#1A4D2E] font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                          {lang.name}
                        </span>
                      </div>
                      {i18n.language === lang.code && <CheckCircle2 className="w-4 h-4 text-[#1A4D2E]" />}
                    </button>
                  ))}
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-[#111] rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${userProfile?.notificationsEnabled ? 'bg-[#1A4D2E]/10 text-[#1A4D2E]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Notifications</p>
                      <p className="text-xs text-gray-400">{userProfile?.notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleNotificationToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      userProfile?.notificationsEnabled ? 'bg-[#1A4D2E]' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      userProfile?.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Account info */}
                <div className="bg-white dark:bg-[#111] rounded-2xl px-5 py-4 shadow-sm space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span>Member since {new Date().getFullYear()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="capitalize">{userProfile?.role || 'customer'} account</span>
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
              className="bg-white dark:bg-[#111] rounded-3xl w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">Top Up Wallet</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Current: <span className="font-bold text-[#1A4D2E]">₺{(userProfile?.walletBalance || 0).toFixed(2)}</span></p>
                </div>
                <button onClick={() => setShowWalletModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[50, 100, 200, 500, 1000, 2000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setTopUpAmount(amount)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                      topUpAmount === amount
                        ? 'bg-[#1A4D2E] border-[#1A4D2E] text-white'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    ₺{amount}
                  </button>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5 block">Custom amount</label>
                <input
                  type="number" min={1}
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1A4D2E]"
                />
              </div>

              <button
                onClick={handleTopUp}
                className="w-full py-3.5 bg-[#1A4D2E] text-white rounded-2xl font-bold hover:bg-[#133b23] transition-colors"
              >
                Add ₺{topUpAmount}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

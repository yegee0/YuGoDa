import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Heart, ShoppingBag, Plus, Minus, ChevronLeft,
  MapPin, Clock, CreditCard, Truck, Loader2, Package,
  Info, X, CheckCircle, Leaf, Zap, Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

const TL = (n: number) => `₺${n.toFixed(2)}`;

function isStoreCurrentlyOpen(operatingHours: any[] | null | undefined): boolean {
  if (!operatingHours || !Array.isArray(operatingHours)) return true;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const slot = operatingHours.find((s: any) => s.day === days[now.getDay()]);
  if (!slot || !slot.isOpen) return false;
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return t >= slot.open && t <= slot.close;
}

function BagCard({ bag, store, onAdd, cartQty, onInc, onDec }: {
  bag: any; store: any;
  onAdd: () => void;
  cartQty: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const discount = bag.originalPrice > bag.price
    ? Math.round((1 - bag.price / bag.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-[#1A4D2E]/10 to-[#1A4D2E]/5 overflow-hidden">
        {bag.image ? (
          <img
            src={bag.image}
            alt={bag.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#1A4D2E]/30" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {discount >= 30 && (
            <span className="flex items-center gap-1 bg-[#1A4D2E] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              <Leaf className="w-2.5 h-2.5" /> -{discount}%
            </span>
          )}
          {bag.available > 0 && bag.available <= 2 && (
            <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" /> Only {bag.available} left
            </span>
          )}
        </div>
        {bag.available === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-black text-sm bg-black/60 px-3 py-1 rounded-full">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1">
          {bag.category} Magic Bag
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mb-3">
          {bag.description || `Surprise selection from ${store.name}`}
        </p>

        {bag.pickupTime && (
          <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{bag.pickupTime}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-base text-[#1A4D2E]">{TL(bag.price)}</span>
            {bag.originalPrice > bag.price && (
              <span className="text-xs text-gray-300 dark:text-gray-600 line-through ml-1.5">{TL(bag.originalPrice)}</span>
            )}
          </div>

          {bag.available === 0 ? (
            <span className="text-xs text-gray-400 font-bold">Unavailable</span>
          ) : cartQty === 0 ? (
            <button
              onClick={onAdd}
              className="w-9 h-9 bg-[#1A4D2E] text-white rounded-xl flex items-center justify-center hover:bg-[#133b23] active:scale-95 transition-all shadow-sm shadow-[#1A4D2E]/30"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 rounded-xl px-2 py-1">
              <button onClick={onDec} className="w-6 h-6 bg-[#1A4D2E] text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-black text-[#1A4D2E] text-sm w-4 text-center">{cartQty}</span>
              <button onClick={onInc} className="w-6 h-6 bg-[#1A4D2E] text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart, addToCart, removeFromCart, updateCartQuantity, favorites, toggleFavorite } = useStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [store, setStore] = useState<any>(null);
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!id) return;
    api.get(`/stores/${id}`)
      .then((data: any) => {
        setStore(data.store);
        setBags(data.bags || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const categories: Record<string, any[]> = bags.reduce((acc: Record<string, any[]>, bag: any) => {
    const cat = bag.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(bag);
    return acc;
  }, {});

  const catKeys = Object.keys(categories);

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cartItems = cart.filter(c => bags.some(b => b.id === c.id));
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = deliveryType === 'delivery' ? 15 : 0;
  const total = subtotal + deliveryFee;
  const isFavStore = store ? favorites.includes(store.id) : false;
  const isOpen = store ? isStoreCurrentlyOpen(store.operatingHours) : true;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-10 h-10 text-[#1A4D2E] animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-[#0a0a0a]">
        <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Store not found</h2>
        <p className="text-gray-400 mt-2 text-sm">This store may no longer be available.</p>
        <button onClick={() => navigate('/discover')} className="mt-6 px-6 py-3 bg-[#1A4D2E] text-white rounded-2xl font-bold">
          Back to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-[#0a0a0a]">

      {/* ── Main scroll column ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Hero header ── */}
        <div className="relative">
          {/* Banner */}
          <div className="h-44 relative overflow-hidden bg-gray-200 dark:bg-[#1a1a1a]">
            {store.coverImage ? (
              <img src={store.coverImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A4D2E] to-[#2d6a4f]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Fav button */}
            <button
              onClick={() => toggleFavorite(store.id)}
              className={`absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all ${
                isFavStore ? 'bg-red-500 text-white' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavStore ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Store identity card */}
          <div className="bg-white dark:bg-[#111] px-6 pb-5 shadow-sm pt-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#1a1a1a] border-4 border-white dark:border-[#111] shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-[#1A4D2E]">
                {store.logo
                  ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <ShoppingBag className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{store.name}</h1>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {store.category && (
                    <span className="text-xs font-bold text-[#1A4D2E] bg-[#1A4D2E]/8 dark:bg-[#1A4D2E]/15 px-2 py-0.5 rounded-full">
                      {store.category}
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isOpen ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'
                  }`}>
                    {isOpen ? 'Open now' : 'Closed'}
                  </span>
                  {store.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {store.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowInfo(v => !v)}
                className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#1A4D2E] transition-colors flex-shrink-0"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {store.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{store.description}</p>
            )}

            {/* Quick info pills */}
            <div className="flex flex-wrap gap-2">
              {store.address && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[180px]">{store.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                <CreditCard className="w-3 h-3" /> Card · Cash · Wallet
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                <Truck className="w-3 h-3" /> Delivery available
              </div>
            </div>

            {/* Expandable detail info */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-4"
                >
                  <div className="pt-4 border-t border-gray-100 dark:border-white/5 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                    {store.phone && (
                      <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> {store.phone}</div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> {store.email}</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Sticky category nav ── */}
        {catKeys.length > 1 && (
          <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#111]/90 backdrop-blur-sm border-b border-gray-100 dark:border-white/5 px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {catKeys.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    activeCategory === cat
                      ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                      : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-[#1A4D2E]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Bag grid ── */}
        <div className="p-6 space-y-8">
          {catKeys.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111] rounded-3xl border-2 border-dashed border-gray-100 dark:border-white/5">
              <ShoppingBag className="w-12 h-12 text-gray-200 dark:text-white/10 mx-auto mb-3" />
              <p className="font-bold text-gray-400 text-sm">No packages available right now</p>
              <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Check back later for surprise bags</p>
            </div>
          ) : (
            catKeys.map(cat => (
              <div key={cat} ref={el => { categoryRefs.current[cat] = el; }}>
                <h2 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>{cat}</span>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{categories[cat].length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(categories[cat] as any[]).map(bag => {
                    const cartItem = cart.find(c => c.id === bag.id);
                    const qty = cartItem?.quantity || 0;
                    return (
                      <BagCard
                        key={bag.id}
                        bag={bag}
                        store={store}
                        cartQty={qty}
                        onAdd={() => addToCart({
                          id: bag.id,
                          restaurantId: bag.restaurantId,
                          restaurantName: store.name,
                          name: `${bag.category} Magic Bag`,
                          price: bag.price,
                          quantity: 1,
                          image: bag.image || '',
                        })}
                        onInc={() => updateCartQuantity(bag.id, qty + 1)}
                        onDec={() => qty > 1 ? updateCartQuantity(bag.id, qty - 1) : removeFromCart(bag.id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Right sidebar (basket) ── */}
      <div className="w-[320px] flex-shrink-0 bg-white dark:bg-[#111] border-l border-gray-100 dark:border-white/5 flex flex-col h-full sticky top-0">

        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-black text-gray-900 dark:text-white">{t('Your Basket')}</h2>
            {cartItems.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{cartItems.reduce((a, i) => a + i.quantity, 0)} items</p>
            )}
          </div>
          {cartItems.length > 0 && (
            <span className="w-6 h-6 bg-[#1A4D2E] text-white text-xs font-black rounded-full flex items-center justify-center">
              {cartItems.reduce((a, i) => a + i.quantity, 0)}
            </span>
          )}
        </div>

        {/* Delivery / Pickup toggle */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
            {(['delivery', 'pickup'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setDeliveryType(opt)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  deliveryType === opt
                    ? 'bg-white dark:bg-[#1a1a1a] shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-400'
                }`}
              >
                {opt}
                {opt === 'delivery' && (
                  <span className="ml-1 text-[10px] text-gray-400">+₺15</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <AnimatePresence>
            {cartItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full py-12 text-center"
              >
                <ShoppingBag className="w-12 h-12 text-gray-200 dark:text-white/10 mb-3" />
                <p className="font-bold text-gray-400 text-sm">{t('Your basket is empty')}</p>
                <p className="text-xs text-gray-300 dark:text-white/20 mt-1">Add bags to get started</p>
              </motion.div>
            ) : (
              cartItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-[#1A4D2E]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-xs text-[#1A4D2E] font-bold">{TL(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                      className="w-6 h-6 bg-gray-200 dark:bg-white/10 rounded-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                    </button>
                    <span className="text-xs font-black w-4 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-[#1A4D2E] rounded-lg flex items-center justify-center hover:bg-[#133b23] transition-colors"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-white/5 space-y-3">
          {cartItems.length > 0 && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{TL(subtotal)}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Delivery fee</span>
                  <span>{TL(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-white/5">
                <span>Total</span>
                <span>{TL(total)}</span>
              </div>
            </div>
          )}
          <button
            disabled={cartItems.length === 0}
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold text-sm hover:bg-[#133b23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1A4D2E]/20 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {cartItems.length === 0 ? t('Your basket is empty') : `${t('Go to Checkout')} · ${TL(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

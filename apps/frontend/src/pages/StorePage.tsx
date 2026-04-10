import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Star, Heart, ShoppingBag, Plus, Minus, ChevronLeft,
  MapPin, Clock, CreditCard, Truck, Loader2, Package,
  X, CheckCircle, Leaf, Zap, Tag
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/app/store/useStore';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Bag, StoreProfile, OperatingHours, Review } from '@/types';
import { TL } from '@/lib/formatters';
import { DAY_NAMES, DELIVERY_FEE } from '@/lib/constants';

function isStoreCurrentlyOpen(operatingHours: OperatingHours[] | null | undefined): boolean {
  if (!operatingHours || !Array.isArray(operatingHours)) return true;
  const days = DAY_NAMES;
  const now = new Date();
  const slot = operatingHours.find((s: OperatingHours) => s.day === days[now.getDay()]);
  if (!slot || !slot.isOpen) return false;
  const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return t >= slot.open && t <= slot.close;
}

function BagCard({ bag, store, onAdd, cartQty, onInc, onDec }: {
  bag: Bag; store: StoreProfile;
  onAdd: () => void;
  cartQty: number;
  onInc: () => void;
  onDec: () => void;
}) {
  const { t } = useTranslation();
  const discount = bag.originalPrice > bag.price
    ? Math.round((1 - bag.price / bag.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:shadow-lg hover:shadow-[#1B1B1B]/8 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative h-36 bg-gradient-to-br from-[#1B5E52]/10 to-[#1B5E52]/5 overflow-hidden">
        {bag.image || store.coverImage ? (
          <img
            src={bag.image || store.coverImage}
            alt={bag.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#1B5E52]/30" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {discount >= 30 && (
            <span className="flex items-center gap-1 bg-[#1B5E52] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              <Leaf className="w-2.5 h-2.5" /> -{discount}%
            </span>
          )}
          {bag.available > 0 && bag.available <= 2 && (
            <span className="flex items-center gap-1 bg-[#ad3115] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" /> {t('Only {{count}} left', { count: bag.available })}
            </span>
          )}
        </div>
        {bag.available === 0 && (
          <div className="absolute inset-0 bg-[#1B1B1B]/60 flex items-center justify-center">
            <span className="text-white font-black text-sm bg-[#1B1B1B]/70 px-3 py-1 rounded-full">{t('Sold Out')}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-black text-[#1B1B1B] text-sm leading-tight mb-1">
          {bag.category} Magic Bag
        </h3>
        <p className="text-xs text-[#8FA396] font-medium line-clamp-2 mb-3">
          {bag.description || `Surprise selection from ${store.name}`}
        </p>

        {bag.pickupTime && (
          <div className="flex items-center gap-1 mb-3 text-xs text-[#8FA396] font-medium">
            <Clock className="w-3 h-3" />
            <span>{bag.pickupTime}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-black text-base text-[#1B5E52]">{TL(bag.price)}</span>
            {bag.originalPrice > bag.price && (
              <span className="text-xs text-[#C5BDB5] line-through ml-1.5">{TL(bag.originalPrice)}</span>
            )}
          </div>

          {bag.available === 0 ? (
            <span className="text-xs text-[#8FA396] font-bold">{t('Unavailable')}</span>
          ) : cartQty === 0 ? (
            <button
              onClick={onAdd}
              className="w-9 h-9 bg-[#1B5E52] text-white rounded-full flex items-center justify-center hover:bg-[#164d43] active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[#1B5E52]/8 rounded-xl px-2 py-1">
              <button onClick={onDec} className="w-6 h-6 bg-[#1B5E52] text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-black text-[#1B5E52] text-sm w-4 text-center">{cartQty}</span>
              <button onClick={onInc} className="w-6 h-6 bg-[#1B5E52] text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform">
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
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [bags, setBags] = useState<Bag[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [storeTab, setStoreTab] = useState<'packages' | 'reviews' | 'info'>('packages');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!id) return;
    api.get(`/stores/${id}`)
      .then((data: { store: StoreProfile; bags?: Bag[] }) => {
        setStore(data.store);
        setBags(data.bags || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get(`/reviews?restaurantId=${id}`)
      .then((data: { reviews?: Review[] }) => setReviews(data.reviews || []))
      .catch(() => {});
  }, [id]);

  const categories: Record<string, Bag[]> = bags.reduce((acc: Record<string, Bag[]>, bag: Bag) => {
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
  const deliveryFee = deliveryType === 'delivery' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const isFavStore = store ? favorites.includes(store.id) : false;
  const isOpen = store ? isStoreCurrentlyOpen(store.operatingHours) : true;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#1b5e52' }}>
        <Loader2 className="w-10 h-10 text-[#748f2b] animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8" style={{ backgroundColor: '#1b5e52' }}>
        <ShoppingBag className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.45)' }} />
        <h2 className="text-xl font-black text-white">{t('Store not found')}</h2>
        <p className="font-medium mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>This store may no longer be available.</p>
        <button onClick={() => navigate('/discover')} className="mt-6 px-6 py-3 text-white rounded-full font-black" style={{ backgroundColor: '#ad3115' }}>
          {t('Back to Discover')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full relative" style={{ backgroundColor: '#1b5e52' }}>

      {/* ── Main scroll column ── */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">

        {/* ── Hero header ── */}
        <div className="relative">
          {/* Banner */}
          <div className="h-44 relative overflow-hidden bg-[#E8E0D5]">
            {store.coverImage ? (
              <img src={store.coverImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1B5E52] to-[#2d7a6a]" />
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
          <div className="bg-white px-6 pb-5 shadow-sm pt-4 border-b border-[#E8E0D5]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-[#1B5E52]">
                {store.logo
                  ? <img src={store.logo} alt={store.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  : <ShoppingBag className="w-8 h-8" />}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-black text-[#1B1B1B] leading-tight">{store.name}</h1>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  {store.category && (
                    <span className="text-xs font-black text-[#1B5E52] bg-[#1B5E52]/10 px-2.5 py-0.5 rounded-full">
                      {store.category}
                    </span>
                  )}
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    isOpen ? 'bg-[#748f2b]/20 text-[#5a7a1a]' : 'bg-[#ad3115]/10 text-[#ad3115]'
                  }`}>
                    {isOpen ? t('Open now') : t('Closed')}
                  </span>
                  {store.rating > 0 && (
                    <span className="flex items-center gap-1 text-xs font-black text-[#ad3115]">
                      <Star className="w-3 h-3 fill-current" />
                      {store.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {store.description && (
              <p className="text-sm text-[#8FA396] font-medium leading-relaxed mb-4">{store.description}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {store.address && (
                <div className="flex items-center gap-1.5 text-xs text-[#8FA396] font-medium bg-[#F5F0E8] px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[180px]">{store.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[#8FA396] font-medium bg-[#F5F0E8] px-3 py-1.5 rounded-full">
                <CreditCard className="w-3 h-3" /> {t('Card · Cash · Wallet')}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#8FA396] font-medium bg-[#F5F0E8] px-3 py-1.5 rounded-full">
                <Truck className="w-3 h-3" /> {t('Delivery available')}
              </div>
            </div>

          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div className="bg-white border-b border-[#E8E0D5] px-4">
          <div className="flex">
            {(['packages', 'reviews', 'info'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStoreTab(tab)}
                className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wide border-b-2 transition-all ${
                  storeTab === tab
                    ? 'border-[#1B5E52] text-[#1B5E52]'
                    : 'border-transparent text-[#B0BDB7] hover:text-[#5C6B63]'
                }`}
              >
                {tab === 'packages' ? 'Packages' : tab === 'reviews' ? `Reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}` : 'Info'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sticky category nav (Packages tab only) ── */}
        {storeTab === 'packages' && catKeys.length > 1 && (
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#E8E0D5] px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {catKeys.map(cat => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all border ${
                    activeCategory === cat
                      ? 'bg-[#1B5E52] text-white border-[#1B5E52]'
                      : 'bg-white text-[#8FA396] border-[#E8E0D5] hover:border-[#1B5E52]/40 hover:text-[#1B5E52]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Packages tab ── */}
        {storeTab === 'packages' && (
          <div className="p-6 space-y-8" id="bags">
            {catKeys.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-[#E8E0D5]">
                <ShoppingBag className="w-12 h-12 text-[#C5BDB5] mx-auto mb-3" />
                <p className="font-black text-[#8FA396] text-sm">{t('No packages available right now')}</p>
                <p className="text-xs text-[#B0BDB7] font-medium mt-1">{t('Check back later for surprise bags')}</p>
              </div>
            ) : (
              catKeys.map(cat => (
                <div key={cat} ref={el => { categoryRefs.current[cat] = el; }}>
                  <h2 className="text-base font-black text-[#1B1B1B] mb-4 flex items-center gap-2">
                    <span>{cat}</span>
                    <span className="text-xs font-black text-[#8FA396] bg-[#F5F0E8] px-2 py-0.5 rounded-full">{categories[cat].length}</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories[cat].map(bag => {
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
                            image: bag.image || store.coverImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
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
        )}

        {/* ── Reviews tab ── */}
        {storeTab === 'reviews' && (
          <div className="px-6 py-6">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-10 h-10 text-[#C5BDB5] mx-auto mb-3" />
                <p className="font-black text-[#8FA396] text-sm">{t('No reviews yet')}</p>
                <p className="text-xs text-[#B0BDB7] font-medium mt-1">{t('Be the first to leave a review')}</p>
              </div>
            ) : (
              <>
                <h2 className="text-base font-black text-[#1B1B1B] mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-[#ad3115] text-[#ad3115]" />
                  {t('Reviews')}
                  <span className="text-xs font-black text-[#8FA396] bg-[#F5F0E8] px-2 py-0.5 rounded-full">{reviews.length}</span>
                </h2>
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-white rounded-2xl p-4 border border-[#E8E0D5]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-black text-[#1B1B1B]">
                          {review.userName || t('Anonymous')}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-[#ad3115] text-[#ad3115]' : 'text-[#E8E0D5]'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-[#8FA396] font-medium leading-relaxed">{review.comment}</p>
                      )}
                      {review.createdAt && (
                        <p className="text-[10px] text-[#C5BDB5] mt-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Info tab ── */}
        {storeTab === 'info' && (
          <div className="p-6 space-y-3">
            {store.address && (
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#E8E0D5]">
                <MapPin className="w-4 h-4 text-[#1B5E52] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-[#8FA396] uppercase tracking-wide mb-0.5">Address</p>
                  <p className="text-sm text-[#1B1B1B] font-medium">{store.address}</p>
                </div>
              </div>
            )}
            {store.phone && (
              <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-[#E8E0D5]">
                <Tag className="w-4 h-4 text-[#1B5E52] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-black text-[#8FA396] uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="text-sm text-[#1B1B1B] font-medium">{store.phone}</p>
                </div>
              </div>
            )}
            <div className="p-4 bg-white rounded-2xl border border-[#E8E0D5]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-[#8FA396] uppercase tracking-wide">Opening Hours</p>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  isOpen ? 'bg-[#748f2b]/20 text-[#5a7a1a]' : 'bg-[#ad3115]/10 text-[#ad3115]'
                }`}>{isOpen ? t('Open now') : t('Closed')}</span>
              </div>
              {store.operatingHours && store.operatingHours.length > 0 ? (
                <div>
                  {store.operatingHours.map((slot, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-t border-[#F5F0E8] first:border-t-0 text-sm">
                      <span className="text-[#8FA396] font-medium w-28">{slot.day}</span>
                      {slot.isOpen ? (
                        <span className="text-[#1B1B1B] font-bold">{slot.open} – {slot.close}</span>
                      ) : (
                        <span className="text-[#B0BDB7] text-xs font-black">Closed</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8FA396] font-medium">Hours not available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky checkout bar ── */}
      {cartItems.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 p-4 bg-white border-t border-[#E8E0D5] shadow-lg">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-[#1B5E52] text-white rounded-full font-black text-sm flex items-center justify-between px-5 shadow-lg shadow-[#1B5E52]/20"
          >
            <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-black">
              {cartItems.reduce((a, i) => a + i.quantity, 0)}
            </span>
            <span>{t('Go to Checkout')}</span>
            <span className="font-black">{TL(total)}</span>
          </button>
        </div>
      )}

      {/* ── Right sidebar (basket) ── */}
      <div className="hidden md:flex w-[320px] flex-shrink-0 bg-white border-l border-[#E8E0D5] flex-col h-full sticky top-0">

        {/* Sidebar header */}
        <div className="p-5 border-b border-[#E8E0D5] flex items-center justify-between">
          <div>
            <h2 className="font-black text-[#1B1B1B]">{t('Your Basket')}</h2>
            {cartItems.length > 0 && (
              <p className="text-xs text-[#8FA396] font-medium mt-0.5">{cartItems.reduce((a, i) => a + i.quantity, 0)} items</p>
            )}
          </div>
          {cartItems.length > 0 && (
            <span className="w-6 h-6 bg-[#1B5E52] text-white text-xs font-black rounded-full flex items-center justify-center">
              {cartItems.reduce((a, i) => a + i.quantity, 0)}
            </span>
          )}
        </div>

        {/* Delivery / Pickup toggle */}
        <div className="px-5 py-3 border-b border-[#E8E0D5]">
          <div className="flex p-1 bg-[#F5F0E8] rounded-full">
            {(['delivery', 'pickup'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => setDeliveryType(opt)}
                className={`flex-1 py-2 rounded-full text-xs font-black capitalize transition-all ${
                  deliveryType === opt
                    ? 'bg-white shadow-sm text-[#1B1B1B]'
                    : 'text-[#8FA396]'
                }`}
              >
                {opt}
                {opt === 'delivery' && (
                  <span className="ml-1 text-[10px] text-[#B0BDB7]">+₺15</span>
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
                <ShoppingBag className="w-12 h-12 text-[#C5BDB5] mb-3" />
                <p className="font-black text-[#8FA396] text-sm">{t('Your basket is empty')}</p>
                <p className="text-xs text-[#B0BDB7] font-medium mt-1">{t('Add bags to get started')}</p>
              </motion.div>
            ) : (
              cartItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3 p-3 bg-[#F5F0E8] rounded-2xl"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#1B5E52]/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-[#1B5E52]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#1B1B1B] truncate">{item.name}</p>
                    <p className="text-xs text-[#1B5E52] font-black">{TL(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => item.quantity > 1 ? updateCartQuantity(item.id, item.quantity - 1) : removeFromCart(item.id)}
                      className="w-6 h-6 bg-[#E8E0D5] rounded-lg flex items-center justify-center hover:bg-[#D5CEC5] transition-colors"
                    >
                      <Minus className="w-3 h-3 text-[#5C6B63]" />
                    </button>
                    <span className="text-xs font-black w-4 text-center text-[#1B1B1B]">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-[#1B5E52] rounded-lg flex items-center justify-center hover:bg-[#164d43] transition-colors"
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
        <div className="p-5 border-t border-[#E8E0D5] space-y-3">
          {cartItems.length > 0 && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#8FA396] font-medium">
                <span>{t('Subtotal')}</span>
                <span>{TL(subtotal)}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between text-[#8FA396] font-medium">
                  <span>{t('Delivery fee')}</span>
                  <span>{TL(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-[#1B1B1B] pt-2 border-t border-[#E8E0D5]">
                <span>{t('Total')}</span>
                <span>{TL(total)}</span>
              </div>
            </div>
          )}
          <button
            disabled={cartItems.length === 0}
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-[#1B5E52] text-white rounded-full font-black text-sm hover:bg-[#164d43] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#1B5E52]/20 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {cartItems.length === 0 ? t('Your basket is empty') : `${t('Go to Checkout')} · ${TL(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

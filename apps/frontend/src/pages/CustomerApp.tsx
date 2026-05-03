import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Filter,
  Search,
  Clock,
  Star,
  ShoppingBag,
  ChevronRight,
  Heart,
  ArrowRight,
  X,
  CheckCircle2,
  Store,
  Map as MapIcon,
  Grid,
  Navigation,
  Truck,
  Camera,
  DollarSign as DollarIcon,
  Leaf,
  Info,
  Plus,
  CreditCard,
  Wallet,
  LocateFixed,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleMapsView from '@/components/GoogleMapsView';
import LocationPickerMap from '@/components/LocationPickerMap';
import { reverseGeocodeNominatim } from '@/lib/geocoding';
import { useCountdown } from '@/hooks/useCountdown';
import { useStore } from '@/app/store/useStore';
import { useBags } from '@/hooks/useBags';
import { useLocationManager } from '@/hooks/useLocationManager';
import FilterPanel from '@/components/FilterPanel';
import CartDrawer from '@/components/CartDrawer';
import AiRecommendations from '@/components/AiRecommendations';
import AiChatWidget from '@/components/AiChatWidget';
import { api } from '@/lib/api';
import { TL } from '@/lib/formatters';
import type { Bag, MapSuggestion, CartItem } from '@/types';

const GOOGLE_MAPS_API_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const GOOGLE_MAPS_MAP_ID: string = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '';

function BagCard({ bag, onClick }: { bag: Bag; onClick: () => void }) {
  const countdown = useCountdown(bag.countdown || '');
  const { favorites, toggleFavorite, addToCart } = useStore();
  const isFavorite = favorites.includes(bag.id);
  const { t } = useTranslation();

  return (
    <div
      className="eco-card group cursor-pointer flex flex-col h-full overflow-hidden bag-card-enter"
      onClick={onClick}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Link to={`/store/${bag.restaurantId || 'pizza-bulls'}`}>
          {bag.image || bag.storeCoverImage ? (
            <img
              src={bag.image || bag.storeCoverImage}
              alt={bag.restaurantName}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1B5E52]/15 to-[#1B5E52]/5 flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#1B5E52]/30" />
            </div>
          )}
        </Link>

        {bag.isCurrentlyOpen === false && (
          <div className="absolute inset-0 bg-[#1B1B1B]/60 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-[#1B1B1B]/80 text-white text-xs font-black rounded-full tracking-wide">
              {t('Closed')}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => { e.stopPropagation(); void toggleFavorite(bag.id); }}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-eco-secondary text-white' : 'bg-white/90 text-[#8FA396] hover:bg-white'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
          <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-black text-[#1B5E52] flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current text-eco-secondary" /> {bag.rating || 4.5}
          </div>
        </div>

        {bag.isLastChance && (
          <div className="absolute bottom-3 left-3 bg-eco-secondary text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 animate-pulse shadow-lg">
            <Clock className="w-3 h-3" /> {countdown}
          </div>
        )}

        <div className="absolute top-3 left-3 bg-[#1B5E52] text-white px-2.5 py-1 rounded-full text-xs font-black shadow-sm">
          {bag.available} {t('left')}
        </div>

        {bag.storeLogo && (
          <div className="absolute bottom-3 right-3 w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-lg">
            <img src={bag.storeLogo} alt={bag.restaurantName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/store/${bag.restaurantId || 'pizza-bulls'}`}>
            <h3 className="font-black text-[#1B1B1B] text-base leading-tight group-hover:text-[#1B5E52] transition-colors">{bag.restaurantName}</h3>
          </Link>
          <div className="text-right ml-2 shrink-0">
            <span className="font-black text-[#1B5E52] text-base">₺{bag.price.toFixed(2)}</span>
            <p className="text-[10px] text-[#B0BDB7] line-through">₺{bag.originalPrice?.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-[#8FA396] font-medium mb-2">{bag.category} • {bag.distance || t('disc_default_distance')}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {bag.merchantType && (
            <span className="px-2 py-0.5 bg-[#1B5E52]/10 text-[#1B5E52] text-[10px] font-black rounded-full flex items-center gap-1">
              <Store className="w-2 h-2" /> {bag.merchantType}
            </span>
          )}
          {bag.dietaryTags && bag.dietaryTags.length > 0
            ? bag.dietaryTags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-[#748f2b]/20 text-[#5a7a1a] text-[10px] font-black rounded-full flex items-center gap-1">
                  <Leaf className="w-2 h-2" /> {tag}
                </span>
              ))
            : bag.dietaryType && (
                <span className="px-2 py-0.5 bg-[#748f2b]/20 text-[#5a7a1a] text-[10px] font-black rounded-full flex items-center gap-1">
                  <Leaf className="w-2 h-2" /> {bag.dietaryType}
                </span>
              )
          }
        </div>

        <div className="mt-auto pt-3 border-t border-[#E8E0D5] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8FA396]">
            <Clock className="w-3.5 h-3.5 text-eco-secondary" />
            <span>{t('Pickup')}: {bag.pickupTime}</span>
          </div>
          <button
            disabled={bag.isCurrentlyOpen === false}
            onClick={(e) => {
              e.stopPropagation();
              if (bag.isCurrentlyOpen === false) return;
              addToCart({
                id: bag.id,
                restaurantId: bag.restaurantId || 'mock',
                restaurantName: bag.restaurantName,
                name: `${bag.category} Magic Bag`,
                price: bag.price,
                quantity: 1,
                image: bag.image || bag.storeCoverImage || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
                available: bag.available ?? 0,
                isCurrentlyOpen: bag.isCurrentlyOpen ?? true,
              });
            }}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              bag.isCurrentlyOpen === false
                ? 'bg-[#F5F0E8] text-[#B0BDB7] cursor-not-allowed'
                : 'bg-[#1B5E52] text-white hover:bg-[#164d43] shadow-sm hover:shadow-md'
            }`}
          >
            {bag.isCurrentlyOpen === false ? t('Closed') : t('Add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerApp({ initialTab = 'discover' }: { initialTab?: 'discover' | 'browse' | 'favorites' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'discover' | 'browse' | 'favorites'>(initialTab);
  const [selectedBag, setSelectedBag] = useState<Bag | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'reserve' | 'pay' | 'tracking' | 'success' | 'review'>('reserve');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mapInfoBag, setMapInfoBag] = useState<Bag | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<{ items: CartItem[]; tip: number; bookingFee: number; tax: number; total: number; deliveryType: string; paymentMethod: string; leaveAtDoor: boolean } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<{ type: string; label: string; sublabel: string; bag?: Bag }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);
  const searchRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll via scroll event on the overflow container (IntersectionObserver
  // with root:null doesn't fire for elements inside overflow-y-auto divs).
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollHeight - scrollTop - clientHeight < 400) {
        setVisibleCount(prev => prev + 16);
      }
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  const { user, userProfile, filters, cart, clearCart } = useStore();

  // Extracted hooks
  const {
    userLocation, setUserLocation,
    locationName, setLocationName,
    locationCity, setLocationCity,
    mapSearch, setMapSearch: searchMapFn,
    mapSuggestions, showMapSuggestions, setShowMapSuggestions,
    mapSearchLoading, mapSearchRef,
  } = useLocationManager();
  const { bags, filteredBags, loading } = useBags(searchQuery, activeTab);

  // Build autocomplete suggestions from bags data
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const seen = new Set<string>();
    const suggestions: { type: string; label: string; sublabel: string; bag?: Bag }[] = [];
    bags.forEach(bag => {
      if ((bag.restaurantName || '').toLowerCase().includes(q) && !seen.has(bag.restaurantName || '')) {
        seen.add(bag.restaurantName || '');
        suggestions.push({ type: 'restaurant', label: bag.restaurantName || '', sublabel: bag.category || '', bag });
      }
    });
    const categories = [...new Set(bags.map((b: Bag) => b.category))].filter((c): c is string => typeof c === 'string' && c.toLowerCase().includes(q));
    categories.forEach((c: string) => {
      if (!seen.has(c)) {
        seen.add(c);
        suggestions.push({ type: 'category', label: c, sublabel: c });
      }
    });
    setSearchSuggestions(suggestions.slice(0, 6));
    setShowSuggestions(suggestions.length > 0);
  }, [searchQuery, bags]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Infinite scroll: reset count when list changes (new filter/search/tab)
  useEffect(() => {
    setVisibleCount(16);
  }, [filteredBags, activeTab, searchQuery]);


  // Unique restaurants matching the current search query (for restaurant result cards)
  const matchingRestaurants = searchQuery.trim()
    ? [...new Map(
        filteredBags
          .filter(b => (b.restaurantName || '').toLowerCase().includes(searchQuery.toLowerCase()))
          .map(b => [b.restaurantId, {
            id: b.restaurantId,
            name: b.restaurantName || '',
            logo: b.storeLogo,
            cover: b.storeCoverImage,
          }])
      ).values()]
    : ([] as Array<{ id: string; name: string; logo?: string; cover?: string }>);

  // Discover grid artık restoran-bazlı: paketler yerine restoran kartları, kullanıcı
  // tıklayınca o restoranın detay sayfasına gider ve oradaki paketleri görür.
  // Aggregate metrikleri (kaç paket, en düşük fiyat, ortalama rating) bag listesinden türet.
  const restaurantsList = useMemo(() => {
    const m = new Map<string, {
      id: string; name: string; logo?: string; cover?: string; category?: string;
      bagCount: number; minPrice: number; avgRating: number;
      _ratingSum: number; _ratingN: number;
    }>();
    for (const b of filteredBags) {
      if (!b.restaurantId) continue;
      const r = b.rating ?? 0;
      const cur = m.get(b.restaurantId);
      if (!cur) {
        m.set(b.restaurantId, {
          id: b.restaurantId,
          name: b.restaurantName || '',
          logo: b.storeLogo,
          cover: b.storeCoverImage,
          category: b.category,
          bagCount: 1,
          minPrice: b.price,
          avgRating: r,
          _ratingSum: r,
          _ratingN: r > 0 ? 1 : 0,
        });
      } else {
        cur.bagCount += 1;
        cur.minPrice = Math.min(cur.minPrice, b.price);
        if (r > 0) {
          cur._ratingSum += r;
          cur._ratingN += 1;
          cur.avgRating = cur._ratingSum / cur._ratingN;
        }
      }
    }
    return Array.from(m.values());
  }, [filteredBags]);

  const handleCheckout = async (data: { items: CartItem[]; tip: number; bookingFee: number; tax: number; total: number; deliveryType: string; paymentMethod: string; leaveAtDoor: boolean }) => {
    setCheckoutData(data);
    setIsCartOpen(false);
    setCheckoutStep('pay');
    if (data.items.length > 0) {
      const bag = bags.find(b => b.id === data.items[0].id) || data.items[0];
      setSelectedBag(bag);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || !checkoutData) return;

    try {
      const restaurantGroups = checkoutData.items.reduce((acc: Record<string, CartItem[]>, item: CartItem) => {
        if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      let createdOrderId = '';
      for (const [restaurantId, groupItems] of Object.entries(restaurantGroups) as [string, CartItem[]][]) {
        const res = await api.post('/orders', {
          restaurantId,
          bagId: groupItems[0].id,
          restaurantName: groupItems[0].restaurantName,
          items: groupItems,
          price: groupItems.reduce((s: number, i: CartItem) => s + i.price * i.quantity, 0),
          tipAmount: checkoutData.tip,
          bookingFee: checkoutData.bookingFee,
          tax: checkoutData.tax,
          total: checkoutData.total,
          deliveryType: checkoutData.deliveryType,
          paymentMethod: checkoutData.paymentMethod,
          leaveAtDoor: checkoutData.leaveAtDoor ? 1 : 0,
        });
        createdOrderId = res.order?.id || '';
      }
      setOrderId(createdOrderId);
      clearCart();
      setCheckoutStep('tracking');
    } catch (error) {
      console.error('Error placing order:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !selectedBag) return;
    try {
      await api.post('/reviews', {
        restaurantId: selectedBag.restaurantId,
        orderId: orderId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setSelectedBag(null);
      setCheckoutStep('reserve');
      setReviewComment('');
      setReviewRating(5);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#1b5e52' }}>
      {/* Top Header / Filter Bar */}
      <div className={`border-b px-4 md:px-8 py-3 md:py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 ${activeTab === 'browse' ? 'hidden' : ''}`} style={{ backgroundColor: '#1b5e52', borderColor: 'rgba(0,0,0,0.12)' }}>
        <div className="flex items-center gap-2 md:gap-3 w-full md:flex-1 md:w-auto min-w-0 md:max-w-2xl">
          {/* Search with Autocomplete */}
          <div className="relative flex-1 min-w-0" ref={searchRef}>
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FA396]" />
            <input
              type="text"
              placeholder={t('Search for food...')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              className="w-full bg-[#F5F0E8] border border-[#E8E0D5] rounded-full py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-[#1B5E52] focus:ring-2 focus:ring-[#1B5E52]/10 transition-all text-[#1B1B1B] font-medium placeholder:text-[#B0BDB7]"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B0BDB7] hover:text-[#8FA396]">
                <X className="w-4 h-4" />
              </button>
            )}
            {/* Autocomplete Dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#E8E0D5] overflow-hidden z-50"
                >
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors text-left"
                      onClick={() => { setSearchQuery(s.label); setShowSuggestions(false); }}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.type === 'restaurant' ? 'bg-[#1B5E52]/10' : 'bg-eco-secondary/10'}`}>
                        {s.type === 'restaurant' ? <Store className="w-4 h-4 text-[#1B5E52]" /> : <Search className="w-4 h-4 text-eco-secondary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#1B1B1B] truncate">{s.label}</p>
                        <p className="text-[11px] text-[#8FA396] font-medium">{s.type === 'category' ? t('disc_search_category') : s.sublabel}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#C5BDB5] shrink-0" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            aria-label={t('Filters')}
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-full text-sm font-bold text-white transition-all shrink-0 border border-white/30 hover:bg-white/15"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden md:inline">{t('Filters')}</span>
            {(filters.dietary.length > 0 || filters.merchantType.length > 0) && (
              <span className="w-2 h-2 bg-eco-secondary rounded-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex p-1 rounded-full border border-white/25" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
            <button onClick={() => setActiveTab('discover')} className={`p-2 rounded-full transition-all ${activeTab === 'discover' ? 'bg-white text-[#1b5e52] shadow-sm' : 'text-white/70'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('browse')} className={`p-2 rounded-full transition-all ${activeTab === 'browse' ? 'bg-white text-[#1b5e52] shadow-sm' : 'text-white/70'}`}>
              <MapIcon className="w-4 h-4" />
            </button>
            <button onClick={() => setActiveTab('favorites')} className={`p-2 rounded-full transition-all ${activeTab === 'favorites' ? 'bg-white text-eco-secondary shadow-sm' : 'text-white/70'}`}>
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-[#1B5E52] text-white rounded-full shadow-md shadow-[#1B5E52]/20 hover:bg-[#164d43] hover:shadow-lg transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-eco-secondary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cart.reduce((acc, i) => acc + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      <AnimatePresence>
        {(filters.dietary.length > 0 || filters.merchantType.length > 0) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-[#E8E0D5] px-4 md:px-8 py-2 flex flex-wrap gap-2 overflow-hidden"
          >
            {filters.dietary.map(d => (
              <span key={d} className="flex items-center gap-1 px-3 py-1 bg-[#1B5E52]/10 text-[#1B5E52] text-xs font-black rounded-full">
                {d} <X className="w-3 h-3 cursor-pointer" onClick={() => useStore.getState().setFilters({ dietary: filters.dietary.filter(i => i !== d) })} />
              </span>
            ))}
            {filters.merchantType.map(m => (
              <span key={m} className="flex items-center gap-1 px-3 py-1 bg-eco-secondary/10 text-eco-secondary text-xs font-black rounded-full">
                {m} <X className="w-3 h-3 cursor-pointer" onClick={() => useStore.getState().setFilters({ merchantType: filters.merchantType.filter(i => i !== m) })} />
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1B5E52]/30 border-t-[#748f2b]"></div>
          </div>
        ) : (activeTab === 'discover' || activeTab === 'favorites' ? (
          <div ref={scrollContainerRef} className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {activeTab === 'favorites' ? t('Your Favorites') : t('Discover Surplus Meals')}
                  </h1>
                  <p className="font-medium mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {activeTab === 'favorites' ? t('Quickly access the meals you love.') : t('Save delicious food from going to waste near you.')}
                  </p>
                </div>
              </div>

              {/* AI-powered recommendations */}
              {activeTab === 'discover' && <AiRecommendations />}

              {/* Restaurant result cards */}
              {matchingRestaurants.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-black uppercase tracking-widest mb-3 px-1" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('disc_restaurants_label')}</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {matchingRestaurants.map(r => (
                      <Link
                        key={r.id}
                        to={`/store/${r.id}`}
                        className="flex-shrink-0 bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:shadow-lg hover:border-[#1B5E52]/20 transition-all w-36"
                      >
                        <div className="h-20 relative overflow-hidden bg-gradient-to-br from-[#1B5E52]/10 to-[#1B5E52]/5">
                          {r.cover ? (
                            <img src={r.cover} alt={r.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-8 h-8 text-[#1B5E52]/30" />
                            </div>
                          )}
                          {r.logo && (
                            <div className="absolute bottom-2 left-2 w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-md">
                              <img src={r.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-black text-[#1B1B1B] truncate">{r.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'favorites' ? (
                /* Favoriler tab'ında kullanıcı favori paketlerini görür — BagCard hâlâ kullanılır. */
                filteredBags.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredBags.map(bag => (
                      <BagCard key={bag.id} bag={bag} onClick={() => setSelectedBag(bag)} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 border border-white/20" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <Heart className="w-10 h-10 text-white/60" />
                    </div>
                    <h3 className="text-xl font-black text-white">{t('No meals found')}</h3>
                    <p className="font-medium max-w-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('Try adjusting your filters or search terms to find what you\'re looking for.')}</p>
                  </div>
                )
              ) : (
                /* Discover tab'ı: paketler yerine restoran kartları. */
                restaurantsList.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {restaurantsList.slice(0, visibleCount).map(r => (
                        <Link
                          key={r.id}
                          to={`/store/${r.id}`}
                          className="bg-white rounded-2xl overflow-hidden border border-[#E8E0D5] hover:shadow-lg hover:border-[#1B5E52]/30 transition-all"
                        >
                          <div className="h-32 relative overflow-hidden bg-gradient-to-br from-[#1B5E52]/10 to-[#1B5E52]/5">
                            {r.cover ? (
                              <img src={r.cover} alt={r.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Store className="w-12 h-12 text-[#1B5E52]/30" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 text-xs font-bold text-[#1B1B1B] shadow-sm">
                              <ShoppingBag className="w-3 h-3 text-[#1B5E52]" />
                              {r.bagCount}
                            </div>
                          </div>
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-black text-[#1B1B1B] truncate flex-1">{r.name}</p>
                              {r.avgRating > 0 && (
                                <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#1B5E52] shrink-0">
                                  <Star className="w-3 h-3 fill-current" />
                                  {r.avgRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            {r.category && (
                              <p className="text-[11px] text-[#8FA396] font-medium truncate mt-0.5">{r.category}</p>
                            )}
                            <p className="text-xs font-bold text-[#FF9F1C] mt-1.5">{t('disc_from_price', { price: TL(r.minPrice) })}</p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Infinite scroll loading indicator */}
                    {visibleCount < restaurantsList.length && (
                      <div className="flex justify-center items-center py-8 mt-4">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map(i => (
                            <span
                              key={i}
                              className="w-2 h-2 rounded-full animate-bounce"
                              style={{ backgroundColor: 'rgba(255,255,255,0.5)', animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 border border-white/20" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                      <Search className="w-10 h-10 text-white/60" />
                    </div>
                    <h3 className="text-xl font-black text-white">{t('disc_no_restaurants_title')}</h3>
                    <p className="font-medium max-w-xs mt-2" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('disc_no_restaurants_subtitle')}</p>
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* Floating Map Search */}
            <div className="absolute top-20 left-4 right-4 z-[1001] max-w-md mx-auto" ref={mapSearchRef}>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FA396]" />
                <input
                  type="text"
                  placeholder={t('Search on map...')}
                  value={mapSearch}
                  onChange={(e) => searchMapFn(e.target.value, bags)}
                  onFocus={() => mapSuggestions.length > 0 && setShowMapSuggestions(true)}
                  className="w-full bg-white shadow-lg rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E52]/20 transition-all text-[#1B1B1B] font-medium border border-[#E8E0D5]"
                />
                {mapSearchLoading && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1B5E52]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {!mapSearchLoading && mapSearch && (
                  <button onClick={() => { searchMapFn('', bags); setShowMapSuggestions(false); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#B0BDB7]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showMapSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#E8E0D5] overflow-hidden"
                  >
                    {mapSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors text-left"
                        onClick={() => {
                          searchMapFn(s.label, bags);
                          setShowMapSuggestions(false);
                          if (s.coords) {
                            setUserLocation(s.coords);
                            setLocationName(s.label);
                          }
                        }}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.type === 'restaurant' ? 'bg-[#1B5E52]/10' : 'bg-eco-secondary/10'}`}>
                          {s.type === 'restaurant' ? <Store className="w-4 h-4 text-[#1B5E52]" /> : <MapPin className="w-4 h-4 text-eco-secondary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#1B1B1B] truncate">{s.label}</p>
                          <p className="text-[11px] text-[#8FA396] font-medium">{s.sublabel}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <LocationPickerMap
              initialLocation={userLocation}
              initialName={locationName}
              onConfirm={async (coords, name) => {
                setUserLocation(coords);
                setLocationName(name);
                const geoData = await reverseGeocodeNominatim(coords.lat, coords.lng);
                const city = geoData?.address?.city || geoData?.address?.town || geoData?.address?.village || null;
                setLocationCity(city);
                localStorage.setItem('yugoda_location', JSON.stringify({ coords, name, city }));
                setActiveTab('discover');
              }}
              onClose={() => setActiveTab('discover')}
            />
          </div>
        ))}
      </div>

      {/* Filter Panel */}
      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => { setIsCartOpen(false); navigate('/checkout'); }}
      />

      {/* AI Chat — hidden on map/browse tab */}
      {activeTab !== 'browse' && <AiChatWidget />}

      {/* Checkout Flow Overlay */}
      <AnimatePresence>
        {selectedBag && checkoutStep !== 'reserve' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setSelectedBag(null); setCheckoutStep('reserve'); }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 md:p-6 border-b border-[#E8E0D5] flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="font-black text-xl text-[#1B1B1B]">{t('Order Details')}</h3>
                <button
                  onClick={() => { setSelectedBag(null); setCheckoutStep('reserve'); }}
                  className="p-2 hover:bg-[#F5F0E8] rounded-full transition-colors text-[#8FA396]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 md:p-8">
                {checkoutStep === 'pay' && checkoutData && (
                  <div className="flex flex-col items-center py-10 space-y-8">
                    <div className="text-center">
                      <h2 className="text-4xl font-black text-[#1B1B1B] mb-2">₺{checkoutData.total.toFixed(2)}</h2>
                      <p className="text-[#8FA396] font-medium">{t('Secure Payment with EcoPay')}</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                      <div className="p-4 border-2 border-[#1B5E52] rounded-2xl flex items-center justify-between bg-[#1B5E52]/6">
                        <div className="flex items-center gap-3">
                          {checkoutData.paymentMethod === 'card' ? <CreditCard className="w-5 h-5 text-[#1B5E52]" /> : checkoutData.paymentMethod === 'wallet' ? <Wallet className="w-5 h-5 text-[#1B5E52]" /> : <ShoppingBag className="w-5 h-5 text-[#1B5E52]" />}
                          <span className="font-black text-[#1B1B1B] capitalize">{checkoutData.paymentMethod}</span>
                        </div>
                        <span className="text-xs font-black text-[#1B5E52]">{t('Selected')}</span>
                      </div>

                      {checkoutData.paymentMethod === 'wallet' && (
                        <div className="p-4 bg-[#748f2b]/15 rounded-2xl flex items-center gap-3 border border-[#748f2b]/30">
                          <Info className="w-4 h-4 text-[#5a7a1a]" />
                          <p className="text-xs text-[#5a7a1a] font-bold">
                            {t('Current balance')}: ₺{userProfile?.walletBalance?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmOrder}
                      className="w-full max-w-sm eco-button-primary py-4 text-base"
                    >
                      {t('Confirm Payment')} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {checkoutStep === 'tracking' && (
                  <div className="py-8 space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-[#1B1B1B]">{t('Live Tracking')}</h2>
                      <p className="text-[#8FA396] font-medium">{t('Driver is on the way')}</p>
                    </div>

                    <div className="h-64 rounded-2xl overflow-hidden border border-[#E8E0D5]">
                      <GoogleMapsView
                        bags={[]}
                        userLocation={userLocation}
                        selectedBag={null}
                        onBagSelect={() => { }}
                        apiKey={GOOGLE_MAPS_API_KEY}
                        mapId={GOOGLE_MAPS_MAP_ID || undefined}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-[#F5F0E8] rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-[#1B5E52] flex items-center justify-center text-white shadow-sm">
                          <Truck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-[#1B1B1B]">EcoDriver John</p>
                          <p className="text-xs text-[#8FA396] font-medium">Toyota Prius • ABC-123</p>
                        </div>
                        <button className="ml-auto p-2 bg-white rounded-full shadow-sm border border-[#E8E0D5]">
                          <MessageCircle className="w-5 h-5 text-[#1B5E52]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm py-2">
                        <span className="text-[#8FA396] font-medium">{t('Pickup Time')}</span>
                        <span className="font-black text-[#1B1B1B] capitalize">{checkoutData?.pickupTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm py-2 border-t border-[#E8E0D5]">
                        <span className="text-[#8FA396] font-medium">{t('Estimated Arrival')}</span>
                        <span className="font-black text-[#1B1B1B]">{t('disc_12_mins')}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep('success')}
                      className="w-full eco-button-primary py-4"
                    >
                      {t('Simulate Delivery Completion')}
                    </button>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div className="text-center py-12 space-y-6">
                    <div className="w-24 h-24 bg-[#748f2b]/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#748f2b]/40">
                      <CheckCircle2 className="w-12 h-12 text-[#1B5E52]" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-[#1B1B1B]">{t('Order Delivered')}!</h2>
                      <p className="text-[#8FA396] font-medium mt-2">{t('Your Magic Bag has been delivered. Enjoy your meal!')}</p>
                    </div>

                    <div className="bg-[#F5F0E8] p-4 rounded-2xl space-y-3">
                      <p className="text-xs font-black text-[#8FA396] uppercase tracking-widest flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" /> {t('Proof of Delivery')}
                      </p>
                      <img
                        src="https://picsum.photos/seed/delivery/400/300"
                        alt="Proof of Delivery"
                        className="w-full h-40 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="bg-[#F5F0E8] p-6 rounded-2xl max-w-xs mx-auto border border-[#E8E0D5]">
                      <p className="text-xs text-[#8FA396] font-black uppercase tracking-widest mb-1">{t('Order ID')}</p>
                      <p className="text-3xl font-mono font-black text-[#1B1B1B]">{orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : '#—'}</p>
                    </div>
                    <button
                      onClick={() => setCheckoutStep('review')}
                      className="eco-button-coral px-12 py-3"
                    >
                      {t('Leave a Review')}
                    </button>
                    <button
                      onClick={() => { setSelectedBag(null); setCheckoutStep('reserve'); }}
                      className="block mx-auto text-sm text-[#8FA396] font-medium hover:text-[#5C6B63] transition-colors"
                    >
                      {t('Skip for now')}
                    </button>
                  </div>
                )}

                {checkoutStep === 'review' && (
                  <div className="py-8 space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-[#1B1B1B]">{t('How was your experience?')}</h2>
                      <p className="text-[#8FA396] font-medium mt-1">{t('Rate your pickup from')} {selectedBag.restaurantName}</p>
                    </div>

                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`p-2 transition-all ${reviewRating >= star ? 'text-eco-secondary' : 'text-[#C5BDB5]'}`}
                        >
                          <Star className={`w-10 h-10 ${reviewRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-[#5C6B63]">{t('Comments')}</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={t('Tell us about the food quality and pickup experience...')}
                        className="w-full bg-[#F5F0E8] border border-[#E8E0D5] rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#1B5E52]/20 focus:border-[#1B5E52] outline-none text-[#1B1B1B] min-h-[120px] font-medium"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      className="w-full eco-button-primary py-4 text-base"
                    >
                      {t('Submit Review')} <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

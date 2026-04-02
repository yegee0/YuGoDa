import React, { useState, useEffect, useRef } from 'react';
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
import { useCountdown } from '@/hooks/useCountdown';
import { useStore } from '@/app/store/useStore';
import { useBags } from '@/hooks/useBags';
import { useLocationManager } from '@/hooks/useLocationManager';
import FilterPanel from '@/components/FilterPanel';
import CartDrawer from '@/components/CartDrawer';
import { api } from '@/lib/api';

const GOOGLE_MAPS_API_KEY: string = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ?? '';
const GOOGLE_MAPS_MAP_ID: string = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID ?? '';

function BagCard({ bag, onClick }: any) {
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
          <img
            src={bag.image}
            alt={bag.restaurantName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>

        {bag.isCurrentlyOpen === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-gray-900/80 text-white text-xs font-bold rounded-full tracking-wide">
              {t('Closed')}
            </span>
          </div>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(bag.id); }}
            className={`p-2 rounded-full backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#1A4D2E] flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current text-[#FF9F1C]" /> {bag.rating || 4.5}
          </div>
        </div>

        {bag.isLastChance && (
          <div className="absolute bottom-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse shadow-lg">
            <Clock className="w-3 h-3" /> {countdown}
          </div>
        )}

        <div className="absolute top-3 left-3 bg-[#1A4D2E] text-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm">
          {bag.available} {t('left')}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/store/${bag.restaurantId || 'pizza-bulls'}`}>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-[#1A4D2E] transition-colors">{bag.restaurantName}</h3>
          </Link>
          <div className="text-right">
            <span className="font-bold text-[#1A4D2E] dark:text-[#2D6A4F] text-lg">₺{bag.price.toFixed(2)}</span>
            <p className="text-[10px] text-gray-400 line-through">₺{bag.originalPrice?.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-2">{bag.category} • {bag.distance || '0.5 miles'}</p>

        {/* Tags & Dietary */}
        <div className="flex flex-wrap gap-1 mb-4">
          {bag.dietaryType && (
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Leaf className="w-2 h-2" /> {bag.dietaryType}
            </span>
          )}
          {bag.merchantType && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1">
              <Store className="w-2 h-2" /> {bag.merchantType}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 text-[#FF9F1C]" />
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
                image: bag.image
              });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              bag.isCurrentlyOpen === false
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                : 'bg-[#1A4D2E]/10 text-[#1A4D2E] hover:bg-[#1A4D2E] hover:text-white'
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
  const [selectedBag, setSelectedBag] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'reserve' | 'pay' | 'tracking' | 'success' | 'review'>('reserve');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mapInfoBag, setMapInfoBag] = useState<any | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { user, userProfile, filters, cart, clearCart } = useStore();

  // Extracted hooks
  const { bags, filteredBags, loading } = useBags(searchQuery, activeTab);
  const {
    userLocation, setUserLocation,
    locationName, setLocationName,
    mapSearch, setMapSearch: searchMapFn,
    mapSuggestions, showMapSuggestions, setShowMapSuggestions,
    mapSearchLoading, mapSearchRef,
  } = useLocationManager();

  // Build autocomplete suggestions from bags data
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const seen = new Set<string>();
    const suggestions: any[] = [];
    bags.forEach(bag => {
      if (bag.restaurantName.toLowerCase().includes(q) && !seen.has(bag.restaurantName)) {
        seen.add(bag.restaurantName);
        suggestions.push({ type: 'restaurant', label: bag.restaurantName, sublabel: bag.category, bag });
      }
    });
    const categories = [...new Set(bags.map((b: any) => b.category))].filter((c: any) => c.toLowerCase().includes(q));
    categories.forEach((c: any) => {
      if (!seen.has(c)) {
        seen.add(c);
        suggestions.push({ type: 'category', label: c, sublabel: 'Category' });
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

  const handleCheckout = async (data: any) => {
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
      const restaurantGroups = checkoutData.items.reduce((acc: any, item: any) => {
        if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      let createdOrderId = '';
      for (const [restaurantId, items] of Object.entries(restaurantGroups) as any) {
        const res = await api.post('/orders', {
          restaurantId,
          bagId: (items as any[])[0].id,
          restaurantName: (items as any[])[0].restaurantName,
          items,
          price: (items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0),
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
    <div className="flex-1 flex flex-col h-full bg-[#F9F9F9] dark:bg-[#0A0A0A] overflow-hidden">
      {/* Top Header / Filter Bar — hidden on Browse Map tab (has its own floating search) */}
      <div className={`bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between gap-4 sticky top-0 z-20 ${activeTab === 'browse' ? 'hidden' : ''}`}>
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Search with Autocomplete */}
          <div className="relative flex-1" ref={searchRef}>
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('Search for restaurants, meals, or categories...')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]/20 transition-all dark:text-white"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                >
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      onClick={() => { setSearchQuery(s.label); setShowSuggestions(false); }}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.type === 'restaurant' ? 'bg-[#1A4D2E]/10' : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                        {s.type === 'restaurant' ? <Store className="w-4 h-4 text-[#1A4D2E]" /> : <Search className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.label}</p>
                        <p className="text-[11px] text-gray-400">{s.sublabel}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <Filter className="w-4 h-4" />
            {t('Filters')}
            {(filters.dietary.length > 0 || filters.merchantType.length > 0) && (
              <span className="w-2 h-2 bg-[#1A4D2E] rounded-full" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab('discover')} className={`p-2 rounded-lg transition-all ${activeTab === 'discover' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-400'}`}>
              <Grid className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('browse')} className={`p-2 rounded-lg transition-all ${activeTab === 'browse' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-400'}`}>
              <MapIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('favorites')} className={`p-2 rounded-lg transition-all ${activeTab === 'favorites' ? 'bg-white dark:bg-gray-700 text-[#1A4D2E] shadow-sm' : 'text-gray-400'}`}>
              <Heart className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-[#1A4D2E] text-white rounded-xl shadow-lg shadow-[#1A4D2E]/20 hover:scale-105 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-[#111111]">
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
            className="bg-white dark:bg-[#111111] px-8 py-2 flex flex-wrap gap-2 overflow-hidden"
          >
            {filters.dietary.map(d => (
              <span key={d} className="flex items-center gap-1 px-3 py-1 bg-[#1A4D2E]/10 text-[#1A4D2E] text-xs font-bold rounded-full">
                {d} <X className="w-3 h-3 cursor-pointer" onClick={() => useStore.getState().setFilters({ dietary: filters.dietary.filter(i => i !== d) })} />
              </span>
            ))}
            {filters.merchantType.map(m => (
              <span key={m} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                {m} <X className="w-3 h-3 cursor-pointer" onClick={() => useStore.getState().setFilters({ merchantType: filters.merchantType.filter(i => i !== m) })} />
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A4D2E]"></div>
          </div>
        ) : (activeTab === 'discover' || activeTab === 'favorites' ? (
          <div className="h-full overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {activeTab === 'favorites' ? t('Your Favorites') : t('Discover Surplus Meals')}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {activeTab === 'favorites' ? t('Quickly access the meals you love.') : t('Save delicious food from going to waste near you.')}
                  </p>
                </div>
              </div>

              {filteredBags.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredBags.map(bag => (
                    <BagCard key={bag.id} bag={bag} onClick={() => setSelectedBag(bag)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('No meals found')}</h3>
                  <p className="text-gray-500 max-w-xs">{t('Try adjusting your filters or search terms to find what you\'re looking for.')}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-full w-full">
            {/* Floating Map Search */}
            <div className="absolute top-20 left-4 right-4 z-[1001] max-w-md mx-auto" ref={mapSearchRef}>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('Search on map...')}
                  value={mapSearch}
                  onChange={(e) => searchMapFn(e.target.value, bags)}
                  onFocus={() => mapSuggestions.length > 0 && setShowMapSuggestions(true)}
                  className="w-full bg-white dark:bg-[#1a1a1a] shadow-lg rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] transition-all dark:text-white"
                />
                {mapSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A4D2E]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {!mapSearchLoading && mapSearch && (
                  <button onClick={() => { searchMapFn('', bags); setShowMapSuggestions(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showMapSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                  >
                    {mapSuggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        onClick={() => {
                          searchMapFn(s.label, bags);
                          setShowMapSuggestions(false);
                          if (s.coords) {
                            setUserLocation(s.coords);
                            setLocationName(s.label);
                          }
                        }}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.type === 'restaurant' ? 'bg-[#1A4D2E]/10' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                          {s.type === 'restaurant' ? <Store className="w-4 h-4 text-[#1A4D2E]" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{s.label}</p>
                          <p className="text-[11px] text-gray-400">{s.sublabel}</p>
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
              onConfirm={(coords, name) => {
                setUserLocation(coords);
                setLocationName(name);
                localStorage.setItem('yugoda_location', JSON.stringify({ coords, name }));
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
              className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-bold text-xl dark:text-white">{t('Order Details')}</h3>
                <button
                  onClick={() => { setSelectedBag(null); setCheckoutStep('reserve'); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {checkoutStep === 'pay' && checkoutData && (
                  <div className="flex flex-col items-center py-12 space-y-8">
                    <div className="text-center">
                      <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">₺{checkoutData.total.toFixed(2)}</h2>
                      <p className="text-gray-500">{t('Secure Payment with EcoPay')}</p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                      <div className="p-4 border-2 border-[#1A4D2E] rounded-2xl flex items-center justify-between bg-[#1A4D2E]/5">
                        <div className="flex items-center gap-3">
                          {checkoutData.paymentMethod === 'card' ? <CreditCard className="w-5 h-5 text-[#1A4D2E]" /> : checkoutData.paymentMethod === 'wallet' ? <Wallet className="w-5 h-5 text-[#1A4D2E]" /> : <ShoppingBag className="w-5 h-5 text-[#1A4D2E]" />}
                          <span className="font-bold dark:text-white capitalize">{checkoutData.paymentMethod}</span>
                        </div>
                        <span className="text-xs font-bold text-[#1A4D2E]">{t('Selected')}</span>
                      </div>

                      {checkoutData.paymentMethod === 'wallet' && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center gap-3">
                          <Info className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs text-emerald-600 font-medium">
                            {t('Current balance')}: ₺{userProfile?.walletBalance?.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleConfirmOrder}
                      className="w-full max-w-sm eco-button-primary py-4 text-lg flex items-center justify-center gap-2"
                    >
                      {t('Confirm Payment')} <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {checkoutStep === 'tracking' && (
                  <div className="py-8 space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Live Tracking')}</h2>
                      <p className="text-gray-500">{t('Driver is on the way')}</p>
                    </div>

                    <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                      <GoogleMapsView
                        bags={[]}
                        userLocation={userLocation}
                        selectedBag={null}
                        onBagSelect={() => { }}
                        apiKey={GOOGLE_MAPS_API_KEY}
                        mapId={GOOGLE_MAPS_MAP_ID || undefined}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                        <div className="w-12 h-12 rounded-full bg-[#1A4D2E] flex items-center justify-center text-white">
                          <Truck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold dark:text-white">EcoDriver John</p>
                          <p className="text-xs text-gray-500">Toyota Prius • ABC-123</p>
                        </div>
                        <button className="ml-auto p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                          <MessageCircle className="w-5 h-5 text-[#1A4D2E]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t('Pickup Time')}</span>
                        <span className="font-bold dark:text-white capitalize">{checkoutData.pickupTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{t('Estimated Arrival')}</span>
                        <span className="font-bold dark:text-white">12 mins</span>
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
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('Order Delivered')}!</h2>
                      <p className="text-gray-500 mt-2">{t('Your Magic Bag has been delivered. Enjoy your meal!')}</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                        <Camera className="w-4 h-4" /> {t('Proof of Delivery')}
                      </p>
                      <img
                        src="https://picsum.photos/seed/delivery/400/300"
                        alt="Proof of Delivery"
                        className="w-full h-40 object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl max-w-xs mx-auto">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{t('Order ID')}</p>
                      <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">{orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : '#—'}</p>
                    </div>
                    <button
                      onClick={() => setCheckoutStep('review')}
                      className="eco-button-primary px-12 py-3"
                    >
                      {t('Leave a Review')}
                    </button>
                    <button
                      onClick={() => { setSelectedBag(null); setCheckoutStep('reserve'); }}
                      className="block mx-auto text-sm text-gray-500 hover:underline"
                    >
                      {t('Skip for now')}
                    </button>
                  </div>
                )}

                {checkoutStep === 'review' && (
                  <div className="py-8 space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('How was your experience?')}</h2>
                      <p className="text-gray-500 mt-1">{t('Rate your pickup from')} {selectedBag.restaurantName}</p>
                    </div>

                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`p-2 transition-all ${reviewRating >= star ? 'text-[#FF9F1C]' : 'text-gray-300'}`}
                        >
                          <Star className={`w-10 h-10 ${reviewRating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('Comments')}</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder={t('Tell us about the food quality and pickup experience...')}
                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#1A4D2E] outline-none dark:text-white min-h-[120px]"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      className="w-full eco-button-primary py-4 text-lg flex items-center justify-center gap-2"
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

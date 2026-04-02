import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Filter,
  Check,
  RotateCcw,
  DollarSign,
  Leaf,
  Store,
  Utensils,
  Star,
  MapPin,
  Zap,
  Wheat,
  Flame,
  Fish,
  Egg,
  Milk,
  Nut,
  Heart,
  ShoppingCart,
  Coffee,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '@/app/store/useStore';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Dietary option definitions
// ─────────────────────────────────────────────
const DIETARY_OPTIONS = [
  { id: 'Vegan', label: 'Vegan', icon: <Leaf className="w-3.5 h-3.5" /> },
  { id: 'Vegetarian', label: 'Vegetarian', icon: <Leaf className="w-3.5 h-3.5" /> },
  { id: 'Gluten-Free', label: 'Gluten-Free', icon: <Wheat className="w-3.5 h-3.5" /> },
  { id: 'Halal', label: 'Halal', icon: <Check className="w-3.5 h-3.5" /> },
];

// ─────────────────────────────────────────────
// Merchant type options
// ─────────────────────────────────────────────
const MERCHANT_OPTIONS = [
  { id: 'Restaurant', label: 'Restaurant', icon: <Utensils className="w-4 h-4" /> },
  { id: 'Bakery', label: 'Bakery', icon: <Coffee className="w-4 h-4" /> },
  { id: 'Supermarket', label: 'Supermarket', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'Café', label: 'Café', icon: <Coffee className="w-4 h-4" /> },
];

const SORT_OPTIONS = [
  { id: 'lowest', label: 'Lowest Price', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'highest', label: 'Highest Rated', icon: <Star className="w-4 h-4" /> },
  { id: 'nearest', label: 'Nearest', icon: <MapPin className="w-4 h-4" /> },
  { id: 'fastest', label: 'Fastest Pickup', icon: <Zap className="w-4 h-4" /> },
];

// ─────────────────────────────────────────────
// Collapsible section helper
// ─────────────────────────────────────────────
function Section({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
          {badge ? (
            <span className="w-5 h-5 bg-[#1A4D2E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {badge}
            </span>
          ) : null}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters } = useStore();

  const totalActive =
    filters.dietary.length +
    filters.merchantType.length +
    (filters.sortBy ? 1 : 0);

  const toggleDietary = (id: string) => {
    setFilters({
      dietary: filters.dietary.includes(id)
        ? filters.dietary.filter(d => d !== id)
        : [...filters.dietary, id],
    });
  };

  const toggleMerchant = (id: string) => {
    setFilters({
      merchantType: filters.merchantType.includes(id)
        ? filters.merchantType.filter(m => m !== id)
        : [...filters.merchantType, id],
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#141414] shadow-2xl z-[101] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A4D2E]/10 flex items-center justify-center text-[#1A4D2E]">
                  <Filter className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">{t('Filters')}</h2>
                  {totalActive > 0 && (
                    <p className="text-xs text-[#1A4D2E] font-semibold mt-0.5">{totalActive} active</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* ── Sort By ── */}
              <Section title={t('Sort By')} badge={filters.sortBy ? 1 : 0}>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilters({ sortBy: opt.id as any })}
                      className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold transition-all border ${filters.sortBy === opt.id
                        ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-lg shadow-[#1A4D2E]/20'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-gray-700 hover:border-[#1A4D2E]/40'
                        }`}
                    >
                      {opt.icon}
                      <span className="truncate">{t(opt.label)}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* ── Price Range ── */}
              <Section title={t('Price Range')}>
                <div className="space-y-3 px-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">₺0</span>
                    <span className="font-bold text-[#1A4D2E]">
                      ₺{filters.priceRange[0]} – ₺{filters.priceRange[1]}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">₺100</span>
                  </div>
                  {/* Dual range track */}
                  <div className="relative h-6 flex items-center">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full relative">
                      <div
                        className="absolute h-2 bg-[#1A4D2E] rounded-full"
                        style={{
                          left: `${filters.priceRange[0]}%`,
                          width: `${filters.priceRange[1] - filters.priceRange[0]}%`,
                        }}
                      />
                    </div>
                    <input
                      type="range" min="0" max="100"
                      value={filters.priceRange[0]}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (v < filters.priceRange[1])
                          setFilters({ priceRange: [v, filters.priceRange[1]] });
                      }}
                      className="absolute w-full h-2 opacity-0 cursor-pointer"
                    />
                    <input
                      type="range" min="0" max="100"
                      value={filters.priceRange[1]}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        if (v > filters.priceRange[0])
                          setFilters({ priceRange: [filters.priceRange[0], v] });
                      }}
                      className="absolute w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                  {/* Quick preset chips */}
                  <div className="flex gap-2 flex-wrap pt-1">
                    {[[0, 5], [0, 10], [0, 20], [0, 50]].map(([lo, hi]) => (
                      <button
                        key={`${lo}-${hi}`}
                        onClick={() => setFilters({ priceRange: [lo, hi] })}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${filters.priceRange[0] === lo && filters.priceRange[1] === hi
                          ? 'bg-[#1A4D2E] text-white border-[#1A4D2E]'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:border-[#1A4D2E]/30'
                          }`}
                      >
                        Under ${hi}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              {/* ── Dietary Preferences ── */}
              <Section title={t('Dietary Preferences')} badge={filters.dietary.length}>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((opt) => {
                    const active = filters.dietary.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleDietary(opt.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all border ${active
                          ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#1A4D2E]/30'
                          }`}
                      >
                        <span className="flex items-center text-current">{opt.icon}</span>
                        {t(opt.label)}
                        {active && <X className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* ── Merchant Type ── */}
              <Section title={t('Merchant Type')} badge={filters.merchantType.length}>
                <div className="grid grid-cols-2 gap-2">
                  {MERCHANT_OPTIONS.map((opt) => {
                    const active = filters.merchantType.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleMerchant(opt.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-all border ${active
                          ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-md'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#1A4D2E]/30'
                          }`}
                      >
                        <span className="flex items-center text-current">{opt.icon}</span>
                        {t(opt.label)}
                        {active && <X className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* ── Min Rating ── */}
              <Section title="Minimum Rating">
                <div className="flex gap-2">
                  {[3, 3.5, 4, 4.5, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilters({ minRating: (filters as any).minRating === rating ? 0 : rating })}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-bold border transition-all ${(filters as any).minRating === rating
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent text-gray-600 dark:text-gray-400 hover:border-amber-200'
                        }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {rating}+
                    </button>
                  ))}
                </div>
              </Section>

              {/* ── Pickup Time ── */}
              <Section title="Pickup Time">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'today', label: 'Today', icon: <Store className="w-5 h-5 mb-1" /> },
                    { id: 'morning', label: 'Morning', icon: <Zap className="w-5 h-5 mb-1" /> },
                    { id: 'evening', label: 'Evening', icon: <Star className="w-5 h-5 mb-1" /> },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        const newTime = (filters as any).pickupTime === opt.id ? null : opt.id as 'today' | 'morning' | 'evening';
                        setFilters({ pickupTime: newTime });
                      }}
                      className={`flex flex-col items-center p-3 rounded-2xl text-xs font-bold border transition-all ${(filters as any).pickupTime === opt.id
                        ? 'bg-[#1A4D2E] text-white border-[#1A4D2E] shadow-lg'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#1A4D2E]/30'
                        }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Section>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#141414] flex gap-3 shrink-0">
              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-4 bg-[#1A4D2E] text-white rounded-2xl font-bold shadow-lg shadow-[#1A4D2E]/20 hover:bg-[#133b23] transition-colors"
              >
                {totalActive > 0 ? `Apply ${totalActive} Filter${totalActive > 1 ? 's' : ''}` : 'Apply Filters'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

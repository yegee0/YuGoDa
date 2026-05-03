import { StateCreator } from 'zustand';
import type { Notification } from '@/types';

export interface Filters {
  sortBy: 'lowest' | 'highest' | 'nearest' | 'fastest';
  priceRange: [number, number];
  dietary: string[];
  merchantType: string[];
  minRating: number;
  pickupTime: 'today' | 'morning' | 'evening' | null;
}

export interface UiSlice {
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  /** City used for restaurant discovery — updated by map picker and "Use" address button */
  locationCity: string | null;
  setLocationCity: (city: string | null) => void;
}

const initialFilters: Filters = {
  sortBy: 'lowest',
  priceRange: [0, 100],
  dietary: [],
  merchantType: [],
  minRating: 0,
  pickupTime: null,
};

function readCityFromStorage(): string | null {
  try {
    const saved = localStorage.getItem('yugoda_location');
    if (saved) return (JSON.parse(saved) as { city?: string }).city || null;
  } catch { /* ignore */ }
  return null;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  isDarkMode: localStorage.getItem('theme') === 'dark',
  setIsDarkMode: (isDarkMode) => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDarkMode });
  },
  filters: initialFilters,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({ filters: initialFilters }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  locationCity: readCityFromStorage(),
  setLocationCity: (city) => set({ locationCity: city }),
});

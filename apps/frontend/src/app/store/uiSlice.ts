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
}

const initialFilters: Filters = {
  sortBy: 'lowest',
  priceRange: [0, 100],
  dietary: [],
  merchantType: [],
  minRating: 0,
  pickupTime: null,
};

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
});

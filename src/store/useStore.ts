import { create } from 'zustand';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role: 'customer' | 'restaurant' | 'admin' | 'driver';
  favorites: string[];
  walletBalance: number;
  countryCode?: string;
  mobileNumber?: string;
  addresses: any[];
}

interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Filters {
  sortBy: 'lowest' | 'highest' | 'nearest' | 'fastest';
  priceRange: [number, number];
  dietary: string[];
  merchantType: string[];
  minRating: number;
  pickupTime: 'today' | 'morning' | 'evening' | null;
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  favorites: string[];
  setFavorites: (favorites: string[]) => void;
  toggleFavorite: (id: string) => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;

  orders: any[];
  setOrders: (orders: any[]) => void;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
}

const initialFilters: Filters = {
  sortBy: 'lowest',
  priceRange: [0, 100],
  dietary: [],
  merchantType: [],
  minRating: 0,
  pickupTime: null,
};

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  userProfile: null,
  setUserProfile: (userProfile) => set({ userProfile }),
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),
  toggleFavorite: async (id: string) => {
    const { user, favorites } = get();
    if (!user) return;

    const isFavorite = favorites.includes(id);
    const userRef = doc(db, 'users', user.uid);

    try {
      if (isFavorite) {
        set((state) => ({ favorites: state.favorites.filter((f) => f !== id) }));
        await updateDoc(userRef, {
          favorites: arrayRemove(id)
        });
      } else {
        set((state) => ({ favorites: [...state.favorites, id] }));
        await updateDoc(userRef, {
          favorites: arrayUnion(id)
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Rollback on error
      if (isFavorite) {
        set((state) => ({ favorites: [...state.favorites, id] }));
      } else {
        set((state) => ({ favorites: state.favorites.filter((f) => f !== id) }));
      }
    }
  },

  // Cart
  cart: [],
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.id === item.id);
    if (existing) {
      return {
        cart: state.cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      };
    }
    return { cart: [...state.cart, item] };
  }),
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(i => i.id !== id)
  })),
  updateCartQuantity: (id, quantity) => set((state) => ({
    cart: state.cart.map(i => i.id === id ? { ...i, quantity } : i)
  })),
  clearCart: () => set({ cart: [] }),

  // Filters
  filters: initialFilters,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  resetFilters: () => set({ filters: initialFilters }),

  orders: [],
  setOrders: (orders) => set({ orders }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  isAuthReady: false,
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),
  isDarkMode: localStorage.getItem('theme') !== 'light',
  setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
}));

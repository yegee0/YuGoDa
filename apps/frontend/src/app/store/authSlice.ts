import { StateCreator } from 'zustand';
import { User } from 'firebase/auth';
import { api } from '@/lib/api';

export interface UserProfile {
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
  notificationsEnabled: boolean;
  preferredLanguage: string;
  addresses: any[];
}

export interface AuthSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  favorites: string[];
  setFavorites: (favorites: string[]) => void;
  toggleFavorite: (id: string) => Promise<void>;
  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  userProfile: null,
  setUserProfile: (userProfile) => set({ userProfile }),
  favorites: [],
  setFavorites: (favorites) => set({ favorites }),
  toggleFavorite: async (id: string) => {
    const { favorites } = get();
    const isFavorite = favorites.includes(id);

    // Optimistic update
    if (isFavorite) {
      set((state) => ({ favorites: state.favorites.filter((f) => f !== id) }));
    } else {
      set((state) => ({ favorites: [...state.favorites, id] }));
    }

    // Backend'e senkronize et
    try {
      const data = await api.put('/users/me/favorites', { bagId: id });
      if (data.favorites) {
        set({ favorites: data.favorites });
      }
    } catch {
      // Hata durumunda geri al
      set({ favorites });
    }
  },
  isAuthReady: false,
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),
});

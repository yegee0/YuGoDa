import { StateCreator } from 'zustand';
import { User } from 'firebase/auth';

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

    // For now, update state locally. Real API calls will map to the custom backend soon.
    if (isFavorite) {
      set((state) => ({ favorites: state.favorites.filter((f) => f !== id) }));
    } else {
      set((state) => ({ favorites: [...state.favorites, id] }));
    }
  },
  isAuthReady: false,
  setIsAuthReady: (ready) => set({ isAuthReady: ready }),
});

import { create } from 'zustand';
import { AuthSlice, createAuthSlice } from './authSlice';
import { CartSlice, createCartSlice } from './cartSlice';
import { UiSlice, createUiSlice } from './uiSlice';

// Re-export types for convenience
export type { UserProfile } from './authSlice';
export type { CartItem } from './cartSlice';
export type { Filters } from './uiSlice';

export type AppState = AuthSlice & CartSlice & UiSlice;

export const useStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createCartSlice(...a),
  ...createUiSlice(...a),
}));

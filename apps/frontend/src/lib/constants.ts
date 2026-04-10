import type React from 'react';

// ── Brand Colors ──────────────────────────────────────────────
export const COLORS = {
  forest: '#1B5E52',
  forestDark: '#164d43',
  orange: '#FF9F1C',
} as const;

// ── Auth Page Palettes ────────────────────────────────────────
export const AUTH_PALETTE = {
  forest: '#0e2e1e',
  forestMid: '#163d28',
  lime: '#c5f135',
  orange: '#e05a2b',
  cream: '#f5f0e8',
  white: '#ffffff',
  bg: '#0e2e1e',
} as const;

// ── Order / Bag Status ────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-600' },
  confirmed: { label: 'Confirmed', cls: 'bg-[#1B5E52]/10 text-[#1B5E52]' },
  preparing: { label: 'Preparing', cls: 'bg-blue-50 text-blue-600' },
  ready:     { label: 'Ready',     cls: 'bg-purple-50 text-purple-600' },
  picked_up: { label: 'Picked Up', cls: 'bg-indigo-50 text-indigo-600' },
  delivering:{ label: 'Delivering',cls: 'bg-cyan-50 text-cyan-600' },
  delivered: { label: 'Delivered', cls: 'bg-[#748f2b]/20 text-[#5a7a1a]' },
  cancelled: { label: 'Cancelled', cls: 'bg-[#ad3115]/10 text-[#ad3115]' },
  completed: { label: 'Completed', cls: 'bg-[#748f2b]/20 text-[#5a7a1a]' },
};

// ── Day Names ─────────────────────────────────────────────────
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ── Business Constants ────────────────────────────────────────
export const DELIVERY_FEE = 15;
export const ORDER_POLL_INTERVAL = 30_000;
export const DEFAULT_COMMISSION_RATE = 15;

// ── Restaurant Signup ─────────────────────────────────────────
export const BUSINESS_TYPES = ['Restaurant', 'Bakery & Patisserie', 'Grocery Store', 'Cafe'] as const;

// ── Font Helpers ──────────────────────────────────────────────
export const FONT_PLAYFAIR: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif' };
export const FONT_DM: React.CSSProperties = { fontFamily: '"DM Sans", system-ui, sans-serif' };
export const FONT_MONO: React.CSSProperties = { fontFamily: '"DM Mono", "Courier New", monospace' };

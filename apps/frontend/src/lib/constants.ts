import type React from 'react';

// ── Brand Colors ──────────────────────────────────────────────
export const COLORS = {
  forest: '#1A4D2E',
  forestDark: '#133b23',
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
  pending:   { label: 'Pending',   cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
  confirmed: { label: 'Confirmed', cls: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' },
  preparing: { label: 'Preparing', cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
  ready:     { label: 'Ready',     cls: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
  picked_up: { label: 'Picked Up', cls: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
  delivering:{ label: 'Delivering',cls: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600' },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 dark:bg-red-900/20 text-red-500' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
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

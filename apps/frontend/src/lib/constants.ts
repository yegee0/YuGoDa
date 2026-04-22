import type React from 'react';

// ── Brand Colors ──────────────────────────────────────────────
export const COLORS = {
  forest: '#1B5E52',
  forestDark: '#164d43',
  orange: '#FF9F1C',
  sidebarWarm: '#d4553a',
  // Multi-role warm red: danger/urgent (cancelled status, Urgent priority, error
  // text), favorites/stars (store ratings, heart icon), and primary-CTA accents
  // (favorite-tab, dispute-error text). Same color serves all these roles by
  // team-lead direction; keep as one token. Also mirrored at
  // `app/index.css --color-eco-secondary` for Tailwind class consumption
  // (`bg-eco-secondary` / `text-eco-secondary`).
  accentWarm: '#ad3115',
  // ── Logo palette (canonical across nav, sidebar, auth, legal surfaces) ──
  logoBg: '#B8E04A',      // lime — rounded tile behind the Leaf icon
  logoIcon: '#1B5E52',    // forest — Leaf fill (mirrors COLORS.forest)
  logoAccent: '#E8674A',  // coral — used for the "Go" accent inside the "YuGoDa" wordmark
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
  cancelled: { label: 'Cancelled', cls: 'bg-eco-secondary/10 text-eco-secondary' },
  completed: { label: 'Completed', cls: 'bg-[#748f2b]/20 text-[#5a7a1a]' },
};

// ── Support Ticket Priority ───────────────────────────────────
// Used by SupportTicketModal and admin SupportTab to color the priority tag.
// `activeCls` = when the priority is selected (filled); `idleCls` = not selected (outline).
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export const TICKET_PRIORITIES: readonly TicketPriority[] = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const TICKET_PRIORITY_CONFIG: Record<TicketPriority, { activeCls: string; idleCls: string }> = {
  Low:    { activeCls: 'bg-slate-500 border-slate-500 text-white',                  idleCls: 'border-gray-200 text-gray-500 dark:border-white/15 dark:text-white/60' },
  Medium: { activeCls: 'bg-[#1B5E52] border-[#1B5E52] text-white',                  idleCls: 'border-gray-200 text-gray-500 dark:border-white/15 dark:text-white/60' },
  High:   { activeCls: 'bg-amber-500 border-amber-500 text-white',                  idleCls: 'border-gray-200 text-gray-500 dark:border-white/15 dark:text-white/60' },
  Urgent: { activeCls: 'bg-eco-secondary border-eco-secondary text-white',          idleCls: 'border-gray-200 text-gray-500 dark:border-white/15 dark:text-white/60' },
};

// Admin CustomersTab account-status chip styling. Status values are backend-owned
// and set via admin suspend/ban/reinstate endpoints (see #65). `dotCls` is the
// small colored dot, `textCls` wraps both the dot's container and the label.
export const ACCOUNT_STATUSES = ['active', 'suspended', 'banned'] as const;
export const ACCOUNT_STATUS_CONFIG: Record<typeof ACCOUNT_STATUSES[number], { dotCls: string; textCls: string; labelKey: string }> = {
  active:    { dotCls: 'bg-emerald-500',   textCls: 'text-emerald-600',    labelKey: 'account_status_active' },
  suspended: { dotCls: 'bg-amber-500',     textCls: 'text-amber-600',      labelKey: 'account_status_suspended' },
  banned:    { dotCls: 'bg-eco-secondary', textCls: 'text-eco-secondary',  labelKey: 'account_status_banned' },
};

// Admin SupportTab ticket-status chip styling. Status values are backend-owned;
// see `TicketStatus` in types/index.ts — `open | in_progress | resolved | closed`.
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export const TICKET_STATUS_CONFIG: Record<typeof TICKET_STATUSES[number], { cls: string; labelKey: string }> = {
  open:        { cls: 'bg-slate-100 text-slate-600',   labelKey: 'ticket_status_open' },
  in_progress: { cls: 'bg-amber-100 text-amber-600',   labelKey: 'ticket_status_in_progress' },
  resolved:    { cls: 'bg-emerald-100 text-emerald-600', labelKey: 'ticket_status_resolved' },
  closed:      { cls: 'bg-gray-100 text-gray-500',     labelKey: 'ticket_status_closed' },
};

// ── Day Names ─────────────────────────────────────────────────
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ── Business Constants ────────────────────────────────────────
export const DELIVERY_FEE = 15;
export const ORDER_POLL_INTERVAL = 30_000;
export const CHAT_POLL_INTERVAL = 2_000;
export const CHAT_QUEUE_POLL_INTERVAL = 5_000;
export const ADMIN_PRESENCE_HEARTBEAT = 30_000;
export const DEFAULT_COMMISSION_RATE = 15;

// ── Landing-page / auth-page "impact so far" stats ────────────
// Consumed by LandingPage stats bar and CustomerAuth impact row.
// `labelKey` is the i18n key for the underneath label; counters use `value` + `suffix`.
export interface LandingStat {
  value: number;
  suffix: string;
  labelKey: string;
}
export const LANDING_STATS: readonly LandingStat[] = [
  { value: 47, suffix: '',    labelKey: 'stats_bags_rescued' },
  { value: 9,  suffix: '+',   labelKey: 'stats_partner_stores' },
  { value: 70, suffix: '%',   labelKey: 'stats_avg_discount' },
  { value: 83, suffix: ' kg', labelKey: 'stats_co2_avoided' },
] as const;

// ── Restaurant Signup ─────────────────────────────────────────
export const BUSINESS_TYPES = ['Restaurant', 'Bakery & Patisserie', 'Grocery Store', 'Cafe'] as const;

// ── Font Helpers ──────────────────────────────────────────────
export const FONT_PLAYFAIR: React.CSSProperties = { fontFamily: '"Playfair Display", Georgia, serif' };
export const FONT_DM: React.CSSProperties = { fontFamily: '"DM Sans", system-ui, sans-serif' };
export const FONT_MONO: React.CSSProperties = { fontFamily: '"DM Mono", "Courier New", monospace' };

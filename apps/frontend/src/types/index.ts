/** Shared domain types for the YuGoDa frontend */

// ── Auth & Users ─────────────────────────────────────────
export type UserRole = 'customer' | 'restaurant' | 'admin' | 'driver';
export type AccountStatus = 'active' | 'suspended' | 'banned';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  favorites: string[];
  walletBalance: number;
  countryCode?: string;
  mobileNumber?: string;
  addresses: Address[];
  notificationsEnabled: boolean;
  preferredLanguage: string;
}

/**
 * Shape returned by admin `/users` endpoint. Minimal projection of UserProfile —
 * intentionally lighter than UserProfile so admin list rendering doesn't assume
 * fields the backend doesn't return.
 */
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | string;
  accountStatus?: AccountStatus;
  createdAt?: string;
  mobileNumber?: string;
}

export interface Address {
  id?: string;
  tag?: string;
  addressLabel?: string;
  label?: string;
  apartment?: string;
  floor?: number;
  unit?: string;
  latitude?: number;
  longitude?: number;
  deliveryNote?: string;
  phone?: string;
  company?: string;
}

// ── Orders ───────────────────────────────────────────────
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId?: string;
  restaurantId?: string;
  restaurantName?: string;
  bagId?: string;
  status: OrderStatus;
  price?: number;
  tip?: number;
  deliveryFee?: number;
  total?: number;
  items?: CartItem[];
  deliveryType?: string;
  paymentMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  estimatedPickupTime?: string;
  trackingNotes?: string;
  /** 4-digit code shown to customer; restaurant must enter it to confirm delivery. */
  deliveryCode?: string;
  /** Customer delivery address coordinates (set at checkout for delivery orders). */
  deliveryLat?: number;
  deliveryLng?: number;
}

export interface CartItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// ── Stores ───────────────────────────────────────────────
export interface StoreProfile {
  id: string;
  name: string;
  category?: string;
  storeType?: string;
  description?: string;
  address?: string;
  phone?: string;
  logo?: string;
  coverImage?: string;
  location?: { lat: number; lng: number };
  operatingHours?: OperatingHours[];
  dietaryTags?: string[];
  status?: 'pending' | 'active' | 'rejected';
  rating?: number;
  totalOrders?: number;
  commissionRate?: number;
  bankingDetails?: BankingDetails;
  createdAt?: string;
}

export interface BankingDetails {
  iban?: string;
  accountHolder?: string;
  bankName?: string;
  branchCode?: string;
  taxId?: string;
}

export interface OperatingHours {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

// ── Bags ─────────────────────────────────────────────────
export interface Bag {
  id: string;
  restaurantId?: string;
  restaurantName?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  available?: number;
  pickupTime?: string;
  image?: string;
  dietaryTags?: string[];
  dietaryType?: string;
  merchantType?: string;
  tags?: string[];
  status?: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
  isCurrentlyOpen?: boolean;
  isLastChance?: boolean;
  countdown?: string;
  distance?: string;
  prepTime?: number;
  storeLogo?: string;
  storeCoverImage?: string;
  createdAt?: string;
}

// ── Drivers ──────────────────────────────────────────────
export interface Driver {
  uid: string;
  name?: string;
  displayName?: string;
  phone?: string;
  vehicle?: string;
  status?: 'available' | 'busy' | 'offline';
  currentLocation?: { lat: number; lng: number };
  earnings?: number;
  rating?: number;
  totalDeliveries?: number;
}

// ── Reviews ──────────────────────────────────────────────
export interface Review {
  id: string;
  userId?: string;
  userName?: string;
  restaurantId?: string;
  orderId?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

// ── Transactions ─────────────────────────────────────────
export interface Transaction {
  id: string;
  orderId?: string;
  userId?: string;
  restaurantId?: string;
  amount: number;
  tip?: number;
  commissionRate?: number;
  commissionAmount?: number;
  restaurantAmount?: number;
  status?: string;
  paymentMethod?: string;
  createdAt?: string;
}

// ── Disputes / Support ───────────────────────────────────
export interface Dispute {
  id: string;
  userId?: string;
  subject?: string;
  message: string;
  status: 'open' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  createdAt?: string;
}

export interface DisputeMessage {
  id: string;
  disputeId?: string;
  senderId?: string;
  senderRole: string;
  message: string;
  createdAt?: string;
}

export interface SupportMessage {
  id: string;
  text: string;
  sender: 'admin' | 'restaurant' | 'customer';
  time: string;
  createdAt?: string;
}

// ── Support Tickets ──────────────────────────────────────
// Priority values MUST match the union in `lib/constants.ts`. Backend clamps
// invalid priorities to "Medium"; status is one of the four literals below.
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  userId: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  subject: string;
  description: string;
  orderRef: string | null;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ────────────────────────────────────────
export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  /** i18n key set by the backend; when present, render via t() — fall back to `title` if absent. */
  titleKey?: string;
  /** i18n key set by the backend; when present, render via t() — fall back to `message` if absent. */
  messageKey?: string;
  /** If present, clicking the notification should deep-link to this order. */
  orderId?: string;
  read: boolean;
  createdAt?: string;
}

// ── Maps ─────────────────────────────────────────────────
export interface MapSuggestion {
  type: 'restaurant' | 'place';
  label: string;
  sublabel: string;
  coords: { lat: number; lng: number };
  bag?: Bag;
}

// ── Charts ───────────────────────────────────────────────
export interface ChartDataPoint {
  day: string;
  revenue: number;
  orders: number;
}

// ── AI Chatbot ──────────────────────────────────────────
export interface ChatMessageItem {
  role: 'user' | 'model';
  text: string;
}

export interface ChatRequest {
  message: string;
  location?: { lat: number; lng: number };
}

export interface ChatResponse {
  success: boolean;
  reply: string;
  recommendations: ChatRecommendation[];
}

export interface ChatRecommendation {
  bagId: string;
  restaurantName: string;
  category?: string;
  price: number;
  originalPrice?: number;
  available?: number;
  pickupTime?: string;
  dietaryType?: string;
  distance?: string;
  rating?: number;
}

// ── Live Chat ────────────────────────────────────────────
// Customer ↔ admin real-time support conversations. Backend contract locked
// under tasks #56/#57/#75 — these shapes mirror the REST responses from
// `/api/live-chat/conversations` and `/api/live-chat/conversations/{id}/messages`.
export type ChatConversationStatus = 'queued' | 'active' | 'archived' | 'customer_deleted';
export type AdminResolution = 'solved' | 'still_investigating' | null;

export interface ChatConversation {
  id: string;
  customerId: string;
  adminId: string | null;
  status: ChatConversationStatus;
  adminResolution: AdminResolution;
  createdAt: string;
  assignedAt: string | null;
  endedAt: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderRole: 'customer' | 'admin';
  senderUid: string;
  content: string;
  createdAt: string;
}

export interface ChatAvailability {
  availableAdmins: number;
}

export type AdminPresenceState = 'available' | 'away' | 'offline';

export interface AdminPresence {
  adminUid: string;
  state: AdminPresenceState;
  lastHeartbeatAt: string;
  currentConversationId: string | null;
  lastAssignedAt: string | null;
}

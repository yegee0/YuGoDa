/** Shared domain types for the YuGoDa frontend */

// ── Auth & Users ─────────────────────────────────────────
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
  addresses: Address[];
  notificationsEnabled: boolean;
  preferredLanguage: string;
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
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'confirmed' | 'completed';

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
  createdAt?: string;
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
  amount: number;
  tip?: number;
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

// ── Notifications ────────────────────────────────────────
export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
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

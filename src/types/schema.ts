/**
 * SurpriseBag Entity Schema (NoSQL/JSON)
 * Represents a surplus food package available for rescue.
 */

export enum BagStatus {
  ACTIVE = 'Active',
  SOLD_OUT = 'Sold_Out',
  CANCELLED = 'Cancelled'
}

export interface SurpriseBag {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Reference to the partner store/restaurant */
  store_id: string;
  
  /** Original retail value of the contents */
  price_original: number;
  
  /** Discounted price for the customer */
  price_discounted: number;
  
  /** List of allergens present in the bag */
  allergen_info: string[];
  
  /** ISO 8601 Timestamp for start of pickup window */
  pickup_window_start: string;
  
  /** ISO 8601 Timestamp for end of pickup window */
  pickup_window_end: string;
  
  /** Number of bags currently available */
  stock_count: number;
  
  /** Current lifecycle status of the bag */
  status: BagStatus;
  
  /** Metadata for display */
  category: string;
  image_url: string;
  description?: string;
}

/**
 * Example JSON Object
 */
export const surpriseBagExample: SurpriseBag = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  store_id: "store_789",
  price_original: 15.00,
  price_discounted: 4.99,
  allergen_info: ["Gluten", "Dairy"],
  pickup_window_start: "2024-03-20T18:00:00Z",
  pickup_window_end: "2024-03-20T20:00:00Z",
  stock_count: 3,
  status: BagStatus.ACTIVE,
  category: "Bakery",
  image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff"
};

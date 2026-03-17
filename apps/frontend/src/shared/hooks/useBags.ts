import { useState, useEffect } from 'react';
import { useStore } from '@/app/store/useStore';

const FALLBACK_BAGS = [
  { id: 'local-1', restaurantName: 'Green Bakery', restaurantId: 'green-bakery', category: 'Bakery', price: 4.99, originalPrice: 15.0, distance: '0.8 km', pickupTime: 'Today, 18:00 – 20:00', available: 3, rating: 4.8, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', dietaryType: 'Vegetarian', merchantType: 'Bakery', coordinates: { lat: 41.015, lng: 28.979 }, isLastChance: false },
  { id: 'local-2', restaurantName: 'Sushi Daily', restaurantId: 'sushi-daily', category: 'Hot Meals', price: 6.5, originalPrice: 20.0, distance: '1.2 km', pickupTime: 'Today, 21:00 – 22:30', available: 1, rating: 4.5, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800', dietaryType: 'Pescatarian', merchantType: 'Sushi Bar', coordinates: { lat: 41.018, lng: 28.982 }, isLastChance: true, countdown: '00:45:00' },
  { id: 'local-3', restaurantName: 'Fresh Market', restaurantId: 'fresh-market', category: 'Groceries', price: 3.99, originalPrice: 12.0, distance: '2.5 km', pickupTime: 'Tomorrow, 08:00 – 10:00', available: 5, rating: 4.2, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800', dietaryType: 'Vegan', merchantType: 'Supermarket', coordinates: { lat: 41.011, lng: 28.975 }, isLastChance: false },
  { id: 'local-4', restaurantName: 'The Vegan Bowl', restaurantId: 'vegan-bowl', category: 'Vegan', price: 5.5, originalPrice: 16.5, distance: '0.5 km', pickupTime: 'Today, 14:00 – 15:00', available: 2, rating: 4.9, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', dietaryType: 'Vegan', merchantType: 'Restaurant', coordinates: { lat: 41.016, lng: 28.977 }, isLastChance: true, countdown: '01:15:00' },
  { id: 'local-5', restaurantName: 'Pizza Bulls', restaurantId: 'pizza-bulls', category: 'Hot Meals', price: 7.99, originalPrice: 24.0, distance: '1.0 km', pickupTime: 'Today, 22:00 – 23:00', available: 4, rating: 4.7, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800', dietaryType: 'Meat', merchantType: 'Pizza', coordinates: { lat: 41.013, lng: 28.98 }, isLastChance: false },
  { id: 'local-6', restaurantName: 'Café Lumière', restaurantId: 'cafe-lumiere', category: 'Bakery', price: 3.49, originalPrice: 10.0, distance: '0.3 km', pickupTime: 'Today, 17:00 – 18:00', available: 6, rating: 4.6, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800', dietaryType: 'Vegetarian', merchantType: 'Café', coordinates: { lat: 41.017, lng: 28.981 }, isLastChance: false },
  { id: 'local-7', restaurantName: 'Thai Garden', restaurantId: 'thai-garden', category: 'Hot Meals', price: 8.5, originalPrice: 25.0, distance: '1.8 km', pickupTime: 'Today, 20:30 – 21:30', available: 2, rating: 4.8, image: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&q=80&w=800', dietaryType: 'Gluten-Free', merchantType: 'Restaurant', coordinates: { lat: 41.019, lng: 28.984 }, isLastChance: true, countdown: '02:00:00' },
  { id: 'local-8', restaurantName: 'La Panadería', restaurantId: 'la-panaderia', category: 'Bakery', price: 4.25, originalPrice: 13.0, distance: '0.9 km', pickupTime: 'Today, 16:00 – 17:30', available: 8, rating: 4.4, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800', dietaryType: 'Vegetarian', merchantType: 'Bakery', coordinates: { lat: 41.012, lng: 28.978 }, isLastChance: false },
  { id: 'local-9', restaurantName: 'Halal Grill House', restaurantId: 'halal-grill', category: 'Hot Meals', price: 9.99, originalPrice: 28.0, distance: '1.4 km', pickupTime: 'Today, 19:00 – 21:00', available: 3, rating: 4.7, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800', dietaryType: 'Halal', merchantType: 'Restaurant', coordinates: { lat: 41.014, lng: 28.983 }, isLastChance: false },
  { id: 'local-10', restaurantName: 'Keto Kitchen', restaurantId: 'keto-kitchen', category: 'Hot Meals', price: 11.5, originalPrice: 32.0, distance: '2.0 km', pickupTime: 'Today, 18:30 – 20:00', available: 2, rating: 4.6, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800', dietaryType: 'Keto', merchantType: 'Restaurant', coordinates: { lat: 41.020, lng: 28.976 }, isLastChance: true, countdown: '01:30:00' },
  { id: 'local-11', restaurantName: 'Pure Deli', restaurantId: 'pure-deli', category: 'Sandwiches', price: 5.99, originalPrice: 14.0, distance: '0.7 km', pickupTime: 'Today, 15:00 – 16:30', available: 7, rating: 4.3, image: 'https://images.unsplash.com/photo-1481070555726-e2fe8357725c?auto=format&fit=crop&q=80&w=800', dietaryType: 'Dairy-Free', merchantType: 'Deli', coordinates: { lat: 41.016, lng: 28.974 }, isLastChance: false },
  { id: 'local-12', restaurantName: 'BurgerBros', restaurantId: 'burgerbros', category: 'Fast Food', price: 6.99, originalPrice: 18.0, distance: '1.6 km', pickupTime: 'Today, 23:00 – 23:59', available: 5, rating: 4.1, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', dietaryType: 'Meat', merchantType: 'Fast Food', coordinates: { lat: 41.012, lng: 28.981 }, isLastChance: true, countdown: '00:30:00' },
];

export function useBags(searchQuery: string, activeTab: 'discover' | 'browse' | 'favorites') {
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, filters } = useStore();

  // Load bags on mount
  useEffect(() => {
    // Firestore removed for custom backend migration. Using local fallback data.
    // TODO: CUSTOM BACKEND — fetch bags from API
    setBags(FALLBACK_BAGS);
    setLoading(false);
  }, []);

  const filteredBags = bags
    .filter(bag => {
      const matchesSearch = bag.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bag.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = bag.price >= filters.priceRange[0] && bag.price <= filters.priceRange[1];
      const matchesFavorites = activeTab !== 'favorites' || favorites.includes(bag.id);
      const matchesDietary = filters.dietary.length === 0 || filters.dietary.includes(bag.dietaryType);
      const matchesMerchant = filters.merchantType.length === 0 || filters.merchantType.includes(bag.merchantType);
      return matchesSearch && matchesPrice && matchesFavorites && matchesDietary && matchesMerchant;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'lowest') return a.price - b.price;
      if (filters.sortBy === 'highest') return (b.rating || 0) - (a.rating || 0);
      if (filters.sortBy === 'nearest') return (parseFloat(a.distance) || 0) - (parseFloat(b.distance) || 0);
      if (filters.sortBy === 'fastest') return (a.prepTime || 30) - (b.prepTime || 30);
      return 0;
    });

  return { bags, filteredBags, loading };
}

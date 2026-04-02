import { useState, useEffect } from 'react';
import { useStore } from '@/app/store/useStore';
import { api } from '@/lib/api';

export function useBags(searchQuery: string, activeTab: 'discover' | 'browse' | 'favorites') {
  const [bags, setBags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites, filters } = useStore();

  // Backend API'den bag'leri yükle
  useEffect(() => {
    let cancelled = false;

    async function fetchBags() {
      try {
        const data = await api.get('/bags');
        if (!cancelled) {
          setBags(data.bags || []);
        }
      } catch (error) {
        console.error('Failed to fetch bags from API:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchBags();
    return () => { cancelled = true; };
  }, []);

  const filteredBags = bags
    .filter(bag => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (bag.restaurantName || '').toLowerCase().includes(q) ||
        (bag.category || '').toLowerCase().includes(q) ||
        (bag.description || '').toLowerCase().includes(q);
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

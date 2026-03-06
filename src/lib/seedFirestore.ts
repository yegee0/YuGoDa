import { db } from './firebase';
import {
    collection,
    getDocs,
    serverTimestamp,
    query,
    limit,
    writeBatch,
    doc,
} from 'firebase/firestore';

const SEED_BAGS = [
    {
        restaurantName: 'Green Bakery',
        restaurantId: 'green-bakery',
        category: 'Bakery',
        price: 4.99,
        originalPrice: 15.0,
        distance: '0.8 km',
        pickupTime: 'Today, 18:00 – 20:00',
        available: 3,
        rating: 4.8,
        image:
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegetarian',
        merchantType: 'Bakery',
        coordinates: { lat: 41.015, lng: 28.979 },
        isLastChance: false,
    },
    {
        restaurantName: 'Sushi Daily',
        restaurantId: 'sushi-daily',
        category: 'Hot Meals',
        price: 6.5,
        originalPrice: 20.0,
        distance: '1.2 km',
        pickupTime: 'Today, 21:00 – 22:30',
        available: 1,
        rating: 4.5,
        image:
            'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Pescatarian',
        merchantType: 'Restaurant',
        coordinates: { lat: 41.018, lng: 28.982 },
        isLastChance: true,
        countdown: '00:45:00',
    },
    {
        restaurantName: 'Fresh Market',
        restaurantId: 'fresh-market',
        category: 'Groceries',
        price: 3.99,
        originalPrice: 12.0,
        distance: '2.5 km',
        pickupTime: 'Tomorrow, 08:00 – 10:00',
        available: 5,
        rating: 4.2,
        image:
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegan',
        merchantType: 'Supermarket',
        coordinates: { lat: 41.011, lng: 28.975 },
        isLastChance: false,
    },
    {
        restaurantName: 'The Vegan Bowl',
        restaurantId: 'vegan-bowl',
        category: 'Vegan',
        price: 5.5,
        originalPrice: 16.5,
        distance: '0.5 km',
        pickupTime: 'Today, 14:00 – 15:00',
        available: 2,
        rating: 4.9,
        image:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegan',
        merchantType: 'Restaurant',
        coordinates: { lat: 41.016, lng: 28.977 },
        isLastChance: true,
        countdown: '01:15:00',
    },
    {
        restaurantName: 'Pizza Bulls',
        restaurantId: 'pizza-bulls',
        category: 'Hot Meals',
        price: 7.99,
        originalPrice: 24.0,
        distance: '1.0 km',
        pickupTime: 'Today, 22:00 – 23:00',
        available: 4,
        rating: 4.7,
        image:
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Meat',
        merchantType: 'Restaurant',
        coordinates: { lat: 41.013, lng: 28.98 },
        isLastChance: false,
    },
    {
        restaurantName: 'Café Lumière',
        restaurantId: 'cafe-lumiere',
        category: 'Bakery',
        price: 3.49,
        originalPrice: 10.0,
        distance: '0.3 km',
        pickupTime: 'Today, 17:00 – 18:00',
        available: 6,
        rating: 4.6,
        image:
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegetarian',
        merchantType: 'Café',
        coordinates: { lat: 41.017, lng: 28.981 },
        isLastChance: false,
    },
    {
        restaurantName: 'Thai Garden',
        restaurantId: 'thai-garden',
        category: 'Hot Meals',
        price: 8.5,
        originalPrice: 25.0,
        distance: '1.8 km',
        pickupTime: 'Today, 20:30 – 21:30',
        available: 2,
        rating: 4.8,
        image:
            'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegan',
        merchantType: 'Restaurant',
        coordinates: { lat: 41.019, lng: 28.984 },
        isLastChance: true,
        countdown: '02:00:00',
    },
    {
        restaurantName: 'La Panadería',
        restaurantId: 'la-panaderia',
        category: 'Bakery',
        price: 4.25,
        originalPrice: 13.0,
        distance: '0.9 km',
        pickupTime: 'Today, 16:00 – 17:30',
        available: 8,
        rating: 4.4,
        image:
            'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800',
        dietaryType: 'Vegetarian',
        merchantType: 'Bakery',
        coordinates: { lat: 41.012, lng: 28.978 },
        isLastChance: false,
    },
];

let seededThisSession = false;

export async function seedIfEmpty(): Promise<void> {
    if (seededThisSession) return;

    try {
        const snapshot = await getDocs(query(collection(db, 'bags'), limit(1)));
        if (!snapshot.empty) {
            console.log('[Seed] Bags already exist. Skipping seed.');
            seededThisSession = true;
            return;
        }

        console.log('[Seed] No bags found. Seeding Firestore with batch write...');
        // Use writeBatch so all 8 writes fire as ONE atomic operation
        // → onSnapshot fires exactly once, no flickering
        const batch = writeBatch(db);
        SEED_BAGS.forEach((bag) => {
            const ref = doc(collection(db, 'bags'));
            batch.set(ref, { ...bag, createdAt: serverTimestamp() });
        });
        await batch.commit();
        seededThisSession = true;
        console.log('[Seed] Seeded', SEED_BAGS.length, 'bags successfully (batch).');
    } catch (err: any) {
        if (err?.code === 'permission-denied') {
            console.warn('[Seed] Permission denied - will retry when user is authenticated.');
        } else {
            console.error('[Seed] Error:', err);
        }
    }
}

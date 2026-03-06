export const MOCK_BAGS = [
  {
    id: '1',
    restaurantName: 'Green Bakery',
    category: 'Bakery',
    price: 4.99,
    originalPrice: 15.00,
    distance: '0.8 km',
    pickupTime: 'Today, 18:00 - 20:00',
    available: 3,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    tags: ['Vegetarian', 'Pastries'],
    coordinates: { lat: 47.6062, lng: -122.3321 },
    isLastChance: false,
    reviews: [
      { id: 'r1', user: 'Alice', rating: 5, comment: 'Amazing pastries! So fresh even at the end of the day.' },
      { id: 'r2', user: 'Bob', rating: 4, comment: 'Great value for money.' }
    ]
  },
  {
    id: '2',
    restaurantName: 'Sushi Daily',
    category: 'Hot Meals',
    price: 6.50,
    originalPrice: 20.00,
    distance: '1.2 km',
    pickupTime: 'Today, 21:00 - 22:30',
    available: 1,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=800',
    tags: ['Seafood', 'Dinner'],
    coordinates: { lat: 47.6082, lng: -122.3341 },
    isLastChance: true,
    countdown: '00:45:00',
    reviews: [
      { id: 'r3', user: 'Charlie', rating: 5, comment: 'The sushi was still very fresh!' }
    ]
  },
  {
    id: '3',
    restaurantName: 'Fresh Market',
    category: 'Groceries',
    price: 3.99,
    originalPrice: 12.00,
    distance: '2.5 km',
    pickupTime: 'Tomorrow, 08:00 - 10:00',
    available: 0,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
    tags: ['Produce', 'Dairy'],
    coordinates: { lat: 47.6042, lng: -122.3301 },
    isLastChance: false,
    reviews: []
  },
  {
    id: '4',
    restaurantName: 'The Vegan Bowl',
    category: 'Vegan',
    price: 5.50,
    originalPrice: 16.50,
    distance: '0.5 km',
    pickupTime: 'Today, 14:00 - 15:00',
    available: 2,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    tags: ['Vegan', 'Healthy'],
    coordinates: { lat: 47.6052, lng: -122.3311 },
    isLastChance: true,
    countdown: '01:15:00',
    reviews: [
      { id: 'r4', user: 'Dana', rating: 5, comment: 'Best vegan surprise bag in the city!' }
    ]
  }
];

export const MOCK_ORDERS = [
  { id: 'ORD-8492', customer: 'Alice M.', items: 2, status: 'pending', time: '18:30' },
  { id: 'ORD-8493', customer: 'John D.', items: 1, status: 'picked_up', time: '17:45' },
  { id: 'ORD-8494', customer: 'Sarah K.', items: 3, status: 'pending', time: '19:00' },
];

export const MOCK_STATS = {
  mealsSaved: 12450,
  co2Prevented: 31125, // kg
  activePartners: 342,
  activeUsers: 15890
};

export const CHART_DATA = [
  { name: 'Mon', meals: 120 },
  { name: 'Tue', meals: 150 },
  { name: 'Wed', meals: 180 },
  { name: 'Thu', meals: 140 },
  { name: 'Fri', meals: 250 },
  { name: 'Sat', meals: 310 },
  { name: 'Sun', meals: 280 },
];

export const PIE_DATA = [
  { name: 'Bakery', value: 400, color: '#1A4D2E' },
  { name: 'Vegan', value: 300, color: '#2D6A4F' },
  { name: 'Groceries', value: 300, color: '#FF9F1C' },
  { name: 'Hot Meals', value: 200, color: '#FFBF69' },
];

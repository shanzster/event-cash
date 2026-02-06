import { Package } from '@/types/booking';

export const packages: Package[] = [
  {
    id: 'intimate',
    name: 'Intimate Gathering',
    price: 1500,
    description: 'Perfect for small, cozy celebrations with close friends and family',
    features: [
      'Up to 30 guests',
      '3-course meal',
      'Professional service staff',
      'Table setup & decoration',
      'Basic bar service',
      '4 hours of service',
    ],
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
  },
  {
    id: 'grand',
    name: 'Grand Celebration',
    price: 3500,
    description: 'Ideal for medium to large events with premium service',
    features: [
      'Up to 100 guests',
      '5-course gourmet meal',
      'Full service staff',
      'Premium table setup & décor',
      'Full bar service',
      'Live cooking stations',
      '6 hours of service',
      'Event coordinator',
    ],
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80',
  },
  {
    id: 'luxury',
    name: 'Luxury Experience',
    price: 7500,
    description: 'The ultimate catering experience for exclusive events',
    features: [
      'Up to 200 guests',
      '7-course fine dining experience',
      'Premium service team',
      'Luxury décor & ambiance',
      'Premium bar with sommelier',
      'Multiple live cooking stations',
      'Chef\'s table experience',
      '8 hours of service',
      'Dedicated event manager',
      'Custom menu design',
    ],
    image: 'https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=800&q=80',
  },
];

export const eventTypes = [
  { id: 'wedding', name: 'Wedding' },
  { id: 'corporate', name: 'Corporate Event' },
  { id: 'birthday', name: 'Birthday Party' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'graduation', name: 'Graduation' },
  { id: 'other', name: 'Other' },
];

export const serviceTypes = [
  { id: 'food-only', name: 'Food Only', description: 'Food and beverages only, no additional services', pricePerGuest: 0 },
  { id: 'service-only', name: 'Service Only', description: 'Event services and equipment only, no food', pricePerGuest: 0 },
  { id: 'mixed', name: 'Mixed (Food + Services)', description: 'Complete package with food and services', pricePerGuest: 0 },
];

export const additionalFoodItems = [
  { id: 'appetizer-platter', name: 'Premium Appetizer Platter', price: 150, category: 'appetizers' },
  { id: 'seafood-station', name: 'Seafood Station', price: 450, category: 'stations' },
  { id: 'sushi-bar', name: 'Sushi Bar', price: 380, category: 'stations' },
  { id: 'dessert-bar', name: 'Dessert Bar', price: 280, category: 'desserts' },
  { id: 'cheese-board', name: 'Artisan Cheese Board', price: 120, category: 'appetizers' },
  { id: 'pasta-station', name: 'Fresh Pasta Station', price: 320, category: 'stations' },
  { id: 'taco-bar', name: 'Gourmet Taco Bar', price: 250, category: 'stations' },
  { id: 'fruit-display', name: 'Tropical Fruit Display', price: 180, category: 'desserts' },
  { id: 'coffee-station', name: 'Premium Coffee & Tea Station', price: 150, category: 'beverages' },
  { id: 'cocktail-hour', name: 'Cocktail Hour Package', price: 400, category: 'beverages' },
];

export const additionalServices = [
  { id: 'chairs-standard', name: 'Standard Chairs', pricePerUnit: 20, unit: 'chair' },
  { id: 'chairs-chiavari', name: 'Chiavari Chairs', pricePerUnit: 50, unit: 'chair' },
  { id: 'tables-round', name: 'Round Tables (8-seat)', pricePerUnit: 100, unit: 'table' },
  { id: 'tables-rectangular', name: 'Rectangular Tables', pricePerUnit: 150, unit: 'table' },
  { id: 'linens-basic', name: 'Basic Table Linens', pricePerUnit: 20, unit: 'table' },
  { id: 'linens-premium', name: 'Premium Table Linens', pricePerUnit: 70, unit: 'table' },
  { id: 'centerpieces', name: 'Floral Centerpieces', pricePerUnit: 100, unit: 'piece' },
  { id: 'lighting', name: 'Ambient Lighting Package', pricePerUnit: 1500, unit: 'package' },
  { id: 'sound-system', name: 'Sound System', pricePerUnit: 5000, unit: 'package' },
  { id: 'photo-booth', name: 'Photo Booth', pricePerUnit: 7000, unit: 'package' },
];

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  image: string;
}

export interface EventType {
  id: string;
  name: string;
  icon: string;
}

export interface AdditionalFoodItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface AdditionalService {
  id: string;
  name: string;
  pricePerUnit: number;
  unit: string;
  quantity?: number;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
}

export interface BookingDetails {
  id?: string;
  userId: string;
  managerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  packageId: string;
  packageName: string;
  serviceType: string;
  serviceTypeName: string;
  eventDate: Date;
  eventTime: string;
  guestCount: number;
  location: Location;
  specialRequests?: string;
  dietaryRestrictions?: string;
  additionalFood?: string[];
  additionalServices?: { id: string; quantity: number }[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  basePrice: number;
  servicePrice: number;
  foodAddonsPrice: number;
  servicesAddonsPrice: number;
  totalPrice: number;
  finalPrice?: number;
  downpayment?: number;
  discount?: number;
  budget?: number;
  expenses?: Expense[];
  createdAt: Date;
  createdByManager?: boolean;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Transaction {
  id?: string;
  bookingId: string;
  managerId: string;
  customerName: string;
  eventType: string;
  amount: number;
  downpayment: number;
  remainingBalance: number;
  expenses: Expense[];
  totalExpenses: number;
  profit: number;
  status: 'completed' | 'pending';
  eventDate: Date;
  completedAt?: Date;
  createdAt: Date;
}

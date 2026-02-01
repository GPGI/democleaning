import { Service, Staff, Booking } from './types';

export const demoServices: Service[] = [
  {
    id: 'service-1',
    name: 'Standard Cleaning',
    description: 'Thorough cleaning of all rooms including vacuuming, mopping, dusting, and bathroom sanitization. Perfect for regular home maintenance.',
    duration: 120,
    price: 129,
    icon: 'home',
    category: 'Regular',
  },
  {
    id: 'service-2',
    name: 'Deep Cleaning',
    description: 'Intensive cleaning that covers hard-to-reach areas, inside appliances, window tracks, and detailed sanitization. Ideal for seasonal refreshes.',
    duration: 240,
    price: 249,
    icon: 'sparkles',
    category: 'Premium',
  },
  {
    id: 'service-3',
    name: 'Move-In/Move-Out',
    description: 'Complete top-to-bottom cleaning for properties in transition. Includes cabinet interiors, appliance cleaning, and wall spot cleaning.',
    duration: 300,
    price: 349,
    icon: 'truck',
    category: 'Specialty',
  },
];

const createDefaultAvailability = () => ({
  '0': { available: false, slots: [] },
  '1': { available: true, slots: [{ start: '09:00', end: '17:00' }] },
  '2': { available: true, slots: [{ start: '09:00', end: '17:00' }] },
  '3': { available: true, slots: [{ start: '09:00', end: '17:00' }] },
  '4': { available: true, slots: [{ start: '09:00', end: '17:00' }] },
  '5': { available: true, slots: [{ start: '09:00', end: '17:00' }] },
  '6': { available: true, slots: [{ start: '10:00', end: '15:00' }] },
});

export const demoStaff: Staff[] = [
  {
    id: 'staff-1',
    name: 'Sarah Johnson',
    email: 'sarah@sparkclean.com',
    phone: '(555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    services: ['service-1', 'service-2', 'service-3'],
    availability: createDefaultAvailability(),
  },
  {
    id: 'staff-2',
    name: 'Michael Chen',
    email: 'michael@sparkclean.com',
    phone: '(555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    services: ['service-1', 'service-2'],
    availability: {
      ...createDefaultAvailability(),
      '3': { available: false, slots: [] },
    },
  },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const demoBookings: Booking[] = [
  {
    id: 'booking-1',
    serviceId: 'service-1',
    staffId: 'staff-1',
    customerId: 'customer-1',
    customerName: 'Emily Parker',
    customerEmail: 'emily.parker@email.com',
    customerPhone: '(555) 234-5678',
    date: tomorrow.toISOString().split('T')[0],
    time: '10:00',
    status: 'confirmed',
    totalPrice: 129,
    createdAt: today.toISOString(),
    address: '123 Oak Street, Apt 4B, New York, NY 10001',
  },
  {
    id: 'booking-2',
    serviceId: 'service-2',
    staffId: 'staff-2',
    customerId: 'customer-2',
    customerName: 'James Wilson',
    customerEmail: 'james.wilson@email.com',
    customerPhone: '(555) 345-6789',
    date: nextWeek.toISOString().split('T')[0],
    time: '14:00',
    status: 'pending',
    notes: 'Please use eco-friendly products',
    totalPrice: 249,
    createdAt: today.toISOString(),
    address: '456 Maple Avenue, Suite 201, New York, NY 10002',
  },
];

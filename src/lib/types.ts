export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  icon: string;
  category: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  services: string[]; // service IDs they can perform
  availability: WeeklyAvailability;
}

export interface WeeklyAvailability {
  [key: string]: DayAvailability; // 0-6 for days
}

export interface DayAvailability {
  available: boolean;
  slots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  totalPrice: number;
  createdAt: string;
  address?: string;
}

export interface AvailableSlot {
  time: string;
  staffId: string;
  staffName: string;
}

export interface BookingFormData {
  serviceId: string;
  date: Date | undefined;
  time: string;
  staffId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  notes: string;
}

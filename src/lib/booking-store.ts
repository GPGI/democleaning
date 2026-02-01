import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Service, Staff, Booking, AvailableSlot } from './types';
import { demoServices, demoStaff, demoBookings } from './demo-data';
import { addDays, format, parse, isWithinInterval, isSameDay, getDay } from 'date-fns';

interface BookingStore {
  services: Service[];
  staff: Staff[];
  bookings: Booking[];
  
  // Actions
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  cancelBooking: (id: string) => void;
  getAvailableSlots: (serviceId: string, date: Date) => AvailableSlot[];
  getServiceById: (id: string) => Service | undefined;
  getStaffById: (id: string) => Staff | undefined;
  getBookingById: (id: string) => Booking | undefined;
  
  // Admin actions
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      services: demoServices,
      staff: demoStaff,
      bookings: demoBookings,

      addBooking: (bookingData) => {
        const newBooking: Booking = {
          ...bookingData,
          id: `booking-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));
        return newBooking;
      },

      updateBooking: (id, updates) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      cancelBooking: (id) => {
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        }));
      },

      getAvailableSlots: (serviceId, date) => {
        const { services, staff, bookings } = get();
        const service = services.find((s) => s.id === serviceId);
        if (!service) return [];

        const dayOfWeek = getDay(date).toString();
        const availableSlots: AvailableSlot[] = [];

        // Get staff who can perform this service
        const eligibleStaff = staff.filter((s) =>
          s.services.includes(serviceId)
        );

        eligibleStaff.forEach((staffMember) => {
          const dayAvailability = staffMember.availability[dayOfWeek];
          if (!dayAvailability?.available) return;

          dayAvailability.slots.forEach((slot) => {
            // Generate time slots every 30 minutes within the available window
            const startTime = parse(slot.start, 'HH:mm', date);
            const endTime = parse(slot.end, 'HH:mm', date);
            
            let currentSlot = startTime;
            while (currentSlot < endTime) {
              const slotTime = format(currentSlot, 'HH:mm');
              
              // Check if this slot overlaps with existing bookings
              const hasConflict = bookings.some((booking) => {
                if (
                  booking.staffId !== staffMember.id ||
                  booking.status === 'cancelled' ||
                  !isSameDay(parse(booking.date, 'yyyy-MM-dd', new Date()), date)
                ) {
                  return false;
                }
                
                const bookingService = services.find((s) => s.id === booking.serviceId);
                if (!bookingService) return false;
                
                const bookingStart = parse(booking.time, 'HH:mm', date);
                const bookingEnd = addDays(bookingStart, 0);
                bookingEnd.setMinutes(bookingEnd.getMinutes() + bookingService.duration);
                
                const slotStart = parse(slotTime, 'HH:mm', date);
                const slotEnd = addDays(slotStart, 0);
                slotEnd.setMinutes(slotEnd.getMinutes() + service.duration);
                
                return (
                  (slotStart >= bookingStart && slotStart < bookingEnd) ||
                  (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                  (slotStart <= bookingStart && slotEnd >= bookingEnd)
                );
              });

              if (!hasConflict) {
                availableSlots.push({
                  time: slotTime,
                  staffId: staffMember.id,
                  staffName: staffMember.name,
                });
              }
              
              currentSlot.setMinutes(currentSlot.getMinutes() + 30);
            }
          });
        });

        // Sort by time, then deduplicate times (keep first staff for each time)
        const uniqueSlots: AvailableSlot[] = [];
        const seenTimes = new Set<string>();
        
        availableSlots
          .sort((a, b) => a.time.localeCompare(b.time))
          .forEach((slot) => {
            const key = `${slot.time}-${slot.staffId}`;
            if (!seenTimes.has(key)) {
              seenTimes.add(key);
              uniqueSlots.push(slot);
            }
          });

        return uniqueSlots;
      },

      getServiceById: (id) => get().services.find((s) => s.id === id),
      getStaffById: (id) => get().staff.find((s) => s.id === id),
      getBookingById: (id) => get().bookings.find((b) => b.id === id),

      addService: (serviceData) => {
        const newService: Service = {
          ...serviceData,
          id: `service-${Date.now()}`,
        };
        set((state) => ({
          services: [...state.services, newService],
        }));
      },

      updateService: (id, updates) => {
        set((state) => ({
          services: state.services.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteService: (id) => {
        set((state) => ({
          services: state.services.filter((s) => s.id !== id),
        }));
      },

      addStaff: (staffData) => {
        const newStaff: Staff = {
          ...staffData,
          id: `staff-${Date.now()}`,
        };
        set((state) => ({
          staff: [...state.staff, newStaff],
        }));
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      deleteStaff: (id) => {
        set((state) => ({
          staff: state.staff.filter((s) => s.id !== id),
        }));
      },
    }),
    {
      name: 'sparkclean-bookings',
    }
  )
);

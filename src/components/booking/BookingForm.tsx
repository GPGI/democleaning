import { useState, useMemo } from 'react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookingStore } from '@/lib/booking-store';
import { BookingFormData, AvailableSlot } from '@/lib/types';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, User, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ServiceCard from './ServiceCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BookingForm = () => {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service') || '';
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    serviceId: initialServiceId,
    date: undefined,
    time: '',
    staffId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    notes: '',
  });

  const { services, getAvailableSlots, addBooking, getServiceById, getStaffById } = useBookingStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const selectedService = formData.serviceId ? getServiceById(formData.serviceId) : undefined;
  
  const availableSlots = useMemo(() => {
    if (!formData.serviceId || !formData.date) return [];
    return getAvailableSlots(formData.serviceId, formData.date);
  }, [formData.serviceId, formData.date, getAvailableSlots]);

  const groupedSlots = useMemo(() => {
    const groups: Record<string, AvailableSlot[]> = {};
    availableSlots.forEach((slot) => {
      if (!groups[slot.time]) {
        groups[slot.time] = [];
      }
      groups[slot.time].push(slot);
    });
    return groups;
  }, [availableSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({ ...prev, date, time: '', staffId: '' }));
  };

  const handleTimeSelect = (time: string, staffId: string) => {
    setFormData((prev) => ({ ...prev, time, staffId }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const booking = addBooking({
      serviceId: formData.serviceId,
      staffId: formData.staffId,
      customerId: `customer-${Date.now()}`,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      date: format(formData.date!, 'yyyy-MM-dd'),
      time: formData.time,
      status: 'confirmed',
      totalPrice: selectedService?.price || 0,
      address: formData.address,
      notes: formData.notes,
    });

    toast({
      title: "Booking Confirmed! 🎉",
      description: `Your ${selectedService?.name} is scheduled for ${format(formData.date!, 'MMMM d, yyyy')} at ${formData.time}.`,
    });

    navigate(`/booking-confirmation/${booking.id}`);
    setIsSubmitting(false);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!formData.serviceId;
      case 2:
        return !!formData.date && !!formData.time && !!formData.staffId;
      case 3:
        return (
          formData.customerName.trim() !== '' &&
          formData.customerEmail.trim() !== '' &&
          formData.customerPhone.trim() !== '' &&
          formData.address.trim() !== ''
        );
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Select Service', icon: CheckCircle2 },
    { number: 2, title: 'Choose Date & Time', icon: CalendarIcon },
    { number: 3, title: 'Your Details', icon: User },
    { number: 4, title: 'Confirm', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all",
                  step >= s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step > s.number ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  s.number
                )}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium hidden sm:inline",
                  step >= s.number ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 sm:w-16 lg:w-24 h-0.5 mx-2 sm:mx-4",
                    step > s.number ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-display font-bold mb-2">Choose Your Service</h2>
          <p className="text-muted-foreground mb-6">Select the cleaning service that best fits your needs</p>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => setFormData((prev) => ({ ...prev, serviceId: service.id }))}
                className={cn(
                  "cursor-pointer",
                  formData.serviceId === service.id && "ring-2 ring-primary ring-offset-2 rounded-xl"
                )}
              >
                <ServiceCard service={service} showBookButton={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-display font-bold mb-2">Select Date & Time</h2>
          <p className="text-muted-foreground mb-6">
            Choose when you'd like your {selectedService?.name}
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateSelect}
                  disabled={(date) => isBefore(date, startOfToday())}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Available Times
                </CardTitle>
                <CardDescription>
                  {formData.date
                    ? `Available slots for ${format(formData.date, 'MMMM d, yyyy')}`
                    : 'Please select a date first'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.date ? (
                  Object.keys(groupedSlots).length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(groupedSlots).map(([time, slots]) => (
                        <Button
                          key={time}
                          variant={formData.time === time ? 'default' : 'outline'}
                          className="h-auto py-3 flex flex-col"
                          onClick={() => handleTimeSelect(time, slots[0].staffId)}
                        >
                          <span className="font-semibold">{time}</span>
                          <span className="text-xs opacity-70">{slots[0].staffName}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No available slots for this date. Please try another date.
                    </p>
                  )
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a date to see available time slots
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 3: Customer Details */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-display font-bold mb-2">Your Details</h2>
          <p className="text-muted-foreground mb-6">Tell us where to come and how to reach you</p>

          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Service Address *</Label>
                  <Input
                    id="address"
                    placeholder="123 Main St, Apt 4B, New York, NY 10001"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific areas to focus on, access instructions, pets, etc."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-display font-bold mb-2">Confirm Your Booking</h2>
          <p className="text-muted-foreground mb-6">Review your booking details before confirming</p>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {formData.date && format(formData.date, 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">{formData.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-medium">{selectedService?.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cleaner</span>
                  <span className="font-medium">{getStaffById(formData.staffId)?.name}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ${selectedService?.price}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground text-sm">Name</span>
                  <p className="font-medium">{formData.customerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Email</span>
                  <p className="font-medium">{formData.customerEmail}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Phone</span>
                  <p className="font-medium">{formData.customerPhone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">Address</span>
                  <p className="font-medium">{formData.address}</p>
                </div>
                {formData.notes && (
                  <div>
                    <span className="text-muted-foreground text-sm">Notes</span>
                    <p className="font-medium">{formData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {step < 4 ? (
          <Button
            variant="hero"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
          >
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant="hero"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                Confirm Booking
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BookingForm;

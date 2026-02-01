import { useState, useMemo } from 'react';
import { format, isBefore, startOfToday } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBookingStore } from '@/lib/booking-store';
import { BookingFormData, AvailableSlot } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Home,
  Truck,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Plus,
  Minus,
  Bed,
  Bath,
  Sofa,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ExtrasSelection {
  extWindows: boolean;
  sofa: boolean;
  matt: boolean;
  blinds: boolean;
  wall: boolean;
  ceiling: boolean;
}

interface ExtendedBookingFormData extends BookingFormData {
  postcode: string;
  city: string;
  propertyType: 'apartment' | 'house' | '';
  carpetCount: number;
  balconyCount: number;
  bedrooms: number;
  bathrooms: number;
  extras: ExtrasSelection;
  paymentType: 'deposit-cash' | 'full' | '';
  depositPercentage: number;
}

interface BookingWidgetProps {
  onComplete?: (bookingId: string) => void;
}

const BookingWidget = ({ onComplete }: BookingWidgetProps) => {
  const [step, setStep] = useState<'location-datetime' | 'property-details' | 'contact' | 'payment' | 'confirm' | 'success'>('location-datetime');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExtendedBookingFormData>({
    serviceId: '',
    date: undefined,
    time: '',
    staffId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    notes: '',
    postcode: '',
    city: '',
    propertyType: '',
    carpetCount: 0,
    balconyCount: 0,
    bedrooms: 1,
    bathrooms: 1,
    extras: {
      extWindows: false,
      sofa: false,
      matt: false,
      blinds: false,
      wall: false,
      ceiling: false,
    },
    paymentType: '',
    depositPercentage: 30,
  });

  const { services, getAvailableSlots, addBooking, getServiceById, getStaffById } = useBookingStore();
  const { toast } = useToast();

  // Use first service as default or create a default service
  const selectedService = services[0] || getServiceById(formData.serviceId);
  
  // Calculate total price based on property details
  const totalPrice = useMemo(() => {
    const basePrice = 50; // Base cleaning price
    const bedroomPrice = formData.bedrooms * 15;
    const bathroomPrice = formData.bathrooms * 20;
    const carpetPrice = formData.carpetCount * 25;
    const balconyPrice = formData.balconyCount * 20;
    const propertyMultiplier = formData.propertyType === 'house' ? 1.2 : 1.0;
    
    // Extras pricing
    const extrasPrice = Object.entries(formData.extras).reduce((sum, [key, value]) => {
      if (value) {
        const prices: Record<string, number> = {
          extWindows: 30,
          sofa: 25,
          matt: 15,
          blinds: 20,
          wall: 40,
          ceiling: 35,
        };
        return sum + (prices[key] || 0);
      }
      return sum;
    }, 0);
    
    return Math.round((basePrice + bedroomPrice + bathroomPrice + carpetPrice + balconyPrice + extrasPrice) * propertyMultiplier);
  }, [formData.bedrooms, formData.bathrooms, formData.carpetCount, formData.balconyCount, formData.propertyType, formData.extras]);

  const depositAmount = useMemo(() => {
    if (formData.paymentType === 'deposit-cash') {
      return Math.round(totalPrice * (formData.depositPercentage / 100));
    }
    return totalPrice;
  }, [totalPrice, formData.paymentType, formData.depositPercentage]);

  const availableSlots = useMemo(() => {
    if (!selectedService || !formData.date) return [];
    return getAvailableSlots(selectedService.id, formData.date);
  }, [selectedService, formData.date, getAvailableSlots]);

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

  const handlePropertyTypeSelect = (type: 'apartment' | 'house') => {
    setFormData(prev => ({ ...prev, propertyType: type }));
  };

  const handleCarpetChange = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      carpetCount: Math.max(0, prev.carpetCount + delta),
    }));
  };

  const handleBalconyChange = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      balconyCount: Math.max(0, prev.balconyCount + delta),
    }));
  };

  const handleBedroomsChange = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      bedrooms: Math.max(1, prev.bedrooms + delta),
    }));
  };

  const handleBathroomsChange = (delta: number) => {
    setFormData(prev => ({
      ...prev,
      bathrooms: Math.max(1, prev.bathrooms + delta),
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date, time: '', staffId: '' }));
  };

  const handleTimeSelect = (time: string, staffId: string) => {
    setFormData(prev => ({ ...prev, time, staffId }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const fullAddress = `${formData.postcode}, ${formData.city}`;
    
    const extrasList = Object.entries(formData.extras)
      .filter(([_, selected]) => selected)
      .map(([key, _]) => {
                        const labels: Record<string, string> = {
                          extWindows: 'External Windows',
                          sofa: 'Sofa Cleaning',
                          matt: 'Mattress Cleaning',
                          blinds: 'Blinds Cleaning',
                          wall: 'Wall Cleaning',
                          ceiling: 'Ceiling Cleaning',
                        };
        return labels[key];
      })
      .join(', ');

    const paymentInfo = formData.paymentType === 'deposit-cash' 
      ? `Payment: Deposit ${formData.depositPercentage}% (£${depositAmount}) + Cash on arrival (£${totalPrice - depositAmount})`
      : `Payment: Full payment (£${totalPrice})`;

    const booking = addBooking({
      serviceId: selectedService?.id || '',
      staffId: formData.staffId,
      customerId: `customer-${Date.now()}`,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      date: format(formData.date!, 'yyyy-MM-dd'),
      time: formData.time,
      status: 'confirmed',
      totalPrice: totalPrice,
      address: fullAddress,
      notes: `${formData.notes}\n\nProperty: ${formData.propertyType}\nBedrooms: ${formData.bedrooms}\nBathrooms: ${formData.bathrooms}\nCarpets: ${formData.carpetCount}\nBalconies: ${formData.balconyCount}\nExtras: ${extrasList || 'None'}\n${paymentInfo}`,
    });

    setBookingId(booking.id);
    setIsSubmitting(false);
    setStep('success');
    
    toast({
      title: "Booking Confirmed! 🎉",
      description: `Your cleaning is scheduled for ${format(formData.date!, 'MMMM d, yyyy')} at ${formData.time}.`,
    });

    onComplete?.(booking.id);
  };

  const canProceedFromLocation = formData.postcode.trim() && formData.city.trim() && 
                                  formData.date && formData.time && formData.staffId;
  const canProceedToContact = formData.propertyType !== '' && formData.bedrooms > 0 && formData.bathrooms > 0;
  const canProceedToPayment = formData.customerName.trim() && formData.customerEmail.trim() && 
                               formData.customerPhone.trim();
  const canProceedToConfirm = formData.paymentType !== '';

  const handleExtrasToggle = (extra: keyof ExtrasSelection) => {
    setFormData(prev => ({
      ...prev,
      extras: {
        ...prev.extras,
        [extra]: !prev.extras[extra],
      },
    }));
  };

  const goBack = () => {
    switch (step) {
      case 'property-details': setStep('location-datetime'); break;
      case 'contact': setStep('property-details'); break;
      case 'payment': setStep('contact'); break;
      case 'confirm': setStep('payment'); break;
    }
  };


  return (
    <div className="bg-background flex flex-col w-full h-screen fixed inset-0 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-display font-bold">SparkClean</h1>
              <p className="text-primary-foreground/80 text-sm">Professional Cleaning Services</p>
            </div>
          </div>
          {step !== 'success' && (
            <div className="text-right">
              <span className="text-xs text-primary-foreground/70">Estimated</span>
              <p className="text-2xl font-bold">£{totalPrice}</p>
            </div>
          )}
        </div>
        
        {/* Progress Indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-1 mt-6">
            {['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shrink-0",
                  step === s || ['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].indexOf(step) > i
                    ? "bg-white text-primary"
                    : "bg-primary-foreground/20 text-primary-foreground/60"
                )}>
                  {['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].indexOf(step) > i ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 4 && (
                  <div className={cn(
                    "flex-1 h-0.5 mx-1",
                    ['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].indexOf(step) > i
                      ? "bg-white"
                      : "bg-primary-foreground/20"
                  )} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-6">
        {/* Step: Location, Date & Time */}
        {step === 'location-datetime' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Location & Schedule</h2>
            
            {/* UK Postcode and City */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postcode" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> UK Postcode
                </Label>
                <Input
                  id="postcode"
                  placeholder="SW1A 1AA"
                  value={formData.postcode}
                  onChange={e => setFormData(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                  className="uppercase"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> City
                </Label>
                <Input
                  id="city"
                  placeholder="London"
                  value={formData.city}
                  onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Select Date
                </Label>
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateSelect}
                  disabled={(date) => isBefore(date, startOfToday())}
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Available Times
                </Label>
                {formData.date ? (
                  Object.keys(groupedSlots).length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                      {Object.entries(groupedSlots).map(([time, slots]) => (
                        <Button
                          key={time}
                          variant={formData.time === time ? 'default' : 'outline'}
                          size="sm"
                          className="h-auto py-2 flex flex-col"
                          onClick={() => handleTimeSelect(time, slots[0].staffId)}
                        >
                          <span className="font-semibold">{time}</span>
                          <span className="text-xs opacity-70">{slots[0].staffName}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8 border rounded-lg">
                      No available slots for this date
                    </div>
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8 border rounded-lg">
                    Please select a date first
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full mt-6"
              disabled={!canProceedFromLocation}
              onClick={() => setStep('property-details')}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Property Details & Extras */}
        {step === 'property-details' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold">Property Details & Services</h2>
            </div>

            {/* Property Type Selection */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePropertyTypeSelect('apartment')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    formData.propertyType === 'apartment'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      formData.propertyType === 'apartment' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Apartment</p>
                      <p className="text-xs text-muted-foreground">Flat or unit</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handlePropertyTypeSelect('house')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    formData.propertyType === 'house'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      formData.propertyType === 'house' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">House</p>
                      <p className="text-xs text-muted-foreground">Detached or semi-detached</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bed className="h-4 w-4" /> Bedrooms
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleBedroomsChange(-1)}
                    disabled={formData.bedrooms <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-bold">{formData.bedrooms}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleBedroomsChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bath className="h-4 w-4" /> Bathrooms
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleBathroomsChange(-1)}
                    disabled={formData.bathrooms <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-2xl font-bold">{formData.bathrooms}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => handleBathroomsChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Carpet & Balcony Extras */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Additional Services</Label>
              
              {/* Carpet Cleaning */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sofa className="h-4 w-4" /> Carpet Cleaning (Extra)
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <div>
                    <p className="font-medium">Number of Carpets</p>
                    <p className="text-xs text-muted-foreground">Optional extra service</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleCarpetChange(-1)}
                      disabled={formData.carpetCount === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">{formData.carpetCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleCarpetChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Balcony */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Balcony Cleaning (Extra)
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <div>
                    <p className="font-medium">Number of Balconies</p>
                    <p className="text-xs text-muted-foreground">Optional extra service</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleBalconyChange(-1)}
                      disabled={formData.balconyCount === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">{formData.balconyCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleBalconyChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <div className="space-y-2 mt-6">
              <Label className="text-base font-semibold">Other Services</Label>
              <p className="text-sm text-muted-foreground mb-3">Select any additional services you need</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: 'extWindows' as const, label: 'External Windows', price: 30 },
                  { key: 'sofa' as const, label: 'Sofa Cleaning', price: 25 },
                  { key: 'matt' as const, label: 'Mattress Cleaning', price: 15 },
                  { key: 'blinds' as const, label: 'Blinds Cleaning', price: 20 },
                  { key: 'wall' as const, label: 'Wall Cleaning', price: 40 },
                  { key: 'ceiling' as const, label: 'Ceiling Cleaning', price: 35 },
                ].map(({ key, label, price }) => (
                  <button
                    key={key}
                    onClick={() => handleExtrasToggle(key)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      formData.extras[key]
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                          formData.extras[key] ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {formData.extras[key] ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">+£{price}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">£{totalPrice}</span>
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full mt-6"
              disabled={!canProceedToContact}
              onClick={() => setStep('contact')}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Contact Info */}
        {step === 'contact' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold">Contact Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <User className="h-3 w-3" /> Full Name *
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customerEmail}
                  onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 20 1234 5678"
                value={formData.customerPhone}
                onChange={e => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Access codes, pets, focus areas..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <Button
              variant="hero"
              className="w-full mt-6"
              disabled={!canProceedToPayment}
              onClick={() => setStep('payment')}
            >
              Continue to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Payment */}
        {step === 'payment' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold">Payment Options</h2>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-primary">£{totalPrice}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'deposit-cash' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  formData.paymentType === 'deposit-cash'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Deposit + Cash on Arrival</p>
                    <p className="text-sm text-muted-foreground">
                      Pay {formData.depositPercentage}% deposit now, rest in cash
                    </p>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                    formData.paymentType === 'deposit-cash' ? "border-primary bg-primary" : "border-muted"
                  )}>
                    {formData.paymentType === 'deposit-cash' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                {formData.paymentType === 'deposit-cash' && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Deposit ({formData.depositPercentage}%):</span>
                      <span className="font-medium">£{depositAmount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cash on arrival:</span>
                      <span className="font-medium">£{totalPrice - depositAmount}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Label className="text-xs">Deposit %:</Label>
                      <Input
                        type="number"
                        min="10"
                        max="90"
                        value={formData.depositPercentage}
                        onChange={e => setFormData(prev => ({ 
                          ...prev, 
                          depositPercentage: Math.max(10, Math.min(90, parseInt(e.target.value) || 30))
                        }))}
                        className="w-20 h-8"
                      />
                    </div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'full' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  formData.paymentType === 'full'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Full Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Pay the full amount now
                    </p>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                    formData.paymentType === 'full' ? "border-primary bg-primary" : "border-muted"
                  )}>
                    {formData.paymentType === 'full' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            <Button
              variant="hero"
              className="w-full mt-6"
              disabled={!canProceedToConfirm}
              onClick={() => setStep('confirm')}
            >
              Continue to Review
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold">Confirm Booking</h2>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-4">
              {/* Location & Schedule */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="font-medium">{formData.postcode}, {formData.city}</p>
              </div>

              <div className="border-t pt-3 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Date</span>
                  <p className="font-medium">{formData.date && format(formData.date, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time</span>
                  <p className="font-medium">{formData.time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cleaner</span>
                  <p className="font-medium">{getStaffById(formData.staffId)?.name?.split(' ')[0] || 'TBD'}</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Property Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium capitalize">{formData.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bedrooms:</span>
                    <span className="font-medium">{formData.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bathrooms:</span>
                    <span className="font-medium">{formData.bathrooms}</span>
                  </div>
                  {formData.carpetCount > 0 && (
                    <div className="flex justify-between">
                      <span>Carpets:</span>
                      <span className="font-medium">{formData.carpetCount}</span>
                    </div>
                  )}
                  {formData.balconyCount > 0 && (
                    <div className="flex justify-between">
                      <span>Balconies:</span>
                      <span className="font-medium">{formData.balconyCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Extras */}
              {Object.values(formData.extras).some(v => v) && (
                <div className="border-t pt-3 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Additional Services</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.extras)
                      .filter(([_, selected]) => selected)
                      .map(([key, _]) => {
                        const labels: Record<string, string> = {
                          extWindows: 'External Windows',
                          sofa: 'Sofa Cleaning',
                          matt: 'Mattress Cleaning',
                          blinds: 'Blinds Cleaning',
                          wall: 'Wall Cleaning',
                          ceiling: 'Ceiling Cleaning',
                        };
                        return (
                          <span key={key} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                            {labels[key]}
                          </span>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Payment</p>
                <div className="text-sm">
                  {formData.paymentType === 'deposit-cash' ? (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Deposit ({formData.depositPercentage}%):</span>
                        <span className="font-medium">£{depositAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash on arrival:</span>
                        <span className="font-medium">£{totalPrice - depositAmount}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>Full Payment:</span>
                      <span className="font-medium">£{totalPrice}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total</span>
                  <span className="text-3xl font-bold text-primary">£{totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
              <p><strong>Name:</strong> {formData.customerName}</p>
              <p><strong>Email:</strong> {formData.customerEmail}</p>
              <p><strong>Phone:</strong> {formData.customerPhone}</p>
              {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Booking · {formData.paymentType === 'deposit-cash' ? `£${depositAmount} deposit` : `£${totalPrice}`}
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              By confirming, you agree to our terms of service
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4 animate-fade-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-display font-bold">Booking Confirmed!</h2>
            <p className="text-muted-foreground">
              Your cleaning is scheduled for<br />
              <strong>{formData.date && format(formData.date, 'EEEE, MMMM d, yyyy')}</strong> at <strong>{formData.time}</strong>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <p><strong>Confirmation ID:</strong> {bookingId}</p>
              <p><strong>Total:</strong> £{totalPrice}</p>
              {formData.paymentType === 'deposit-cash' && (
                <>
                  <p><strong>Deposit Paid:</strong> £{depositAmount} ({formData.depositPercentage}%)</p>
                  <p><strong>Cash on Arrival:</strong> £{totalPrice - depositAmount}</p>
                </>
              )}
              <p><strong>Location:</strong> {formData.postcode}, {formData.city}</p>
              <p><strong>Property:</strong> {formData.propertyType} - {formData.bedrooms} BR, {formData.bathrooms} BA</p>
              {formData.carpetCount > 0 && <p><strong>Carpets:</strong> {formData.carpetCount}</p>}
              {formData.balconyCount > 0 && <p><strong>Balconies:</strong> {formData.balconyCount}</p>}
              {Object.values(formData.extras).some(v => v) && (
                <p><strong>Extras:</strong> {Object.entries(formData.extras)
                  .filter(([_, selected]) => selected)
                  .map(([key, _]) => {
                    const labels: Record<string, string> = {
                      extWindows: 'External Windows',
                      sofa: 'Sofa',
                      matt: 'Mattress',
                      blinds: 'Blinds',
                      wall: 'Wall',
                      ceiling: 'Ceiling',
                    };
                    return labels[key];
                  }).join(', ')}
                </p>
              )}
              <p className="text-muted-foreground mt-2">
                A confirmation email has been sent to {formData.customerEmail}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStep('location-datetime');
                setFormData({
                  serviceId: '',
                  date: undefined,
                  time: '',
                  staffId: '',
                  customerName: '',
                  customerEmail: '',
                  customerPhone: '',
                  address: '',
                  notes: '',
                  postcode: '',
                  city: '',
                  propertyType: '',
                  carpetCount: 0,
                  balconyCount: 0,
                  bedrooms: 1,
                  bathrooms: 1,
                  extras: {
                    extWindows: false,
                    sofa: false,
                    matt: false,
                    blinds: false,
                    wall: false,
                    ceiling: false,
                  },
                  paymentType: '',
                  depositPercentage: 30,
                });
              }}
            >
              Book Another Cleaning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;

import { useState, useMemo } from 'react';
import { format, isBefore, startOfToday } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="bg-background flex flex-col w-full min-h-screen overflow-hidden safe-area-inset">
      {/* Header - Improved Mobile */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-4 md:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold">SparkClean</h1>
              <p className="text-primary-foreground/90 text-xs sm:text-sm">Professional Cleaning Services</p>
            </div>
          </div>
          {step !== 'success' && (
            <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 sm:px-4 w-full sm:w-auto">
              <span className="text-xs text-primary-foreground/80 block">Estimated Total</span>
              <p className="text-2xl sm:text-3xl font-bold">£{totalPrice}</p>
            </div>
          )}
        </div>
        
        {/* Progress Indicator - Mobile Optimized */}
        {step !== 'success' && (
          <div className="max-w-4xl mx-auto mt-4 sm:mt-6 px-2">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].map((s, i) => {
                const stepNames = ['Location', 'Property', 'Contact', 'Payment', 'Review'];
                const isActive = step === s;
                const isCompleted = ['location-datetime', 'property-details', 'contact', 'payment', 'confirm'].indexOf(step) > i;
                
                return (
                  <div key={s} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all shrink-0 mb-2",
                        isActive || isCompleted
                          ? "bg-white text-primary shadow-lg scale-110"
                          : "bg-white/20 text-primary-foreground/60"
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-medium hidden sm:block text-center truncate w-full",
                        isActive || isCompleted ? "text-white" : "text-primary-foreground/70"
                      )}>
                        {stepNames[i]}
                      </span>
                    </div>
                    {i < 4 && (
                      <div className={cn(
                        "flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-all min-w-[8px]",
                        isCompleted ? "bg-white" : "bg-white/20"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content - Mobile optimized spacing */}
      <div className="overflow-y-auto flex-1 p-4 sm:p-6 md:p-8">
        {/* Step: Location, Date & Time */}
        {step === 'location-datetime' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-display font-bold mb-2">Location & Schedule</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Tell us where to come and when</p>
            </div>
            
            {/* Location Section - Card Style */}
            <div className="bg-gradient-to-br from-accent/50 to-background rounded-2xl p-4 sm:p-6 border-2 border-primary/10 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shrink-0">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Your Location</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Where should we send the cleaner?</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-sm font-medium">
                    UK Postcode
                  </Label>
                  <Input
                    id="postcode"
                    placeholder="SW1A 1AA"
                    value={formData.postcode}
                    onChange={e => setFormData(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                    className="uppercase h-12 sm:h-14 text-base border-2 focus:border-primary"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="London"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="h-12 sm:h-14 text-base border-2 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">Then select date & time</span>
              </div>
            </div>

            {/* Date & Time Selection - Side by Side Cards */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Date Selection Card - Improved */}
              <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg">Select Date</h3>
                  </div>
                  {formData.date && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0" />
                      <span className="text-muted-foreground hidden sm:inline">Selected</span>
                    </div>
                  )}
                </div>
                
                {/* Calendar - Full width with responsive days */}
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateSelect}
                  disabled={(date) => isBefore(date, startOfToday())}
                  className="w-full rounded-xl border-2 border-primary/10 bg-background p-2 sm:p-4 shadow-sm"
                  classNames={{
                    months: "w-full flex flex-col",
                    month: "space-y-2 sm:space-y-4 w-full max-w-none",
                    table: "w-full",
                    head_row: "flex w-full",
                    head_cell: "text-muted-foreground rounded-md flex-1 h-8 sm:h-9 font-normal text-xs flex items-center justify-center",
                    row: "flex w-full mt-1 sm:mt-2.5",
                    cell: "h-10 sm:h-12 flex-1 text-center text-xs sm:text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-10 sm:h-12 w-full p-0 font-normal text-xs sm:text-sm aria-selected:opacity-100 min-h-[44px]",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold",
                    day_today: "bg-accent text-accent-foreground font-semibold"
                  }}
                />
                
                {/* Quick date shortcuts */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDateSelect(new Date())}
                    className="text-xs min-h-[44px] px-3"
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      handleDateSelect(tomorrow);
                    }}
                    className="text-xs min-h-[44px] px-3"
                  >
                    Tomorrow
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      handleDateSelect(nextWeek);
                    }}
                    className="text-xs min-h-[44px] px-3"
                  >
                    Next Week
                  </Button>
                </div>
              </div>

              {/* Time Selection Card - Enhanced */}
              <div className="bg-card rounded-2xl p-4 sm:p-6 border-2 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg">Available Times</h3>
                      {formData.date && (
                        <p className="text-xs text-muted-foreground truncate">
                          {format(formData.date, 'EEEE, MMMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  {formData.time && (
                    <div className="flex items-center gap-2 bg-success/10 text-success px-2 sm:px-3 py-1 rounded-full shrink-0">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs font-medium hidden sm:inline">Selected</span>
                    </div>
                  )}
                </div>
                {formData.date ? (
                  Object.keys(groupedSlots).length > 0 ? (
                    <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2">
                      {Object.entries(groupedSlots).map(([time, slots]) => (
                        <Button
                          key={time}
                          variant={formData.time === time ? 'default' : 'outline'}
                          className={cn(
                            "w-full h-14 sm:h-16 justify-between text-left transition-all min-h-[56px]",
                            formData.time === time && "ring-2 ring-primary ring-offset-2 shadow-lg"
                          )}
                          onClick={() => handleTimeSelect(time, slots[0].staffId)}
                        >
                          <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                            <span className="font-bold text-base sm:text-lg">{time}</span>
                            <span className="text-xs text-muted-foreground truncate w-full">{slots[0].staffName}</span>
                          </div>
                          {formData.time === time && (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Clock className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="font-medium text-base sm:text-lg mb-1">No slots available</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Try selecting a different date</p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <CalendarIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="font-medium text-base sm:text-lg mb-1">Select a date first</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Choose from the calendar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Continue Button */}
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-4 sm:mt-6 min-h-[56px]"
              disabled={!canProceedFromLocation}
              onClick={() => setStep('property-details')}
            >
              Continue to Property Details
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step: Property Details & Extras */}
        {step === 'property-details' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold">Property Details & Services</h2>
            </div>

            {/* Property Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Property Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => handlePropertyTypeSelect('apartment')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left min-h-[80px]",
                    formData.propertyType === 'apartment'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      formData.propertyType === 'apartment' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">Apartment</p>
                      <p className="text-xs text-muted-foreground">Flat or unit</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handlePropertyTypeSelect('house')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left min-h-[80px]",
                    formData.propertyType === 'house'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      formData.propertyType === 'house' ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">House</p>
                      <p className="text-xs text-muted-foreground">Detached or semi-detached</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Bed className="h-4 w-4" /> Bedrooms
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => handleBedroomsChange(-1)}
                    disabled={formData.bedrooms <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl sm:text-2xl font-bold">{formData.bedrooms}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => handleBedroomsChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Bath className="h-4 w-4" /> Bathrooms
                </Label>
                <div className="flex items-center justify-between p-4 rounded-xl border-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => handleBathroomsChange(-1)}
                    disabled={formData.bathrooms <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl sm:text-2xl font-bold">{formData.bathrooms}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                    onClick={() => handleBathroomsChange(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Carpet & Balcony Extras */}
            <div className="space-y-4">
              <Label className="text-sm sm:text-base font-semibold">Additional Services</Label>
              
              {/* Carpet Cleaning */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Sofa className="h-4 w-4" /> Carpet Cleaning (Extra)
                </Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border-2">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Number of Carpets</p>
                    <p className="text-xs text-muted-foreground">Optional extra service</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                      onClick={() => handleCarpetChange(-1)}
                      disabled={formData.carpetCount === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg sm:text-xl">{formData.carpetCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                      onClick={() => handleCarpetChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Balcony */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm sm:text-base">
                  <Home className="h-4 w-4" /> Balcony Cleaning (Extra)
                </Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border-2">
                  <div>
                    <p className="font-medium text-sm sm:text-base">Number of Balconies</p>
                    <p className="text-xs text-muted-foreground">Optional extra service</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                      onClick={() => handleBalconyChange(-1)}
                      disabled={formData.balconyCount === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg sm:text-xl">{formData.balconyCount}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full min-h-[44px] min-w-[44px]"
                      onClick={() => handleBalconyChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <div className="space-y-2 mt-4 sm:mt-6">
              <Label className="text-sm sm:text-base font-semibold">Other Services</Label>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">Select any additional services you need</p>

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
                      "p-4 rounded-xl border-2 transition-all text-left min-h-[80px]",
                      formData.extras[key]
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                          formData.extras[key] ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {formData.extras[key] ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm sm:text-base">{label}</p>
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
                <span className="font-medium text-sm sm:text-base">Total</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">£{totalPrice}</span>
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full mt-4 sm:mt-6 min-h-[56px]"
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
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold">Contact Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1 text-sm sm:text-base">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" /> Full Name *
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.customerName}
                  onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="h-12 sm:h-14 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1 text-sm sm:text-base">
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" /> Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.customerEmail}
                  onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="h-12 sm:h-14 text-base"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1 text-sm sm:text-base">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4" /> Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+44 20 1234 5678"
                value={formData.customerPhone}
                onChange={e => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                className="h-12 sm:h-14 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm sm:text-base">Special Instructions (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Access codes, pets, focus areas..."
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="text-base"
              />
            </div>

            <Button
              variant="hero"
              className="w-full mt-4 sm:mt-6 min-h-[56px]"
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
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold">Payment Options</h2>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm sm:text-base">Total Amount</span>
                <span className="text-xl sm:text-2xl font-bold text-primary">£{totalPrice}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'deposit-cash' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left min-h-[80px]",
                  formData.paymentType === 'deposit-cash'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Deposit + Cash on Arrival</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Pay {formData.depositPercentage}% deposit now, rest in cash
                    </p>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    formData.paymentType === 'deposit-cash' ? "border-primary bg-primary" : "border-muted"
                  )}>
                    {formData.paymentType === 'deposit-cash' && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                {formData.paymentType === 'deposit-cash' && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Deposit ({formData.depositPercentage}%):</span>
                      <span className="font-medium">£{depositAmount}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
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
                        className="w-20 h-10 sm:h-12 text-base"
                      />
                    </div>
                  </div>
                )}
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, paymentType: 'full' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left min-h-[80px]",
                  formData.paymentType === 'full'
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base">Full Payment</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Pay the full amount now
                    </p>
                  </div>
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
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
              className="w-full mt-4 sm:mt-6 min-h-[56px]"
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
          <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex items-center gap-2">
              <button onClick={goBack} className="p-2 sm:p-3 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg sm:text-xl font-semibold">Confirm Booking</h2>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 sm:p-6 space-y-4">
              {/* Location & Schedule */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Location</p>
                <p className="font-medium text-sm sm:text-base">{formData.postcode}, {formData.city}</p>
              </div>

              <div className="border-t pt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Date</span>
                  <p className="font-medium">{formData.date && format(formData.date, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Time</span>
                  <p className="font-medium">{formData.time}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Cleaner</span>
                  <p className="font-medium">{getStaffById(formData.staffId)?.name?.split(' ')[0] || 'TBD'}</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Property Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
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
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Payment</p>
                <div className="text-xs sm:text-sm">
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
                  <span className="font-medium text-sm sm:text-base">Total</span>
                  <span className="text-2xl sm:text-3xl font-bold text-primary">£{totalPrice}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-xs sm:text-sm">
              <p><strong>Name:</strong> {formData.customerName}</p>
              <p><strong>Email:</strong> {formData.customerEmail}</p>
              <p><strong>Phone:</strong> {formData.customerPhone}</p>
              {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full min-h-[56px]"
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
                  <span className="hidden sm:inline">Confirm Booking · </span>
                  {formData.paymentType === 'deposit-cash' ? `£${depositAmount} deposit` : `£${totalPrice}`}
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground px-4">
              By confirming, you agree to our terms of service
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold">Booking Confirmed!</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your cleaning is scheduled for<br />
              <strong>{formData.date && format(formData.date, 'EEEE, MMMM d, yyyy')}</strong> at <strong>{formData.time}</strong>
            </p>
            <div className="bg-muted/50 rounded-lg p-4 sm:p-6 text-xs sm:text-sm space-y-2 text-left max-w-2xl mx-auto">
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

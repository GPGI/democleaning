import { useParams, Link } from 'react-router-dom';
import { useBookingStore } from '@/lib/booking-store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Calendar, Clock, MapPin, User, Mail, Phone, ArrowRight, Download } from 'lucide-react';
import { format, parse } from 'date-fns';

const BookingConfirmation = () => {
  const { id } = useParams();
  const { getBookingById, getServiceById, getStaffById } = useBookingStore();

  const booking = id ? getBookingById(id) : undefined;
  const service = booking ? getServiceById(booking.serviceId) : undefined;
  const staff = booking ? getStaffById(booking.staffId) : undefined;

  if (!booking || !service) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
            <Button asChild>
              <Link to="/book">Book a New Cleaning</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const bookingDate = parse(booking.date, 'yyyy-MM-dd', new Date());

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container max-w-2xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-success/15 text-success mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground">
              A confirmation email has been sent to {booking.customerEmail}
            </p>
          </div>

          <Card className="mb-6 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <span className="text-sm font-normal text-muted-foreground">
                  #{booking.id.slice(-8).toUpperCase()}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{format(bookingDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-semibold">{booking.time} ({service.duration} min)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Cleaner</p>
                    <p className="font-semibold">{staff?.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-semibold">{booking.address}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">${booking.totalPrice}</p>
                </div>
              </div>

              {booking.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                  <p>{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span>{booking.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span>{booking.customerEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{booking.customerPhone}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button variant="hero" asChild>
              <Link to="/">
                Back to Home
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/book">Book Another Cleaning</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingConfirmation;

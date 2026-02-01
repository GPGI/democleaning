import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingForm from '@/components/booking/BookingForm';

const BookingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Book Your Cleaning</h1>
            <p className="text-muted-foreground">
              Schedule your professional cleaning in just a few clicks
            </p>
          </div>
          
          <BookingForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;

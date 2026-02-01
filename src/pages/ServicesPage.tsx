import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServiceCard from '@/components/booking/ServiceCard';
import { useBookingStore } from '@/lib/booking-store';

const ServicesPage = () => {
  const { services } = useBookingStore();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">Our Services</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional cleaning services tailored to your needs. Every service includes
              eco-friendly products and our satisfaction guarantee.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-accent/50 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Need Something Custom?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer custom cleaning packages for unique needs. Whether it's a large property,
              commercial space, or special event cleanup, we've got you covered.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServicesPage;

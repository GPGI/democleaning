import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Shield, Clock, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import ServiceCard from '@/components/booking/ServiceCard';
import { useBookingStore } from '@/lib/booking-store';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Index = () => {
  const { services } = useBookingStore();

  const features = [
    {
      icon: Clock,
      title: 'Flexible Scheduling',
      description: 'Book appointments that work with your busy schedule, any day of the week.',
    },
    {
      icon: Shield,
      title: 'Trusted Professionals',
      description: 'All cleaners are vetted, insured, and trained to the highest standards.',
    },
    {
      icon: Star,
      title: 'Satisfaction Guaranteed',
      description: 'Not happy? We\'ll re-clean for free or give you a full refund.',
    },
    {
      icon: Users,
      title: 'Dedicated Team',
      description: 'Get matched with the same cleaner for consistent, personalized service.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      role: 'Homeowner',
      content: 'SparkClean transformed my home! The team was professional, thorough, and left everything spotless.',
      rating: 5,
    },
    {
      name: 'David R.',
      role: 'Business Owner',
      content: 'We use SparkClean for our office weekly. Reliable, efficient, and always on time.',
      rating: 5,
    },
    {
      name: 'Jennifer L.',
      role: 'Working Mom',
      content: 'Finally, a cleaning service I can trust! The online booking is so convenient.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-accent/20 to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="h-4 w-4" />
              Professional Cleaning Services
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight mb-6 animate-slide-up">
              Your Home, Our{' '}
              <span className="text-gradient">Passion</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Experience the difference with SparkClean. Professional cleaners, eco-friendly products, 
              and a sparkling home guaranteed—book in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/book">
                  Book Your Cleaning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/services">View Services</Link>
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>5,000+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Fully Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span>Eco-Friendly Products</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Our Services</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From regular maintenance to deep cleaning, we've got your home covered
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Why Choose SparkClean?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not just cleaners—we're your partners in maintaining a healthy, beautiful home
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-4">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust SparkClean
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl border p-6 shadow-sm"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="relative rounded-3xl bg-primary text-primary-foreground p-8 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready for a Spotless Home?
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                Book your first cleaning today and see the SparkClean difference. 
                It takes less than 60 seconds to get started.
              </p>
              <Button
                size="xl"
                className="bg-background text-primary hover:bg-background/90 font-semibold"
                asChild
              >
                <Link to="/book">
                  Book Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

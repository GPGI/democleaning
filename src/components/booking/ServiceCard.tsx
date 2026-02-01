import { Service } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Home, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  service: Service;
  showBookButton?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-6 w-6" />,
  sparkles: <Sparkles className="h-6 w-6" />,
  truck: <Truck className="h-6 w-6" />,
};

const ServiceCard = ({ service, showBookButton = true }: ServiceCardProps) => {
  return (
    <Card variant="service" className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            {iconMap[service.icon] || <Sparkles className="h-6 w-6" />}
          </div>
          <Badge variant="secondary">{service.category}</Badge>
        </div>
        <CardTitle className="mt-4">{service.name}</CardTitle>
        <CardDescription className="line-clamp-2">{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{service.duration} min</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-display">${service.price}</span>
          </div>
        </div>
        {showBookButton && (
          <Button variant="hero-outline" className="w-full" asChild>
            <Link to={`/book?service=${service.id}`}>Book Now</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;

import BookingWidget from '@/components/booking/BookingWidget';
import { Toaster } from '@/components/ui/toaster';

const EmbedPage = () => {
  return (
    <>
      <BookingWidget />
      <Toaster />
    </>
  );
};

export default EmbedPage;

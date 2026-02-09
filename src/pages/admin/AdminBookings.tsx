import { useState } from 'react';
import { useBookingStore } from '@/lib/booking-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';
import { Search, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminBookings = () => {
  const { bookings, updateBooking, cancelBooking, getServiceById, getStaffById } = useBookingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  const filteredBookings = bookings
    .filter((booking) => {
      const matchesSearch =
        booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStatusChange = (bookingId: string, newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    if (newStatus === 'cancelled') {
      cancelBooking(bookingId);
    } else {
      updateBooking(bookingId, { status: newStatus });
    }
    toast({
      title: 'Status Updated',
      description: `Booking status changed to ${newStatus}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Bookings</h1>
        <p className="text-muted-foreground">Manage all your customer bookings</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => {
                      const service = getServiceById(booking.serviceId);
                      const staffMember = getStaffById(booking.staffId);
                      const bookingDate = parseISO(booking.date);

                      return (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm sm:text-base">{booking.customerName}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{booking.customerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm sm:text-base">{service?.name}</TableCell>
                          <TableCell className="text-sm sm:text-base">{staffMember?.name}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm sm:text-base">{format(bookingDate, 'MMM d, yyyy')}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">{booking.time}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={booking.status as any} className="text-xs">{booking.status}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm sm:text-base">£{booking.totalPrice}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {booking.status === 'pending' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                    className="min-h-[44px]"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm
                                  </DropdownMenuItem>
                                )}
                                {booking.status === 'confirmed' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(booking.id, 'completed')}
                                    className="min-h-[44px]"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                )}
                                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                    className="text-destructive min-h-[44px]"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm sm:text-base">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;

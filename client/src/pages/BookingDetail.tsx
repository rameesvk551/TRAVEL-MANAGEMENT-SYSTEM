import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, CreditCard, Mail, Phone, Tag, Clock } from 'lucide-react';
import { useBooking, useResource, useDeleteBooking } from '@/hooks';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';
import type { BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    pending: 'warning',
    confirmed: 'success',
    checked_in: 'default',
    checked_out: 'secondary',
    cancelled: 'destructive',
    no_show: 'destructive',
};

export default function BookingDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: bookingResponse, isLoading: isLoadingBooking, error: bookingError } = useBooking(id || '');
    const booking = bookingResponse?.data;

    const deleteBooking = useDeleteBooking();

    const { data: resourceResponse, isLoading: isLoadingResource } = useResource(booking?.resourceId || '');
    const resource = resourceResponse?.data;

    if (isLoadingBooking) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-muted-foreground">Loading booking details...</div>
            </div>
        );
    }

    if (bookingError || !booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-destructive font-semibold">Failed to load booking details.</div>
                <Button variant="outline" onClick={() => navigate('/bookings')}>
                    Back to Bookings
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/bookings')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Booking Details</h2>
                    <p className="text-muted-foreground">Reference: {booking.id.split('-')[0].toUpperCase()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Guest Information</CardTitle>
                                <Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Name</p>
                                    <p className="font-medium flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {booking.guestName}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="font-medium flex items-center">
                                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {booking.guestEmail || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium flex items-center">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {booking.guestPhone || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Guest Count</p>
                                    <p className="font-medium flex items-center">
                                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {booking.guestCount} Guest(s)
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Stay Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Resource</p>
                                    <p className="font-medium flex items-center">
                                        <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {isLoadingResource ? 'Loading...' : resource?.name || 'Unknown Resource'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Dates</p>
                                    <p className="font-medium flex items-center">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Source</p>
                                    <Badge variant="outline">{booking.source}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Created At</p>
                                    <p className="font-medium flex items-center text-sm">
                                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {new Date(booking.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {booking.notes && (
                                <>
                                    <hr className="my-4 border-t" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Notes</p>
                                        <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Base Amount</span>
                                <span className="font-medium">{formatCurrency(booking.baseAmount, booking.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-sm">Tax</span>
                                <span className="font-medium">{formatCurrency(booking.taxAmount, booking.currency)}</span>
                            </div>
                            <hr className="my-4 border-t" />
                            <div className="flex justify-between items-center text-lg font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(booking.totalAmount, booking.currency)}</span>
                            </div>
                            <div className="pt-4">
                                <Button className="w-full" variant="outline">
                                    Record Payment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" variant="outline" onClick={() => navigate(`/bookings/${booking.id}/edit`)}>
                                Edit Booking
                            </Button>
                            <Button 
                                className="w-full" 
                                variant="destructive" 
                                disabled={deleteBooking.isPending}
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this booking?')) {
                                        deleteBooking.mutate(booking.id, {
                                            onSuccess: () => navigate('/bookings')
                                        });
                                    }
                                }}
                            >
                                {deleteBooking.isPending ? 'Deleting...' : 'Delete Booking'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

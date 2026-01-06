import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BookingForm } from '@/components/bookings';
import { useBooking, useUpdateBooking } from '@/hooks';
import { Button } from '@/components/ui';

export default function EditBooking() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const { data: bookingResponse, isLoading: isLoadingBooking } = useBooking(id || '');
    const updateBooking = useUpdateBooking();

    const booking = bookingResponse?.data;

    if (isLoadingBooking) {
        return <div className="p-8 text-center text-muted-foreground">Loading booking...</div>;
    }

    if (!booking) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-destructive font-semibold">Booking not found.</p>
                <Button onClick={() => navigate('/bookings')}>Back to Bookings</Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/bookings/${id}`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">Edit Booking</h2>
                    <p className="text-muted-foreground">
                        Update booking information for {booking.guestName}
                    </p>
                </div>
            </div>

            <BookingForm
                initialData={booking}
                onSubmit={(data) => {
                    updateBooking.mutate(
                        { id: id!, data },
                        {
                            onSuccess: () => navigate(`/bookings/${id}`),
                        }
                    );
                }}
                isLoading={updateBooking.isPending}
                onCancel={() => navigate(`/bookings/${id}`)}
            />
        </div>
    );
}

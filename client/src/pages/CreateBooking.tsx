import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BookingForm } from '@/components/bookings';
import { useCreateBooking } from '@/hooks';
import { Button } from '@/components/ui';

export default function CreateBooking() {
    const navigate = useNavigate();
    const createBooking = useCreateBooking();

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/bookings')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold">New Booking</h2>
                    <p className="text-muted-foreground">
                        Create a manual booking for a guest
                    </p>
                </div>
            </div>

            <BookingForm
                onSubmit={(data) => {
                    createBooking.mutate(data, {
                        onSuccess: () => navigate('/bookings'),
                    });
                }}
                isLoading={createBooking.isPending}
                onCancel={() => navigate('/bookings')}
            />
        </div>
    );
}

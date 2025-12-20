import { useState } from 'react';
import { Plus, Calendar, User, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '@/hooks';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';
import type { Booking, BookingStatus } from '@/types';

const statusColors: Record<BookingStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    pending: 'warning',
    confirmed: 'success',
    checked_in: 'default',
    checked_out: 'secondary',
    cancelled: 'destructive',
    no_show: 'destructive',
};

interface BookingCardProps {
    booking: Booking;
}

function BookingCard({ booking }: BookingCardProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold truncate">{booking.guestName}</CardTitle>
                    <Badge variant={statusColors[booking.status]}>{booking.status}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    <span>{booking.guestCount} Guest(s)</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="font-semibold text-foreground">{formatCurrency(booking.totalAmount)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Bookings() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { data, isLoading, error } = useBookings({
        search: search || undefined
    });

    const bookings = data?.data?.bookings || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Bookings</h2>
                    <p className="text-muted-foreground">
                        Manage reservations and occupancy
                    </p>
                </div>
                <Button onClick={() => navigate('/bookings/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Booking
                </Button>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Search guest name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                {/* Add more filters later */}
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading bookings...</div>
            ) : error ? (
                <div className="text-center py-12 text-destructive">
                    Failed to load bookings.
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    No bookings found.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {bookings.map((booking) => (
                        <BookingCard key={booking.id} booking={booking} />
                    ))}
                </div>
            )}
        </div>
    );
}

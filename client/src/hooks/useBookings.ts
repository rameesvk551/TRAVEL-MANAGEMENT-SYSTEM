import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/api';
import { BookingFilters, CreateBookingInput } from '@/types';


export function useBookings(filters: BookingFilters = {}) {
    return useQuery({
        queryKey: ['bookings', filters],
        queryFn: () => bookingApi.getAll(filters),
    });
}

export function useBooking(id: string) {
    return useQuery({
        queryKey: ['bookings', id],
        queryFn: () => bookingApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateBooking() {
    const queryClient = useQueryClient();
    // navigate unused for now, handling in component

    return useMutation({
        mutationFn: (data: CreateBookingInput) => bookingApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

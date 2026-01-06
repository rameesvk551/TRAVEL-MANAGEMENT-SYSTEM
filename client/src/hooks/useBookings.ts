import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '@/api';
import { BookingFilters, CreateBookingInput, UpdateBookingInput } from '@/types';


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

    return useMutation({
        mutationFn: (data: CreateBookingInput) => bookingApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

export function useUpdateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBookingInput }) =>
            bookingApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['bookings', variables.id] });
        },
    });
}

export function useDeleteBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => bookingApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

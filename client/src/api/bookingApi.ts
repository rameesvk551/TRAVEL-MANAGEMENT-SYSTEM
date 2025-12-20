import { apiClient } from './client';
import { ApiResponse } from '@/types/api.types';
import { Booking, CreateBookingInput, BookingFilters } from '@/types/booking.types';

export const bookingApi = {
    getAll: async (filters: BookingFilters = {}) => {
        const params = new URLSearchParams();
        if (filters.resourceId) params.append('resourceId', filters.resourceId);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        // Default pagination for now
        params.append('limit', '50');

        const response = await apiClient.get<ApiResponse<{ bookings: Booking[]; total: number }>>('/bookings', { params });
        return response.data;
    },

    getById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Booking>>(`/bookings/${id}`);
        return response.data;
    },

    create: async (data: CreateBookingInput) => {
        const response = await apiClient.post<ApiResponse<Booking>>('/bookings', data);
        return response.data;
    },
};

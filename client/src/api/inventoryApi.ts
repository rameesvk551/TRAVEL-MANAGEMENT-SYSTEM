import { apiClient } from './client';
import type {
    DepartureWithInventory,
    CreateDepartureRequest,
    AvailabilityResult,
    ActiveHold,
    InitiateBookingRequest,
    BookingInitResult,
    CalendarData,
} from '@/types';

/**
 * Inventory API - Manages departure instances and availability
 */
export const inventoryApi = {
    /**
     * Get departures for calendar view
     */
    getCalendarData: async (
        dateFrom: string,
        dateTo: string,
        resourceId?: string
    ): Promise<CalendarData> => {
        const params = new URLSearchParams({
            dateFrom,
            dateTo,
            ...(resourceId && { resourceId }),
        });
        const response = await apiClient.get(`/inventory/calendar?${params}`);
        return response.data.data; // Extract nested data
    },

    /**
     * Get departure with inventory state
     */
    getDeparture: async (departureId: string): Promise<DepartureWithInventory> => {
        const response = await apiClient.get(`/inventory/departures/${departureId}`);
        return response.data.data;
    },

    /**
     * Get departures for a resource
     */
    getDeparturesByResource: async (
        resourceId: string,
        dateFrom?: string,
        dateTo?: string
    ): Promise<DepartureWithInventory[]> => {
        const params = new URLSearchParams({
            ...(dateFrom && { dateFrom }),
            ...(dateTo && { dateTo }),
        });
        const response = await apiClient.get(
            `/inventory/resources/${resourceId}/departures?${params}`
        );
        return response.data.data;
    },

    /**
     * Create a new departure instance
     */
    createDeparture: async (data: CreateDepartureRequest): Promise<DepartureWithInventory> => {
        const response = await apiClient.post('/inventory/departures', data);
        return response.data.data;
    },

    /**
     * Update departure instance
     */
    updateDeparture: async (
        departureId: string,
        data: Partial<CreateDepartureRequest>
    ): Promise<DepartureWithInventory> => {
        const response = await apiClient.patch(`/inventory/departures/${departureId}`, data);
        return response.data.data;
    },

    /**
     * Check availability for a departure
     */
    checkAvailability: async (
        departureId: string,
        seatCount: number
    ): Promise<AvailabilityResult> => {
        const response = await apiClient.get(
            `/inventory/departures/${departureId}/availability?seats=${seatCount}`
        );
        return response.data.data;
    },

    /**
     * Get active holds for a departure
     */
    getActiveHolds: async (departureId: string): Promise<ActiveHold[]> => {
        const response = await apiClient.get(`/inventory/departures/${departureId}/holds`);
        return response.data.data ?? [];
    },

    /**
     * Create an inventory hold (for cart)
     */
    createHold: async (
        departureId: string,
        seatCount: number,
        holdType: 'CART' | 'PAYMENT_PENDING' | 'APPROVAL_PENDING' = 'CART'
    ): Promise<{ holdId: string; expiresAt: string }> => {
        const response = await apiClient.post(`/inventory/departures/${departureId}/holds`, {
            seatCount,
            holdType,
        });
        return response.data.data;
    },

    /**
     * Release a hold
     */
    releaseHold: async (holdId: string): Promise<void> => {
        await apiClient.delete(`/inventory/holds/${holdId}`);
    },

    /**
     * Extend a hold's expiry
     */
    extendHold: async (
        holdId: string,
        newHoldType: 'PAYMENT_PENDING' | 'APPROVAL_PENDING'
    ): Promise<{ expiresAt: string }> => {
        const response = await apiClient.patch(`/inventory/holds/${holdId}/extend`, {
            holdType: newHoldType,
        });
        return response.data.data;
    },

    /**
     * Block seats (staff/VIP allocation)
     */
    blockSeats: async (
        departureId: string,
        seatCount: number,
        blockType: 'STAFF' | 'VIP' | 'CHANNEL_QUOTA' | 'MAINTENANCE',
        reason?: string
    ): Promise<void> => {
        await apiClient.post(`/inventory/departures/${departureId}/blocks`, {
            seatCount,
            blockType,
            reason,
        });
    },

    /**
     * Update departure status
     */
    updateStatus: async (
        departureId: string,
        status: 'OPEN' | 'CLOSED' | 'CANCELLED'
    ): Promise<void> => {
        await apiClient.patch(`/inventory/departures/${departureId}/status`, { status });
    },
};

/**
 * Booking Orchestration API - Unified booking flow for all channels
 */
export const bookingOrchestratorApi = {
    /**
     * Initiate a booking (creates hold + draft booking)
     */
    initiateBooking: async (data: InitiateBookingRequest): Promise<BookingInitResult> => {
        const response = await apiClient.post('/inventory/bookings', data);
        return response.data.data;
    },

    /**
     * Confirm a booking after payment
     */
    confirmBooking: async (
        bookingId: string,
        holdId: string
    ): Promise<{ success: boolean; errorMessage?: string }> => {
        const response = await apiClient.post(`/inventory/bookings/${holdId}/confirm`, { bookingId });
        return response.data.data;
    },

    /**
     * Cancel a booking
     */
    cancelBooking: async (
        bookingId: string,
        reason: string
    ): Promise<{ success: boolean; errorMessage?: string }> => {
        const response = await apiClient.delete(`/inventory/bookings/${bookingId}`, { data: { reason } });
        return response.data.data;
    },

    /**
     * Get booking with payment summary
     */
    getBookingDetails: async (bookingId: string) => {
        const response = await apiClient.get(`/bookings/${bookingId}/details`);
        return response.data.data;
    },
};

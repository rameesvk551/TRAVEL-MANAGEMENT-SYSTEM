import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, bookingOrchestratorApi } from '@/api';
import type {
    CreateDepartureRequest,
    InitiateBookingRequest,
    DepartureWithInventory,
    CalendarData,
    ActiveHold,
    AvailabilityResult,
} from '@/types';

/**
 * Query keys for inventory data
 */
export const inventoryKeys = {
    all: ['inventory'] as const,
    calendar: (dateFrom: string, dateTo: string, resourceId?: string) =>
        [...inventoryKeys.all, 'calendar', dateFrom, dateTo, resourceId] as const,
    departure: (id: string) => [...inventoryKeys.all, 'departure', id] as const,
    departuresByResource: (resourceId: string) =>
        [...inventoryKeys.all, 'resource', resourceId] as const,
    holds: (departureId: string) => [...inventoryKeys.all, 'holds', departureId] as const,
    availability: (departureId: string, seats: number) =>
        [...inventoryKeys.all, 'availability', departureId, seats] as const,
};

/**
 * Hook for calendar view data
 */
export function useInventoryCalendar(
    dateFrom: string,
    dateTo: string,
    resourceId?: string
) {
    return useQuery<CalendarData>({
        queryKey: inventoryKeys.calendar(dateFrom, dateTo, resourceId),
        queryFn: () => inventoryApi.getCalendarData(dateFrom, dateTo, resourceId),
        staleTime: 30000, // 30 seconds - inventory changes frequently
    });
}

/**
 * Hook for single departure with inventory
 */
export function useDeparture(departureId: string) {
    return useQuery<DepartureWithInventory>({
        queryKey: inventoryKeys.departure(departureId),
        queryFn: () => inventoryApi.getDeparture(departureId),
        enabled: !!departureId,
    });
}

/**
 * Hook for departures by resource
 */
export function useDeparturesByResource(
    resourceId: string,
    dateFrom?: string,
    dateTo?: string
) {
    return useQuery<DepartureWithInventory[]>({
        queryKey: inventoryKeys.departuresByResource(resourceId),
        queryFn: () => inventoryApi.getDeparturesByResource(resourceId, dateFrom, dateTo),
        enabled: !!resourceId,
    });
}

/**
 * Hook for active holds
 */
export function useActiveHolds(departureId: string) {
    return useQuery<ActiveHold[]>({
        queryKey: inventoryKeys.holds(departureId),
        queryFn: () => inventoryApi.getActiveHolds(departureId),
        enabled: !!departureId,
        refetchInterval: 30000, // Refresh every 30 seconds for hold expiry updates
    });
}

/**
 * Hook for availability check
 */
export function useAvailabilityCheck(departureId: string, seatCount: number) {
    return useQuery<AvailabilityResult>({
        queryKey: inventoryKeys.availability(departureId, seatCount),
        queryFn: () => inventoryApi.checkAvailability(departureId, seatCount),
        enabled: !!departureId && seatCount > 0,
    });
}

/**
 * Hook for creating a departure
 */
export function useCreateDeparture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateDepartureRequest) => inventoryApi.createDeparture(data),
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            queryClient.invalidateQueries({
                queryKey: inventoryKeys.departuresByResource(variables.resourceId),
            });
        },
    });
}

/**
 * Hook for updating a departure
 */
export function useUpdateDeparture() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            departureId,
            data,
        }: {
            departureId: string;
            data: Partial<CreateDepartureRequest>;
        }) => inventoryApi.updateDeparture(departureId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: inventoryKeys.departure(variables.departureId),
            });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
        },
    });
}

/**
 * Hook for creating a hold
 */
export function useCreateHold() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            departureId,
            seatCount,
            holdType,
        }: {
            departureId: string;
            seatCount: number;
            holdType?: 'CART' | 'PAYMENT_PENDING' | 'APPROVAL_PENDING';
        }) => inventoryApi.createHold(departureId, seatCount, holdType),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: inventoryKeys.holds(variables.departureId),
            });
            queryClient.invalidateQueries({
                queryKey: inventoryKeys.departure(variables.departureId),
            });
        },
    });
}

/**
 * Hook for releasing a hold
 */
export function useReleaseHold() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (holdId: string) => inventoryApi.releaseHold(holdId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
        },
    });
}

/**
 * Hook for initiating a booking
 */
export function useInitiateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: InitiateBookingRequest) =>
            bookingOrchestratorApi.initiateBooking(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: inventoryKeys.departure(variables.departureId),
            });
        },
    });
}

/**
 * Hook for confirming a booking
 */
export function useConfirmBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, holdId }: { bookingId: string; holdId: string }) =>
            bookingOrchestratorApi.confirmBooking(bookingId, holdId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

/**
 * Hook for cancelling a booking
 */
export function useCancelBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
            bookingOrchestratorApi.cancelBooking(bookingId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

/**
 * HRMS Hooks - Trip Assignment Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripAssignmentApi } from '@/api/hrms';
import type { TripAssignmentStatus } from '@/types/hrms.types';

const QUERY_KEYS = {
    myAssignments: ['hrms', 'trip-assignments', 'me'] as const,
    tripAssignments: (tripId: string) => ['hrms', 'trip-assignments', 'trip', tripId] as const,
    availableStaff: ['hrms', 'trip-assignments', 'available-staff'] as const,
};

export function useMyTripAssignments(params?: {
    status?: TripAssignmentStatus;
    upcoming?: boolean;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.myAssignments, params],
        queryFn: () => tripAssignmentApi.getMyAssignments(params),
    });
}

export function useTripAssignments(tripId: string) {
    return useQuery({
        queryKey: QUERY_KEYS.tripAssignments(tripId),
        queryFn: () => tripAssignmentApi.getByTrip(tripId),
        enabled: !!tripId,
    });
}

export function useAvailableStaff(params: {
    startDate: string;
    endDate: string;
    role?: string;
    skillIds?: string[];
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.availableStaff, params],
        queryFn: () => tripAssignmentApi.getAvailableStaff(params),
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useAssignToTrip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            employeeId: string;
            tripId: string;
            role: string;
            startDate: string;
            endDate: string;
            dailyRate?: number;
        }) => tripAssignmentApi.assign(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAssignments });
            queryClient.invalidateQueries({ 
                queryKey: QUERY_KEYS.tripAssignments(variables.tripId) 
            });
        },
    });
}

export function useConfirmAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tripAssignmentApi.confirm(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAssignments });
        },
    });
}

export function useCompleteAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => tripAssignmentApi.complete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAssignments });
        },
    });
}

export function useCancelAssignment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => 
            tripAssignmentApi.cancel(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAssignments });
        },
    });
}

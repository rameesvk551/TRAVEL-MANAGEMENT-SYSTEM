/**
 * HRMS Hooks - Leave Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/hrms';
import type { CreateLeaveDTO, LeaveStatus } from '@/types/hrms.types';

const QUERY_KEYS = {
    myLeaves: ['hrms', 'leaves', 'me'] as const,
    myBalance: ['hrms', 'leaves', 'balance'] as const,
    pending: ['hrms', 'leaves', 'pending'] as const,
    calendar: ['hrms', 'leaves', 'calendar'] as const,
};

export function useMyLeaves(params?: { status?: LeaveStatus; year?: number }) {
    return useQuery({
        queryKey: [...QUERY_KEYS.myLeaves, params],
        queryFn: () => leaveApi.getMyLeaves(params),
    });
}

export function useLeaveBalance() {
    return useQuery({
        queryKey: QUERY_KEYS.myBalance,
        queryFn: () => leaveApi.getMyBalance(),
    });
}

export function usePendingApprovals() {
    return useQuery({
        queryKey: QUERY_KEYS.pending,
        queryFn: () => leaveApi.getPendingApprovals(),
    });
}

export function useLeaveCalendar(params: {
    startDate: string;
    endDate: string;
    departmentId?: string;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.calendar, params],
        queryFn: () => leaveApi.getTeamCalendar(params),
        enabled: !!params.startDate && !!params.endDate,
    });
}

export function useApplyLeave() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateLeaveDTO) => leaveApi.apply(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myLeaves });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myBalance });
        },
    });
}

export function useCancelLeave() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => leaveApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myLeaves });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myBalance });
        },
    });
}

export function useApproveLeave() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
            leaveApi.approve(id, remarks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.calendar });
        },
    });
}

export function useRejectLeave() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
            leaveApi.reject(id, remarks),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pending });
        },
    });
}

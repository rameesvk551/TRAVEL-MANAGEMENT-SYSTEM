/**
 * HRMS Hooks - Attendance Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/hrms';
import type { CheckInDTO, CheckOutDTO } from '@/types/hrms.types';

const QUERY_KEYS = {
    myAttendance: ['hrms', 'attendance', 'me'] as const,
    todayStatus: ['hrms', 'attendance', 'today'] as const,
    teamAttendance: (date: string) => ['hrms', 'attendance', 'team', date] as const,
    employeeAttendance: (id: string) => ['hrms', 'attendance', 'employee', id] as const,
};

export function useMyAttendance(params?: {
    startDate?: string;
    endDate?: string;
}) {
    return useQuery({
        queryKey: [...QUERY_KEYS.myAttendance, params],
        queryFn: () => attendanceApi.getMyAttendance(params),
    });
}

export function useTodayStatus() {
    return useQuery({
        queryKey: QUERY_KEYS.todayStatus,
        queryFn: () => attendanceApi.getTodayStatus(),
        refetchInterval: 60000, // Refresh every minute
    });
}

export function useTeamAttendance(date: string) {
    return useQuery({
        queryKey: QUERY_KEYS.teamAttendance(date),
        queryFn: () => attendanceApi.getTeamAttendance(date),
        enabled: !!date,
    });
}

export function useEmployeeAttendance(
    employeeId: string,
    params?: { startDate?: string; endDate?: string }
) {
    return useQuery({
        queryKey: [...QUERY_KEYS.employeeAttendance(employeeId), params],
        queryFn: () => attendanceApi.getEmployeeAttendance(employeeId, params),
        enabled: !!employeeId,
    });
}

export function useCheckIn() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CheckInDTO) => attendanceApi.checkIn(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayStatus });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAttendance });
        },
    });
}

export function useCheckOut() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CheckOutDTO) => attendanceApi.checkOut(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayStatus });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAttendance });
        },
    });
}

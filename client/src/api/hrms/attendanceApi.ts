/**
 * HRMS API - Attendance Endpoints
 */
import { apiClient } from '../client';
import type {
    Attendance,
    CheckInDTO,
    CheckOutDTO,
} from '@/types/hrms.types';
import type { ApiResponse } from '@/types/api.types';

const BASE_URL = '/hrms/attendance';

export const attendanceApi = {
    getMyAttendance: async (params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<ApiResponse<Attendance[]>> => {
        const response = await apiClient.get(`${BASE_URL}/me`, { params });
        return response.data;
    },

    getEmployeeAttendance: async (
        employeeId: string,
        params?: { startDate?: string; endDate?: string }
    ): Promise<ApiResponse<Attendance[]>> => {
        const response = await apiClient.get(
            `${BASE_URL}/employee/${employeeId}`,
            { params }
        );
        return response.data;
    },

    checkIn: async (data: CheckInDTO): Promise<ApiResponse<Attendance>> => {
        const response = await apiClient.post(`${BASE_URL}/check-in`, data);
        return response.data;
    },

    checkOut: async (data: CheckOutDTO): Promise<ApiResponse<Attendance>> => {
        const response = await apiClient.post(`${BASE_URL}/check-out`, data);
        return response.data;
    },

    getTodayStatus: async (): Promise<ApiResponse<Attendance | null>> => {
        const response = await apiClient.get(`${BASE_URL}/today`);
        return response.data;
    },

    getTeamAttendance: async (
        date: string
    ): Promise<ApiResponse<Attendance[]>> => {
        const response = await apiClient.get(`${BASE_URL}/team`, {
            params: { date },
        });
        return response.data;
    },

    markAbsent: async (
        employeeId: string,
        date: string,
        reason?: string
    ): Promise<ApiResponse<Attendance>> => {
        const response = await apiClient.post(`${BASE_URL}/mark-absent`, {
            employeeId,
            date,
            reason,
        });
        return response.data;
    },
};

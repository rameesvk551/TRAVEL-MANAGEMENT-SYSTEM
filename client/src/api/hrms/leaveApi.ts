/**
 * HRMS API - Leave Management Endpoints
 */
import { apiClient } from '../client';
import type {
    Leave,
    CreateLeaveDTO,
    LeaveBalance,
    LeaveStatus,
} from '@/types/hrms.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

const BASE_URL = '/hrms/leaves';

export const leaveApi = {
    getMyLeaves: async (params?: {
        status?: LeaveStatus;
        year?: number;
    }): Promise<PaginatedResponse<Leave>> => {
        const response = await apiClient.get(`${BASE_URL}/me`, { params });
        return response.data;
    },

    getMyBalance: async (): Promise<ApiResponse<LeaveBalance[]>> => {
        const response = await apiClient.get(`${BASE_URL}/me/balance`);
        return response.data;
    },

    apply: async (data: CreateLeaveDTO): Promise<ApiResponse<Leave>> => {
        const response = await apiClient.post(BASE_URL, data);
        return response.data;
    },

    cancel: async (id: string): Promise<ApiResponse<Leave>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/cancel`);
        return response.data;
    },

    // Manager endpoints
    getPendingApprovals: async (): Promise<PaginatedResponse<Leave>> => {
        const response = await apiClient.get(`${BASE_URL}/pending`);
        return response.data;
    },

    approve: async (
        id: string,
        remarks?: string
    ): Promise<ApiResponse<Leave>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/approve`, {
            remarks,
        });
        return response.data;
    },

    reject: async (
        id: string,
        remarks: string
    ): Promise<ApiResponse<Leave>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/reject`, {
            remarks,
        });
        return response.data;
    },

    // Admin endpoints
    getTeamCalendar: async (params: {
        startDate: string;
        endDate: string;
        departmentId?: string;
    }): Promise<ApiResponse<Leave[]>> => {
        const response = await apiClient.get(`${BASE_URL}/calendar`, { params });
        return response.data;
    },
};

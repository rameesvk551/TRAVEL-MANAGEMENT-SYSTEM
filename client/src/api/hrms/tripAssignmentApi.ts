/**
 * HRMS API - Trip Assignment Endpoints
 */
import { apiClient } from '../client';
import type { TripAssignment, TripAssignmentStatus } from '@/types/hrms.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

const BASE_URL = '/hrms/trip-assignments';

export const tripAssignmentApi = {
    getMyAssignments: async (params?: {
        status?: TripAssignmentStatus;
        upcoming?: boolean;
    }): Promise<PaginatedResponse<TripAssignment>> => {
        const response = await apiClient.get(`${BASE_URL}/me`, { params });
        return response.data;
    },

    getByTrip: async (tripId: string): Promise<ApiResponse<TripAssignment[]>> => {
        const response = await apiClient.get(`${BASE_URL}/trip/${tripId}`);
        return response.data;
    },

    assign: async (data: {
        employeeId: string;
        tripId: string;
        role: string;
        startDate: string;
        endDate: string;
        dailyRate?: number;
    }): Promise<ApiResponse<TripAssignment>> => {
        const response = await apiClient.post(BASE_URL, data);
        return response.data;
    },

    updateStatus: async (
        id: string,
        status: TripAssignmentStatus
    ): Promise<ApiResponse<TripAssignment>> => {
        const response = await apiClient.patch(`${BASE_URL}/${id}/status`, {
            status,
        });
        return response.data;
    },

    confirm: async (id: string): Promise<ApiResponse<TripAssignment>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/confirm`);
        return response.data;
    },

    complete: async (id: string): Promise<ApiResponse<TripAssignment>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/complete`);
        return response.data;
    },

    cancel: async (
        id: string,
        reason: string
    ): Promise<ApiResponse<TripAssignment>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/cancel`, {
            reason,
        });
        return response.data;
    },

    getAvailableStaff: async (params: {
        startDate: string;
        endDate: string;
        role?: string;
        skillIds?: string[];
    }): Promise<ApiResponse<{ employeeId: string; name: string }[]>> => {
        const response = await apiClient.get(`${BASE_URL}/available-staff`, {
            params,
        });
        return response.data;
    },
};

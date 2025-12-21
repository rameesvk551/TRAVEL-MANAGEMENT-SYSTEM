/**
 * HRMS API - Payroll Endpoints
 */
import { apiClient } from '../client';
import type { Payroll } from '@/types/hrms.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

const BASE_URL = '/hrms/payroll';

export const payrollApi = {
    getMyPayslips: async (params?: {
        year?: number;
    }): Promise<PaginatedResponse<Payroll>> => {
        const response = await apiClient.get(`${BASE_URL}/me`, { params });
        return response.data;
    },

    getPayslip: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    downloadPayslip: async (id: string): Promise<Blob> => {
        const response = await apiClient.get(`${BASE_URL}/${id}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // Admin endpoints
    generatePayroll: async (params: {
        periodStart: string;
        periodEnd: string;
        employeeIds?: string[];
    }): Promise<ApiResponse<Payroll[]>> => {
        const response = await apiClient.post(`${BASE_URL}/generate`, params);
        return response.data;
    },

    getPendingPayrolls: async (): Promise<PaginatedResponse<Payroll>> => {
        const response = await apiClient.get(`${BASE_URL}/pending`);
        return response.data;
    },

    approve: async (id: string): Promise<ApiResponse<Payroll>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/approve`);
        return response.data;
    },

    bulkApprove: async (ids: string[]): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(`${BASE_URL}/bulk-approve`, { ids });
        return response.data;
    },

    markPaid: async (
        id: string,
        paymentRef?: string
    ): Promise<ApiResponse<Payroll>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/mark-paid`, {
            paymentRef,
        });
        return response.data;
    },

    getPayrollSummary: async (params: {
        periodStart: string;
        periodEnd: string;
    }): Promise<ApiResponse<{
        totalEmployees: number;
        totalBaseSalary: number;
        totalTripEarnings: number;
        totalDeductions: number;
        totalNet: number;
    }>> => {
        const response = await apiClient.get(`${BASE_URL}/summary`, { params });
        return response.data;
    },
};

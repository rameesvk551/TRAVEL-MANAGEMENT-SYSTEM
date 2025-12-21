/**
 * HRMS API - Employee Endpoints
 */
import { apiClient } from '../client';
import type {
    Employee,
    CreateEmployeeDTO,
    UpdateEmployeeDTO,
    EmployeeSkill,
} from '@/types/hrms.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

const BASE_URL = '/hrms/employees';

export const employeeApi = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
        departmentId?: string;
        search?: string;
    }): Promise<PaginatedResponse<Employee>> => {
        const response = await apiClient.get(BASE_URL, { params });
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<Employee>> => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    create: async (data: CreateEmployeeDTO): Promise<ApiResponse<Employee>> => {
        const response = await apiClient.post(BASE_URL, data);
        return response.data;
    },

    update: async (
        id: string,
        data: UpdateEmployeeDTO
    ): Promise<ApiResponse<Employee>> => {
        const response = await apiClient.patch(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`${BASE_URL}/${id}`);
        return response.data;
    },

    getSkills: async (id: string): Promise<ApiResponse<EmployeeSkill[]>> => {
        const response = await apiClient.get(`${BASE_URL}/${id}/skills`);
        return response.data;
    },

    addSkill: async (
        id: string,
        skillData: { skillId: string; proficiency: string }
    ): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/skills`, skillData);
        return response.data;
    },
};

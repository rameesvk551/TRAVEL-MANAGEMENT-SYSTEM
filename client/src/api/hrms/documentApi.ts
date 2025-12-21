/**
 * HRMS API - Document Endpoints
 */
import { apiClient } from '../client';
import type {
    EmployeeDocument,
    CreateDocumentDTO,
    UpdateDocumentDTO,
    DocumentQuery,
} from '@/types/hrms.types';
import type { ApiResponse } from '@/types/api.types';

const BASE_URL = '/hrms/documents';

export const documentApi = {
    getAll: async (params?: DocumentQuery): Promise<ApiResponse<EmployeeDocument[]>> => {
        const response = await apiClient.get(BASE_URL, { params });
        return response.data;
    },

    getById: async (id: string): Promise<ApiResponse<EmployeeDocument>> => {
        const response = await apiClient.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    getByEmployee: async (employeeId: string): Promise<ApiResponse<EmployeeDocument[]>> => {
        const response = await apiClient.get(`${BASE_URL}/employee/${employeeId}`);
        return response.data;
    },

    getExpiring: async (days?: number): Promise<ApiResponse<EmployeeDocument[]>> => {
        const response = await apiClient.get(`${BASE_URL}/expiring`, {
            params: { days: days || 30 },
        });
        return response.data;
    },

    create: async (data: CreateDocumentDTO): Promise<ApiResponse<EmployeeDocument>> => {
        const response = await apiClient.post(BASE_URL, data);
        return response.data;
    },

    update: async (
        id: string,
        data: UpdateDocumentDTO
    ): Promise<ApiResponse<EmployeeDocument>> => {
        const response = await apiClient.put(`${BASE_URL}/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`${BASE_URL}/${id}`);
        return response.data;
    },

    verify: async (id: string): Promise<ApiResponse<EmployeeDocument>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/verify`);
        return response.data;
    },

    reject: async (id: string, reason: string): Promise<ApiResponse<EmployeeDocument>> => {
        const response = await apiClient.post(`${BASE_URL}/${id}/reject`, { reason });
        return response.data;
    },

    // File upload helper - in a real app, this would upload to cloud storage
    // and return the URL. For now, we'll use a mock implementation.
    uploadFile: async (file: File): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> => {
        // In production, this would upload to S3/GCS/Azure Blob Storage
        // For now, we'll create a local object URL as a placeholder
        const url = URL.createObjectURL(file);
        return {
            url,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
        };
    },
};

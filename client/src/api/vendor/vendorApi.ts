import { apiClient } from '../client';
import type {
    Vendor,
    VendorAssignment,
    VendorPayable,
    VendorSettlement,
    CreateVendorInput,
    UpdateVendorInput,
    CreateAssignmentInput,
    UpdateAssignmentInput,
    CreatePayableInput,
    UpdatePayableInput,
    CreateSettlementInput,
    VendorFilters,
    AssignmentFilters,
    PayableFilters,
    SettlementFilters,
    PayableSummary,
    SettlementSummary,
    VendorType,
    VendorStatus,
} from '@/types';
import type { ApiResponse, PaginatedResponse } from '@/types';

// ============================================================================
// VENDOR API
// ============================================================================

export const vendorApi = {
    async getAll(filters: VendorFilters = {}): Promise<PaginatedResponse<Vendor>> {
        const params = new URLSearchParams();
        if (filters.vendorType) params.set('type', filters.vendorType);
        if (filters.status) params.set('status', filters.status);
        if (filters.search) params.set('search', filters.search);
        if (filters.city) params.set('city', filters.city);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await apiClient.get<PaginatedResponse<Vendor>>(
            `/vendors/vendors?${params.toString()}`
        );
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<Vendor>> {
        const response = await apiClient.get<ApiResponse<Vendor>>(`/vendors/vendors/${id}`);
        return response.data;
    },

    async getActive(): Promise<ApiResponse<Vendor[]>> {
        const response = await apiClient.get<ApiResponse<Vendor[]>>('/vendors/vendors/active');
        return response.data;
    },

    async getByType(type: VendorType): Promise<ApiResponse<Vendor[]>> {
        const response = await apiClient.get<ApiResponse<Vendor[]>>(`/vendors/vendors/type/${type}`);
        return response.data;
    },

    async search(query: string): Promise<ApiResponse<Vendor[]>> {
        const response = await apiClient.get<ApiResponse<Vendor[]>>(`/vendors/vendors/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    async create(data: CreateVendorInput): Promise<ApiResponse<Vendor>> {
        const response = await apiClient.post<ApiResponse<Vendor>>('/vendors/vendors', data);
        return response.data;
    },

    async update(id: string, data: UpdateVendorInput): Promise<ApiResponse<Vendor>> {
        const response = await apiClient.put<ApiResponse<Vendor>>(`/vendors/vendors/${id}`, data);
        return response.data;
    },

    async updateStatus(id: string, status: VendorStatus): Promise<ApiResponse<void>> {
        const response = await apiClient.patch<ApiResponse<void>>(`/vendors/vendors/${id}/status`, { status });
        return response.data;
    },

    async activate(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/vendors/${id}/activate`);
        return response.data;
    },

    async deactivate(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/vendors/${id}/deactivate`);
        return response.data;
    },
};

// ============================================================================
// ASSIGNMENT API
// ============================================================================

export const vendorAssignmentApi = {
    async getAll(filters: AssignmentFilters = {}): Promise<PaginatedResponse<VendorAssignment>> {
        const params = new URLSearchParams();
        if (filters.vendorId) params.set('vendorId', filters.vendorId);
        if (filters.bookingId) params.set('bookingId', filters.bookingId);
        if (filters.status) params.set('status', filters.status);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await apiClient.get<PaginatedResponse<VendorAssignment>>(
            `/vendors/assignments?${params.toString()}`
        );
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<VendorAssignment>> {
        const response = await apiClient.get<ApiResponse<VendorAssignment>>(`/vendors/assignments/${id}`);
        return response.data;
    },

    async getUpcoming(days = 7): Promise<ApiResponse<VendorAssignment[]>> {
        const response = await apiClient.get<ApiResponse<VendorAssignment[]>>(`/vendors/assignments/upcoming?days=${days}`);
        return response.data;
    },

    async getByVendor(vendorId: string): Promise<ApiResponse<VendorAssignment[]>> {
        const response = await apiClient.get<ApiResponse<VendorAssignment[]>>(`/vendors/assignments/vendor/${vendorId}`);
        return response.data;
    },

    async getByBooking(bookingId: string): Promise<ApiResponse<VendorAssignment[]>> {
        const response = await apiClient.get<ApiResponse<VendorAssignment[]>>(`/vendors/assignments/booking/${bookingId}`);
        return response.data;
    },

    async create(data: CreateAssignmentInput): Promise<ApiResponse<VendorAssignment>> {
        const response = await apiClient.post<ApiResponse<VendorAssignment>>('/vendors/assignments', data);
        return response.data;
    },

    async update(id: string, data: UpdateAssignmentInput): Promise<ApiResponse<VendorAssignment>> {
        const response = await apiClient.put<ApiResponse<VendorAssignment>>(`/vendors/assignments/${id}`, data);
        return response.data;
    },

    async accept(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/assignments/${id}/accept`);
        return response.data;
    },

    async complete(id: string): Promise<ApiResponse<{ payable: VendorPayable }>> {
        const response = await apiClient.post<ApiResponse<{ payable: VendorPayable }>>(`/vendors/assignments/${id}/complete`);
        return response.data;
    },

    async cancel(id: string, reason: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/assignments/${id}/cancel`, { reason });
        return response.data;
    },

    async replace(id: string, newVendorId: string): Promise<ApiResponse<VendorAssignment>> {
        const response = await apiClient.post<ApiResponse<VendorAssignment>>(`/vendors/assignments/${id}/replace`, { newVendorId });
        return response.data;
    },
};

// ============================================================================
// PAYABLE API
// ============================================================================

export const vendorPayableApi = {
    async getAll(filters: PayableFilters = {}): Promise<PaginatedResponse<VendorPayable>> {
        const params = new URLSearchParams();
        if (filters.vendorId) params.set('vendorId', filters.vendorId);
        if (filters.status) params.set('status', filters.status);
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await apiClient.get<PaginatedResponse<VendorPayable>>(
            `/vendors/payables?${params.toString()}`
        );
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<VendorPayable>> {
        const response = await apiClient.get<ApiResponse<VendorPayable>>(`/vendors/payables/${id}`);
        return response.data;
    },

    async getOverdue(): Promise<ApiResponse<VendorPayable[]>> {
        const response = await apiClient.get<ApiResponse<VendorPayable[]>>('/vendors/payables/overdue');
        return response.data;
    },

    async getByVendor(vendorId: string): Promise<ApiResponse<VendorPayable[]>> {
        const response = await apiClient.get<ApiResponse<VendorPayable[]>>(`/vendors/payables/vendor/${vendorId}`);
        return response.data;
    },

    async getSummary(): Promise<ApiResponse<PayableSummary>> {
        const response = await apiClient.get<ApiResponse<PayableSummary>>('/vendors/payables/summary');
        return response.data;
    },

    async getVendorSummary(vendorId: string): Promise<ApiResponse<PayableSummary>> {
        const response = await apiClient.get<ApiResponse<PayableSummary>>(`/vendors/payables/vendor/${vendorId}/summary`);
        return response.data;
    },

    async create(data: CreatePayableInput): Promise<ApiResponse<VendorPayable>> {
        const response = await apiClient.post<ApiResponse<VendorPayable>>('/vendors/payables', data);
        return response.data;
    },

    async update(id: string, data: UpdatePayableInput): Promise<ApiResponse<VendorPayable>> {
        const response = await apiClient.put<ApiResponse<VendorPayable>>(`/vendors/payables/${id}`, data);
        return response.data;
    },

    async submit(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/payables/${id}/submit`);
        return response.data;
    },

    async approve(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/payables/${id}/approve`);
        return response.data;
    },

    async hold(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/payables/${id}/hold`);
        return response.data;
    },

    async dispute(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/payables/${id}/dispute`);
        return response.data;
    },
};

// ============================================================================
// SETTLEMENT API
// ============================================================================

export const vendorSettlementApi = {
    async getAll(filters: SettlementFilters = {}): Promise<PaginatedResponse<VendorSettlement>> {
        const params = new URLSearchParams();
        if (filters.vendorId) params.set('vendorId', filters.vendorId);
        if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
        if (filters.isVerified !== undefined) params.set('isVerified', String(filters.isVerified));
        if (filters.page) params.set('page', String(filters.page));
        if (filters.limit) params.set('limit', String(filters.limit));

        const response = await apiClient.get<PaginatedResponse<VendorSettlement>>(
            `/vendors/settlements?${params.toString()}`
        );
        return response.data;
    },

    async getById(id: string): Promise<ApiResponse<VendorSettlement>> {
        const response = await apiClient.get<ApiResponse<VendorSettlement>>(`/vendors/settlements/${id}`);
        return response.data;
    },

    async getByVendor(vendorId: string): Promise<ApiResponse<VendorSettlement[]>> {
        const response = await apiClient.get<ApiResponse<VendorSettlement[]>>(`/vendors/settlements/vendor/${vendorId}`);
        return response.data;
    },

    async getSummary(dateFrom?: string, dateTo?: string): Promise<ApiResponse<SettlementSummary>> {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        const response = await apiClient.get<ApiResponse<SettlementSummary>>(`/vendors/settlements/summary?${params.toString()}`);
        return response.data;
    },

    async getVendorSummary(vendorId: string): Promise<ApiResponse<SettlementSummary>> {
        const response = await apiClient.get<ApiResponse<SettlementSummary>>(`/vendors/settlements/vendor/${vendorId}/summary`);
        return response.data;
    },

    async create(data: CreateSettlementInput): Promise<ApiResponse<VendorSettlement>> {
        const response = await apiClient.post<ApiResponse<VendorSettlement>>('/vendors/settlements', data);
        return response.data;
    },

    async verify(id: string): Promise<ApiResponse<void>> {
        const response = await apiClient.post<ApiResponse<void>>(`/vendors/settlements/${id}/verify`);
        return response.data;
    },
};

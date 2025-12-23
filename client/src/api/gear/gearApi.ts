import { apiClient } from '../client';
import type {
    GearCategory,
    GearItem,
    GearItemWithInventory,
    GearAssignment,
    TripGearManifest,
    InventorySummary,
    AvailabilityResult,
    InventoryHeatmap,
    GearCategoryFilters,
    GearItemFilters,
    CreateGearCategoryDTO,
    CreateGearItemDTO,
    CreateGearAssignmentDTO,
    IssueGearDTO,
    ReturnGearDTO,
    AvailabilityQuery,
    GearCondition,
} from '../../types/gear.types';
import type { PaginatedResult } from '../../types/api.types';

const BASE_URL = '/gear';

// ============================================
// CATEGORY API
// ============================================

export const gearCategoryApi = {
    getAll: async (filters?: GearCategoryFilters): Promise<GearCategory[]> => {
        const params = new URLSearchParams();
        if (filters?.type) params.append('type', filters.type);
        if (filters?.parentId) params.append('parentId', filters.parentId);
        if (filters?.isSafetyCritical !== undefined) params.append('isSafetyCritical', String(filters.isSafetyCritical));
        if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters?.search) params.append('search', filters.search);

        const { data } = await apiClient.get(`${BASE_URL}/categories?${params}`);
        return data.data;
    },

    getById: async (id: string): Promise<GearCategory> => {
        const { data } = await apiClient.get(`${BASE_URL}/categories/${id}`);
        return data.data;
    },

    create: async (dto: CreateGearCategoryDTO): Promise<GearCategory> => {
        const { data } = await apiClient.post(`${BASE_URL}/categories`, dto);
        return data.data;
    },

    update: async (id: string, dto: Partial<CreateGearCategoryDTO>): Promise<GearCategory> => {
        const { data } = await apiClient.put(`${BASE_URL}/categories/${id}`, dto);
        return data.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`${BASE_URL}/categories/${id}`);
    },
};

// ============================================
// ITEM API
// ============================================

export const gearItemApi = {
    getAll: async (
        filters?: GearItemFilters,
        page = 1,
        limit = 50
    ): Promise<PaginatedResult<GearItem>> => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', String(limit));
        if (filters?.categoryId) params.append('categoryId', filters.categoryId);
        if (filters?.condition) {
            if (Array.isArray(filters.condition)) {
                filters.condition.forEach(c => params.append('condition', c));
            } else {
                params.append('condition', filters.condition);
            }
        }
        if (filters?.ownershipType) params.append('ownershipType', filters.ownershipType);
        if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
        if (filters?.isSafetyCritical !== undefined) params.append('isSafetyCritical', String(filters.isSafetyCritical));
        if (filters?.isRentable !== undefined) params.append('isRentable', String(filters.isRentable));
        if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
        if (filters?.inspectionOverdue) params.append('inspectionOverdue', 'true');
        if (filters?.maintenanceOverdue) params.append('maintenanceOverdue', 'true');
        if (filters?.search) params.append('search', filters.search);

        const { data } = await apiClient.get(`${BASE_URL}/items?${params}`);
        return data;
    },

    getById: async (id: string): Promise<GearItemWithInventory> => {
        const { data } = await apiClient.get(`${BASE_URL}/items/${id}`);
        return data.data;
    },

    getByBarcode: async (barcode: string): Promise<GearItemWithInventory> => {
        const { data } = await apiClient.get(`${BASE_URL}/items/barcode/${barcode}`);
        return data.data;
    },

    getUnsafe: async (): Promise<GearItem[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/items/unsafe`);
        return data.data;
    },

    getInspectionOverdue: async (): Promise<GearItem[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/items/inspection-overdue`);
        return data.data;
    },

    getMaintenanceOverdue: async (): Promise<GearItem[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/items/maintenance-overdue`);
        return data.data;
    },

    create: async (dto: CreateGearItemDTO): Promise<GearItem> => {
        const { data } = await apiClient.post(`${BASE_URL}/items`, dto);
        return data.data;
    },

    update: async (id: string, dto: Partial<CreateGearItemDTO>): Promise<GearItem> => {
        const { data } = await apiClient.put(`${BASE_URL}/items/${id}`, dto);
        return data.data;
    },

    updateCondition: async (
        id: string,
        condition: GearCondition,
        conditionScore: number
    ): Promise<void> => {
        await apiClient.patch(`${BASE_URL}/items/${id}/condition`, {
            condition,
            conditionScore,
        });
    },

    retire: async (id: string): Promise<void> => {
        await apiClient.post(`${BASE_URL}/items/${id}/retire`);
    },
};

// ============================================
// INVENTORY API
// ============================================

export const gearInventoryApi = {
    getSummary: async (warehouseId?: string): Promise<InventorySummary> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const { data } = await apiClient.get(`${BASE_URL}/inventory/summary${params}`);
        return data.data;
    },

    checkAvailability: async (query: AvailabilityQuery): Promise<AvailabilityResult> => {
        const params = new URLSearchParams();
        if (query.categoryId) params.append('categoryId', query.categoryId);
        if (query.warehouseId) params.append('warehouseId', query.warehouseId);
        if (query.size) params.append('size', query.size);
        params.append('startDate', query.startDate);
        params.append('endDate', query.endDate);
        params.append('quantity', String(query.quantity));

        const { data } = await apiClient.get(`${BASE_URL}/inventory/availability?${params}`);
        return data.data;
    },

    getHeatmap: async (warehouseId?: string): Promise<InventoryHeatmap> => {
        const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const { data } = await apiClient.get(`${BASE_URL}/inventory/heatmap${params}`);
        return data.data;
    },

    transfer: async (
        gearItemId: string,
        toWarehouseId: string,
        reason?: string
    ): Promise<void> => {
        await apiClient.post(`${BASE_URL}/inventory/transfer`, {
            gearItemId,
            toWarehouseId,
            reason,
        });
    },

    releaseFromQuarantine: async (
        gearItemId: string,
        inspectionPassed: boolean,
        notes?: string
    ): Promise<void> => {
        await apiClient.post(`${BASE_URL}/inventory/${gearItemId}/release-quarantine`, {
            inspectionPassed,
            notes,
        });
    },

    releaseExpiredReservations: async (): Promise<{ released: number }> => {
        const { data } = await apiClient.post(`${BASE_URL}/inventory/release-expired`);
        return data.data;
    },
};

// ============================================
// ASSIGNMENT API
// ============================================

export const gearAssignmentApi = {
    getByTrip: async (tripId: string): Promise<GearAssignment[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/assignments/trip/${tripId}`);
        return data.data;
    },

    getTripManifest: async (tripId: string): Promise<TripGearManifest> => {
        const { data } = await apiClient.get(`${BASE_URL}/assignments/trip/${tripId}/manifest`);
        return data.data;
    },

    getPendingReturns: async (): Promise<GearAssignment[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/assignments/pending-returns`);
        return data.data;
    },

    getOverdueReturns: async (): Promise<GearAssignment[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/assignments/overdue`);
        return data.data;
    },

    create: async (dto: CreateGearAssignmentDTO): Promise<GearAssignment> => {
        const { data } = await apiClient.post(`${BASE_URL}/assignments`, dto);
        return data.data;
    },

    createBulk: async (
        tripId: string,
        assignments: Omit<CreateGearAssignmentDTO, 'tripId'>[]
    ): Promise<GearAssignment[]> => {
        const { data } = await apiClient.post(`${BASE_URL}/assignments/bulk`, {
            tripId,
            assignments,
        });
        return data.data;
    },

    issueGear: async (assignmentId: string, dto: IssueGearDTO): Promise<GearAssignment> => {
        const { data } = await apiClient.post(`${BASE_URL}/assignments/${assignmentId}/issue`, dto);
        return data.data;
    },

    returnGear: async (assignmentId: string, dto: ReturnGearDTO): Promise<GearAssignment> => {
        const { data } = await apiClient.post(`${BASE_URL}/assignments/${assignmentId}/return`, dto);
        return data.data;
    },

    cancel: async (assignmentId: string): Promise<void> => {
        await apiClient.post(`${BASE_URL}/assignments/${assignmentId}/cancel`);
    },
};

// Combined gear API export
export const gearApi = {
    categories: gearCategoryApi,
    items: gearItemApi,
    inventory: gearInventoryApi,
    assignments: gearAssignmentApi,
};

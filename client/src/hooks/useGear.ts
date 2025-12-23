import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gearApi } from '../api/gear';
import type {
    GearCategoryFilters,
    GearItemFilters,
    CreateGearCategoryDTO,
    CreateGearItemDTO,
    CreateGearAssignmentDTO,
    IssueGearDTO,
    ReturnGearDTO,
    AvailabilityQuery,
    GearCondition,
} from '../types/gear.types';

// Query keys
export const gearKeys = {
    all: ['gear'] as const,
    categories: () => [...gearKeys.all, 'categories'] as const,
    categoryList: (filters?: GearCategoryFilters) => [...gearKeys.categories(), 'list', filters] as const,
    category: (id: string) => [...gearKeys.categories(), id] as const,
    items: () => [...gearKeys.all, 'items'] as const,
    itemList: (filters?: GearItemFilters, page?: number) => [...gearKeys.items(), 'list', filters, page] as const,
    item: (id: string) => [...gearKeys.items(), id] as const,
    itemByBarcode: (barcode: string) => [...gearKeys.items(), 'barcode', barcode] as const,
    unsafeItems: () => [...gearKeys.items(), 'unsafe'] as const,
    inspectionOverdue: () => [...gearKeys.items(), 'inspection-overdue'] as const,
    maintenanceOverdue: () => [...gearKeys.items(), 'maintenance-overdue'] as const,
    inventory: () => [...gearKeys.all, 'inventory'] as const,
    inventorySummary: (warehouseId?: string) => [...gearKeys.inventory(), 'summary', warehouseId] as const,
    availability: (query: AvailabilityQuery) => [...gearKeys.inventory(), 'availability', query] as const,
    heatmap: (warehouseId?: string) => [...gearKeys.inventory(), 'heatmap', warehouseId] as const,
    assignments: () => [...gearKeys.all, 'assignments'] as const,
    tripAssignments: (tripId: string) => [...gearKeys.assignments(), 'trip', tripId] as const,
    tripManifest: (tripId: string) => [...gearKeys.assignments(), 'manifest', tripId] as const,
    pendingReturns: () => [...gearKeys.assignments(), 'pending-returns'] as const,
    overdueReturns: () => [...gearKeys.assignments(), 'overdue'] as const,
};

// ============================================
// CATEGORY HOOKS
// ============================================

export function useGearCategories(filters?: GearCategoryFilters) {
    return useQuery({
        queryKey: gearKeys.categoryList(filters),
        queryFn: () => gearApi.categories.getAll(filters),
    });
}

export function useGearCategory(id: string) {
    return useQuery({
        queryKey: gearKeys.category(id),
        queryFn: () => gearApi.categories.getById(id),
        enabled: !!id,
    });
}

export function useCreateGearCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateGearCategoryDTO) => gearApi.categories.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.categories() });
        },
    });
}

export function useUpdateGearCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateGearCategoryDTO> }) =>
            gearApi.categories.update(id, dto),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.category(id) });
            queryClient.invalidateQueries({ queryKey: gearKeys.categories() });
        },
    });
}

export function useDeleteGearCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => gearApi.categories.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.categories() });
        },
    });
}

// ============================================
// ITEM HOOKS
// ============================================

export function useGearItems(filters?: GearItemFilters, page = 1, limit = 50) {
    return useQuery({
        queryKey: gearKeys.itemList(filters, page),
        queryFn: () => gearApi.items.getAll(filters, page, limit),
    });
}

export function useGearItem(id: string) {
    return useQuery({
        queryKey: gearKeys.item(id),
        queryFn: () => gearApi.items.getById(id),
        enabled: !!id,
    });
}

export function useGearItemByBarcode(barcode: string) {
    return useQuery({
        queryKey: gearKeys.itemByBarcode(barcode),
        queryFn: () => gearApi.items.getByBarcode(barcode),
        enabled: !!barcode,
    });
}

export function useUnsafeGearItems() {
    return useQuery({
        queryKey: gearKeys.unsafeItems(),
        queryFn: () => gearApi.items.getUnsafe(),
    });
}

export function useInspectionOverdueItems() {
    return useQuery({
        queryKey: gearKeys.inspectionOverdue(),
        queryFn: () => gearApi.items.getInspectionOverdue(),
    });
}

export function useMaintenanceOverdueItems() {
    return useQuery({
        queryKey: gearKeys.maintenanceOverdue(),
        queryFn: () => gearApi.items.getMaintenanceOverdue(),
    });
}

export function useCreateGearItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateGearItemDTO) => gearApi.items.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.items() });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

export function useUpdateGearItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateGearItemDTO> }) =>
            gearApi.items.update(id, dto),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.item(id) });
            queryClient.invalidateQueries({ queryKey: gearKeys.items() });
        },
    });
}

export function useUpdateGearCondition() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            condition,
            conditionScore,
        }: {
            id: string;
            condition: GearCondition;
            conditionScore: number;
        }) => gearApi.items.updateCondition(id, condition, conditionScore),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.item(id) });
            queryClient.invalidateQueries({ queryKey: gearKeys.items() });
            queryClient.invalidateQueries({ queryKey: gearKeys.unsafeItems() });
        },
    });
}

export function useRetireGearItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => gearApi.items.retire(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.item(id) });
            queryClient.invalidateQueries({ queryKey: gearKeys.items() });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

// ============================================
// INVENTORY HOOKS
// ============================================

export function useInventorySummary(warehouseId?: string) {
    return useQuery({
        queryKey: gearKeys.inventorySummary(warehouseId),
        queryFn: () => gearApi.inventory.getSummary(warehouseId),
    });
}

export function useCheckAvailability(query: AvailabilityQuery) {
    return useQuery({
        queryKey: gearKeys.availability(query),
        queryFn: () => gearApi.inventory.checkAvailability(query),
        enabled: !!(query.startDate && query.endDate),
    });
}

export function useInventoryHeatmap(warehouseId?: string) {
    return useQuery({
        queryKey: gearKeys.heatmap(warehouseId),
        queryFn: () => gearApi.inventory.getHeatmap(warehouseId),
    });
}

export function useTransferGear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            gearItemId,
            toWarehouseId,
            reason,
        }: {
            gearItemId: string;
            toWarehouseId: string;
            reason?: string;
        }) => gearApi.inventory.transfer(gearItemId, toWarehouseId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
            queryClient.invalidateQueries({ queryKey: gearKeys.items() });
        },
    });
}

export function useReleaseFromQuarantine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            gearItemId,
            inspectionPassed,
            notes,
        }: {
            gearItemId: string;
            inspectionPassed: boolean;
            notes?: string;
        }) => gearApi.inventory.releaseFromQuarantine(gearItemId, inspectionPassed, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

// ============================================
// ASSIGNMENT HOOKS
// ============================================

export function useTripGearAssignments(tripId: string) {
    return useQuery({
        queryKey: gearKeys.tripAssignments(tripId),
        queryFn: () => gearApi.assignments.getByTrip(tripId),
        enabled: !!tripId,
    });
}

export function useTripGearManifest(tripId: string) {
    return useQuery({
        queryKey: gearKeys.tripManifest(tripId),
        queryFn: () => gearApi.assignments.getTripManifest(tripId),
        enabled: !!tripId,
    });
}

export function usePendingReturns() {
    return useQuery({
        queryKey: gearKeys.pendingReturns(),
        queryFn: () => gearApi.assignments.getPendingReturns(),
    });
}

export function useOverdueReturns() {
    return useQuery({
        queryKey: gearKeys.overdueReturns(),
        queryFn: () => gearApi.assignments.getOverdueReturns(),
    });
}

export function useCreateGearAssignment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateGearAssignmentDTO) => gearApi.assignments.create(dto),
        onSuccess: (_, dto) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.tripAssignments(dto.tripId) });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

export function useCreateBulkGearAssignments() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            tripId,
            assignments,
        }: {
            tripId: string;
            assignments: Omit<CreateGearAssignmentDTO, 'tripId'>[];
        }) => gearApi.assignments.createBulk(tripId, assignments),
        onSuccess: (_, { tripId }) => {
            queryClient.invalidateQueries({ queryKey: gearKeys.tripAssignments(tripId) });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

export function useIssueGear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, dto }: { assignmentId: string; dto: IssueGearDTO }) =>
            gearApi.assignments.issueGear(assignmentId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.assignments() });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

export function useReturnGear() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ assignmentId, dto }: { assignmentId: string; dto: ReturnGearDTO }) =>
            gearApi.assignments.returnGear(assignmentId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.assignments() });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
            queryClient.invalidateQueries({ queryKey: gearKeys.pendingReturns() });
        },
    });
}

export function useCancelGearAssignment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (assignmentId: string) => gearApi.assignments.cancel(assignmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: gearKeys.assignments() });
            queryClient.invalidateQueries({ queryKey: gearKeys.inventory() });
        },
    });
}

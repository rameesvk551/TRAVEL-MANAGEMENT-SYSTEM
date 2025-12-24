import { apiClient } from './client';
import type {
    Branch,
    BranchWithStats,
    BranchWithChildren,
    BranchPermission,
    BranchTransfer,
    CreateBranchInput,
    UpdateBranchInput,
    GrantPermissionInput,
    CreateTransferInput,
    BranchListParams,
    BranchListResponse,
    BranchHierarchyResponse,
} from '../types/branch.types';

// ============================================================================
// Branch CRUD API
// ============================================================================

/**
 * Get all branches with optional filtering
 */
export async function getBranches(params?: BranchListParams): Promise<BranchListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.parentBranchId) queryParams.append('parentBranchId', params.parentBranchId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params?.includeStats) queryParams.append('includeStats', String(params.includeStats));

    const queryString = queryParams.toString();
    const url = `/branches${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<BranchListResponse>(url);
    return response.data;
}

/**
 * Get all branches with statistics
 */
export async function getBranchesWithStats(): Promise<BranchWithStats[]> {
    const response = await apiClient.get<{ data: BranchWithStats[] }>('/branches?includeStats=true');
    return response.data.data;
}

/**
 * Get branch by ID
 */
export async function getBranchById(id: string, includeStats?: boolean): Promise<Branch | BranchWithStats> {
    const url = includeStats ? `/branches/${id}?includeStats=true` : `/branches/${id}`;
    const response = await apiClient.get<{ data: Branch | BranchWithStats }>(url);
    return response.data.data;
}

/**
 * Get branch by code
 */
export async function getBranchByCode(code: string): Promise<Branch> {
    const response = await apiClient.get<{ data: Branch }>(`/branches/code/${code}`);
    return response.data.data;
}

/**
 * Create a new branch
 */
export async function createBranch(data: CreateBranchInput): Promise<Branch> {
    const response = await apiClient.post<{ data: Branch }>('/branches', data);
    return response.data.data;
}

/**
 * Update a branch
 */
export async function updateBranch(id: string, data: UpdateBranchInput): Promise<Branch> {
    const response = await apiClient.patch<{ data: Branch }>(`/branches/${id}`, data);
    return response.data.data;
}

/**
 * Delete a branch (soft delete by default)
 */
export async function deleteBranch(id: string, hard?: boolean): Promise<void> {
    const url = hard ? `/branches/${id}?hard=true` : `/branches/${id}`;
    await apiClient.delete(url);
}

// ============================================================================
// Branch Hierarchy API
// ============================================================================

/**
 * Get branch hierarchy (tree structure)
 */
export async function getBranchHierarchy(): Promise<BranchWithChildren[]> {
    const response = await apiClient.get<BranchHierarchyResponse>('/branches/hierarchy');
    return response.data.data;
}

/**
 * Get child branches of a parent branch
 */
export async function getChildBranches(parentId: string): Promise<Branch[]> {
    const response = await apiClient.get<{ data: Branch[] }>(`/branches/${parentId}/children`);
    return response.data.data;
}

// ============================================================================
// Branch Permissions API
// ============================================================================

/**
 * Grant permission to a user for a branch
 */
export async function grantBranchPermission(
    branchId: string,
    data: GrantPermissionInput
): Promise<BranchPermission> {
    const response = await apiClient.post<{ data: BranchPermission }>(
        `/branches/${branchId}/permissions`,
        data
    );
    return response.data.data;
}

/**
 * Revoke permission from a user for a branch
 */
export async function revokeBranchPermission(branchId: string, userId: string): Promise<void> {
    await apiClient.delete(`/branches/${branchId}/permissions/${userId}`);
}

/**
 * Get all permissions for a branch
 */
export async function getBranchPermissions(branchId: string): Promise<BranchPermission[]> {
    const response = await apiClient.get<{ data: BranchPermission[] }>(
        `/branches/${branchId}/permissions`
    );
    return response.data.data;
}

/**
 * Get user's branch permissions
 */
export async function getUserBranchPermissions(userId: string): Promise<BranchPermission[]> {
    const response = await apiClient.get<{ data: BranchPermission[] }>(
        `/branches/user/${userId}/permissions`
    );
    return response.data.data;
}

/**
 * Get branches accessible by a user
 */
export async function getUserAccessibleBranches(userId: string): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(
        `/branches/user/${userId}/accessible`
    );
    return response.data.data;
}

/**
 * Check if current user has access to a branch
 */
export async function checkBranchAccess(
    branchId: string,
    permissionLevel?: string
): Promise<boolean> {
    const url = permissionLevel
        ? `/branches/${branchId}/access?level=${permissionLevel}`
        : `/branches/${branchId}/access`;
    const response = await apiClient.get<{ data: { hasAccess: boolean } }>(url);
    return response.data.data.hasAccess;
}

// ============================================================================
// Branch Transfers API
// ============================================================================

/**
 * Create a transfer request
 */
export async function createTransfer(data: CreateTransferInput): Promise<BranchTransfer> {
    const response = await apiClient.post<{ data: BranchTransfer }>('/branches/transfers', data);
    return response.data.data;
}

/**
 * Get a transfer by ID
 */
export async function getTransfer(id: string): Promise<BranchTransfer> {
    const response = await apiClient.get<{ data: BranchTransfer }>(`/branches/transfers/${id}`);
    return response.data.data;
}

/**
 * Approve a transfer
 */
export async function approveTransfer(id: string): Promise<BranchTransfer> {
    const response = await apiClient.post<{ data: BranchTransfer }>(
        `/branches/transfers/${id}/approve`
    );
    return response.data.data;
}

/**
 * Complete a transfer
 */
export async function completeTransfer(id: string): Promise<BranchTransfer> {
    const response = await apiClient.post<{ data: BranchTransfer }>(
        `/branches/transfers/${id}/complete`
    );
    return response.data.data;
}

/**
 * Cancel a transfer
 */
export async function cancelTransfer(id: string): Promise<BranchTransfer> {
    const response = await apiClient.post<{ data: BranchTransfer }>(
        `/branches/transfers/${id}/cancel`
    );
    return response.data.data;
}

/**
 * Reject a transfer
 */
export async function rejectTransfer(id: string): Promise<BranchTransfer> {
    const response = await apiClient.post<{ data: BranchTransfer }>(
        `/branches/transfers/${id}/reject`
    );
    return response.data.data;
}

/**
 * Get pending transfers for a branch
 */
export async function getPendingTransfers(
    branchId: string,
    direction?: 'from' | 'to' | 'both'
): Promise<BranchTransfer[]> {
    const url = direction
        ? `/branches/${branchId}/transfers/pending?direction=${direction}`
        : `/branches/${branchId}/transfers/pending`;
    const response = await apiClient.get<{ data: BranchTransfer[] }>(url);
    return response.data.data;
}

// ============================================================================
// Export all branch API functions
// ============================================================================

export const branchApi = {
    // CRUD
    getBranches,
    getBranchesWithStats,
    getBranchById,
    getBranchByCode,
    createBranch,
    updateBranch,
    deleteBranch,
    
    // Hierarchy
    getBranchHierarchy,
    getChildBranches,
    
    // Permissions
    grantBranchPermission,
    revokeBranchPermission,
    getBranchPermissions,
    getUserBranchPermissions,
    getUserAccessibleBranches,
    checkBranchAccess,
    
    // Transfers
    createTransfer,
    getTransfer,
    approveTransfer,
    completeTransfer,
    cancelTransfer,
    rejectTransfer,
    getPendingTransfers,
};

export default branchApi;

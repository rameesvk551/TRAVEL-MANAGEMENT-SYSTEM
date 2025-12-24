import { useState, useEffect, useCallback } from 'react';
import { branchApi } from '../api/branchApi';
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
} from '../types/branch.types';

// ============================================================================
// useBranches Hook - Main branch list management
// ============================================================================

export function useBranches(params?: BranchListParams) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await branchApi.getBranches(params);
            setBranches(response.data);
            if (response.pagination) {
                setTotal(response.pagination.total);
            } else {
                setTotal(response.data.length);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch branches');
        } finally {
            setIsLoading(false);
        }
    }, [params?.type, params?.isActive, params?.parentBranchId, params?.search, params?.page, params?.pageSize]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    return {
        branches,
        total,
        isLoading,
        error,
        refetch: fetchBranches,
    };
}

// ============================================================================
// useBranchesWithStats Hook - Branches with statistics
// ============================================================================

export function useBranchesWithStats() {
    const [branches, setBranches] = useState<BranchWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await branchApi.getBranchesWithStats();
            setBranches(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch branches');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    return {
        branches,
        isLoading,
        error,
        refetch: fetchBranches,
    };
}

// ============================================================================
// useBranch Hook - Single branch management
// ============================================================================

export function useBranch(id: string | null, includeStats?: boolean) {
    const [branch, setBranch] = useState<Branch | BranchWithStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBranch = useCallback(async () => {
        if (!id) {
            setBranch(null);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await branchApi.getBranchById(id, includeStats);
            setBranch(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch branch');
        } finally {
            setIsLoading(false);
        }
    }, [id, includeStats]);

    useEffect(() => {
        fetchBranch();
    }, [fetchBranch]);

    return {
        branch,
        isLoading,
        error,
        refetch: fetchBranch,
    };
}

// ============================================================================
// useBranchHierarchy Hook - Branch tree structure
// ============================================================================

export function useBranchHierarchy() {
    const [hierarchy, setHierarchy] = useState<BranchWithChildren[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHierarchy = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await branchApi.getBranchHierarchy();
            setHierarchy(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch branch hierarchy');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHierarchy();
    }, [fetchHierarchy]);

    return {
        hierarchy,
        isLoading,
        error,
        refetch: fetchHierarchy,
    };
}

// ============================================================================
// useBranchMutations Hook - CRUD operations
// ============================================================================

export function useBranchMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBranch = useCallback(async (data: CreateBranchInput): Promise<Branch | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const branch = await branchApi.createBranch(data);
            return branch;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create branch');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateBranch = useCallback(async (id: string, data: UpdateBranchInput): Promise<Branch | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const branch = await branchApi.updateBranch(id, data);
            return branch;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update branch');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteBranch = useCallback(async (id: string, hard?: boolean): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.deleteBranch(id, hard);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete branch');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        createBranch,
        updateBranch,
        deleteBranch,
        isLoading,
        error,
    };
}

// ============================================================================
// useBranchPermissions Hook - Permission management
// ============================================================================

export function useBranchPermissions(branchId: string | null) {
    const [permissions, setPermissions] = useState<BranchPermission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPermissions = useCallback(async () => {
        if (!branchId) {
            setPermissions([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await branchApi.getBranchPermissions(branchId);
            setPermissions(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
        } finally {
            setIsLoading(false);
        }
    }, [branchId]);

    useEffect(() => {
        fetchPermissions();
    }, [fetchPermissions]);

    const grantPermission = useCallback(async (data: GrantPermissionInput): Promise<BranchPermission | null> => {
        if (!branchId) return null;
        
        setIsLoading(true);
        setError(null);
        try {
            const permission = await branchApi.grantBranchPermission(branchId, data);
            await fetchPermissions();
            return permission;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to grant permission');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [branchId, fetchPermissions]);

    const revokePermission = useCallback(async (userId: string): Promise<boolean> => {
        if (!branchId) return false;
        
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.revokeBranchPermission(branchId, userId);
            await fetchPermissions();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to revoke permission');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [branchId, fetchPermissions]);

    return {
        permissions,
        isLoading,
        error,
        refetch: fetchPermissions,
        grantPermission,
        revokePermission,
    };
}

// ============================================================================
// useUserBranchAccess Hook - Current user's branch access
// ============================================================================

export function useUserBranchAccess(userId: string | null) {
    const [accessibleBranchIds, setAccessibleBranchIds] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<BranchPermission[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAccess = useCallback(async () => {
        if (!userId) {
            setAccessibleBranchIds([]);
            setPermissions([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const [branchIds, perms] = await Promise.all([
                branchApi.getUserAccessibleBranches(userId),
                branchApi.getUserBranchPermissions(userId),
            ]);
            setAccessibleBranchIds(branchIds);
            setPermissions(perms);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user access');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchAccess();
    }, [fetchAccess]);

    const checkAccess = useCallback(async (branchId: string, level?: string): Promise<boolean> => {
        try {
            return await branchApi.checkBranchAccess(branchId, level);
        } catch {
            return false;
        }
    }, []);

    return {
        accessibleBranchIds,
        permissions,
        isLoading,
        error,
        refetch: fetchAccess,
        checkAccess,
    };
}

// ============================================================================
// useBranchTransfers Hook - Transfer management
// ============================================================================

export function useBranchTransfers(branchId: string | null, direction?: 'from' | 'to' | 'both') {
    const [transfers, setTransfers] = useState<BranchTransfer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTransfers = useCallback(async () => {
        if (!branchId) {
            setTransfers([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const data = await branchApi.getPendingTransfers(branchId, direction);
            setTransfers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
        } finally {
            setIsLoading(false);
        }
    }, [branchId, direction]);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    const createTransfer = useCallback(async (data: CreateTransferInput): Promise<BranchTransfer | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const transfer = await branchApi.createTransfer(data);
            await fetchTransfers();
            return transfer;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create transfer');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [fetchTransfers]);

    const approveTransfer = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.approveTransfer(id);
            await fetchTransfers();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve transfer');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchTransfers]);

    const completeTransfer = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.completeTransfer(id);
            await fetchTransfers();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete transfer');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchTransfers]);

    const cancelTransfer = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.cancelTransfer(id);
            await fetchTransfers();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to cancel transfer');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchTransfers]);

    const rejectTransfer = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);
        try {
            await branchApi.rejectTransfer(id);
            await fetchTransfers();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject transfer');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [fetchTransfers]);

    return {
        transfers,
        isLoading,
        error,
        refetch: fetchTransfers,
        createTransfer,
        approveTransfer,
        completeTransfer,
        cancelTransfer,
        rejectTransfer,
    };
}

// ============================================================================
// useBranchSelector Hook - For branch filtering UI
// ============================================================================

export function useBranchSelector(defaultBranchId?: string | null) {
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(defaultBranchId ?? null);
    const { branches, isLoading, error } = useBranches({ isActive: true });

    const selectedBranch = branches.find(b => b.id === selectedBranchId) ?? null;

    const selectBranch = useCallback((branchId: string | null) => {
        setSelectedBranchId(branchId);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedBranchId(null);
    }, []);

    return {
        branches,
        selectedBranchId,
        selectedBranch,
        selectBranch,
        clearSelection,
        isLoading,
        error,
    };
}

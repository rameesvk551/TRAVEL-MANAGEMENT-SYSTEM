import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch } from '@/types/branch.types';

interface BranchState {
    // Selected branch for filtering data
    selectedBranchId: string | null;
    selectedBranch: Branch | null;
    
    // All available branches for the current user
    availableBranches: Branch[];
    
    // Actions
    setSelectedBranch: (branch: Branch | null) => void;
    setSelectedBranchById: (branchId: string | null) => void;
    setAvailableBranches: (branches: Branch[]) => void;
    clearBranchSelection: () => void;
}

export const useBranchStore = create<BranchState>()(
    persist(
        (set, get) => ({
            selectedBranchId: null,
            selectedBranch: null,
            availableBranches: [],

            setSelectedBranch: (branch) =>
                set({
                    selectedBranch: branch,
                    selectedBranchId: branch?.id ?? null,
                }),

            setSelectedBranchById: (branchId) => {
                const { availableBranches } = get();
                const branch = branchId
                    ? availableBranches.find((b) => b.id === branchId) ?? null
                    : null;
                set({
                    selectedBranchId: branchId,
                    selectedBranch: branch,
                });
            },

            setAvailableBranches: (branches) => {
                const { selectedBranchId } = get();
                const selectedBranch = selectedBranchId
                    ? branches.find((b) => b.id === selectedBranchId) ?? null
                    : null;
                set({
                    availableBranches: branches,
                    selectedBranch,
                });
            },

            clearBranchSelection: () =>
                set({
                    selectedBranchId: null,
                    selectedBranch: null,
                }),
        }),
        {
            name: 'branch-storage',
            partialize: (state) => ({
                selectedBranchId: state.selectedBranchId,
            }),
        }
    )
);

// Selector hooks for common patterns
export const useSelectedBranch = () =>
    useBranchStore((state) => state.selectedBranch);

export const useSelectedBranchId = () =>
    useBranchStore((state) => state.selectedBranchId);

export const useAvailableBranches = () =>
    useBranchStore((state) => state.availableBranches);

// Hook to get branch filter params for API calls
export const useBranchFilterParams = () => {
    const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
    return selectedBranchId ? { branchId: selectedBranchId } : {};
};

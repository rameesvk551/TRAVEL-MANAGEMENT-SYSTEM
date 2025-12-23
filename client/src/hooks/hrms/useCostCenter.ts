// hooks/hrms/useCostCenter.ts
// Cost Center & Labor Cost React Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  costCenterApi,
  type CostCenterFilters,
  type AllocationFilters,
  type LaborCostFilters,
  type BudgetFilters,
  type CreateCostCenterRequest,
  type UpdateCostCenterRequest,
  type CreateAllocationRequest,
  type UpdateAllocationRequest,
  type CreateLaborCostRequest,
  type CreateBudgetRequest,
  type UpdateBudgetRequest,
} from '../../api/hrms/costCenterApi';

// Query Keys
export const costCenterKeys = {
  all: ['costCenter'] as const,
  costCenters: () => [...costCenterKeys.all, 'costCenters'] as const,
  costCentersList: (filters?: CostCenterFilters) => [...costCenterKeys.costCenters(), 'list', filters] as const,
  costCenterDetail: (id: string) => [...costCenterKeys.costCenters(), 'detail', id] as const,
  costCenterByCode: (code: string) => [...costCenterKeys.costCenters(), 'code', code] as const,
  costCenterTree: () => [...costCenterKeys.costCenters(), 'tree'] as const,
  costCenterSummary: (id: string, fiscalYear?: number) => [...costCenterKeys.costCenters(), 'summary', id, fiscalYear] as const,
  allocations: () => [...costCenterKeys.all, 'allocations'] as const,
  allocationsList: (filters?: AllocationFilters) => [...costCenterKeys.allocations(), 'list', filters] as const,
  allocationDetail: (id: string) => [...costCenterKeys.allocations(), 'detail', id] as const,
  employeeAllocations: (employeeId: string) => [...costCenterKeys.allocations(), 'employee', employeeId] as const,
  laborCosts: () => [...costCenterKeys.all, 'laborCosts'] as const,
  laborCostsList: (filters?: LaborCostFilters) => [...costCenterKeys.laborCosts(), 'list', filters] as const,
  laborCostReport: (year: number, month?: number) => [...costCenterKeys.laborCosts(), 'report', year, month] as const,
  budgets: () => [...costCenterKeys.all, 'budgets'] as const,
  budgetsList: (filters?: BudgetFilters) => [...costCenterKeys.budgets(), 'list', filters] as const,
  budgetDetail: (id: string) => [...costCenterKeys.budgets(), 'detail', id] as const,
  budgetReport: (fiscalYear: number) => [...costCenterKeys.budgets(), 'report', fiscalYear] as const,
};

// Cost Center Hooks
export function useCostCenters(filters?: CostCenterFilters) {
  return useQuery({
    queryKey: costCenterKeys.costCentersList(filters),
    queryFn: () => costCenterApi.getCostCenters(filters),
  });
}

export function useCostCenter(id: string) {
  return useQuery({
    queryKey: costCenterKeys.costCenterDetail(id),
    queryFn: () => costCenterApi.getCostCenterById(id),
    enabled: !!id,
  });
}

export function useCostCenterByCode(code: string) {
  return useQuery({
    queryKey: costCenterKeys.costCenterByCode(code),
    queryFn: () => costCenterApi.getCostCenterByCode(code),
    enabled: !!code,
  });
}

export function useCostCenterTree() {
  return useQuery({
    queryKey: costCenterKeys.costCenterTree(),
    queryFn: () => costCenterApi.getCostCenterTree(),
  });
}

export function useCostCenterSummary(id: string, fiscalYear?: number) {
  return useQuery({
    queryKey: costCenterKeys.costCenterSummary(id, fiscalYear),
    queryFn: () => costCenterApi.getCostCenterSummary(id, fiscalYear),
    enabled: !!id,
  });
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCostCenterRequest) => costCenterApi.createCostCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.costCenters() });
    },
  });
}

export function useUpdateCostCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCostCenterRequest }) =>
      costCenterApi.updateCostCenter(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.costCenters() });
      queryClient.invalidateQueries({ queryKey: costCenterKeys.costCenterDetail(variables.id) });
    },
  });
}

export function useDeleteCostCenter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => costCenterApi.deleteCostCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.costCenters() });
    },
  });
}

// Allocation Hooks
export function useCostAllocations(filters?: AllocationFilters) {
  return useQuery({
    queryKey: costCenterKeys.allocationsList(filters),
    queryFn: () => costCenterApi.getAllocations(filters),
  });
}

export function useCostAllocation(id: string) {
  return useQuery({
    queryKey: costCenterKeys.allocationDetail(id),
    queryFn: () => costCenterApi.getAllocationById(id),
    enabled: !!id,
  });
}

export function useEmployeeAllocations(employeeId: string) {
  return useQuery({
    queryKey: costCenterKeys.employeeAllocations(employeeId),
    queryFn: () => costCenterApi.getEmployeeAllocations(employeeId),
    enabled: !!employeeId,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAllocationRequest) => costCenterApi.createAllocation(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.allocations() });
      queryClient.invalidateQueries({ queryKey: costCenterKeys.employeeAllocations(data.employeeId) });
    },
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAllocationRequest }) =>
      costCenterApi.updateAllocation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.allocations() });
      queryClient.invalidateQueries({ queryKey: costCenterKeys.allocationDetail(variables.id) });
    },
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => costCenterApi.deleteAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.allocations() });
    },
  });
}

// Labor Cost Hooks
export function useLaborCosts(filters?: LaborCostFilters) {
  return useQuery({
    queryKey: costCenterKeys.laborCostsList(filters),
    queryFn: () => costCenterApi.getLaborCosts(filters),
  });
}

export function useCreateLaborCost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLaborCostRequest) => costCenterApi.createLaborCost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.laborCosts() });
    },
  });
}

export function useCreateBulkLaborCosts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLaborCostRequest[]) => costCenterApi.createBulkLaborCosts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.laborCosts() });
    },
  });
}

export function useLaborCostReport(periodYear: number, periodMonth?: number) {
  return useQuery({
    queryKey: costCenterKeys.laborCostReport(periodYear, periodMonth),
    queryFn: () => costCenterApi.getLaborCostReport(periodYear, periodMonth),
    enabled: !!periodYear,
  });
}

export function useSyncFromPayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ periodYear, periodMonth }: { periodYear: number; periodMonth: number }) =>
      costCenterApi.syncFromPayroll(periodYear, periodMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.laborCosts() });
    },
  });
}

// Budget Hooks
export function useBudgets(filters?: BudgetFilters) {
  return useQuery({
    queryKey: costCenterKeys.budgetsList(filters),
    queryFn: () => costCenterApi.getBudgets(filters),
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: costCenterKeys.budgetDetail(id),
    queryFn: () => costCenterApi.getBudgetById(id),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => costCenterApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.budgets() });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetRequest }) =>
      costCenterApi.updateBudget(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: costCenterKeys.budgetDetail(variables.id) });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => costCenterApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: costCenterKeys.budgets() });
    },
  });
}

export function useBudgetVsActualReport(fiscalYear: number) {
  return useQuery({
    queryKey: costCenterKeys.budgetReport(fiscalYear),
    queryFn: () => costCenterApi.getBudgetVsActualReport(fiscalYear),
    enabled: !!fiscalYear,
  });
}

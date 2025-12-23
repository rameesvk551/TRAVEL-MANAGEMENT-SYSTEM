// hooks/hrms/useApproval.ts
// Approval Workflow React Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approvalApi,
  type ApprovalChainFilters,
  type ApprovalRequestFilters,
  type CreateApprovalChainRequest,
  type UpdateApprovalChainRequest,
  type SubmitApprovalRequest,
  type ProcessApprovalRequest,
  type ApprovalChainStep,
} from '../../api/hrms/approvalApi';

// Query Keys
export const approvalKeys = {
  all: ['approval'] as const,
  chains: () => [...approvalKeys.all, 'chains'] as const,
  chainsList: (filters?: ApprovalChainFilters) => [...approvalKeys.chains(), 'list', filters] as const,
  chainDetail: (id: string) => [...approvalKeys.chains(), 'detail', id] as const,
  chainByType: (entityType: string) => [...approvalKeys.chains(), 'byType', entityType] as const,
  requests: () => [...approvalKeys.all, 'requests'] as const,
  requestsList: (filters?: ApprovalRequestFilters) => [...approvalKeys.requests(), 'list', filters] as const,
  requestDetail: (id: string) => [...approvalKeys.requests(), 'detail', id] as const,
  myRequests: () => [...approvalKeys.requests(), 'my'] as const,
  pending: () => [...approvalKeys.requests(), 'pending'] as const,
  stats: () => [...approvalKeys.all, 'stats'] as const,
};

// Chain Hooks
export function useApprovalChains(filters?: ApprovalChainFilters) {
  return useQuery({
    queryKey: approvalKeys.chainsList(filters),
    queryFn: () => approvalApi.getChains(filters),
  });
}

export function useApprovalChain(id: string) {
  return useQuery({
    queryKey: approvalKeys.chainDetail(id),
    queryFn: () => approvalApi.getChainById(id),
    enabled: !!id,
  });
}

export function useApprovalChainByEntityType(entityType: string) {
  return useQuery({
    queryKey: approvalKeys.chainByType(entityType),
    queryFn: () => approvalApi.getChainByEntityType(entityType as any),
    enabled: !!entityType,
  });
}

export function useCreateApprovalChain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateApprovalChainRequest) => approvalApi.createChain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chains() });
    },
  });
}

export function useUpdateApprovalChain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApprovalChainRequest }) =>
      approvalApi.updateChain(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chains() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.chainDetail(variables.id) });
    },
  });
}

export function useDeleteApprovalChain() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => approvalApi.deleteChain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chains() });
    },
  });
}

// Chain Step Hooks
export function useAddApprovalStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, step }: { chainId: string; step: Omit<ApprovalChainStep, 'id' | 'chainId' | 'createdAt'> }) =>
      approvalApi.addStep(chainId, step),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chainDetail(variables.chainId) });
      queryClient.invalidateQueries({ queryKey: approvalKeys.chains() });
    },
  });
}

export function useUpdateApprovalStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, stepId, data }: { chainId: string; stepId: string; data: Partial<ApprovalChainStep> }) =>
      approvalApi.updateStep(chainId, stepId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chainDetail(variables.chainId) });
    },
  });
}

export function useDeleteApprovalStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, stepId }: { chainId: string; stepId: string }) =>
      approvalApi.deleteStep(chainId, stepId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chainDetail(variables.chainId) });
    },
  });
}

export function useReorderApprovalSteps() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chainId, stepIds }: { chainId: string; stepIds: string[] }) =>
      approvalApi.reorderSteps(chainId, stepIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.chainDetail(variables.chainId) });
    },
  });
}

// Request Hooks
export function useApprovalRequests(filters?: ApprovalRequestFilters) {
  return useQuery({
    queryKey: approvalKeys.requestsList(filters),
    queryFn: () => approvalApi.getRequests(filters),
  });
}

export function useApprovalRequest(id: string) {
  return useQuery({
    queryKey: approvalKeys.requestDetail(id),
    queryFn: () => approvalApi.getRequestById(id),
    enabled: !!id,
  });
}

export function useMyApprovalRequests() {
  return useQuery({
    queryKey: approvalKeys.myRequests(),
    queryFn: () => approvalApi.getMyRequests(),
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: approvalKeys.pending(),
    queryFn: () => approvalApi.getPendingApprovals(),
  });
}

export function useSubmitApprovalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: SubmitApprovalRequest) => approvalApi.submitRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.requests() });
    },
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: ProcessApprovalRequest }) =>
      approvalApi.processRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.requests() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.pending() });
    },
  });
}

export function useCancelApprovalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (requestId: string) => approvalApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.requests() });
      queryClient.invalidateQueries({ queryKey: approvalKeys.myRequests() });
    },
  });
}

// Stats Hook
export function useApprovalStats() {
  return useQuery({
    queryKey: approvalKeys.stats(),
    queryFn: () => approvalApi.getStats(),
  });
}

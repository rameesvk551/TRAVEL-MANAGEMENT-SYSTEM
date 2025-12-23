// api/hrms/approvalApi.ts
// Approval Workflow API

import { apiClient as client } from '../client';

// Types
export type ApproverType = 'DIRECT_MANAGER' | 'DEPARTMENT_HEAD' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'SPECIFIC_USER' | 'ROLE' | 'CUSTOM';
export type ApprovalEntityType = 'LEAVE' | 'EXPENSE' | 'OVERTIME' | 'TRAVEL' | 'DOCUMENT' | 'SALARY_CHANGE' | 'PROMOTION' | 'TERMINATION';
export type ApprovalRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';
export type ApprovalActionType = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'DELEGATED' | 'SKIPPED' | 'ESCALATED';

export interface ApprovalChainStep {
  id: string;
  chainId: string;
  stepOrder: number;
  name: string;
  approverType: ApproverType;
  approverId?: string;
  approverRole?: string;
  canSkip: boolean;
  skipCondition?: Record<string, unknown>;
  autoApproveAfterDays?: number;
  escalationAfterDays?: number;
  escalationTo?: string;
  requiresComment: boolean;
  minAmount?: number;
  maxAmount?: number;
  createdAt: string;
}

export interface ApprovalChain {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  isActive: boolean;
  isDefault: boolean;
  steps: ApprovalChainStep[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  stepId: string;
  stepOrder: number;
  approverId: string;
  action: ApprovalActionType;
  comments?: string;
  delegatedTo?: string;
  actionAt: string;
  createdAt: string;
  approver?: { id: string; name: string; email: string };
}

export interface ApprovalRequest {
  id: string;
  tenantId: string;
  chainId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  requestorId: string;
  currentStep: number;
  status: ApprovalRequestStatus;
  submittedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  chain?: ApprovalChain;
  requestor?: { id: string; name: string; email: string };
  actions?: ApprovalAction[];
}

export interface PendingApproval {
  request: ApprovalRequest;
  currentStepInfo: ApprovalChainStep;
  entity: Record<string, unknown>;
  dueDate?: string;
  isOverdue: boolean;
}

// Request types
export interface CreateApprovalChainRequest {
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  isDefault?: boolean;
  steps: Omit<ApprovalChainStep, 'id' | 'chainId' | 'createdAt'>[];
}

export interface UpdateApprovalChainRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface SubmitApprovalRequest {
  chainId?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessApprovalRequest {
  action: ApprovalActionType;
  comments?: string;
  delegatedTo?: string;
}

export interface ApprovalChainFilters {
  entityType?: ApprovalEntityType;
  isActive?: boolean;
  search?: string;
}

export interface ApprovalRequestFilters {
  entityType?: ApprovalEntityType;
  entityId?: string;
  requestorId?: string;
  status?: ApprovalRequestStatus;
  startDate?: string;
  endDate?: string;
}

// API Functions
export const approvalApi = {
  // Approval Chains
  getChains: async (filters?: ApprovalChainFilters): Promise<ApprovalChain[]> => {
    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await client.get(`/api/hrms/approval-chains?${params}`);
    return response.data.data;
  },

  getChainById: async (id: string): Promise<ApprovalChain> => {
    const response = await client.get(`/api/hrms/approval-chains/${id}`);
    return response.data.data;
  },

  getChainByEntityType: async (entityType: ApprovalEntityType): Promise<ApprovalChain | null> => {
    const response = await client.get(`/api/hrms/approval-chains/entity/${entityType}`);
    return response.data.data;
  },

  createChain: async (data: CreateApprovalChainRequest): Promise<ApprovalChain> => {
    const response = await client.post('/api/hrms/approval-chains', data);
    return response.data.data;
  },

  updateChain: async (id: string, data: UpdateApprovalChainRequest): Promise<ApprovalChain> => {
    const response = await client.patch(`/api/hrms/approval-chains/${id}`, data);
    return response.data.data;
  },

  deleteChain: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/approval-chains/${id}`);
  },

  // Chain Steps
  addStep: async (chainId: string, step: Omit<ApprovalChainStep, 'id' | 'chainId' | 'createdAt'>): Promise<ApprovalChainStep> => {
    const response = await client.post(`/api/hrms/approval-chains/${chainId}/steps`, step);
    return response.data.data;
  },

  updateStep: async (chainId: string, stepId: string, data: Partial<ApprovalChainStep>): Promise<ApprovalChainStep> => {
    const response = await client.patch(`/api/hrms/approval-chains/${chainId}/steps/${stepId}`, data);
    return response.data.data;
  },

  deleteStep: async (chainId: string, stepId: string): Promise<void> => {
    await client.delete(`/api/hrms/approval-chains/${chainId}/steps/${stepId}`);
  },

  reorderSteps: async (chainId: string, stepIds: string[]): Promise<ApprovalChainStep[]> => {
    const response = await client.post(`/api/hrms/approval-chains/${chainId}/steps/reorder`, { stepIds });
    return response.data.data;
  },

  // Approval Requests
  getRequests: async (filters?: ApprovalRequestFilters): Promise<ApprovalRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.entityId) params.append('entityId', filters.entityId);
    if (filters?.requestorId) params.append('requestorId', filters.requestorId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await client.get(`/api/hrms/approval-requests?${params}`);
    return response.data.data;
  },

  getRequestById: async (id: string): Promise<ApprovalRequest> => {
    const response = await client.get(`/api/hrms/approval-requests/${id}`);
    return response.data.data;
  },

  getMyRequests: async (): Promise<ApprovalRequest[]> => {
    const response = await client.get('/api/hrms/approval-requests/my-requests');
    return response.data.data;
  },

  getPendingApprovals: async (): Promise<PendingApproval[]> => {
    const response = await client.get('/api/hrms/approval-requests/pending');
    return response.data.data;
  },

  submitRequest: async (data: SubmitApprovalRequest): Promise<ApprovalRequest> => {
    const response = await client.post('/api/hrms/approval-requests', data);
    return response.data.data;
  },

  processRequest: async (requestId: string, data: ProcessApprovalRequest): Promise<ApprovalRequest> => {
    const response = await client.post(`/api/hrms/approval-requests/${requestId}/process`, data);
    return response.data.data;
  },

  cancelRequest: async (requestId: string): Promise<ApprovalRequest> => {
    const response = await client.post(`/api/hrms/approval-requests/${requestId}/cancel`);
    return response.data.data;
  },

  // Stats
  getStats: async (): Promise<{
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    averageApprovalTime: number;
  }> => {
    const response = await client.get('/api/hrms/approval-requests/stats');
    return response.data.data;
  },
};

// application/dtos/hrms/ApprovalDTO.ts
// Approval Workflow DTOs and Mappers

import type {
  ApprovalChain,
  ApprovalChainStep,
  ApprovalRequest,
  ApprovalAction,
  ApproverType,
  ApprovalEntityType,
  ApprovalRequestStatus,
  ApprovalActionType,
} from '../../../domain/entities/hrms/ApprovalChain';

// Request DTOs
export interface CreateApprovalChainDTO {
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  isDefault?: boolean;
  steps: CreateApprovalChainStepDTO[];
}

export interface CreateApprovalChainStepDTO {
  stepOrder: number;
  name: string;
  approverType: ApproverType;
  approverId?: string;
  approverRole?: string;
  canSkip?: boolean;
  skipCondition?: Record<string, unknown>;
  autoApproveAfterDays?: number;
  escalationAfterDays?: number;
  escalationTo?: string;
  requiresComment?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface UpdateApprovalChainDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateApprovalChainStepDTO extends Partial<CreateApprovalChainStepDTO> {
  id?: string;
}

export interface SubmitApprovalRequestDTO {
  chainId?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessApprovalDTO {
  action: ApprovalActionType;
  comments?: string;
  delegatedTo?: string;
}

export interface ApprovalChainFiltersDTO {
  entityType?: ApprovalEntityType;
  isActive?: boolean;
  search?: string;
}

export interface ApprovalRequestFiltersDTO {
  entityType?: ApprovalEntityType;
  entityId?: string;
  requestorId?: string;
  status?: ApprovalRequestStatus;
  startDate?: string;
  endDate?: string;
}

// Response DTOs
export interface ApprovalChainResponseDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  isActive: boolean;
  isDefault: boolean;
  steps: ApprovalChainStepResponseDTO[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ApprovalChainStepResponseDTO {
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

export interface ApprovalRequestResponseDTO {
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
  chain?: ApprovalChainResponseDTO;
  requestor?: { id: string; name: string; email: string };
  actions?: ApprovalActionResponseDTO[];
}

export interface ApprovalActionResponseDTO {
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

export interface PendingApprovalDTO {
  request: ApprovalRequestResponseDTO;
  currentStepInfo: ApprovalChainStepResponseDTO;
  entity: Record<string, unknown>;
  dueDate?: string;
  isOverdue: boolean;
}

// Mappers
export const ApprovalMapper = {
  toChainResponseDTO(chain: ApprovalChain): ApprovalChainResponseDTO {
    return {
      id: chain.id,
      tenantId: chain.tenantId,
      name: chain.name,
      description: chain.description,
      entityType: chain.entityType,
      isActive: chain.isActive,
      isDefault: chain.isDefault,
      steps: (chain.steps || []).map(ApprovalMapper.toStepResponseDTO),
      createdAt: chain.createdAt.toISOString(),
      updatedAt: chain.updatedAt.toISOString(),
      createdBy: chain.createdBy,
    };
  },

  toStepResponseDTO(step: ApprovalChainStep): ApprovalChainStepResponseDTO {
    return {
      id: step.id,
      chainId: step.chainId,
      stepOrder: step.stepOrder,
      name: step.name,
      approverType: step.approverType,
      approverId: step.approverId,
      approverRole: step.approverRole,
      canSkip: step.canSkip,
      skipCondition: step.skipCondition,
      autoApproveAfterDays: step.autoApproveAfterDays,
      escalationAfterDays: step.escalationAfterDays,
      escalationTo: step.escalationTo,
      requiresComment: step.requiresComment,
      minAmount: step.minAmount,
      maxAmount: step.maxAmount,
      createdAt: step.createdAt.toISOString(),
    };
  },

  toRequestResponseDTO(request: ApprovalRequest): ApprovalRequestResponseDTO {
    return {
      id: request.id,
      tenantId: request.tenantId,
      chainId: request.chainId,
      entityType: request.entityType,
      entityId: request.entityId,
      requestorId: request.requestorId,
      currentStep: request.currentStep,
      status: request.status,
      submittedAt: request.submittedAt.toISOString(),
      completedAt: request.completedAt?.toISOString(),
      metadata: request.metadata,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      chain: request.chain ? ApprovalMapper.toChainResponseDTO(request.chain) : undefined,
      requestor: request.requestor,
      actions: request.actions?.map(ApprovalMapper.toActionResponseDTO),
    };
  },

  toActionResponseDTO(action: ApprovalAction): ApprovalActionResponseDTO {
    return {
      id: action.id,
      requestId: action.requestId,
      stepId: action.stepId,
      stepOrder: action.stepOrder,
      approverId: action.approverId,
      action: action.action,
      comments: action.comments,
      delegatedTo: action.delegatedTo,
      actionAt: action.actionAt.toISOString(),
      createdAt: action.createdAt.toISOString(),
      approver: action.approver,
    };
  },
};

// domain/entities/hrms/ApprovalChain.ts
// Approval Workflow Domain Entities

export type ApproverType = 'DIRECT_MANAGER' | 'DEPARTMENT_HEAD' | 'HR_MANAGER' | 'FINANCE_MANAGER' | 'SPECIFIC_USER' | 'ROLE' | 'CUSTOM';
export type ApprovalEntityType = 'LEAVE' | 'EXPENSE' | 'OVERTIME' | 'TRAVEL' | 'DOCUMENT' | 'SALARY_CHANGE' | 'PROMOTION' | 'TERMINATION';
export type ApprovalRequestStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ESCALATED';
export type ApprovalActionType = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'DELEGATED' | 'SKIPPED' | 'ESCALATED';

export interface ApprovalChain {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  isActive: boolean;
  isDefault: boolean;
  steps?: ApprovalChainStep[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

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
  createdAt: Date;
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
  submittedAt: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  chain?: ApprovalChain;
  requestor?: { id: string; name: string; email: string };
  actions?: ApprovalAction[];
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
  actionAt: Date;
  createdAt: Date;
  // Joined data
  approver?: { id: string; name: string; email: string };
}

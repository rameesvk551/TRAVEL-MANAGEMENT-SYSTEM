// domain/entities/hrms/Leave.ts
// Leave types, requests, and balances

import { EmployeeType } from './Employee';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface LeaveType {
  id: string;
  tenantId: string;
  
  code: string;
  name: string;
  description?: string;
  
  // Rules
  isPaid: boolean;
  maxDaysPerYear: number;
  carryForwardLimit: number;
  minDaysNotice: number;
  maxConsecutiveDays?: number;
  
  // Applicability
  applicableTo: EmployeeType[];
  requiresApproval: boolean;
  requiresDocument: boolean;
  
  // Accrual
  accrualType: 'ANNUAL' | 'MONTHLY' | 'NONE';
  accrualAmount?: number;
  
  // Blackout periods (peak season)
  blackoutPeriods: DateRange[];
  
  isActive: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export type LeaveStatus = 
  | 'DRAFT' 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED' 
  | 'REVOKED';

export interface ApprovalStep {
  approverId: string;
  approverName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  actionAt?: Date;
  order: number;
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  
  leaveTypeId: string;
  
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  
  isHalfDay: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
  
  reason: string;
  
  // Workflow
  status: LeaveStatus;
  approvalChain: ApprovalStep[];
  currentApproverIndex: number;
  
  // Conflict detection
  hasConflict: boolean;
  conflictingTrips: string[];
  
  // Replacement
  replacementEmployeeId?: string;
  replacementConfirmed: boolean;
  
  // Attachments (medical cert, etc.)
  attachments: string[];
  
  // Cancellation
  cancelledAt?: Date;
  cancellationReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveBalance {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  
  opening: number;
  accrued: number;
  taken: number;
  pending: number;
  adjusted: number;
  carryForward: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Calculated property
export function getAvailableBalance(balance: LeaveBalance): number {
  return balance.opening + 
         balance.accrued + 
         balance.carryForward + 
         balance.adjusted - 
         balance.taken - 
         balance.pending;
}

export function createLeaveRequest(
  params: Omit<LeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentApproverIndex'>
): Omit<LeaveRequest, 'id'> {
  return {
    ...params,
    status: 'DRAFT',
    currentApproverIndex: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateLeaveDays(
  fromDate: Date, 
  toDate: Date, 
  isHalfDay: boolean
): number {
  if (isHalfDay) return 0.5;
  
  const diffTime = toDate.getTime() - fromDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
}

export function isInBlackoutPeriod(
  fromDate: Date, 
  toDate: Date, 
  blackoutPeriods: DateRange[]
): boolean {
  for (const period of blackoutPeriods) {
    if (fromDate <= period.to && toDate >= period.from) {
      return true;
    }
  }
  return false;
}

export function canApprove(
  request: LeaveRequest, 
  approverId: string
): boolean {
  if (request.status !== 'PENDING') return false;
  
  const currentStep = request.approvalChain[request.currentApproverIndex];
  return currentStep?.approverId === approverId && 
         currentStep?.status === 'PENDING';
}

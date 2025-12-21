// application/dtos/hrms/LeaveDTO.ts
// DTOs for Leave operations

import { LeaveStatus } from '../../../domain/entities/hrms/Leave';
import { EmployeeType } from '../../../domain/entities/hrms/Employee';

// Create leave type
export interface CreateLeaveTypeDTO {
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  maxDaysPerYear: number;
  carryForwardLimit: number;
  minDaysNotice: number;
  maxConsecutiveDays?: number;
  applicableTo: EmployeeType[];
  requiresApproval: boolean;
  requiresDocument: boolean;
  accrualType: 'ANNUAL' | 'MONTHLY' | 'NONE';
  accrualAmount?: number;
  blackoutPeriods?: Array<{ from: string; to: string }>;
}

// Create leave request
export interface CreateLeaveRequestDTO {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  isHalfDay: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  replacementEmployeeId?: string;
  attachments?: string[];
}

// Approve/reject leave
export interface LeaveActionDTO {
  action: 'approve' | 'reject';
  comment?: string;
}

// Cancel leave
export interface CancelLeaveDTO {
  reason: string;
}

// Leave type response
export interface LeaveTypeResponseDTO {
  id: string;
  code: string;
  name: string;
  description?: string;
  isPaid: boolean;
  maxDaysPerYear: number;
  carryForwardLimit: number;
  minDaysNotice: number;
  requiresApproval: boolean;
  requiresDocument: boolean;
  isActive: boolean;
}

// Leave request response
export interface LeaveRequestResponseDTO {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  
  leaveType: {
    id: string;
    code: string;
    name: string;
    isPaid: boolean;
  };
  
  fromDate: string;
  toDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: string;
  
  reason: string;
  
  status: LeaveStatus;
  statusLabel: string;
  
  // Approval
  approvalChain: Array<{
    approverName: string;
    status: string;
    comment?: string;
    actionAt?: string;
  }>;
  currentApprover?: string;
  
  // Conflicts
  hasConflict: boolean;
  conflictingTrips: Array<{
    tripId: string;
    tripName: string;
    dates: string;
  }>;
  
  // Replacement
  replacementEmployee?: {
    id: string;
    name: string;
  };
  
  attachments: string[];
  
  createdAt: string;
  updatedAt: string;
}

// Leave balance response
export interface LeaveBalanceResponseDTO {
  leaveType: {
    id: string;
    code: string;
    name: string;
    isPaid: boolean;
  };
  year: number;
  
  opening: number;
  accrued: number;
  taken: number;
  pending: number;
  adjusted: number;
  carryForward: number;
  
  available: number;
  
  // Visual
  usedPercentage: number;
}

// Leave summary for dashboard
export interface LeaveSummaryDTO {
  employeeId: string;
  year: number;
  
  balances: LeaveBalanceResponseDTO[];
  
  // Quick stats
  totalAvailable: number;
  totalTaken: number;
  totalPending: number;
  
  // Upcoming
  upcomingLeaves: Array<{
    fromDate: string;
    toDate: string;
    type: string;
    days: number;
  }>;
}

// Team leave calendar
export interface TeamLeaveCalendarDTO {
  date: string;
  employees: Array<{
    id: string;
    name: string;
    leaveType: string;
    status: LeaveStatus;
  }>;
  totalOnLeave: number;
}

// Leave status labels
export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Awaiting Approval',
  APPROVED: 'Approved',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
  REVOKED: 'Revoked',
};

// domain/interfaces/hrms/ILeaveRepository.ts
import { 
  LeaveType, 
  LeaveRequest, 
  LeaveBalance, 
  LeaveStatus 
} from '../../entities/hrms/Leave';

export interface LeaveRequestFilters {
  employeeId?: string;
  employeeIds?: string[];
  leaveTypeId?: string;
  status?: LeaveStatus;
  dateFrom?: Date;
  dateTo?: Date;
  approverId?: string;
}

export interface ILeaveRepository {
  // Leave Types
  findTypeById(id: string, tenantId: string): Promise<LeaveType | null>;
  findTypeByCode(code: string, tenantId: string): Promise<LeaveType | null>;
  findAllTypes(tenantId: string): Promise<LeaveType[]>;
  createType(leaveType: Omit<LeaveType, 'id'>): Promise<LeaveType>;
  updateType(id: string, leaveType: Partial<LeaveType>): Promise<LeaveType>;
  
  // Leave Requests
  findRequestById(id: string, tenantId: string): Promise<LeaveRequest | null>;
  
  findAllRequests(
    tenantId: string, 
    filters: LeaveRequestFilters
  ): Promise<LeaveRequest[]>;
  
  createRequest(request: Omit<LeaveRequest, 'id'>): Promise<LeaveRequest>;
  updateRequest(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest>;
  deleteRequest(id: string, tenantId: string): Promise<void>;
  
  // Pending for approver
  findPendingForApprover(
    approverId: string, 
    tenantId: string
  ): Promise<LeaveRequest[]>;
  
  // Conflict detection
  findOverlapping(
    employeeId: string, 
    fromDate: Date, 
    toDate: Date, 
    tenantId: string,
    excludeRequestId?: string
  ): Promise<LeaveRequest[]>;
  
  // Leave Balances
  findBalance(
    employeeId: string, 
    leaveTypeId: string, 
    year: number, 
    tenantId: string
  ): Promise<LeaveBalance | null>;
  
  findAllBalances(
    employeeId: string, 
    year: number, 
    tenantId: string
  ): Promise<LeaveBalance[]>;
  
  createBalance(balance: Omit<LeaveBalance, 'id'>): Promise<LeaveBalance>;
  updateBalance(id: string, balance: Partial<LeaveBalance>): Promise<LeaveBalance>;
  
  // Bulk balance initialization
  initializeBalances(
    employeeId: string, 
    year: number, 
    tenantId: string
  ): Promise<LeaveBalance[]>;
}

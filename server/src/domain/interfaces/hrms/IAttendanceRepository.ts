// domain/interfaces/hrms/IAttendanceRepository.ts
import { 
  AttendanceRecord, 
  AttendanceType, 
  AttendanceStatus 
} from '../../entities/hrms/Attendance';

export interface AttendanceFilters {
  employeeId?: string;
  employeeIds?: string[];
  dateFrom: Date;
  dateTo: Date;
  type?: AttendanceType;
  status?: AttendanceStatus;
  tripId?: string;
  branchId?: string;
}

export interface AttendanceSummary {
  employeeId: string;
  period: { from: Date; to: Date };
  presentDays: number;
  absentDays: number;
  halfDays: number;
  tripDays: number;
  restDays: number;
  holidays: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
  lateArrivals: number;
}

export interface IAttendanceRepository {
  // CRUD
  findById(id: string, tenantId: string): Promise<AttendanceRecord | null>;
  
  findByEmployeeAndDate(
    employeeId: string, 
    date: Date, 
    tenantId: string
  ): Promise<AttendanceRecord | null>;
  
  findAll(
    tenantId: string, 
    filters: AttendanceFilters
  ): Promise<AttendanceRecord[]>;
  
  create(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord>;
  update(id: string, record: Partial<AttendanceRecord>): Promise<AttendanceRecord>;
  delete(id: string, tenantId: string): Promise<void>;
  
  // Bulk operations
  createMany(records: Omit<AttendanceRecord, 'id'>[]): Promise<AttendanceRecord[]>;
  
  // Summary
  getSummary(
    employeeId: string, 
    tenantId: string, 
    dateFrom: Date, 
    dateTo: Date
  ): Promise<AttendanceSummary>;
  
  getTeamSummary(
    employeeIds: string[], 
    tenantId: string, 
    dateFrom: Date, 
    dateTo: Date
  ): Promise<AttendanceSummary[]>;
  
  // Trip attendance
  findByTrip(tripId: string, tenantId: string): Promise<AttendanceRecord[]>;
  markTripAttendance(
    tripId: string, 
    employeeId: string, 
    dates: Date[], 
    tenantId: string
  ): Promise<AttendanceRecord[]>;
  
  // Pending approvals
  findPendingApprovals(
    approverEmployeeId: string, 
    tenantId: string
  ): Promise<AttendanceRecord[]>;
}

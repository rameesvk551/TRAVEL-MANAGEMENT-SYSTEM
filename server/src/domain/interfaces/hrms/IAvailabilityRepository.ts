// domain/interfaces/hrms/IAvailabilityRepository.ts
// Availability Repository Interface

import type { 
  EmployeeAvailability, 
  AvailabilityStatus,
  AvailabilityCalendarEntry,
  TeamAvailabilitySummary,
  AvailableStaffQuery 
} from '../../entities/hrms/Availability';

export interface AvailabilityFilters {
  tenantId: string;
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: AvailabilityStatus;
  branchId?: string;
  departmentId?: string;
}

export interface IAvailabilityRepository {
  // CRUD
  findById(id: string): Promise<EmployeeAvailability | null>;
  findByEmployee(employeeId: string, startDate: Date, endDate: Date): Promise<EmployeeAvailability[]>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date): Promise<EmployeeAvailability[]>;
  create(availability: Omit<EmployeeAvailability, 'id'>): Promise<EmployeeAvailability>;
  createBulk(availabilities: Omit<EmployeeAvailability, 'id'>[]): Promise<EmployeeAvailability[]>;
  update(id: string, availability: Partial<EmployeeAvailability>): Promise<EmployeeAvailability | null>;
  delete(id: string): Promise<boolean>;
  deleteBySource(sourceType: string, sourceId: string): Promise<number>;
  
  // Calendar view
  getCalendarEntries(
    tenantId: string, 
    startDate: Date, 
    endDate: Date,
    employeeIds?: string[]
  ): Promise<AvailabilityCalendarEntry[]>;
  
  // Team summary
  getTeamSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    branchId?: string
  ): Promise<TeamAvailabilitySummary[]>;
  
  // Available staff query
  getAvailableStaff(query: AvailableStaffQuery): Promise<{
    employeeId: string;
    employeeName: string;
    category: string;
    skills: string[];
  }[]>;
  
  // Check conflicts
  hasConflicts(employeeId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<boolean>;
}

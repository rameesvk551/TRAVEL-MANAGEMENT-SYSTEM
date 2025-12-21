// domain/interfaces/hrms/ITripAssignmentRepository.ts
import { 
  TripAssignment, 
  TripRole, 
  AssignmentStatus 
} from '../../entities/hrms/TripAssignment';

export interface TripAssignmentFilters {
  tripId?: string;
  employeeId?: string;
  role?: TripRole;
  status?: AssignmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  isPrimary?: boolean;
}

export interface StaffAvailability {
  employeeId: string;
  employeeName: string;
  category: string;
  isAvailable: boolean;
  conflictingTrips: Array<{
    tripId: string;
    tripName: string;
    startDate: Date;
    endDate: Date;
  }>;
  skills: string[];
}

export interface ITripAssignmentRepository {
  // CRUD
  findById(id: string, tenantId: string): Promise<TripAssignment | null>;
  
  findAll(
    tenantId: string, 
    filters: TripAssignmentFilters
  ): Promise<TripAssignment[]>;
  
  create(assignment: Omit<TripAssignment, 'id'>): Promise<TripAssignment>;
  update(id: string, assignment: Partial<TripAssignment>): Promise<TripAssignment>;
  delete(id: string, tenantId: string): Promise<void>;
  
  // Trip queries
  findByTrip(tripId: string, tenantId: string): Promise<TripAssignment[]>;
  findByEmployee(employeeId: string, tenantId: string): Promise<TripAssignment[]>;
  
  // Upcoming for employee
  findUpcoming(
    employeeId: string, 
    tenantId: string, 
    limit?: number
  ): Promise<TripAssignment[]>;
  
  // Availability check
  checkAvailability(
    employeeId: string, 
    startDate: Date, 
    endDate: Date, 
    tenantId: string,
    excludeAssignmentId?: string
  ): Promise<boolean>;
  
  findConflicts(
    employeeId: string, 
    startDate: Date, 
    endDate: Date, 
    tenantId: string
  ): Promise<TripAssignment[]>;
  
  // Staff availability for trip planning
  getStaffAvailability(
    startDate: Date, 
    endDate: Date, 
    tenantId: string,
    requiredSkills?: string[]
  ): Promise<StaffAvailability[]>;
  
  // Stats
  countByEmployee(
    employeeId: string, 
    tenantId: string, 
    year: number
  ): Promise<{ total: number; completed: number; cancelled: number }>;
  
  getTripDays(
    employeeId: string, 
    tenantId: string, 
    dateFrom: Date, 
    dateTo: Date
  ): Promise<number>;
}

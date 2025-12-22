// domain/interfaces/hrms/IScheduleRepository.ts
// Schedule (Shift, Roster) Repository Interface

import type { 
  Shift, 
  Roster, 
  RosterEntry, 
  WorkPattern,
  ShiftSwapRequest,
  RosterStatus 
} from '../../entities/hrms/Schedule';

export interface ShiftFilters {
  tenantId: string;
  type?: string;
  isActive?: boolean;
}

export interface RosterFilters {
  tenantId: string;
  branchId?: string;
  departmentId?: string;
  status?: RosterStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface IScheduleRepository {
  // Shifts
  findShiftById(id: string): Promise<Shift | null>;
  findAllShifts(filters: ShiftFilters): Promise<Shift[]>;
  createShift(shift: Omit<Shift, 'id'>): Promise<Shift>;
  updateShift(id: string, shift: Partial<Shift>): Promise<Shift | null>;
  deleteShift(id: string): Promise<boolean>;
  
  // Work Patterns
  findWorkPatternById(id: string): Promise<WorkPattern | null>;
  findAllWorkPatterns(tenantId: string): Promise<WorkPattern[]>;
  createWorkPattern(pattern: Omit<WorkPattern, 'id'>): Promise<WorkPattern>;
  updateWorkPattern(id: string, pattern: Partial<WorkPattern>): Promise<WorkPattern | null>;
  deleteWorkPattern(id: string): Promise<boolean>;
  
  // Rosters
  findRosterById(id: string): Promise<Roster | null>;
  findAllRosters(filters: RosterFilters): Promise<Roster[]>;
  findCurrentRoster(tenantId: string, branchId?: string): Promise<Roster | null>;
  createRoster(roster: Omit<Roster, 'id'>): Promise<Roster>;
  updateRoster(id: string, roster: Partial<Roster>): Promise<Roster | null>;
  publishRoster(id: string, publisherId: string): Promise<Roster | null>;
  deleteRoster(id: string): Promise<boolean>;
  
  // Roster Entries
  findRosterEntryById(id: string): Promise<RosterEntry | null>;
  findRosterEntriesByEmployee(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<RosterEntry[]>;
  findRosterEntriesByDate(
    tenantId: string,
    date: Date,
    branchId?: string
  ): Promise<RosterEntry[]>;
  createRosterEntry(entry: Omit<RosterEntry, 'id'>): Promise<RosterEntry>;
  createRosterEntriesBulk(entries: Omit<RosterEntry, 'id'>[]): Promise<RosterEntry[]>;
  updateRosterEntry(id: string, entry: Partial<RosterEntry>): Promise<RosterEntry | null>;
  deleteRosterEntry(id: string): Promise<boolean>;
  
  // Shift Swap
  findSwapRequestById(id: string): Promise<ShiftSwapRequest | null>;
  findPendingSwapRequests(tenantId: string): Promise<ShiftSwapRequest[]>;
  findSwapRequestsByEmployee(employeeId: string): Promise<ShiftSwapRequest[]>;
  createSwapRequest(request: Omit<ShiftSwapRequest, 'id'>): Promise<ShiftSwapRequest>;
  approveSwapRequest(id: string, approverId: string): Promise<ShiftSwapRequest | null>;
  rejectSwapRequest(id: string, reason: string): Promise<ShiftSwapRequest | null>;
  
  // Auto-generate
  generateRosterFromPattern(
    tenantId: string,
    patternId: string,
    employeeIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<RosterEntry[]>;
}

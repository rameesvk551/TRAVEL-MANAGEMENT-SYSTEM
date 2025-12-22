// domain/entities/hrms/Schedule.ts
// Shift, Roster, and Work Pattern management

export type ShiftType = 
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'NIGHT'
  | 'FULL_DAY'
  | 'SPLIT'
  | 'FLEXIBLE'
  | 'ON_CALL';

export type DayOfWeek = 
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type RosterStatus = 
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ARCHIVED';

// Shift Definition (template)
export interface Shift {
  id: string;
  tenantId: string;
  
  name: string;
  code: string;
  type: ShiftType;
  
  // Timing
  startTime: string;  // "09:00"
  endTime: string;    // "18:00"
  breakDuration: number;  // in minutes
  
  // Work hours
  workHours: number;
  isOvernight: boolean;
  
  // Color for calendar
  color: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Work Pattern (recurring schedule template)
export interface WorkPattern {
  id: string;
  tenantId: string;
  
  name: string;
  description?: string;
  
  // Weekly pattern
  pattern: WeeklyPattern[];
  
  // Rotation
  isRotating: boolean;
  rotationWeeks: number;
  
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyPattern {
  dayOfWeek: DayOfWeek;
  shiftId?: string;
  shiftName?: string;
  isWorkingDay: boolean;
  isWeekOff: boolean;
}

// Roster Entry (actual scheduled shift for an employee)
export interface RosterEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  
  date: Date;
  shiftId: string;
  shiftName?: string;
  
  // Override times (if different from shift)
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Status
  status: 'SCHEDULED' | 'CONFIRMED' | 'SWAPPED' | 'CANCELLED';
  
  // Swap tracking
  swappedWith?: string;
  swapApprovedBy?: string;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Roster (collection for a period)
export interface Roster {
  id: string;
  tenantId: string;
  
  name: string;
  description?: string;
  
  // Period
  startDate: Date;
  endDate: Date;
  
  // Scope
  branchId?: string;
  departmentId?: string;
  
  status: RosterStatus;
  
  // Entries
  entries: RosterEntry[];
  
  publishedAt?: Date;
  publishedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ShiftSwapRequest {
  id: string;
  tenantId: string;
  
  requesterId: string;
  requesterName?: string;
  requesterRosterEntryId: string;
  
  targetEmployeeId: string;
  targetName?: string;
  targetRosterEntryId: string;
  
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export function createShift(
  params: Omit<Shift, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>
): Omit<Shift, 'id'> {
  return {
    ...params,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createRoster(
  params: Omit<Roster, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'entries'>
): Omit<Roster, 'id'> {
  return {
    ...params,
    status: 'DRAFT',
    entries: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function calculateShiftHours(startTime: string, endTime: string, breakMinutes: number): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const totalMinutes = endMinutes - startMinutes - breakMinutes;
  return Math.round((totalMinutes / 60) * 100) / 100;
}

export const DEFAULT_SHIFTS: Partial<Shift>[] = [
  { name: 'Morning Shift', code: 'MS', type: 'MORNING', startTime: '06:00', endTime: '14:00', breakDuration: 30, color: '#FCD34D' },
  { name: 'Day Shift', code: 'DS', type: 'FULL_DAY', startTime: '09:00', endTime: '18:00', breakDuration: 60, color: '#60A5FA' },
  { name: 'Evening Shift', code: 'ES', type: 'EVENING', startTime: '14:00', endTime: '22:00', breakDuration: 30, color: '#F97316' },
  { name: 'Night Shift', code: 'NS', type: 'NIGHT', startTime: '22:00', endTime: '06:00', breakDuration: 30, color: '#8B5CF6' },
];

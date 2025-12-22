// application/dtos/hrms/ScheduleDTO.ts
// Schedule DTOs and Mappers

import type { 
  Shift, 
  Roster, 
  RosterEntry, 
  WorkPattern,
  ShiftSwapRequest,
  WeeklyPattern 
} from '../../../domain/entities/hrms/Schedule';

// ===== SHIFT DTOs =====
export interface CreateShiftDTO {
  name: string;
  code: string;
  type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'SPLIT' | 'FLEXIBLE';
  startTime: string;
  endTime: string;
  breakDuration: number;
  workHours: number;
  isOvernight?: boolean;
  color?: string;
}

export interface UpdateShiftDTO {
  name?: string;
  code?: string;
  type?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'SPLIT' | 'FLEXIBLE';
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  workHours?: number;
  isOvernight?: boolean;
  color?: string;
  isActive?: boolean;
}

export interface ShiftFiltersDTO {
  type?: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'SPLIT' | 'FLEXIBLE';
  isActive?: boolean;
}

export interface ShiftResponseDTO {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workHours: number;
  isOvernight: boolean;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== WORK PATTERN DTOs =====
export interface WeeklyPatternDTO {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  isWorkingDay: boolean;
  shiftId?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateWorkPatternDTO {
  name: string;
  description?: string;
  pattern: WeeklyPatternDTO[];
  isRotating?: boolean;
  rotationWeeks?: number;
  isDefault?: boolean;
}

export interface UpdateWorkPatternDTO {
  name?: string;
  description?: string;
  pattern?: WeeklyPatternDTO[];
  isActive?: boolean;
}

export interface WorkPatternResponseDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  pattern: WeeklyPatternDTO[];
  isRotating: boolean;
  rotationWeeks: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== ROSTER DTOs =====
export interface CreateRosterDTO {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  departmentId?: string;
}

export interface UpdateRosterDTO {
  name?: string;
  description?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface RosterFiltersDTO {
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  branchId?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface RosterEntryResponseDTO {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  shiftId: string;
  shiftName?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: string;
  swappedWith?: string;
  swapApprovedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RosterResponseDTO {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  departmentId?: string;
  status: string;
  entries: RosterEntryResponseDTO[];
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// ===== ROSTER ENTRY DTOs =====
export interface CreateRosterEntryDTO {
  employeeId: string;
  date: string;
  shiftId: string;
  notes?: string;
}

export interface BulkRosterEntryDTO {
  entries: CreateRosterEntryDTO[];
}

export interface UpdateRosterEntryDTO {
  shiftId?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status?: 'SCHEDULED' | 'WORKED' | 'ABSENT' | 'PARTIAL' | 'SWAPPED' | 'CANCELLED';
  notes?: string;
}

// ===== SHIFT SWAP DTOs =====
export interface CreateSwapRequestDTO {
  requesterRosterEntryId: string;
  targetEmployeeId: string;
  targetRosterEntryId: string;
  reason: string;
}

export interface SwapRequestResponseDTO {
  id: string;
  tenantId: string;
  requesterId: string;
  requesterName?: string;
  requesterRosterEntryId: string;
  targetEmployeeId: string;
  targetName?: string;
  targetRosterEntryId: string;
  reason: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== GENERATE ROSTER DTOs =====
export interface GenerateRosterDTO {
  patternId: string;
  employeeIds: string[];
  startDate: string;
  endDate: string;
}

// ===== MAPPERS =====
export const ScheduleMapper = {
  toShiftResponseDTO(shift: Shift): ShiftResponseDTO {
    return {
      id: shift.id,
      tenantId: shift.tenantId,
      name: shift.name,
      code: shift.code,
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      workHours: shift.workHours,
      isOvernight: shift.isOvernight,
      color: shift.color,
      isActive: shift.isActive,
      createdAt: shift.createdAt.toISOString(),
      updatedAt: shift.updatedAt.toISOString(),
    };
  },

  toWorkPatternResponseDTO(pattern: WorkPattern): WorkPatternResponseDTO {
    return {
      id: pattern.id,
      tenantId: pattern.tenantId,
      name: pattern.name,
      description: pattern.description,
      pattern: pattern.pattern,
      isRotating: pattern.isRotating,
      rotationWeeks: pattern.rotationWeeks,
      isDefault: pattern.isDefault,
      isActive: pattern.isActive,
      createdAt: pattern.createdAt.toISOString(),
      updatedAt: pattern.updatedAt.toISOString(),
    };
  },

  toRosterEntryResponseDTO(entry: RosterEntry): RosterEntryResponseDTO {
    return {
      id: entry.id,
      tenantId: entry.tenantId,
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      date: entry.date.toISOString().split('T')[0],
      shiftId: entry.shiftId,
      shiftName: entry.shiftName,
      actualStartTime: entry.actualStartTime,
      actualEndTime: entry.actualEndTime,
      status: entry.status,
      swappedWith: entry.swappedWith,
      swapApprovedBy: entry.swapApprovedBy,
      notes: entry.notes,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
  },

  toRosterResponseDTO(roster: Roster): RosterResponseDTO {
    return {
      id: roster.id,
      tenantId: roster.tenantId,
      name: roster.name,
      description: roster.description,
      startDate: roster.startDate.toISOString().split('T')[0],
      endDate: roster.endDate.toISOString().split('T')[0],
      branchId: roster.branchId,
      departmentId: roster.departmentId,
      status: roster.status,
      entries: roster.entries.map(e => ScheduleMapper.toRosterEntryResponseDTO(e)),
      publishedAt: roster.publishedAt?.toISOString(),
      publishedBy: roster.publishedBy,
      createdAt: roster.createdAt.toISOString(),
      updatedAt: roster.updatedAt.toISOString(),
      createdBy: roster.createdBy,
    };
  },

  toSwapRequestResponseDTO(request: ShiftSwapRequest): SwapRequestResponseDTO {
    return {
      id: request.id,
      tenantId: request.tenantId,
      requesterId: request.requesterId,
      requesterName: request.requesterName,
      requesterRosterEntryId: request.requesterRosterEntryId,
      targetEmployeeId: request.targetEmployeeId,
      targetName: request.targetName,
      targetRosterEntryId: request.targetRosterEntryId,
      reason: request.reason,
      status: request.status,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt?.toISOString(),
      rejectionReason: request.rejectionReason,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  },
};

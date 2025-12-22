// api/hrms/scheduleApi.ts
// Schedule Management API

import { apiClient as client } from '../client';

// ===== TYPES =====
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'SPLIT' | 'FLEXIBLE';
export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type RosterEntryStatus = 'SCHEDULED' | 'WORKED' | 'ABSENT' | 'PARTIAL' | 'SWAPPED' | 'CANCELLED';
export type SwapRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface Shift {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: ShiftType;
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

export interface WeeklyPattern {
  dayOfWeek: DayOfWeek;
  isWorkingDay: boolean;
  shiftId?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkPattern {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  pattern: WeeklyPattern[];
  isRotating: boolean;
  rotationWeeks: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RosterEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  shiftId: string;
  shiftName?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  status: RosterEntryStatus;
  swappedWith?: string;
  swapApprovedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Roster {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  departmentId?: string;
  status: RosterStatus;
  entries: RosterEntry[];
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
  updatedAt: string;
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
  status: SwapRequestStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== DTOs =====
export interface CreateShiftDTO {
  name: string;
  code: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workHours: number;
  isOvernight?: boolean;
  color?: string;
}

export interface CreateWorkPatternDTO {
  name: string;
  description?: string;
  pattern: WeeklyPattern[];
  isRotating?: boolean;
  rotationWeeks?: number;
  isDefault?: boolean;
}

export interface CreateRosterDTO {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  branchId?: string;
  departmentId?: string;
}

export interface CreateRosterEntryDTO {
  employeeId: string;
  date: string;
  shiftId: string;
  notes?: string;
}

export interface CreateSwapRequestDTO {
  requesterRosterEntryId: string;
  targetEmployeeId: string;
  targetRosterEntryId: string;
  reason: string;
}

export interface GenerateRosterDTO {
  patternId: string;
  employeeIds: string[];
  startDate: string;
  endDate: string;
}

export interface ShiftFilters {
  type?: ShiftType;
  isActive?: boolean;
}

export interface RosterFilters {
  status?: RosterStatus;
  branchId?: string;
  departmentId?: string;
}

// ===== API Functions =====
export const scheduleApi = {
  // ===== SHIFTS =====
  getAllShifts: async (filters?: ShiftFilters): Promise<Shift[]> => {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive));
    const response = await client.get(`/hrms/schedule/shifts?${params}`);
    return response.data.data;
  },

  getShiftById: async (id: string): Promise<Shift> => {
    const response = await client.get(`/hrms/schedule/shifts/${id}`);
    return response.data.data;
  },

  createShift: async (data: CreateShiftDTO): Promise<Shift> => {
    const response = await client.post('/hrms/schedule/shifts', data);
    return response.data.data;
  },

  updateShift: async (id: string, data: Partial<CreateShiftDTO>): Promise<Shift> => {
    const response = await client.put(`/hrms/schedule/shifts/${id}`, data);
    return response.data.data;
  },

  deleteShift: async (id: string): Promise<void> => {
    await client.delete(`/hrms/schedule/shifts/${id}`);
  },

  // ===== WORK PATTERNS =====
  getAllWorkPatterns: async (): Promise<WorkPattern[]> => {
    const response = await client.get('/hrms/schedule/patterns');
    return response.data.data;
  },

  getWorkPatternById: async (id: string): Promise<WorkPattern> => {
    const response = await client.get(`/hrms/schedule/patterns/${id}`);
    return response.data.data;
  },

  createWorkPattern: async (data: CreateWorkPatternDTO): Promise<WorkPattern> => {
    const response = await client.post('/hrms/schedule/patterns', data);
    return response.data.data;
  },

  updateWorkPattern: async (id: string, data: Partial<CreateWorkPatternDTO>): Promise<WorkPattern> => {
    const response = await client.put(`/hrms/schedule/patterns/${id}`, data);
    return response.data.data;
  },

  deleteWorkPattern: async (id: string): Promise<void> => {
    await client.delete(`/hrms/schedule/patterns/${id}`);
  },

  // ===== ROSTERS =====
  getAllRosters: async (filters?: RosterFilters): Promise<Roster[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.branchId) params.set('branchId', filters.branchId);
    if (filters?.departmentId) params.set('departmentId', filters.departmentId);
    const response = await client.get(`/hrms/schedule/rosters?${params}`);
    return response.data.data;
  },

  getCurrentRoster: async (branchId?: string): Promise<Roster | null> => {
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);
    const response = await client.get(`/hrms/schedule/rosters/current?${params}`);
    return response.data.data;
  },

  getRosterById: async (id: string): Promise<Roster> => {
    const response = await client.get(`/hrms/schedule/rosters/${id}`);
    return response.data.data;
  },

  createRoster: async (data: CreateRosterDTO): Promise<Roster> => {
    const response = await client.post('/hrms/schedule/rosters', data);
    return response.data.data;
  },

  updateRoster: async (id: string, data: Partial<CreateRosterDTO>): Promise<Roster> => {
    const response = await client.put(`/hrms/schedule/rosters/${id}`, data);
    return response.data.data;
  },

  publishRoster: async (id: string): Promise<Roster> => {
    const response = await client.post(`/hrms/schedule/rosters/${id}/publish`);
    return response.data.data;
  },

  deleteRoster: async (id: string): Promise<void> => {
    await client.delete(`/hrms/schedule/rosters/${id}`);
  },

  // ===== ROSTER ENTRIES =====
  getRosterEntries: async (rosterId: string): Promise<RosterEntry[]> => {
    const response = await client.get(`/hrms/schedule/rosters/${rosterId}/entries`);
    return response.data.data;
  },

  getMySchedule: async (startDate: string, endDate: string): Promise<RosterEntry[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await client.get(`/hrms/schedule/my-schedule?${params}`);
    return response.data.data;
  },

  getEmployeeSchedule: async (employeeId: string, startDate: string, endDate: string): Promise<RosterEntry[]> => {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await client.get(`/hrms/schedule/employee/${employeeId}?${params}`);
    return response.data.data;
  },

  getScheduleByDate: async (date: string, branchId?: string): Promise<RosterEntry[]> => {
    const params = new URLSearchParams({ date });
    if (branchId) params.set('branchId', branchId);
    const response = await client.get(`/hrms/schedule/by-date?${params}`);
    return response.data.data;
  },

  createRosterEntry: async (data: CreateRosterEntryDTO): Promise<RosterEntry> => {
    const response = await client.post('/hrms/schedule/entries', data);
    return response.data.data;
  },

  createBulkRosterEntries: async (entries: CreateRosterEntryDTO[]): Promise<RosterEntry[]> => {
    const response = await client.post('/hrms/schedule/entries/bulk', { entries });
    return response.data.data;
  },

  updateRosterEntry: async (id: string, data: Partial<CreateRosterEntryDTO>): Promise<RosterEntry> => {
    const response = await client.put(`/hrms/schedule/entries/${id}`, data);
    return response.data.data;
  },

  deleteRosterEntry: async (id: string): Promise<void> => {
    await client.delete(`/hrms/schedule/entries/${id}`);
  },

  // ===== SHIFT SWAP =====
  getPendingSwapRequests: async (): Promise<ShiftSwapRequest[]> => {
    const response = await client.get('/hrms/schedule/swap-requests');
    return response.data.data;
  },

  getMySwapRequests: async (): Promise<ShiftSwapRequest[]> => {
    const response = await client.get('/hrms/schedule/my-swap-requests');
    return response.data.data;
  },

  createSwapRequest: async (data: CreateSwapRequestDTO): Promise<ShiftSwapRequest> => {
    const response = await client.post('/hrms/schedule/swap-requests', data);
    return response.data.data;
  },

  approveSwapRequest: async (id: string): Promise<ShiftSwapRequest> => {
    const response = await client.post(`/hrms/schedule/swap-requests/${id}/approve`);
    return response.data.data;
  },

  rejectSwapRequest: async (id: string, reason: string): Promise<ShiftSwapRequest> => {
    const response = await client.post(`/hrms/schedule/swap-requests/${id}/reject`, { reason });
    return response.data.data;
  },

  // ===== GENERATE ROSTER =====
  generateRosterFromPattern: async (data: GenerateRosterDTO): Promise<RosterEntry[]> => {
    const response = await client.post('/hrms/schedule/generate-from-pattern', data);
    return response.data.data;
  },
};

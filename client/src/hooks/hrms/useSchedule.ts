// hooks/hrms/useSchedule.ts
// Schedule Management React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  scheduleApi, 
  ShiftFilters,
  RosterFilters,
  CreateShiftDTO,
  CreateWorkPatternDTO,
  CreateRosterDTO,
  CreateRosterEntryDTO,
  CreateSwapRequestDTO,
  GenerateRosterDTO
} from '../../api/hrms/scheduleApi';

export const scheduleKeys = {
  all: ['schedule'] as const,
  // Shifts
  shifts: () => [...scheduleKeys.all, 'shifts'] as const,
  shiftsList: (filters?: ShiftFilters) => [...scheduleKeys.shifts(), 'list', filters] as const,
  shiftDetail: (id: string) => [...scheduleKeys.shifts(), 'detail', id] as const,
  // Work Patterns
  patterns: () => [...scheduleKeys.all, 'patterns'] as const,
  patternDetail: (id: string) => [...scheduleKeys.patterns(), 'detail', id] as const,
  // Rosters
  rosters: () => [...scheduleKeys.all, 'rosters'] as const,
  rostersList: (filters?: RosterFilters) => [...scheduleKeys.rosters(), 'list', filters] as const,
  currentRoster: (branchId?: string) => [...scheduleKeys.rosters(), 'current', branchId] as const,
  rosterDetail: (id: string) => [...scheduleKeys.rosters(), 'detail', id] as const,
  // Schedule entries
  mySchedule: (startDate: string, endDate: string) => [...scheduleKeys.all, 'my-schedule', startDate, endDate] as const,
  employeeSchedule: (employeeId: string, startDate: string, endDate: string) => 
    [...scheduleKeys.all, 'employee-schedule', employeeId, startDate, endDate] as const,
  scheduleByDate: (date: string, branchId?: string) => [...scheduleKeys.all, 'by-date', date, branchId] as const,
  // Swap requests
  swapRequests: () => [...scheduleKeys.all, 'swap-requests'] as const,
  mySwapRequests: () => [...scheduleKeys.all, 'my-swap-requests'] as const,
};

// ===== SHIFTS =====
export function useShifts(filters?: ShiftFilters) {
  return useQuery({
    queryKey: scheduleKeys.shiftsList(filters),
    queryFn: () => scheduleApi.getAllShifts(filters),
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: scheduleKeys.shiftDetail(id),
    queryFn: () => scheduleApi.getShiftById(id),
    enabled: !!id,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShiftDTO) => scheduleApi.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateShiftDTO> }) => 
      scheduleApi.updateShift(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shiftDetail(id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.shifts() });
    },
  });
}

// ===== WORK PATTERNS =====
export function useWorkPatterns() {
  return useQuery({
    queryKey: scheduleKeys.patterns(),
    queryFn: () => scheduleApi.getAllWorkPatterns(),
  });
}

export function useWorkPattern(id: string) {
  return useQuery({
    queryKey: scheduleKeys.patternDetail(id),
    queryFn: () => scheduleApi.getWorkPatternById(id),
    enabled: !!id,
  });
}

export function useCreateWorkPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkPatternDTO) => scheduleApi.createWorkPattern(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.patterns() });
    },
  });
}

export function useUpdateWorkPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateWorkPatternDTO> }) => 
      scheduleApi.updateWorkPattern(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.patternDetail(id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.patterns() });
    },
  });
}

export function useDeleteWorkPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteWorkPattern(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.patterns() });
    },
  });
}

// ===== ROSTERS =====
export function useRosters(filters?: RosterFilters) {
  return useQuery({
    queryKey: scheduleKeys.rostersList(filters),
    queryFn: () => scheduleApi.getAllRosters(filters),
  });
}

export function useCurrentRoster(branchId?: string) {
  return useQuery({
    queryKey: scheduleKeys.currentRoster(branchId),
    queryFn: () => scheduleApi.getCurrentRoster(branchId),
  });
}

export function useRoster(id: string) {
  return useQuery({
    queryKey: scheduleKeys.rosterDetail(id),
    queryFn: () => scheduleApi.getRosterById(id),
    enabled: !!id,
  });
}

export function useRosterEntries(rosterId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...scheduleKeys.rosterDetail(rosterId), 'entries'] as const,
    queryFn: () => scheduleApi.getRosterEntries(rosterId),
    enabled: options?.enabled !== false && !!rosterId,
  });
}

export function useCreateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRosterDTO) => scheduleApi.createRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosters() });
    },
  });
}

export function useUpdateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRosterDTO> }) => 
      scheduleApi.updateRoster(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosterDetail(id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosters() });
    },
  });
}

export function usePublishRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.publishRoster(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosterDetail(id) });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosters() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.currentRoster() });
    },
  });
}

export function useDeleteRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteRoster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.rosters() });
    },
  });
}

// ===== SCHEDULE ENTRIES =====
export function useMySchedule(startDate: string, endDate: string) {
  return useQuery({
    queryKey: scheduleKeys.mySchedule(startDate, endDate),
    queryFn: () => scheduleApi.getMySchedule(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useEmployeeSchedule(employeeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: scheduleKeys.employeeSchedule(employeeId, startDate, endDate),
    queryFn: () => scheduleApi.getEmployeeSchedule(employeeId, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate,
  });
}

export function useScheduleByDate(date: string, branchId?: string) {
  return useQuery({
    queryKey: scheduleKeys.scheduleByDate(date, branchId),
    queryFn: () => scheduleApi.getScheduleByDate(date, branchId),
    enabled: !!date,
  });
}

export function useCreateRosterEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRosterEntryDTO) => scheduleApi.createRosterEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useCreateBulkRosterEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: CreateRosterEntryDTO[]) => scheduleApi.createBulkRosterEntries(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useUpdateRosterEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRosterEntryDTO> }) => 
      scheduleApi.updateRosterEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useDeleteRosterEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.deleteRosterEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

// ===== SHIFT SWAP =====
export function usePendingSwapRequests() {
  return useQuery({
    queryKey: scheduleKeys.swapRequests(),
    queryFn: () => scheduleApi.getPendingSwapRequests(),
  });
}

export function useMySwapRequests() {
  return useQuery({
    queryKey: scheduleKeys.mySwapRequests(),
    queryFn: () => scheduleApi.getMySwapRequests(),
  });
}

export function useCreateSwapRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSwapRequestDTO) => scheduleApi.createSwapRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.swapRequests() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.mySwapRequests() });
    },
  });
}

export function useApproveSwapRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scheduleApi.approveSwapRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useRejectSwapRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      scheduleApi.rejectSwapRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.swapRequests() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.mySwapRequests() });
    },
  });
}

// ===== GENERATE ROSTER =====
export function useGenerateRosterFromPattern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateRosterDTO) => scheduleApi.generateRosterFromPattern(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

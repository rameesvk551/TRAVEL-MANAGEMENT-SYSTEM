// hooks/hrms/useAvailability.ts
// Availability Calendar React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  availabilityApi, 
  CalendarQuery, 
  AvailableStaffQuery,
  CreateAvailabilityDTO,
  BulkAvailabilityDTO 
} from '../../api/hrms/availabilityApi';

export const availabilityKeys = {
  all: ['availability'] as const,
  calendar: (query: CalendarQuery) => [...availabilityKeys.all, 'calendar', query] as const,
  teamSummary: (query: CalendarQuery) => [...availabilityKeys.all, 'team-summary', query] as const,
  availableStaff: (query: AvailableStaffQuery) => [...availabilityKeys.all, 'available-staff', query] as const,
  employee: (employeeId: string, startDate: string, endDate: string) => 
    [...availabilityKeys.all, 'employee', employeeId, startDate, endDate] as const,
  detail: (id: string) => [...availabilityKeys.all, 'detail', id] as const,
};

// Calendar entries query
export function useCalendarEntries(query: CalendarQuery) {
  return useQuery({
    queryKey: availabilityKeys.calendar(query),
    queryFn: () => availabilityApi.getCalendarEntries(query),
    enabled: !!query.startDate && !!query.endDate,
  });
}

// Team summary query
export function useTeamSummary(query: CalendarQuery) {
  return useQuery({
    queryKey: availabilityKeys.teamSummary(query),
    queryFn: () => availabilityApi.getTeamSummary(query),
    enabled: !!query.startDate && !!query.endDate,
  });
}

// Available staff query
export function useAvailableStaff(query: AvailableStaffQuery) {
  return useQuery({
    queryKey: availabilityKeys.availableStaff(query),
    queryFn: () => availabilityApi.getAvailableStaff(query),
    enabled: !!query.startDate && !!query.endDate,
  });
}

// Employee availability query
export function useEmployeeAvailability(employeeId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: availabilityKeys.employee(employeeId, startDate, endDate),
    queryFn: () => availabilityApi.getByEmployee(employeeId, startDate, endDate),
    enabled: !!employeeId && !!startDate && !!endDate,
  });
}

// Availability detail query
export function useAvailability(id: string) {
  return useQuery({
    queryKey: availabilityKeys.detail(id),
    queryFn: () => availabilityApi.getById(id),
    enabled: !!id,
  });
}

// Create availability mutation
export function useCreateAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAvailabilityDTO) => availabilityApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

// Create bulk availability mutation
export function useCreateBulkAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BulkAvailabilityDTO) => availabilityApi.createBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

// Update availability mutation
export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAvailabilityDTO> }) => 
      availabilityApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

// Delete availability mutation
export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => availabilityApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: availabilityKeys.all });
    },
  });
}

// Check conflicts
export function useCheckConflicts(employeeId: string, startDate: string, endDate: string, excludeId?: string) {
  return useQuery({
    queryKey: ['availability', 'conflicts', employeeId, startDate, endDate, excludeId],
    queryFn: () => availabilityApi.checkConflicts(employeeId, startDate, endDate, excludeId),
    enabled: !!employeeId && !!startDate && !!endDate,
  });
}

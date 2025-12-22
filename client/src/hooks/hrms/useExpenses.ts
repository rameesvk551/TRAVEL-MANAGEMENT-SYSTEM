// hooks/hrms/useExpenses.ts
// Expense Claims React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  expenseApi, 
  ExpenseFilters, 
  CreateExpenseClaimDTO 
} from '../../api/hrms/expenseApi';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters?: ExpenseFilters) => [...expenseKeys.lists(), filters] as const,
  myExpenses: () => [...expenseKeys.all, 'my-expenses'] as const,
  pendingApproval: () => [...expenseKeys.all, 'pending-approval'] as const,
  detail: (id: string) => [...expenseKeys.all, 'detail', id] as const,
  byEmployee: (employeeId: string) => [...expenseKeys.all, 'employee', employeeId] as const,
  stats: (startDate?: string, endDate?: string) => [...expenseKeys.all, 'stats', startDate, endDate] as const,
};

// All expenses query
export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseApi.getAll(filters),
  });
}

// My expenses query
export function useMyExpenses() {
  return useQuery({
    queryKey: expenseKeys.myExpenses(),
    queryFn: () => expenseApi.getMyExpenses(),
  });
}

// Pending approval query
export function usePendingExpenses() {
  return useQuery({
    queryKey: expenseKeys.pendingApproval(),
    queryFn: () => expenseApi.getPendingApproval(),
  });
}

// Expense detail query
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseApi.getById(id),
    enabled: !!id,
  });
}

// Employee expenses query
export function useEmployeeExpenses(employeeId: string) {
  return useQuery({
    queryKey: expenseKeys.byEmployee(employeeId),
    queryFn: () => expenseApi.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

// Expense stats query
export function useExpenseStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: expenseKeys.stats(startDate, endDate),
    queryFn: () => expenseApi.getStats(startDate, endDate),
  });
}

// Create expense mutation
export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateExpenseClaimDTO) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

// Update expense mutation
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateExpenseClaimDTO> }) => 
      expenseApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

// Delete expense mutation
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

// Submit expense mutation
export function useSubmitExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => expenseApi.submit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.myExpenses() });
    },
  });
}

// Approve expense mutation
export function useApproveExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => 
      expenseApi.approve(id, comments),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingApproval() });
    },
  });
}

// Reject expense mutation
export function useRejectExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      expenseApi.reject(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.pendingApproval() });
    },
  });
}

// Mark as paid mutation
export function useMarkExpensePaid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentReference }: { id: string; paymentReference: string }) => 
      expenseApi.markAsPaid(id, paymentReference),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
  });
}

// Aliases for component compatibility
export const useExpenseClaims = useExpenses;
export const useCreateExpenseClaim = useCreateExpense;
export const useUpdateExpenseClaim = useUpdateExpense;
export const useDeleteExpenseClaim = useDeleteExpense;
export const useSubmitExpenseClaim = useSubmitExpense;
export const useApproveExpenseClaim = useApproveExpense;
export const useRejectExpenseClaim = useRejectExpense;
export const useMarkExpenseAsPaid = useMarkExpensePaid;

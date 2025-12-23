// hooks/hrms/usePerformance.ts
// Performance Management React Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  performanceApi,
  type CycleFilters,
  type GoalFilters,
  type ReviewFilters,
  type FeedbackFilters,
  type CreateCycleRequest,
  type UpdateCycleRequest,
  type CreateGoalRequest,
  type UpdateGoalRequest,
  type UpdateGoalProgressRequest,
  type CreateReviewRequest,
  type UpdateReviewRequest,
  type CreateFeedbackRequest,
} from '../../api/hrms/performanceApi';

// Query Keys
export const performanceKeys = {
  all: ['performance'] as const,
  cycles: () => [...performanceKeys.all, 'cycles'] as const,
  cyclesList: (filters?: CycleFilters) => [...performanceKeys.cycles(), 'list', filters] as const,
  cycleDetail: (id: string) => [...performanceKeys.cycles(), 'detail', id] as const,
  activeCycle: () => [...performanceKeys.cycles(), 'active'] as const,
  goals: () => [...performanceKeys.all, 'goals'] as const,
  goalsList: (filters?: GoalFilters) => [...performanceKeys.goals(), 'list', filters] as const,
  goalDetail: (id: string) => [...performanceKeys.goals(), 'detail', id] as const,
  myGoals: (cycleId?: string) => [...performanceKeys.goals(), 'my', cycleId] as const,
  teamGoals: (cycleId?: string) => [...performanceKeys.goals(), 'team', cycleId] as const,
  reviews: () => [...performanceKeys.all, 'reviews'] as const,
  reviewsList: (filters?: ReviewFilters) => [...performanceKeys.reviews(), 'list', filters] as const,
  reviewDetail: (id: string) => [...performanceKeys.reviews(), 'detail', id] as const,
  myReviews: () => [...performanceKeys.reviews(), 'my'] as const,
  pendingReviews: () => [...performanceKeys.reviews(), 'pending'] as const,
  feedback: () => [...performanceKeys.all, 'feedback'] as const,
  feedbackList: (filters?: FeedbackFilters) => [...performanceKeys.feedback(), 'list', filters] as const,
  receivedFeedback: () => [...performanceKeys.feedback(), 'received'] as const,
  givenFeedback: () => [...performanceKeys.feedback(), 'given'] as const,
  summary: () => [...performanceKeys.all, 'summary'] as const,
  mySummary: (cycleId?: string) => [...performanceKeys.summary(), 'my', cycleId] as const,
  employeeSummary: (employeeId: string, cycleId?: string) => [...performanceKeys.summary(), employeeId, cycleId] as const,
  teamSummary: (cycleId?: string) => [...performanceKeys.summary(), 'team', cycleId] as const,
};

// Cycle Hooks
export function usePerformanceCycles(filters?: CycleFilters) {
  return useQuery({
    queryKey: performanceKeys.cyclesList(filters),
    queryFn: () => performanceApi.getCycles(filters),
  });
}

export function usePerformanceCycle(id: string) {
  return useQuery({
    queryKey: performanceKeys.cycleDetail(id),
    queryFn: () => performanceApi.getCycleById(id),
    enabled: !!id,
  });
}

export function useActiveCycle() {
  return useQuery({
    queryKey: performanceKeys.activeCycle(),
    queryFn: () => performanceApi.getActiveCycle(),
  });
}

export function useCreateCycle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateCycleRequest) => performanceApi.createCycle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.cycles() });
    },
  });
}

export function useUpdateCycle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCycleRequest }) =>
      performanceApi.updateCycle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.cycles() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.cycleDetail(variables.id) });
    },
  });
}

export function useDeleteCycle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => performanceApi.deleteCycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.cycles() });
    },
  });
}

// Goal Hooks
export function usePerformanceGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: performanceKeys.goalsList(filters),
    queryFn: () => performanceApi.getGoals(filters),
  });
}

export function usePerformanceGoal(id: string) {
  return useQuery({
    queryKey: performanceKeys.goalDetail(id),
    queryFn: () => performanceApi.getGoalById(id),
    enabled: !!id,
  });
}

export function useMyGoals(cycleId?: string) {
  return useQuery({
    queryKey: performanceKeys.myGoals(cycleId),
    queryFn: () => performanceApi.getMyGoals(cycleId),
  });
}

export function useTeamGoals(cycleId?: string) {
  return useQuery({
    queryKey: performanceKeys.teamGoals(cycleId),
    queryFn: () => performanceApi.getTeamGoals(cycleId),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateGoalRequest) => performanceApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.goals() });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalRequest }) =>
      performanceApi.updateGoal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.goals() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.goalDetail(variables.id) });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => performanceApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.goals() });
    },
  });
}

export function useUpdateGoalProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalProgressRequest }) =>
      performanceApi.updateGoalProgress(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.goals() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.goalDetail(variables.id) });
    },
  });
}

// Review Hooks
export function usePerformanceReviews(filters?: ReviewFilters) {
  return useQuery({
    queryKey: performanceKeys.reviewsList(filters),
    queryFn: () => performanceApi.getReviews(filters),
  });
}

export function usePerformanceReview(id: string) {
  return useQuery({
    queryKey: performanceKeys.reviewDetail(id),
    queryFn: () => performanceApi.getReviewById(id),
    enabled: !!id,
  });
}

export function useMyReviews() {
  return useQuery({
    queryKey: performanceKeys.myReviews(),
    queryFn: () => performanceApi.getMyReviews(),
  });
}

export function usePendingReviews() {
  return useQuery({
    queryKey: performanceKeys.pendingReviews(),
    queryFn: () => performanceApi.getPendingReviews(),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateReviewRequest) => performanceApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviews() });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewRequest }) =>
      performanceApi.updateReview(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviews() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviewDetail(variables.id) });
    },
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => performanceApi.submitReview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviews() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviewDetail(id) });
    },
  });
}

export function useAcknowledgeReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      performanceApi.acknowledgeReview(id, comments),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviews() });
      queryClient.invalidateQueries({ queryKey: performanceKeys.reviewDetail(id) });
    },
  });
}

// Feedback Hooks
export function usePerformanceFeedback(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: performanceKeys.feedbackList(filters),
    queryFn: () => performanceApi.getFeedback(filters),
  });
}

export function useReceivedFeedback() {
  return useQuery({
    queryKey: performanceKeys.receivedFeedback(),
    queryFn: () => performanceApi.getMyReceivedFeedback(),
  });
}

export function useGivenFeedback() {
  return useQuery({
    queryKey: performanceKeys.givenFeedback(),
    queryFn: () => performanceApi.getMyGivenFeedback(),
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateFeedbackRequest) => performanceApi.createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: performanceKeys.feedback() });
    },
  });
}

// Summary Hooks
export function useMyPerformanceSummary(cycleId?: string) {
  return useQuery({
    queryKey: performanceKeys.mySummary(cycleId),
    queryFn: () => performanceApi.getMySummary(cycleId),
  });
}

export function useEmployeePerformanceSummary(employeeId: string, cycleId?: string) {
  return useQuery({
    queryKey: performanceKeys.employeeSummary(employeeId, cycleId),
    queryFn: () => performanceApi.getEmployeeSummary(employeeId, cycleId),
    enabled: !!employeeId,
  });
}

export function useTeamPerformanceSummary(cycleId?: string) {
  return useQuery({
    queryKey: performanceKeys.teamSummary(cycleId),
    queryFn: () => performanceApi.getTeamSummary(cycleId),
  });
}

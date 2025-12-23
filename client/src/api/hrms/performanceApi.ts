// api/hrms/performanceApi.ts
// Performance Management API

import { apiClient as client } from '../client';

// Types
export type CycleType = 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'PROJECT_BASED';
export type CycleStatus = 'DRAFT' | 'ACTIVE' | 'GOAL_SETTING' | 'IN_REVIEW' | 'CALIBRATION' | 'COMPLETED' | 'ARCHIVED';
export type GoalCategory = 'BUSINESS' | 'DEVELOPMENT' | 'TEAM' | 'PERSONAL' | 'COMPANY';
export type GoalMeasurementType = 'QUANTITATIVE' | 'QUALITATIVE' | 'MILESTONE' | 'BINARY';
export type GoalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DEFERRED';
export type ReviewType = 'SELF' | 'MANAGER' | 'PEER' | '360' | 'SKIP_LEVEL' | 'EXTERNAL';
export type ReviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'COMPLETED';
export type FeedbackType = 'PRAISE' | 'CONSTRUCTIVE' | 'REQUEST' | 'GENERAL' | 'RECOGNITION';

export interface PerformanceCycle {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  cycleType: CycleType;
  startDate: string;
  endDate: string;
  goalSettingDeadline?: string;
  selfReviewDeadline?: string;
  managerReviewDeadline?: string;
  calibrationDeadline?: string;
  status: CycleStatus;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface GoalProgress {
  id: string;
  goalId: string;
  progressValue?: number;
  progressPercentage?: number;
  notes?: string;
  attachments: Array<{ fileName: string; fileUrl: string }>;
  updatedBy: string;
  createdAt: string;
}

export interface PerformanceGoal {
  id: string;
  tenantId: string;
  cycleId: string;
  employeeId: string;
  parentGoalId?: string;
  title: string;
  description?: string;
  category?: GoalCategory;
  measurementType: GoalMeasurementType;
  targetValue?: number;
  targetUnit?: string;
  currentValue: number;
  weight: number;
  startDate?: string;
  dueDate?: string;
  status: GoalStatus;
  progress: number;
  isKeyResult: boolean;
  alignedToOkr?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  employee?: { id: string; name: string };
  cycle?: PerformanceCycle;
  progressHistory?: GoalProgress[];
}

export interface CompetencyRating {
  id: string;
  reviewId: string;
  competencyName: string;
  competencyCategory?: string;
  rating: number;
  weight: number;
  comments?: string;
  evidence?: string;
  createdAt: string;
}

export interface PerformanceReview {
  id: string;
  tenantId: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  reviewType: ReviewType;
  status: ReviewStatus;
  overallRating?: number;
  ratingScale: string;
  strengths?: string;
  areasForImprovement?: string;
  achievements?: string;
  managerComments?: string;
  employeeComments?: string;
  developmentPlan?: string;
  submittedAt?: string;
  acknowledgedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; name: string };
  reviewer?: { id: string; name: string };
  competencyRatings?: CompetencyRating[];
}

export interface PerformanceFeedback {
  id: string;
  tenantId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  feedbackType: FeedbackType;
  isAnonymous: boolean;
  isPrivate: boolean;
  message: string;
  relatedGoalId?: string;
  badges: string[];
  createdAt: string;
  fromEmployee?: { id: string; name: string };
  toEmployee?: { id: string; name: string };
}

export interface PerformanceSummary {
  cycleId: string;
  cycleName: string;
  totalGoals: number;
  completedGoals: number;
  averageProgress: number;
  overallRating?: number;
  reviewStatus: ReviewStatus;
  feedbackReceived: number;
  feedbackGiven: number;
}

// Request types
export interface CreateCycleRequest {
  name: string;
  description?: string;
  cycleType: CycleType;
  startDate: string;
  endDate: string;
  goalSettingDeadline?: string;
  selfReviewDeadline?: string;
  managerReviewDeadline?: string;
  calibrationDeadline?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateCycleRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  goalSettingDeadline?: string;
  selfReviewDeadline?: string;
  managerReviewDeadline?: string;
  calibrationDeadline?: string;
  status?: CycleStatus;
  settings?: Record<string, unknown>;
}

export interface CreateGoalRequest {
  cycleId: string;
  employeeId?: string;
  parentGoalId?: string;
  title: string;
  description?: string;
  category?: GoalCategory;
  measurementType: GoalMeasurementType;
  targetValue?: number;
  targetUnit?: string;
  weight?: number;
  startDate?: string;
  dueDate?: string;
  isKeyResult?: boolean;
  alignedToOkr?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: GoalCategory;
  targetValue?: number;
  targetUnit?: string;
  weight?: number;
  startDate?: string;
  dueDate?: string;
  status?: GoalStatus;
  isKeyResult?: boolean;
  alignedToOkr?: string;
}

export interface UpdateGoalProgressRequest {
  progressValue?: number;
  progressPercentage?: number;
  notes?: string;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}

export interface CreateReviewRequest {
  cycleId: string;
  employeeId: string;
  reviewerId?: string;
  reviewType: ReviewType;
}

export interface UpdateReviewRequest {
  overallRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  achievements?: string;
  managerComments?: string;
  employeeComments?: string;
  developmentPlan?: string;
  competencyRatings?: Array<{
    competencyName: string;
    competencyCategory?: string;
    rating: number;
    weight?: number;
    comments?: string;
    evidence?: string;
  }>;
}

export interface CreateFeedbackRequest {
  toEmployeeId: string;
  feedbackType: FeedbackType;
  isAnonymous?: boolean;
  isPrivate?: boolean;
  message: string;
  relatedGoalId?: string;
  badges?: string[];
}

// Filter types
export interface CycleFilters {
  status?: CycleStatus;
  cycleType?: CycleType;
  year?: number;
}

export interface GoalFilters {
  cycleId?: string;
  employeeId?: string;
  status?: GoalStatus;
  category?: GoalCategory;
  search?: string;
}

export interface ReviewFilters {
  cycleId?: string;
  employeeId?: string;
  reviewerId?: string;
  reviewType?: ReviewType;
  status?: ReviewStatus;
}

export interface FeedbackFilters {
  toEmployeeId?: string;
  fromEmployeeId?: string;
  feedbackType?: FeedbackType;
  startDate?: string;
  endDate?: string;
}

// API Functions
export const performanceApi = {
  // Cycles
  getCycles: async (filters?: CycleFilters): Promise<PerformanceCycle[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.cycleType) params.append('cycleType', filters.cycleType);
    if (filters?.year) params.append('year', String(filters.year));
    
    const response = await client.get(`/api/hrms/performance/cycles?${params}`);
    return response.data.data;
  },

  getCycleById: async (id: string): Promise<PerformanceCycle> => {
    const response = await client.get(`/api/hrms/performance/cycles/${id}`);
    return response.data.data;
  },

  getActiveCycle: async (): Promise<PerformanceCycle | null> => {
    const response = await client.get('/api/hrms/performance/cycles/active');
    return response.data.data;
  },

  createCycle: async (data: CreateCycleRequest): Promise<PerformanceCycle> => {
    const response = await client.post('/api/hrms/performance/cycles', data);
    return response.data.data;
  },

  updateCycle: async (id: string, data: UpdateCycleRequest): Promise<PerformanceCycle> => {
    const response = await client.patch(`/api/hrms/performance/cycles/${id}`, data);
    return response.data.data;
  },

  deleteCycle: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/performance/cycles/${id}`);
  },

  // Goals
  getGoals: async (filters?: GoalFilters): Promise<PerformanceGoal[]> => {
    const params = new URLSearchParams();
    if (filters?.cycleId) params.append('cycleId', filters.cycleId);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await client.get(`/api/hrms/performance/goals?${params}`);
    return response.data.data;
  },

  getGoalById: async (id: string): Promise<PerformanceGoal> => {
    const response = await client.get(`/api/hrms/performance/goals/${id}`);
    return response.data.data;
  },

  getMyGoals: async (cycleId?: string): Promise<PerformanceGoal[]> => {
    const params = cycleId ? `?cycleId=${cycleId}` : '';
    const response = await client.get(`/api/hrms/performance/goals/my-goals${params}`);
    return response.data.data;
  },

  getTeamGoals: async (cycleId?: string): Promise<PerformanceGoal[]> => {
    const params = cycleId ? `?cycleId=${cycleId}` : '';
    const response = await client.get(`/api/hrms/performance/goals/team${params}`);
    return response.data.data;
  },

  createGoal: async (data: CreateGoalRequest): Promise<PerformanceGoal> => {
    const response = await client.post('/api/hrms/performance/goals', data);
    return response.data.data;
  },

  updateGoal: async (id: string, data: UpdateGoalRequest): Promise<PerformanceGoal> => {
    const response = await client.patch(`/api/hrms/performance/goals/${id}`, data);
    return response.data.data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/performance/goals/${id}`);
  },

  updateGoalProgress: async (id: string, data: UpdateGoalProgressRequest): Promise<PerformanceGoal> => {
    const response = await client.post(`/api/hrms/performance/goals/${id}/progress`, data);
    return response.data.data;
  },

  // Reviews
  getReviews: async (filters?: ReviewFilters): Promise<PerformanceReview[]> => {
    const params = new URLSearchParams();
    if (filters?.cycleId) params.append('cycleId', filters.cycleId);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.reviewerId) params.append('reviewerId', filters.reviewerId);
    if (filters?.reviewType) params.append('reviewType', filters.reviewType);
    if (filters?.status) params.append('status', filters.status);
    
    const response = await client.get(`/api/hrms/performance/reviews?${params}`);
    return response.data.data;
  },

  getReviewById: async (id: string): Promise<PerformanceReview> => {
    const response = await client.get(`/api/hrms/performance/reviews/${id}`);
    return response.data.data;
  },

  getMyReviews: async (): Promise<PerformanceReview[]> => {
    const response = await client.get('/api/hrms/performance/reviews/my-reviews');
    return response.data.data;
  },

  getPendingReviews: async (): Promise<PerformanceReview[]> => {
    const response = await client.get('/api/hrms/performance/reviews/pending');
    return response.data.data;
  },

  createReview: async (data: CreateReviewRequest): Promise<PerformanceReview> => {
    const response = await client.post('/api/hrms/performance/reviews', data);
    return response.data.data;
  },

  updateReview: async (id: string, data: UpdateReviewRequest): Promise<PerformanceReview> => {
    const response = await client.patch(`/api/hrms/performance/reviews/${id}`, data);
    return response.data.data;
  },

  submitReview: async (id: string): Promise<PerformanceReview> => {
    const response = await client.post(`/api/hrms/performance/reviews/${id}/submit`);
    return response.data.data;
  },

  acknowledgeReview: async (id: string, comments?: string): Promise<PerformanceReview> => {
    const response = await client.post(`/api/hrms/performance/reviews/${id}/acknowledge`, { comments });
    return response.data.data;
  },

  // Feedback
  getFeedback: async (filters?: FeedbackFilters): Promise<PerformanceFeedback[]> => {
    const params = new URLSearchParams();
    if (filters?.toEmployeeId) params.append('toEmployeeId', filters.toEmployeeId);
    if (filters?.fromEmployeeId) params.append('fromEmployeeId', filters.fromEmployeeId);
    if (filters?.feedbackType) params.append('feedbackType', filters.feedbackType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await client.get(`/api/hrms/performance/feedback?${params}`);
    return response.data.data;
  },

  getMyReceivedFeedback: async (): Promise<PerformanceFeedback[]> => {
    const response = await client.get('/api/hrms/performance/feedback/received');
    return response.data.data;
  },

  getMyGivenFeedback: async (): Promise<PerformanceFeedback[]> => {
    const response = await client.get('/api/hrms/performance/feedback/given');
    return response.data.data;
  },

  createFeedback: async (data: CreateFeedbackRequest): Promise<PerformanceFeedback> => {
    const response = await client.post('/api/hrms/performance/feedback', data);
    return response.data.data;
  },

  // Summary
  getMySummary: async (cycleId?: string): Promise<PerformanceSummary> => {
    const params = cycleId ? `?cycleId=${cycleId}` : '';
    const response = await client.get(`/api/hrms/performance/summary/me${params}`);
    return response.data.data;
  },

  getEmployeeSummary: async (employeeId: string, cycleId?: string): Promise<PerformanceSummary> => {
    const params = cycleId ? `?cycleId=${cycleId}` : '';
    const response = await client.get(`/api/hrms/performance/summary/${employeeId}${params}`);
    return response.data.data;
  },

  getTeamSummary: async (cycleId?: string): Promise<PerformanceSummary[]> => {
    const params = cycleId ? `?cycleId=${cycleId}` : '';
    const response = await client.get(`/api/hrms/performance/summary/team${params}`);
    return response.data.data;
  },
};

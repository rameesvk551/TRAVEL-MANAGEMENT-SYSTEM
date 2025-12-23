// application/dtos/hrms/PerformanceDTO.ts
// Performance Management DTOs and Mappers

import type {
  PerformanceCycle,
  PerformanceGoal,
  GoalProgress,
  PerformanceReview,
  ReviewCompetencyRating,
  PerformanceFeedback,
  CycleType,
  CycleStatus,
  GoalCategory,
  GoalMeasurementType,
  GoalStatus,
  ReviewType,
  ReviewStatus,
  FeedbackType,
} from '../../../domain/entities/hrms/Performance';

// Request DTOs
export interface CreatePerformanceCycleDTO {
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

export interface UpdatePerformanceCycleDTO {
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

export interface CreatePerformanceGoalDTO {
  cycleId: string;
  employeeId?: string; // if not provided, uses current user's employee
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

export interface UpdatePerformanceGoalDTO {
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

export interface UpdateGoalProgressDTO {
  progressValue?: number;
  progressPercentage?: number;
  notes?: string;
  attachments?: Array<{ fileName: string; fileUrl: string }>;
}

export interface CreatePerformanceReviewDTO {
  cycleId: string;
  employeeId: string;
  reviewerId?: string; // if not provided, uses current user
  reviewType: ReviewType;
}

export interface UpdatePerformanceReviewDTO {
  overallRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  achievements?: string;
  managerComments?: string;
  employeeComments?: string;
  developmentPlan?: string;
  competencyRatings?: CreateCompetencyRatingDTO[];
}

export interface CreateCompetencyRatingDTO {
  competencyName: string;
  competencyCategory?: string;
  rating: number;
  weight?: number;
  comments?: string;
  evidence?: string;
}

export interface CreatePerformanceFeedbackDTO {
  toEmployeeId: string;
  feedbackType: FeedbackType;
  isAnonymous?: boolean;
  isPrivate?: boolean;
  message: string;
  relatedGoalId?: string;
  badges?: string[];
}

// Filter DTOs
export interface PerformanceCycleFiltersDTO {
  status?: CycleStatus;
  cycleType?: CycleType;
  year?: number;
}

export interface PerformanceGoalFiltersDTO {
  cycleId?: string;
  employeeId?: string;
  status?: GoalStatus;
  category?: GoalCategory;
  search?: string;
}

export interface PerformanceReviewFiltersDTO {
  cycleId?: string;
  employeeId?: string;
  reviewerId?: string;
  reviewType?: ReviewType;
  status?: ReviewStatus;
}

export interface PerformanceFeedbackFiltersDTO {
  toEmployeeId?: string;
  fromEmployeeId?: string;
  feedbackType?: FeedbackType;
  startDate?: string;
  endDate?: string;
}

// Response DTOs
export interface PerformanceCycleResponseDTO {
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

export interface PerformanceGoalResponseDTO {
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
  cycle?: PerformanceCycleResponseDTO;
  progressHistory?: GoalProgressResponseDTO[];
}

export interface GoalProgressResponseDTO {
  id: string;
  goalId: string;
  progressValue?: number;
  progressPercentage?: number;
  notes?: string;
  attachments: Array<{ fileName: string; fileUrl: string }>;
  updatedBy: string;
  createdAt: string;
}

export interface PerformanceReviewResponseDTO {
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
  competencyRatings?: CompetencyRatingResponseDTO[];
}

export interface CompetencyRatingResponseDTO {
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

export interface PerformanceFeedbackResponseDTO {
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

// Summary/Stats DTOs
export interface PerformanceSummaryDTO {
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

export interface TeamPerformanceDTO {
  managerId: string;
  teamMembers: number;
  averageGoalCompletion: number;
  averageRating: number;
  pendingReviews: number;
  completedReviews: number;
}

// Mappers
export const PerformanceMapper = {
  toCycleResponseDTO(cycle: PerformanceCycle): PerformanceCycleResponseDTO {
    return {
      id: cycle.id,
      tenantId: cycle.tenantId,
      name: cycle.name,
      description: cycle.description,
      cycleType: cycle.cycleType,
      startDate: cycle.startDate.toISOString().split('T')[0],
      endDate: cycle.endDate.toISOString().split('T')[0],
      goalSettingDeadline: cycle.goalSettingDeadline?.toISOString().split('T')[0],
      selfReviewDeadline: cycle.selfReviewDeadline?.toISOString().split('T')[0],
      managerReviewDeadline: cycle.managerReviewDeadline?.toISOString().split('T')[0],
      calibrationDeadline: cycle.calibrationDeadline?.toISOString().split('T')[0],
      status: cycle.status,
      settings: cycle.settings,
      createdAt: cycle.createdAt.toISOString(),
      updatedAt: cycle.updatedAt.toISOString(),
      createdBy: cycle.createdBy,
    };
  },

  toGoalResponseDTO(goal: PerformanceGoal): PerformanceGoalResponseDTO {
    return {
      id: goal.id,
      tenantId: goal.tenantId,
      cycleId: goal.cycleId,
      employeeId: goal.employeeId,
      parentGoalId: goal.parentGoalId,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      measurementType: goal.measurementType,
      targetValue: goal.targetValue,
      targetUnit: goal.targetUnit,
      currentValue: goal.currentValue,
      weight: goal.weight,
      startDate: goal.startDate?.toISOString().split('T')[0],
      dueDate: goal.dueDate?.toISOString().split('T')[0],
      status: goal.status,
      progress: goal.progress,
      isKeyResult: goal.isKeyResult,
      alignedToOkr: goal.alignedToOkr,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      createdBy: goal.createdBy,
      employee: goal.employee,
      cycle: goal.cycle ? PerformanceMapper.toCycleResponseDTO(goal.cycle) : undefined,
      progressHistory: goal.progressHistory?.map(PerformanceMapper.toProgressResponseDTO),
    };
  },

  toProgressResponseDTO(progress: GoalProgress): GoalProgressResponseDTO {
    return {
      id: progress.id,
      goalId: progress.goalId,
      progressValue: progress.progressValue,
      progressPercentage: progress.progressPercentage,
      notes: progress.notes,
      attachments: progress.attachments,
      updatedBy: progress.updatedBy,
      createdAt: progress.createdAt.toISOString(),
    };
  },

  toReviewResponseDTO(review: PerformanceReview): PerformanceReviewResponseDTO {
    return {
      id: review.id,
      tenantId: review.tenantId,
      cycleId: review.cycleId,
      employeeId: review.employeeId,
      reviewerId: review.reviewerId,
      reviewType: review.reviewType,
      status: review.status,
      overallRating: review.overallRating,
      ratingScale: review.ratingScale,
      strengths: review.strengths,
      areasForImprovement: review.areasForImprovement,
      achievements: review.achievements,
      managerComments: review.managerComments,
      employeeComments: review.employeeComments,
      developmentPlan: review.developmentPlan,
      submittedAt: review.submittedAt?.toISOString(),
      acknowledgedAt: review.acknowledgedAt?.toISOString(),
      completedAt: review.completedAt?.toISOString(),
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      employee: review.employee,
      reviewer: review.reviewer,
      competencyRatings: review.competencyRatings?.map(PerformanceMapper.toCompetencyRatingResponseDTO),
    };
  },

  toCompetencyRatingResponseDTO(rating: ReviewCompetencyRating): CompetencyRatingResponseDTO {
    return {
      id: rating.id,
      reviewId: rating.reviewId,
      competencyName: rating.competencyName,
      competencyCategory: rating.competencyCategory,
      rating: rating.rating,
      weight: rating.weight,
      comments: rating.comments,
      evidence: rating.evidence,
      createdAt: rating.createdAt.toISOString(),
    };
  },

  toFeedbackResponseDTO(feedback: PerformanceFeedback): PerformanceFeedbackResponseDTO {
    return {
      id: feedback.id,
      tenantId: feedback.tenantId,
      fromEmployeeId: feedback.isAnonymous ? '' : feedback.fromEmployeeId,
      toEmployeeId: feedback.toEmployeeId,
      feedbackType: feedback.feedbackType,
      isAnonymous: feedback.isAnonymous,
      isPrivate: feedback.isPrivate,
      message: feedback.message,
      relatedGoalId: feedback.relatedGoalId,
      badges: feedback.badges,
      createdAt: feedback.createdAt.toISOString(),
      fromEmployee: feedback.isAnonymous ? undefined : feedback.fromEmployee,
      toEmployee: feedback.toEmployee,
    };
  },
};

// domain/entities/hrms/Performance.ts
// Performance Management Domain Entities

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
  startDate: Date;
  endDate: Date;
  goalSettingDeadline?: Date;
  selfReviewDeadline?: Date;
  managerReviewDeadline?: Date;
  calibrationDeadline?: Date;
  status: CycleStatus;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
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
  startDate?: Date;
  dueDate?: Date;
  status: GoalStatus;
  progress: number;
  isKeyResult: boolean;
  alignedToOkr?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Joined data
  employee?: { id: string; name: string };
  cycle?: PerformanceCycle;
  progressHistory?: GoalProgress[];
}

export interface GoalProgress {
  id: string;
  goalId: string;
  progressValue?: number;
  progressPercentage?: number;
  notes?: string;
  attachments: Array<{ fileName: string; fileUrl: string }>;
  updatedBy: string;
  createdAt: Date;
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
  submittedAt?: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  employee?: { id: string; name: string };
  reviewer?: { id: string; name: string };
  competencyRatings?: ReviewCompetencyRating[];
}

export interface ReviewCompetencyRating {
  id: string;
  reviewId: string;
  competencyName: string;
  competencyCategory?: string;
  rating: number;
  weight: number;
  comments?: string;
  evidence?: string;
  createdAt: Date;
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
  createdAt: Date;
  // Joined data
  fromEmployee?: { id: string; name: string };
  toEmployee?: { id: string; name: string };
}

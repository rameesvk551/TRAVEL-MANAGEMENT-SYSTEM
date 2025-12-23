// domain/entities/hrms/Analytics.ts
// HR Analytics Domain Entities

export type MetricCategory = 'WORKFORCE' | 'RECRUITMENT' | 'RETENTION' | 'ENGAGEMENT' | 'PERFORMANCE' | 'COMPENSATION' | 'ATTENDANCE' | 'TRAINING' | 'COMPLIANCE' | 'CUSTOM';
export type MetricDataType = 'NUMBER' | 'PERCENTAGE' | 'CURRENCY' | 'RATIO' | 'DURATION' | 'COUNT';
export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'LATEST';
export type TargetDirection = 'HIGHER' | 'LOWER' | 'EQUAL' | 'RANGE';
export type RefreshFrequency = 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type TrendType = 'MOVING_AVG' | 'YOY' | 'MOM' | 'QOQ' | 'FORECAST';
export type TrendDirection = 'UP' | 'DOWN' | 'STABLE';
export type DashboardType = 'HR_OVERVIEW' | 'RECRUITMENT' | 'RETENTION' | 'PERFORMANCE' | 'COMPENSATION' | 'COMPLIANCE' | 'EXECUTIVE' | 'CUSTOM';
export type WidgetType = 'METRIC_CARD' | 'LINE_CHART' | 'BAR_CHART' | 'PIE_CHART' | 'DONUT_CHART' | 'TABLE' | 'HEATMAP' | 'GAUGE' | 'SPARKLINE' | 'COMPARISON';

export interface MetricDefinition {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  category: MetricCategory;
  dataType: MetricDataType;
  calculationFormula?: string;
  aggregationType?: AggregationType;
  targetValue?: number;
  targetDirection?: TargetDirection;
  targetMin?: number;
  targetMax?: number;
  unit?: string;
  isActive: boolean;
  refreshFrequency: RefreshFrequency;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricSnapshot {
  id: string;
  tenantId: string;
  metricId: string;
  snapshotDate: Date;
  periodType: PeriodType;
  value: number;
  previousValue?: number;
  changeValue?: number;
  changePercentage?: number;
  breakdown?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  // Joined data
  metric?: MetricDefinition;
}

export interface MetricTrend {
  id: string;
  tenantId: string;
  metricId: string;
  trendType: TrendType;
  periodStart: Date;
  periodEnd: Date;
  trendValue?: number;
  trendDirection?: TrendDirection;
  confidenceLevel?: number;
  dataPoints: Array<{ date: string; value: number }>;
  createdAt: Date;
  // Joined data
  metric?: MetricDefinition;
}

export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  dashboardType: DashboardType;
  layout: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>;
  filters: Record<string, unknown>;
  refreshInterval: number;
  isDefault: boolean;
  isShared: boolean;
  sharedWith: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  widgets?: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  metricIds: string[];
  queryConfig?: Record<string, unknown>;
  visualizationConfig: Record<string, unknown>;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  metrics?: MetricDefinition[];
}

// Pre-defined metric codes for common HR metrics
export const StandardMetricCodes = {
  HEADCOUNT: 'HEADCOUNT',
  TURNOVER_RATE: 'TURNOVER_RATE',
  AVG_TENURE: 'AVG_TENURE',
  GENDER_RATIO: 'GENDER_RATIO',
  GOAL_COMPLETION: 'GOAL_COMPLETION',
  AVG_PERF_SCORE: 'AVG_PERF_SCORE',
  ABSENTEEISM: 'ABSENTEEISM',
  OVERTIME_HOURS: 'OVERTIME_HOURS',
  LABOR_COST_PER_EMP: 'LABOR_COST_PER_EMP',
  BENEFITS_RATIO: 'BENEFITS_RATIO',
  TIME_TO_HIRE: 'TIME_TO_HIRE',
  OFFER_ACCEPTANCE: 'OFFER_ACCEPTANCE',
  TRAINING_HOURS: 'TRAINING_HOURS',
  ENGAGEMENT_SCORE: 'ENGAGEMENT_SCORE',
} as const;

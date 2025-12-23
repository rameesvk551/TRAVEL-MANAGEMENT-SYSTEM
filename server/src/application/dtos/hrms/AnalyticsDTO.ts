// application/dtos/hrms/AnalyticsDTO.ts
// HR Analytics DTOs and Mappers

import type {
  MetricDefinition,
  MetricSnapshot,
  MetricTrend,
  AnalyticsDashboard,
  DashboardWidget,
  MetricCategory,
  MetricDataType,
  AggregationType,
  TargetDirection,
  RefreshFrequency,
  PeriodType,
  TrendType,
  TrendDirection,
  DashboardType,
  WidgetType,
} from '../../../domain/entities/hrms/Analytics';

// Request DTOs
export interface CreateMetricDefinitionDTO {
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
  refreshFrequency?: RefreshFrequency;
}

export interface UpdateMetricDefinitionDTO {
  name?: string;
  description?: string;
  calculationFormula?: string;
  aggregationType?: AggregationType;
  targetValue?: number;
  targetDirection?: TargetDirection;
  targetMin?: number;
  targetMax?: number;
  unit?: string;
  isActive?: boolean;
  refreshFrequency?: RefreshFrequency;
}

export interface CreateMetricSnapshotDTO {
  metricId: string;
  snapshotDate: string;
  periodType: PeriodType;
  value: number;
  previousValue?: number;
  breakdown?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateAnalyticsDashboardDTO {
  name: string;
  description?: string;
  dashboardType: DashboardType;
  isDefault?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  refreshInterval?: number;
}

export interface UpdateAnalyticsDashboardDTO {
  name?: string;
  description?: string;
  layout?: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>;
  filters?: Record<string, unknown>;
  isDefault?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  refreshInterval?: number;
}

export interface CreateDashboardWidgetDTO {
  dashboardId: string;
  widgetType: WidgetType;
  title: string;
  metricIds?: string[];
  queryConfig?: Record<string, unknown>;
  visualizationConfig?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

export interface UpdateDashboardWidgetDTO {
  title?: string;
  metricIds?: string[];
  queryConfig?: Record<string, unknown>;
  visualizationConfig?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

// Filter DTOs
export interface MetricFiltersDTO {
  category?: MetricCategory;
  dataType?: MetricDataType;
  isActive?: boolean;
  search?: string;
}

export interface MetricSnapshotFiltersDTO {
  metricId?: string;
  metricCode?: string;
  periodType?: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface DashboardFiltersDTO {
  dashboardType?: DashboardType;
  isShared?: boolean;
  createdBy?: string;
}

// Response DTOs
export interface MetricDefinitionResponseDTO {
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
  createdAt: string;
  updatedAt: string;
}

export interface MetricSnapshotResponseDTO {
  id: string;
  tenantId: string;
  metricId: string;
  snapshotDate: string;
  periodType: PeriodType;
  value: number;
  previousValue?: number;
  changeValue?: number;
  changePercentage?: number;
  breakdown?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  metric?: MetricDefinitionResponseDTO;
}

export interface MetricTrendResponseDTO {
  id: string;
  tenantId: string;
  metricId: string;
  trendType: TrendType;
  periodStart: string;
  periodEnd: string;
  trendValue?: number;
  trendDirection?: TrendDirection;
  confidenceLevel?: number;
  dataPoints: Array<{ date: string; value: number }>;
  createdAt: string;
  metric?: MetricDefinitionResponseDTO;
}

export interface AnalyticsDashboardResponseDTO {
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
  createdAt: string;
  updatedAt: string;
  widgets?: DashboardWidgetResponseDTO[];
}

export interface DashboardWidgetResponseDTO {
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
  createdAt: string;
  updatedAt: string;
  metrics?: MetricDefinitionResponseDTO[];
}

// Computed/Summary DTOs
export interface MetricValueDTO {
  metricId: string;
  metricCode: string;
  metricName: string;
  currentValue: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  targetValue?: number;
  targetDirection?: TargetDirection;
  isOnTarget: boolean;
  unit?: string;
  asOfDate: string;
}

export interface HRDashboardSummaryDTO {
  headcount: MetricValueDTO;
  turnoverRate: MetricValueDTO;
  averageTenure: MetricValueDTO;
  absenteeismRate: MetricValueDTO;
  overtimeHours: MetricValueDTO;
  laborCost: MetricValueDTO;
  goalCompletion: MetricValueDTO;
  averageRating: MetricValueDTO;
}

export interface WorkforceAnalyticsDTO {
  totalEmployees: number;
  byDepartment: Array<{ department: string; count: number; percentage: number }>;
  byLocation: Array<{ location: string; count: number; percentage: number }>;
  byEmploymentType: Array<{ type: string; count: number; percentage: number }>;
  byGender: Array<{ gender: string; count: number; percentage: number }>;
  byAgeGroup: Array<{ ageGroup: string; count: number; percentage: number }>;
  byTenure: Array<{ tenureRange: string; count: number; percentage: number }>;
  headcountTrend: Array<{ month: string; count: number }>;
}

// Mappers
export const AnalyticsMapper = {
  toMetricDefinitionResponseDTO(metric: MetricDefinition): MetricDefinitionResponseDTO {
    return {
      id: metric.id,
      tenantId: metric.tenantId,
      name: metric.name,
      code: metric.code,
      description: metric.description,
      category: metric.category,
      dataType: metric.dataType,
      calculationFormula: metric.calculationFormula,
      aggregationType: metric.aggregationType,
      targetValue: metric.targetValue,
      targetDirection: metric.targetDirection,
      targetMin: metric.targetMin,
      targetMax: metric.targetMax,
      unit: metric.unit,
      isActive: metric.isActive,
      refreshFrequency: metric.refreshFrequency,
      createdAt: metric.createdAt.toISOString(),
      updatedAt: metric.updatedAt.toISOString(),
    };
  },

  toMetricSnapshotResponseDTO(snapshot: MetricSnapshot): MetricSnapshotResponseDTO {
    return {
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      metricId: snapshot.metricId,
      snapshotDate: snapshot.snapshotDate.toISOString().split('T')[0],
      periodType: snapshot.periodType,
      value: snapshot.value,
      previousValue: snapshot.previousValue,
      changeValue: snapshot.changeValue,
      changePercentage: snapshot.changePercentage,
      breakdown: snapshot.breakdown,
      metadata: snapshot.metadata,
      createdAt: snapshot.createdAt.toISOString(),
      metric: snapshot.metric ? AnalyticsMapper.toMetricDefinitionResponseDTO(snapshot.metric) : undefined,
    };
  },

  toMetricTrendResponseDTO(trend: MetricTrend): MetricTrendResponseDTO {
    return {
      id: trend.id,
      tenantId: trend.tenantId,
      metricId: trend.metricId,
      trendType: trend.trendType,
      periodStart: trend.periodStart.toISOString().split('T')[0],
      periodEnd: trend.periodEnd.toISOString().split('T')[0],
      trendValue: trend.trendValue,
      trendDirection: trend.trendDirection,
      confidenceLevel: trend.confidenceLevel,
      dataPoints: trend.dataPoints,
      createdAt: trend.createdAt.toISOString(),
      metric: trend.metric ? AnalyticsMapper.toMetricDefinitionResponseDTO(trend.metric) : undefined,
    };
  },

  toDashboardResponseDTO(dashboard: AnalyticsDashboard): AnalyticsDashboardResponseDTO {
    return {
      id: dashboard.id,
      tenantId: dashboard.tenantId,
      name: dashboard.name,
      description: dashboard.description,
      dashboardType: dashboard.dashboardType,
      layout: dashboard.layout,
      filters: dashboard.filters,
      refreshInterval: dashboard.refreshInterval,
      isDefault: dashboard.isDefault,
      isShared: dashboard.isShared,
      sharedWith: dashboard.sharedWith,
      createdBy: dashboard.createdBy,
      createdAt: dashboard.createdAt.toISOString(),
      updatedAt: dashboard.updatedAt.toISOString(),
      widgets: dashboard.widgets?.map(AnalyticsMapper.toWidgetResponseDTO),
    };
  },

  toWidgetResponseDTO(widget: DashboardWidget): DashboardWidgetResponseDTO {
    return {
      id: widget.id,
      dashboardId: widget.dashboardId,
      widgetType: widget.widgetType,
      title: widget.title,
      metricIds: widget.metricIds,
      queryConfig: widget.queryConfig,
      visualizationConfig: widget.visualizationConfig,
      positionX: widget.positionX,
      positionY: widget.positionY,
      width: widget.width,
      height: widget.height,
      createdAt: widget.createdAt.toISOString(),
      updatedAt: widget.updatedAt.toISOString(),
      metrics: widget.metrics?.map(AnalyticsMapper.toMetricDefinitionResponseDTO),
    };
  },
};

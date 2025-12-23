// api/hrms/analyticsApi.ts
// HR Analytics API

import { apiClient as client } from '../client';

// Types
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
  createdAt: string;
  updatedAt: string;
}

export interface MetricSnapshot {
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
  metric?: MetricDefinition;
}

export interface MetricTrend {
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
  metric?: MetricDefinition;
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
  createdAt: string;
  updatedAt: string;
  metrics?: MetricDefinition[];
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
  createdAt: string;
  updatedAt: string;
  widgets?: DashboardWidget[];
}

export interface MetricValue {
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

export interface HRDashboardSummary {
  headcount: MetricValue;
  turnoverRate: MetricValue;
  averageTenure: MetricValue;
  absenteeismRate: MetricValue;
  overtimeHours: MetricValue;
  laborCost: MetricValue;
  goalCompletion: MetricValue;
  averageRating: MetricValue;
}

export interface WorkforceAnalytics {
  totalEmployees: number;
  byDepartment: Array<{ department: string; count: number; percentage: number }>;
  byLocation: Array<{ location: string; count: number; percentage: number }>;
  byEmploymentType: Array<{ type: string; count: number; percentage: number }>;
  byGender: Array<{ gender: string; count: number; percentage: number }>;
  byAgeGroup: Array<{ ageGroup: string; count: number; percentage: number }>;
  byTenure: Array<{ tenureRange: string; count: number; percentage: number }>;
  headcountTrend: Array<{ month: string; count: number }>;
}

// Request types
export interface CreateMetricRequest {
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

export interface UpdateMetricRequest {
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

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  dashboardType: DashboardType;
  isDefault?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  refreshInterval?: number;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  layout?: Array<{ widgetId: string; x: number; y: number; w: number; h: number }>;
  filters?: Record<string, unknown>;
  isDefault?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
  refreshInterval?: number;
}

export interface CreateWidgetRequest {
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

export interface UpdateWidgetRequest {
  title?: string;
  metricIds?: string[];
  queryConfig?: Record<string, unknown>;
  visualizationConfig?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
}

// Filter types
export interface MetricFilters {
  category?: MetricCategory;
  dataType?: MetricDataType;
  isActive?: boolean;
  search?: string;
}

export interface SnapshotFilters {
  metricId?: string;
  metricCode?: string;
  periodType?: PeriodType;
  startDate?: string;
  endDate?: string;
}

export interface DashboardFilters {
  dashboardType?: DashboardType;
  isShared?: boolean;
  createdBy?: string;
}

// API Functions
export const analyticsApi = {
  // Metrics
  getMetrics: async (filters?: MetricFilters): Promise<MetricDefinition[]> => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.dataType) params.append('dataType', filters.dataType);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await client.get(`/api/hrms/analytics/metrics?${params}`);
    return response.data.data;
  },

  getMetricById: async (id: string): Promise<MetricDefinition> => {
    const response = await client.get(`/api/hrms/analytics/metrics/${id}`);
    return response.data.data;
  },

  getMetricByCode: async (code: string): Promise<MetricDefinition> => {
    const response = await client.get(`/api/hrms/analytics/metrics/code/${code}`);
    return response.data.data;
  },

  createMetric: async (data: CreateMetricRequest): Promise<MetricDefinition> => {
    const response = await client.post('/api/hrms/analytics/metrics', data);
    return response.data.data;
  },

  updateMetric: async (id: string, data: UpdateMetricRequest): Promise<MetricDefinition> => {
    const response = await client.patch(`/api/hrms/analytics/metrics/${id}`, data);
    return response.data.data;
  },

  deleteMetric: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/analytics/metrics/${id}`);
  },

  // Snapshots
  getSnapshots: async (filters?: SnapshotFilters): Promise<MetricSnapshot[]> => {
    const params = new URLSearchParams();
    if (filters?.metricId) params.append('metricId', filters.metricId);
    if (filters?.metricCode) params.append('metricCode', filters.metricCode);
    if (filters?.periodType) params.append('periodType', filters.periodType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await client.get(`/api/hrms/analytics/snapshots?${params}`);
    return response.data.data;
  },

  getLatestSnapshot: async (metricId: string): Promise<MetricSnapshot | null> => {
    const response = await client.get(`/api/hrms/analytics/snapshots/latest/${metricId}`);
    return response.data.data;
  },

  // Trends
  getMetricTrends: async (metricId: string, trendType?: TrendType): Promise<MetricTrend[]> => {
    const params = trendType ? `?trendType=${trendType}` : '';
    const response = await client.get(`/api/hrms/analytics/trends/${metricId}${params}`);
    return response.data.data;
  },

  // Dashboards
  getDashboards: async (filters?: DashboardFilters): Promise<AnalyticsDashboard[]> => {
    const params = new URLSearchParams();
    if (filters?.dashboardType) params.append('dashboardType', filters.dashboardType);
    if (filters?.isShared !== undefined) params.append('isShared', String(filters.isShared));
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    
    const response = await client.get(`/api/hrms/analytics/dashboards?${params}`);
    return response.data.data;
  },

  getDashboardById: async (id: string): Promise<AnalyticsDashboard> => {
    const response = await client.get(`/api/hrms/analytics/dashboards/${id}`);
    return response.data.data;
  },

  getDefaultDashboard: async (type?: DashboardType): Promise<AnalyticsDashboard | null> => {
    const params = type ? `?type=${type}` : '';
    const response = await client.get(`/api/hrms/analytics/dashboards/default${params}`);
    return response.data.data;
  },

  createDashboard: async (data: CreateDashboardRequest): Promise<AnalyticsDashboard> => {
    const response = await client.post('/api/hrms/analytics/dashboards', data);
    return response.data.data;
  },

  updateDashboard: async (id: string, data: UpdateDashboardRequest): Promise<AnalyticsDashboard> => {
    const response = await client.patch(`/api/hrms/analytics/dashboards/${id}`, data);
    return response.data.data;
  },

  deleteDashboard: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/analytics/dashboards/${id}`);
  },

  // Widgets
  createWidget: async (data: CreateWidgetRequest): Promise<DashboardWidget> => {
    const response = await client.post('/api/hrms/analytics/widgets', data);
    return response.data.data;
  },

  updateWidget: async (id: string, data: UpdateWidgetRequest): Promise<DashboardWidget> => {
    const response = await client.patch(`/api/hrms/analytics/widgets/${id}`, data);
    return response.data.data;
  },

  deleteWidget: async (id: string): Promise<void> => {
    await client.delete(`/api/hrms/analytics/widgets/${id}`);
  },

  // Pre-built analytics
  getHRSummary: async (): Promise<HRDashboardSummary> => {
    const response = await client.get('/api/hrms/analytics/summary');
    return response.data.data;
  },

  getWorkforceAnalytics: async (): Promise<WorkforceAnalytics> => {
    const response = await client.get('/api/hrms/analytics/workforce');
    return response.data.data;
  },

  getMetricValue: async (metricCode: string): Promise<MetricValue> => {
    const response = await client.get(`/api/hrms/analytics/value/${metricCode}`);
    return response.data.data;
  },

  getMultipleMetricValues: async (metricCodes: string[]): Promise<MetricValue[]> => {
    const response = await client.post('/api/hrms/analytics/values', { metricCodes });
    return response.data.data;
  },

  // Refresh metrics
  refreshMetric: async (metricId: string): Promise<MetricSnapshot> => {
    const response = await client.post(`/api/hrms/analytics/metrics/${metricId}/refresh`);
    return response.data.data;
  },

  refreshAllMetrics: async (): Promise<{ refreshed: number; failed: number }> => {
    const response = await client.post('/api/hrms/analytics/metrics/refresh-all');
    return response.data.data;
  },
};

// hooks/hrms/useAnalytics.ts
// HR Analytics React Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyticsApi,
  type MetricFilters,
  type SnapshotFilters,
  type DashboardFilters,
  type CreateMetricRequest,
  type UpdateMetricRequest,
  type CreateDashboardRequest,
  type UpdateDashboardRequest,
  type CreateWidgetRequest,
  type UpdateWidgetRequest,
  type TrendType,
} from '../../api/hrms/analyticsApi';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  metrics: () => [...analyticsKeys.all, 'metrics'] as const,
  metricsList: (filters?: MetricFilters) => [...analyticsKeys.metrics(), 'list', filters] as const,
  metricDetail: (id: string) => [...analyticsKeys.metrics(), 'detail', id] as const,
  metricByCode: (code: string) => [...analyticsKeys.metrics(), 'code', code] as const,
  snapshots: () => [...analyticsKeys.all, 'snapshots'] as const,
  snapshotsList: (filters?: SnapshotFilters) => [...analyticsKeys.snapshots(), 'list', filters] as const,
  latestSnapshot: (metricId: string) => [...analyticsKeys.snapshots(), 'latest', metricId] as const,
  trends: () => [...analyticsKeys.all, 'trends'] as const,
  metricTrends: (metricId: string, trendType?: TrendType) => [...analyticsKeys.trends(), metricId, trendType] as const,
  dashboards: () => [...analyticsKeys.all, 'dashboards'] as const,
  dashboardsList: (filters?: DashboardFilters) => [...analyticsKeys.dashboards(), 'list', filters] as const,
  dashboardDetail: (id: string) => [...analyticsKeys.dashboards(), 'detail', id] as const,
  defaultDashboard: (type?: string) => [...analyticsKeys.dashboards(), 'default', type] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  workforce: () => [...analyticsKeys.all, 'workforce'] as const,
  metricValue: (code: string) => [...analyticsKeys.all, 'value', code] as const,
  multipleValues: (codes: string[]) => [...analyticsKeys.all, 'values', codes] as const,
};

// Metric Hooks
export function useMetrics(filters?: MetricFilters) {
  return useQuery({
    queryKey: analyticsKeys.metricsList(filters),
    queryFn: () => analyticsApi.getMetrics(filters),
  });
}

export function useMetric(id: string) {
  return useQuery({
    queryKey: analyticsKeys.metricDetail(id),
    queryFn: () => analyticsApi.getMetricById(id),
    enabled: !!id,
  });
}

export function useMetricByCode(code: string) {
  return useQuery({
    queryKey: analyticsKeys.metricByCode(code),
    queryFn: () => analyticsApi.getMetricByCode(code),
    enabled: !!code,
  });
}

export function useCreateMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateMetricRequest) => analyticsApi.createMetric(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.metrics() });
    },
  });
}

export function useUpdateMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMetricRequest }) =>
      analyticsApi.updateMetric(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.metrics() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.metricDetail(variables.id) });
    },
  });
}

export function useDeleteMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteMetric(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.metrics() });
    },
  });
}

export function useRefreshMetric() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (metricId: string) => analyticsApi.refreshMetric(metricId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.snapshots() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.summary() });
    },
  });
}

export function useRefreshAllMetrics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => analyticsApi.refreshAllMetrics(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
  });
}

// Snapshot Hooks
export function useMetricSnapshots(filters?: SnapshotFilters) {
  return useQuery({
    queryKey: analyticsKeys.snapshotsList(filters),
    queryFn: () => analyticsApi.getSnapshots(filters),
  });
}

export function useLatestSnapshot(metricId: string) {
  return useQuery({
    queryKey: analyticsKeys.latestSnapshot(metricId),
    queryFn: () => analyticsApi.getLatestSnapshot(metricId),
    enabled: !!metricId,
  });
}

// Trend Hooks
export function useMetricTrends(metricId: string, trendType?: TrendType) {
  return useQuery({
    queryKey: analyticsKeys.metricTrends(metricId, trendType),
    queryFn: () => analyticsApi.getMetricTrends(metricId, trendType),
    enabled: !!metricId,
  });
}

// Dashboard Hooks
export function useAnalyticsDashboards(filters?: DashboardFilters) {
  return useQuery({
    queryKey: analyticsKeys.dashboardsList(filters),
    queryFn: () => analyticsApi.getDashboards(filters),
  });
}

export function useAnalyticsDashboard(id: string) {
  return useQuery({
    queryKey: analyticsKeys.dashboardDetail(id),
    queryFn: () => analyticsApi.getDashboardById(id),
    enabled: !!id,
  });
}

export function useDefaultDashboard(type?: string) {
  return useQuery({
    queryKey: analyticsKeys.defaultDashboard(type),
    queryFn: () => analyticsApi.getDefaultDashboard(type as any),
  });
}

export function useCreateDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateDashboardRequest) => analyticsApi.createDashboard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
    },
  });
}

export function useUpdateDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDashboardRequest }) =>
      analyticsApi.updateDashboard(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboardDetail(variables.id) });
    },
  });
}

export function useDeleteDashboard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteDashboard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
    },
  });
}

// Widget Hooks
export function useCreateWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateWidgetRequest) => analyticsApi.createWidget(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboardDetail(data.dashboardId) });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWidgetRequest }) =>
      analyticsApi.updateWidget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
    },
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => analyticsApi.deleteWidget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboards() });
    },
  });
}

// Pre-built Analytics Hooks
export function useHRSummary() {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: () => analyticsApi.getHRSummary(),
  });
}

export function useWorkforceAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.workforce(),
    queryFn: () => analyticsApi.getWorkforceAnalytics(),
  });
}

export function useMetricValue(metricCode: string) {
  return useQuery({
    queryKey: analyticsKeys.metricValue(metricCode),
    queryFn: () => analyticsApi.getMetricValue(metricCode),
    enabled: !!metricCode,
  });
}

export function useMultipleMetricValues(metricCodes: string[]) {
  return useQuery({
    queryKey: analyticsKeys.multipleValues(metricCodes),
    queryFn: () => analyticsApi.getMultipleMetricValues(metricCodes),
    enabled: metricCodes.length > 0,
  });
}

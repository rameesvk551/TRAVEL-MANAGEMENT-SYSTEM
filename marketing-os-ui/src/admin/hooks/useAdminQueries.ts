import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuditLogParams,
  AutomationLogParams,
  BillingPlanType,
  CouponListParams,
  CouponPatchPayload,
  CouponUpsertPayload,
  Tenant,
  TenantListParams,
  TenantStatus,
  TenantTrialUpdatePayload,
  UsageFeatureConfig,
  UserListParams,
} from '../types';
import { adminService } from '../services/adminService';

export const adminQueryKeys = {
  overview: ['admin', 'overview'] as const,
  tenants: (params: TenantListParams) => ['admin', 'tenants', params] as const,
  tenant: (tenantId: string) => ['admin', 'tenant', tenantId] as const,
  users: (params: UserListParams) => ['admin', 'users', params] as const,
  userActivity: (userId: string) => ['admin', 'user-activity', userId] as const,
  billing: ['admin', 'billing'] as const,
  usageConfigs: (planType?: string) => ['admin', 'usage-configs', planType ?? 'all'] as const,
  coupons: (params: CouponListParams) => ['admin', 'coupons', params] as const,
  integrations: ['admin', 'integrations'] as const,
  automationLogs: (params: AutomationLogParams) => ['admin', 'automation-logs', params] as const,
  auditLogs: (params: AuditLogParams) => ['admin', 'audit-logs', params] as const,
  systemHealth: ['admin', 'system-health'] as const,
  featureManagement: ['admin', 'feature-management'] as const,
  settings: ['admin', 'settings'] as const,
  notifications: ['admin', 'notifications'] as const,
};

export const useAdminOverview = () =>
  useQuery({
    queryKey: adminQueryKeys.overview,
    queryFn: () => adminService.getOverview(),
  });

export const useAdminTenants = (params: TenantListParams) =>
  useQuery({
    queryKey: adminQueryKeys.tenants(params),
    queryFn: () => adminService.getTenants(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminTenantsWithOptions = (
  params: TenantListParams,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: adminQueryKeys.tenants(params),
    queryFn: () => adminService.getTenants(params),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? true,
  });

export const useAdminTenant = (tenantId: string | null) =>
  useQuery({
    queryKey: adminQueryKeys.tenant(tenantId ?? 'none'),
    queryFn: () => {
      if (!tenantId) {
        throw new Error('Tenant id is required');
      }
      return adminService.getTenantById(tenantId);
    },
    enabled: Boolean(tenantId),
  });

export const useAdminUsers = (params: UserListParams) =>
  useQuery({
    queryKey: adminQueryKeys.users(params),
    queryFn: () => adminService.getUsers(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminUsersWithOptions = (params: UserListParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: adminQueryKeys.users(params),
    queryFn: () => adminService.getUsers(params),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled ?? true,
  });

export const useAdminUserActivity = (userId: string | null) =>
  useQuery({
    queryKey: adminQueryKeys.userActivity(userId ?? 'none'),
    queryFn: () => {
      if (!userId) {
        throw new Error('User id is required');
      }
      return adminService.getUserActivity(userId);
    },
    enabled: Boolean(userId),
  });

export const useAdminBilling = () =>
  useQuery({
    queryKey: adminQueryKeys.billing,
    queryFn: () => adminService.getBilling(),
  });

export const useAdminUsageConfigs = (planType?: string) =>
  useQuery({
    queryKey: adminQueryKeys.usageConfigs(planType),
    queryFn: () => adminService.getBillingUsageConfigs(planType),
    placeholderData: (previousData) => previousData,
  });

export const useAdminCoupons = (params: CouponListParams) =>
  useQuery({
    queryKey: adminQueryKeys.coupons(params),
    queryFn: () => adminService.getBillingCoupons(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminIntegrations = () =>
  useQuery({
    queryKey: adminQueryKeys.integrations,
    queryFn: () => adminService.getIntegrations(),
  });

export const useAdminAutomationLogs = (params: AutomationLogParams) =>
  useQuery({
    queryKey: adminQueryKeys.automationLogs(params),
    queryFn: () => adminService.getAutomationLogs(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminAuditLogs = (params: AuditLogParams) =>
  useQuery({
    queryKey: adminQueryKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
    placeholderData: (previousData) => previousData,
  });

export const useAdminSystemHealth = () =>
  useQuery({
    queryKey: adminQueryKeys.systemHealth,
    queryFn: () => adminService.getSystemHealth(),
    refetchInterval: 30000,
  });

export const useAdminFeatureManagement = () =>
  useQuery({
    queryKey: adminQueryKeys.featureManagement,
    queryFn: () => adminService.getFeatureManagement(),
  });

export const useAdminSettings = () =>
  useQuery({
    queryKey: adminQueryKeys.settings,
    queryFn: () => adminService.getSettings(),
  });

export const useAdminNotifications = () =>
  useQuery({
    queryKey: adminQueryKeys.notifications,
    queryFn: () => adminService.getNotifications(),
    refetchInterval: 45000,
  });

export const useTenantStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, status }: { tenantId: string; status: TenantStatus }) =>
      adminService.updateTenantStatus(tenantId, status),
    onSuccess: (tenant: Tenant) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenant(tenant.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing });
    },
  });
};

export const useTenantPlanMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: Tenant['plan'] }) =>
      adminService.changeTenantPlan(tenantId, plan),
    onSuccess: (tenant: Tenant) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.tenant(tenant.id) });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing });
    },
  });
};

export const useTenantImpersonationMutation = () =>
  useMutation({
    mutationFn: ({ tenantId, actorName }: { tenantId: string; actorName?: string }) =>
      adminService.impersonateTenant(tenantId, actorName),
  });

export const useTenantTrialMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: TenantTrialUpdatePayload;
    }) => adminService.updateTenantTrial(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useCreateBillingCouponMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CouponUpsertPayload) => adminService.createBillingCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useMonthlyUsageBillingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (referenceDate?: string) => adminService.runMonthlyUsageBilling(referenceDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useBillingReconciliationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lookbackHours?: number) => adminService.runBillingReconciliation(lookbackHours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.billing });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useUpsertBillingUsageConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planType,
      features,
    }: {
      planType: BillingPlanType;
      features: UsageFeatureConfig[];
    }) => adminService.upsertBillingUsageConfig(planType, features),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'usage-configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useUpdateBillingCouponMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, payload }: { couponId: string; payload: CouponPatchPayload }) =>
      adminService.updateBillingCoupon(couponId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const useDeleteBillingCouponMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ couponId, reason }: { couponId: string; reason?: string }) =>
      adminService.deleteBillingCoupon(couponId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
    },
  });
};

export const usePlanFeatureMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      featureKey,
      enabled,
    }: {
      planId: string;
      featureKey: string;
      enabled: boolean;
    }) => adminService.updatePlanFeature(planId, featureKey, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.featureManagement });
    },
  });
};

export const usePlanLimitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      field,
      value,
    }: {
      planId: string;
      field: 'users' | 'messagesPerMonth' | 'storageGb';
      value: number;
    }) => adminService.updatePlanLimit(planId, field, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.featureManagement });
    },
  });
};

export const useFeatureFlagMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      flagId,
      enabled,
      rolloutPercentage,
    }: {
      flagId: string;
      enabled: boolean;
      rolloutPercentage: number;
    }) => adminService.updateFeatureFlag(flagId, enabled, rolloutPercentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.featureManagement });
    },
  });
};

export const useUpdateSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.settings });
    },
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.notifications });
    },
  });
};


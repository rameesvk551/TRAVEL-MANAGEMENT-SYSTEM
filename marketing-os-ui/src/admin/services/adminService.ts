import type {
  AdminOverviewResponse,
  AuditLog,
  AuditLogParams,
  AutomationLog,
  AutomationLogParams,
  BillingUsageConfig,
  BillingCoupon,
  BillingResponse,
  BillingReconciliationResult,
  CouponDeleteResult,
  CouponListParams,
  CouponPatchPayload,
  CouponUpsertPayload,
  FeatureManagementResponse,
  IntegrationMonitorItem,
  NotificationItem,
  PaginatedResponse,
  PlatformSettings,
  SystemHealthResponse,
  Tenant,
  TenantImpersonationSession,
  TenantListParams,
  TenantStatus,
  TenantTrialUpdatePayload,
  TenantTrialUpdateResult,
  MonthlyUsageBillingResult,
  UsageFeatureConfig,
  User,
  UserActivityItem,
  UserListParams,
} from '../types';
import { adminApiClient } from './apiClient';
import { mockAdminApi } from './mockAdminApi';

const useMock = import.meta.env.VITE_ADMIN_MOCK !== 'false';

const resolve = async <T>(request: Promise<T>, fallback: () => Promise<T>): Promise<T> => {
  if (useMock) {
    return fallback();
  }

  try {
    return await request;
  } catch {
    return fallback();
  }
};

interface ApiEnvelope<T> {
  status?: string;
  data: T;
}

const unwrapEnvelope = <T>(payload: T | ApiEnvelope<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapBillingCoupon = (payload: Record<string, unknown>): BillingCoupon => ({
  id: String(payload.id),
  code: String(payload.code ?? '').toUpperCase(),
  scope: String(payload.scope ?? 'all') as BillingCoupon['scope'],
  discountType: String(payload.discountType ?? payload.discount_type ?? 'fixed') as BillingCoupon['discountType'],
  discountValue: Number(payload.discountValue ?? payload.discount_value ?? 0),
  maxDiscountAmountPaise: toNullableNumber(payload.maxDiscountAmountPaise ?? payload.max_discount_amount_paise),
  active: Boolean(payload.active),
  validFrom: (payload.validFrom ?? payload.valid_from ?? null) as string | null,
  validUntil: (payload.validUntil ?? payload.valid_until ?? null) as string | null,
  usageLimit: toNullableNumber(payload.usageLimit ?? payload.usage_limit),
  usedCount: Number(payload.usedCount ?? payload.used_count ?? 0),
  applicablePlanTypes: (payload.applicablePlanTypes ?? payload.applicable_plan_types ?? []) as BillingCoupon['applicablePlanTypes'],
  razorpayOfferId: (payload.razorpayOfferId ?? payload.razorpay_offer_id ?? null) as string | null,
  createdAt: String(payload.createdAt ?? payload.created_at ?? new Date().toISOString()),
  updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
});

const mapBillingUsageConfig = (payload: Record<string, unknown>): BillingUsageConfig => ({
  id: String(payload.id),
  planType: String(payload.planType ?? payload.plan_type ?? 'trial') as BillingUsageConfig['planType'],
  featureConfigs: Array.isArray(payload.featureConfigs ?? payload.feature_configs)
    ? ((payload.featureConfigs ?? payload.feature_configs) as Array<Record<string, unknown>>).map((feature) => ({
        featureKey: String(feature.featureKey ?? feature.feature_key ?? ''),
        freeLimit: Number(feature.freeLimit ?? feature.free_limit ?? 0),
        overageUnitPricePaise: Number(
          feature.overageUnitPricePaise ?? feature.overage_unit_price_paise ?? 0,
        ),
      }))
    : [],
  updatedByUserId: (payload.updatedByUserId ?? payload.updated_by_user_id ?? null) as string | null,
  createdAt: String(payload.createdAt ?? payload.created_at ?? new Date().toISOString()),
  updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
});

export const adminService = {
  getOverview: () =>
    resolve(
      adminApiClient.get<AdminOverviewResponse>('/admin/overview').then((response) => response.data),
      () => mockAdminApi.getOverview(),
    ),

  getTenants: (params: TenantListParams) =>
    resolve(
      adminApiClient
        .get<PaginatedResponse<Tenant>>('/admin/tenants', { params })
        .then((response) => response.data),
      () => mockAdminApi.getTenants(params),
    ),

  getTenantById: (tenantId: string) =>
    resolve(
      adminApiClient.get<Tenant>(`/admin/tenants/${tenantId}`).then((response) => response.data),
      async () => {
        const tenant = await mockAdminApi.getTenantById(tenantId);
        if (!tenant) {
          throw new Error('Tenant not found');
        }
        return tenant;
      },
    ),

  updateTenantStatus: (tenantId: string, status: TenantStatus) =>
    resolve(
      adminApiClient
        .patch<Tenant>(`/admin/tenants/${tenantId}/status`, { status })
        .then((response) => response.data),
      async () => {
        const tenant = await mockAdminApi.updateTenantStatus(tenantId, status);
        if (!tenant) {
          throw new Error('Tenant not found');
        }
        return tenant;
      },
    ),

  changeTenantPlan: (tenantId: string, plan: Tenant['plan']) =>
    resolve(
      adminApiClient
        .patch<Tenant>(`/admin/tenants/${tenantId}/plan`, { plan })
        .then((response) => response.data),
      async () => {
        const tenant = await mockAdminApi.changeTenantPlan(tenantId, plan);
        if (!tenant) {
          throw new Error('Tenant not found');
        }
        return tenant;
      },
    ),

  impersonateTenant: (tenantId: string, actorName?: string) =>
    resolve(
      adminApiClient
        .post<TenantImpersonationSession>(`/admin/tenants/${tenantId}/impersonate`, { actorName })
        .then((response) => response.data),
      async () => {
        const session = await mockAdminApi.impersonateTenant(tenantId, actorName);
        if (!session) {
          throw new Error('Tenant not found');
        }
        return session;
      },
    ),

  getUsers: (params: UserListParams) =>
    resolve(
      adminApiClient.get<PaginatedResponse<User>>('/admin/users', { params }).then((response) => response.data),
      () => mockAdminApi.getUsers(params),
    ),

  getUserActivity: (userId: string) =>
    resolve(
      adminApiClient
        .get<UserActivityItem[]>(`/admin/users/${userId}/activity`)
        .then((response) => response.data),
      () => mockAdminApi.getUserActivity(userId),
    ),

  getBilling: () =>
    resolve(
      adminApiClient.get<BillingResponse>('/admin/billing').then((response) => response.data),
      () => mockAdminApi.getBilling(),
    ),

  runMonthlyUsageBilling: (referenceDate?: string) =>
    resolve(
      adminApiClient
        .post<ApiEnvelope<MonthlyUsageBillingResult> | MonthlyUsageBillingResult>(
          '/billing/admin/jobs/monthly-usage-billing/run',
          {
            referenceDate,
          },
        )
        .then((response) => unwrapEnvelope(response.data)),
      () => mockAdminApi.runMonthlyUsageBilling(referenceDate),
    ),

  runBillingReconciliation: (lookbackHours?: number) =>
    resolve(
      adminApiClient
        .post<ApiEnvelope<BillingReconciliationResult> | BillingReconciliationResult>(
          '/billing/admin/jobs/reconciliation/run',
          {
            lookbackHours,
          },
        )
        .then((response) => unwrapEnvelope(response.data)),
      () => mockAdminApi.runBillingReconciliation(lookbackHours),
    ),

  getBillingUsageConfigs: (planType?: string) =>
    resolve(
      adminApiClient
        .get<ApiEnvelope<Array<Record<string, unknown>>> | Array<Record<string, unknown>>>(
          '/billing/admin/usage-config',
          {
            params: {
              planType,
            },
          },
        )
        .then((response) => unwrapEnvelope(response.data).map((item) => mapBillingUsageConfig(item))),
      () => mockAdminApi.getBillingUsageConfigs(planType),
    ),

  upsertBillingUsageConfig: (planType: string, features: UsageFeatureConfig[]) =>
    resolve(
      adminApiClient
        .put<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
          `/billing/admin/usage-config/${planType}`,
          { features },
        )
        .then((response) => mapBillingUsageConfig(unwrapEnvelope(response.data))),
      () => mockAdminApi.upsertBillingUsageConfig(planType, features),
    ),

  getBillingCoupons: (params: CouponListParams) =>
    resolve(
      adminApiClient
        .get<ApiEnvelope<PaginatedResponse<Record<string, unknown>>> | PaginatedResponse<Record<string, unknown>>>(
          '/billing/admin/coupons',
          { params },
        )
        .then((response) => {
          const unwrapped = unwrapEnvelope(response.data);
          return {
            ...unwrapped,
            items: unwrapped.items.map((item) => mapBillingCoupon(item)),
          };
        }),
      () => mockAdminApi.getBillingCoupons(params),
    ),

  createBillingCoupon: (payload: CouponUpsertPayload) =>
    resolve(
      adminApiClient
        .post<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>('/billing/admin/coupons', payload)
        .then((response) => mapBillingCoupon(unwrapEnvelope(response.data))),
      () => mockAdminApi.createBillingCoupon(payload),
    ),

  updateBillingCoupon: (couponId: string, payload: CouponPatchPayload) =>
    resolve(
      adminApiClient
        .patch<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
          `/billing/admin/coupons/${couponId}`,
          payload,
        )
        .then((response) => mapBillingCoupon(unwrapEnvelope(response.data))),
      async () => {
        const updated = await mockAdminApi.updateBillingCoupon(couponId, payload);
        if (!updated) {
          throw new Error('Coupon not found');
        }
        return updated;
      },
    ),

  deleteBillingCoupon: (couponId: string, reason?: string) =>
    resolve(
      adminApiClient
        .delete<ApiEnvelope<CouponDeleteResult> | CouponDeleteResult>(`/billing/admin/coupons/${couponId}`, {
          data: { reason },
        })
        .then((response) => unwrapEnvelope(response.data)),
      () => mockAdminApi.deleteBillingCoupon(couponId, reason),
    ),

  updateTenantTrial: (tenantId: string, payload: TenantTrialUpdatePayload) =>
    resolve(
      adminApiClient
        .patch<ApiEnvelope<Record<string, unknown>> | Record<string, unknown>>(
          `/billing/admin/trial/${tenantId}`,
          payload,
        )
        .then((response) => {
          const data = unwrapEnvelope(response.data);
          return {
            id: String(data.id),
            tenantId: String(data.tenantId ?? data.tenant_id ?? tenantId),
            trialStartAt: (data.trialStartAt ?? data.trial_start_at ?? null) as string | null,
            trialEndAt: (data.trialEndAt ?? data.trial_end_at ?? null) as string | null,
            status: String(data.status ?? 'trialing'),
          } satisfies TenantTrialUpdateResult;
        }),
      async () => {
        const updated = await mockAdminApi.updateTenantTrial(tenantId, payload);
        if (!updated) {
          throw new Error('Tenant not found');
        }
        return updated;
      },
    ),

  getIntegrations: () =>
    resolve(
      adminApiClient
        .get<IntegrationMonitorItem[]>('/admin/integrations')
        .then((response) => response.data),
      () => mockAdminApi.getIntegrations(),
    ),

  getAutomationLogs: (params: AutomationLogParams) =>
    resolve(
      adminApiClient
        .get<PaginatedResponse<AutomationLog>>('/admin/automation-logs', { params })
        .then((response) => response.data),
      () => mockAdminApi.getAutomationLogs(params),
    ),

  getAuditLogs: (params: AuditLogParams) =>
    resolve(
      adminApiClient
        .get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params })
        .then((response) => response.data),
      () => mockAdminApi.getAuditLogs(params),
    ),

  getSystemHealth: () =>
    resolve(
      adminApiClient.get<SystemHealthResponse>('/admin/system-health').then((response) => response.data),
      () => mockAdminApi.getSystemHealth(),
    ),

  getFeatureManagement: () =>
    resolve(
      adminApiClient
        .get<FeatureManagementResponse>('/admin/feature-management')
        .then((response) => response.data),
      () => mockAdminApi.getFeatureManagement(),
    ),

  updatePlanFeature: (planId: string, featureKey: string, enabled: boolean) =>
    resolve(
      adminApiClient
        .patch<FeatureManagementResponse>(`/admin/feature-management/plans/${planId}/features`, {
          featureKey,
          enabled,
        })
        .then((response) => response.data),
      () => mockAdminApi.updatePlanFeature(planId, featureKey, enabled),
    ),

  updatePlanLimit: (
    planId: string,
    field: 'users' | 'messagesPerMonth' | 'storageGb',
    value: number,
  ) =>
    resolve(
      adminApiClient
        .patch<FeatureManagementResponse>(`/admin/feature-management/plans/${planId}/limits`, {
          field,
          value,
        })
        .then((response) => response.data),
      () => mockAdminApi.updatePlanLimit(planId, field, value),
    ),

  updateFeatureFlag: (flagId: string, enabled: boolean, rolloutPercentage: number) =>
    resolve(
      adminApiClient
        .patch<FeatureManagementResponse>(`/admin/feature-management/flags/${flagId}`, {
          enabled,
          rolloutPercentage,
        })
        .then((response) => response.data),
      () => mockAdminApi.updateFeatureFlag(flagId, enabled, rolloutPercentage),
    ),

  getSettings: () =>
    resolve(
      adminApiClient.get<PlatformSettings>('/admin/settings').then((response) => response.data),
      () => mockAdminApi.getSettings(),
    ),

  updateSettings: (payload: PlatformSettings) =>
    resolve(
      adminApiClient.put<PlatformSettings>('/admin/settings', payload).then((response) => response.data),
      () => mockAdminApi.updateSettings(payload),
    ),

  getNotifications: () =>
    resolve(
      adminApiClient
        .get<NotificationItem[]>('/admin/notifications')
        .then((response) => response.data),
      () => mockAdminApi.getNotifications(),
    ),

  markNotificationRead: (id: string) =>
    resolve(
      adminApiClient
        .post<NotificationItem[]>(`/admin/notifications/${id}/read`)
        .then((response) => response.data),
      () => mockAdminApi.markNotificationRead(id),
    ),
};

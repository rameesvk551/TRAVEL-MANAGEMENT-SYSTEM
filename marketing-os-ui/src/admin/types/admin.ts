export type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive';

export type UserStatus = 'active' | 'invited' | 'disabled';

export type IntegrationHealth = 'healthy' | 'degraded' | 'down';

export type AutomationStatus = 'success' | 'failed' | 'running';

export type BillingStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface AdminOverviewSummary {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  newSignups30d: number;
  activeSessions: number;
  apiRequestsToday: number;
  monthlyRevenue: number;
  systemHealthPercent: number;
}

export interface AdminOverviewResponse {
  summary: AdminOverviewSummary;
  tenantGrowth: TimeSeriesPoint[];
  userActivityTrend: TimeSeriesPoint[];
  revenueGrowth: TimeSeriesPoint[];
}

export interface Tenant {
  id: string;
  companyName: string;
  plan: 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
  usersCount: number;
  status: TenantStatus;
  createdAt: string;
  lastActivity: string;
  ownerEmail: string;
  region: string;
  monthlySpend: number;
  featureFlags: string[];
}

export interface TenantImpersonationSession {
  tenantId: string;
  tenantName: string;
  actorName: string;
  sessionToken: string;
  expiresAt: string;
  launchUrl: string;
}

export interface TenantListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TenantStatus | 'all';
  plan?: Tenant['plan'] | 'all';
}

export interface User {
  id: string;
  tenantId: string;
  tenantName: string;
  name: string;
  email: string;
  role: 'super_admin' | 'tenant_admin' | 'manager' | 'analyst' | 'member';
  status: UserStatus;
  lastLoginAt: string;
  createdAt: string;
}

export interface UserActivityItem {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ipAddress: string;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus | 'all';
  role?: User['role'] | 'all';
  tenantId?: string | 'all';
}

export interface BillingMetrics {
  mrr: number;
  activeSubscriptions: number;
  trialUsers: number;
  churnRate: number;
}

export interface Invoice {
  id: string;
  tenantName: string;
  amount: number;
  status: BillingStatus;
  issuedAt: string;
  dueAt: string;
}

export interface Payment {
  id: string;
  tenantName: string;
  amount: number;
  status: BillingStatus;
  method: string;
  paidAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: 'Monthly' | 'Yearly' | 'Lifetime';
  billingCycle: 'monthly' | 'yearly' | 'one_time';
  price: number;
  activeTenants: number;
  includedUsers: number;
  includedStorageGb: number;
}

export interface BillingResponse {
  metrics: BillingMetrics;
  invoices: Invoice[];
  payments: Payment[];
  plans: SubscriptionPlan[];
}

export interface BillingFailedTenant {
  tenantId: string;
  error: string;
}

export interface MonthlyUsageBillingResult {
  cycleStart: string;
  cycleEnd: string;
  scanned: number;
  generated: number;
  failedTenants: BillingFailedTenant[];
}

export interface BillingReconciliationFailure {
  entity: string;
  id: string;
  error: string;
}

export interface BillingReconciliationResult {
  lookbackHours: number;
  since: string;
  scannedSubscriptions: number;
  updatedSubscriptions: number;
  scannedInvoices: number;
  paidInvoices: number;
  failures: BillingReconciliationFailure[];
}

export type BillingPlanType = 'trial' | 'monthly' | 'yearly' | 'lifetime';
export type CouponScope = 'subscription' | 'usage' | 'all';
export type CouponDiscountType = 'fixed' | 'percent';

export interface UsageFeatureConfig {
  featureKey: string;
  freeLimit: number;
  overageUnitPricePaise: number;
}

export interface BillingUsageConfig {
  id: string;
  planType: BillingPlanType;
  featureConfigs: UsageFeatureConfig[];
  updatedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingCoupon {
  id: string;
  code: string;
  scope: CouponScope;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmountPaise: number | null;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  applicablePlanTypes: BillingPlanType[];
  razorpayOfferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  scope?: CouponScope;
  active?: boolean;
}

export interface CouponUpsertPayload {
  code: string;
  scope: CouponScope;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmountPaise?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  applicablePlanTypes?: BillingPlanType[];
  razorpayOfferId?: string | null;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface CouponPatchPayload {
  code?: string;
  scope?: CouponScope;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxDiscountAmountPaise?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  applicablePlanTypes?: BillingPlanType[];
  razorpayOfferId?: string | null;
  active?: boolean;
}

export interface CouponDeleteResult {
  deleted: boolean;
  deactivated: boolean;
  couponId?: string;
}

export interface TenantTrialUpdatePayload {
  trialStartAt?: string | null;
  trialEndAt: string;
  reason?: string;
}

export interface TenantTrialUpdateResult {
  id: string;
  tenantId: string;
  trialStartAt: string | null;
  trialEndAt: string | null;
  status: string;
}

export interface IntegrationMonitorItem {
  id: string;
  name: 'WhatsApp' | 'Email Provider' | 'Payment Gateway' | 'Webhooks';
  connectedTenants: number;
  tokenStatus: 'valid' | 'expiring' | 'expired';
  health: IntegrationHealth;
  lastCheckedAt: string;
  errorCount24h: number;
}

export interface AutomationLog {
  id: string;
  workflowName: string;
  tenantName: string;
  triggerSource: string;
  status: AutomationStatus;
  durationMs: number;
  executedAt: string;
}

export interface AutomationLogParams {
  page?: number;
  pageSize?: number;
  status?: AutomationStatus | 'all';
  search?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  category: 'admin_action' | 'tenant_update' | 'permission_change' | 'settings_update';
  tenantName?: string;
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  category?: AuditLog['category'] | 'all';
  search?: string;
}

export interface HealthMetric {
  key: string;
  label: string;
  value: number;
  threshold: number;
  unit: '%' | 'ms' | 'jobs' | 'count' | 'uptime';
  health: IntegrationHealth;
}

export interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  createdAt: string;
}

export interface SystemHealthResponse {
  metrics: HealthMetric[];
  alerts: SystemAlert[];
}

export interface PlanLimits {
  users: number;
  messagesPerMonth: number;
  storageGb: number;
}

export interface PlanFeatureConfig {
  planId: string;
  planName: Tenant['plan'];
  features: Record<string, boolean>;
  limits: PlanLimits;
}

export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export interface FeatureManagementResponse {
  planConfigs: PlanFeatureConfig[];
  featureFlags: FeatureFlag[];
}

export interface PlatformSettings {
  supportEmail: string;
  allowedDomains: string[];
  maintenanceMode: boolean;
  sessionTimeoutMinutes: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  read: boolean;
}

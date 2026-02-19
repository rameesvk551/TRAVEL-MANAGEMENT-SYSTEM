import dayjs from 'dayjs';
import type {
  AdminOverviewResponse,
  BillingUsageConfig,
  BillingCoupon,
  BillingPlanType,
  BillingReconciliationResult,
  AuditLog,
  AuditLogParams,
  AutomationLog,
  AutomationLogParams,
  BillingResponse,
  CouponDeleteResult,
  CouponListParams,
  CouponPatchPayload,
  CouponUpsertPayload,
  FeatureManagementResponse,
  Invoice,
  IntegrationMonitorItem,
  NotificationItem,
  PaginatedResponse,
  Payment,
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

const networkDelayMs = 420;

const withLatency = async <T>(payload: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(payload)), networkDelayMs);
  });

const paginate = <T>(items: T[], page = 1, pageSize = 10): PaginatedResponse<T> => {
  const startIndex = (page - 1) * pageSize;
  return {
    items: items.slice(startIndex, startIndex + pageSize),
    total: items.length,
    page,
    pageSize,
  };
};

const tenants: Tenant[] = [
  {
    id: 'tenant_001',
    companyName: 'Northwind Labs',
    plan: 'Enterprise',
    usersCount: 164,
    status: 'active',
    createdAt: dayjs().subtract(460, 'day').toISOString(),
    lastActivity: dayjs().subtract(5, 'minute').toISOString(),
    ownerEmail: 'ops@northwindlabs.com',
    region: 'US-East',
    monthlySpend: 12490,
    featureFlags: ['ai-insights', 'custom-domain', 'audit-export'],
  },
  {
    id: 'tenant_002',
    companyName: 'Velora Mobility',
    plan: 'Scale',
    usersCount: 91,
    status: 'active',
    createdAt: dayjs().subtract(340, 'day').toISOString(),
    lastActivity: dayjs().subtract(24, 'minute').toISOString(),
    ownerEmail: 'admin@velora.io',
    region: 'US-West',
    monthlySpend: 8180,
    featureFlags: ['ai-insights', 'sandbox-api'],
  },
  {
    id: 'tenant_003',
    companyName: 'Cedar Financial',
    plan: 'Growth',
    usersCount: 38,
    status: 'trial',
    createdAt: dayjs().subtract(21, 'day').toISOString(),
    lastActivity: dayjs().subtract(1, 'hour').toISOString(),
    ownerEmail: 'team@cedarfi.com',
    region: 'US-Central',
    monthlySpend: 1290,
    featureFlags: ['sandbox-api'],
  },
  {
    id: 'tenant_004',
    companyName: 'Astra Logistics',
    plan: 'Scale',
    usersCount: 73,
    status: 'active',
    createdAt: dayjs().subtract(200, 'day').toISOString(),
    lastActivity: dayjs().subtract(2, 'hour').toISOString(),
    ownerEmail: 'it@astralogistics.com',
    region: 'EU-West',
    monthlySpend: 7630,
    featureFlags: ['custom-domain', 'audit-export'],
  },
  {
    id: 'tenant_005',
    companyName: 'Pioneer Retail',
    plan: 'Growth',
    usersCount: 44,
    status: 'suspended',
    createdAt: dayjs().subtract(410, 'day').toISOString(),
    lastActivity: dayjs().subtract(12, 'day').toISOString(),
    ownerEmail: 'owner@pioneerretail.co',
    region: 'US-East',
    monthlySpend: 0,
    featureFlags: [],
  },
  {
    id: 'tenant_006',
    companyName: 'Bluegrid Energy',
    plan: 'Enterprise',
    usersCount: 209,
    status: 'active',
    createdAt: dayjs().subtract(520, 'day').toISOString(),
    lastActivity: dayjs().subtract(16, 'minute').toISOString(),
    ownerEmail: 'platform@bluegrid.energy',
    region: 'US-West',
    monthlySpend: 15990,
    featureFlags: ['ai-insights', 'custom-domain', 'priority-support'],
  },
  {
    id: 'tenant_007',
    companyName: 'Harbor Health',
    plan: 'Starter',
    usersCount: 12,
    status: 'inactive',
    createdAt: dayjs().subtract(88, 'day').toISOString(),
    lastActivity: dayjs().subtract(27, 'day').toISOString(),
    ownerEmail: 'hello@harborhealth.app',
    region: 'US-East',
    monthlySpend: 0,
    featureFlags: [],
  },
  {
    id: 'tenant_008',
    companyName: 'Nexa Travel Group',
    plan: 'Scale',
    usersCount: 58,
    status: 'active',
    createdAt: dayjs().subtract(160, 'day').toISOString(),
    lastActivity: dayjs().subtract(34, 'minute').toISOString(),
    ownerEmail: 'admin@nexatravel.com',
    region: 'AP-South',
    monthlySpend: 6840,
    featureFlags: ['webhook-retries', 'ai-insights'],
  },
  {
    id: 'tenant_009',
    companyName: 'Atlas Bio',
    plan: 'Growth',
    usersCount: 27,
    status: 'active',
    createdAt: dayjs().subtract(112, 'day').toISOString(),
    lastActivity: dayjs().subtract(3, 'hour').toISOString(),
    ownerEmail: 'secops@atlasbio.io',
    region: 'EU-Central',
    monthlySpend: 2110,
    featureFlags: ['sandbox-api'],
  },
  {
    id: 'tenant_010',
    companyName: 'Glider Homes',
    plan: 'Starter',
    usersCount: 10,
    status: 'trial',
    createdAt: dayjs().subtract(12, 'day').toISOString(),
    lastActivity: dayjs().subtract(4, 'hour').toISOString(),
    ownerEmail: 'contact@gliderhomes.com',
    region: 'US-Central',
    monthlySpend: 0,
    featureFlags: [],
  },
  {
    id: 'tenant_011',
    companyName: 'Solstice Media',
    plan: 'Growth',
    usersCount: 49,
    status: 'active',
    createdAt: dayjs().subtract(189, 'day').toISOString(),
    lastActivity: dayjs().subtract(41, 'minute').toISOString(),
    ownerEmail: 'tech@solstice.media',
    region: 'US-East',
    monthlySpend: 3180,
    featureFlags: ['custom-domain'],
  },
  {
    id: 'tenant_012',
    companyName: 'Vertex Learning',
    plan: 'Scale',
    usersCount: 83,
    status: 'active',
    createdAt: dayjs().subtract(295, 'day').toISOString(),
    lastActivity: dayjs().subtract(12, 'minute').toISOString(),
    ownerEmail: 'admin@vertexlearning.org',
    region: 'US-West',
    monthlySpend: 7490,
    featureFlags: ['priority-support', 'audit-export'],
  },
];

const users: User[] = [
  {
    id: 'user_001',
    tenantId: 'tenant_001',
    tenantName: 'Northwind Labs',
    name: 'Avery Chen',
    email: 'avery.chen@northwindlabs.com',
    role: 'tenant_admin',
    status: 'active',
    lastLoginAt: dayjs().subtract(9, 'minute').toISOString(),
    createdAt: dayjs().subtract(420, 'day').toISOString(),
  },
  {
    id: 'user_002',
    tenantId: 'tenant_001',
    tenantName: 'Northwind Labs',
    name: 'Jordan Patel',
    email: 'jordan.patel@northwindlabs.com',
    role: 'manager',
    status: 'active',
    lastLoginAt: dayjs().subtract(43, 'minute').toISOString(),
    createdAt: dayjs().subtract(401, 'day').toISOString(),
  },
  {
    id: 'user_003',
    tenantId: 'tenant_002',
    tenantName: 'Velora Mobility',
    name: 'Mina Diaz',
    email: 'mina.diaz@velora.io',
    role: 'tenant_admin',
    status: 'active',
    lastLoginAt: dayjs().subtract(1, 'hour').toISOString(),
    createdAt: dayjs().subtract(320, 'day').toISOString(),
  },
  {
    id: 'user_004',
    tenantId: 'tenant_003',
    tenantName: 'Cedar Financial',
    name: 'Noah Rivera',
    email: 'noah@cedarfi.com',
    role: 'analyst',
    status: 'invited',
    lastLoginAt: dayjs().subtract(7, 'day').toISOString(),
    createdAt: dayjs().subtract(14, 'day').toISOString(),
  },
  {
    id: 'user_005',
    tenantId: 'tenant_004',
    tenantName: 'Astra Logistics',
    name: 'Sofia Brooks',
    email: 'sofia@astralogistics.com',
    role: 'manager',
    status: 'active',
    lastLoginAt: dayjs().subtract(3, 'hour').toISOString(),
    createdAt: dayjs().subtract(180, 'day').toISOString(),
  },
  {
    id: 'user_006',
    tenantId: 'tenant_005',
    tenantName: 'Pioneer Retail',
    name: 'Liam Walker',
    email: 'liam@pioneerretail.co',
    role: 'tenant_admin',
    status: 'disabled',
    lastLoginAt: dayjs().subtract(18, 'day').toISOString(),
    createdAt: dayjs().subtract(360, 'day').toISOString(),
  },
  {
    id: 'user_007',
    tenantId: 'tenant_006',
    tenantName: 'Bluegrid Energy',
    name: 'Charlotte Kim',
    email: 'charlotte@bluegrid.energy',
    role: 'tenant_admin',
    status: 'active',
    lastLoginAt: dayjs().subtract(4, 'minute').toISOString(),
    createdAt: dayjs().subtract(492, 'day').toISOString(),
  },
  {
    id: 'user_008',
    tenantId: 'tenant_008',
    tenantName: 'Nexa Travel Group',
    name: 'Ethan Gray',
    email: 'ethan@nexatravel.com',
    role: 'manager',
    status: 'active',
    lastLoginAt: dayjs().subtract(5, 'hour').toISOString(),
    createdAt: dayjs().subtract(147, 'day').toISOString(),
  },
  {
    id: 'user_009',
    tenantId: 'tenant_009',
    tenantName: 'Atlas Bio',
    name: 'Grace Bell',
    email: 'grace@atlasbio.io',
    role: 'analyst',
    status: 'active',
    lastLoginAt: dayjs().subtract(2, 'day').toISOString(),
    createdAt: dayjs().subtract(97, 'day').toISOString(),
  },
  {
    id: 'user_010',
    tenantId: 'tenant_010',
    tenantName: 'Glider Homes',
    name: 'Leo Park',
    email: 'leo@gliderhomes.com',
    role: 'member',
    status: 'invited',
    lastLoginAt: dayjs().subtract(6, 'day').toISOString(),
    createdAt: dayjs().subtract(8, 'day').toISOString(),
  },
  {
    id: 'user_011',
    tenantId: 'tenant_011',
    tenantName: 'Solstice Media',
    name: 'Maya Foster',
    email: 'maya@solstice.media',
    role: 'manager',
    status: 'active',
    lastLoginAt: dayjs().subtract(8, 'hour').toISOString(),
    createdAt: dayjs().subtract(163, 'day').toISOString(),
  },
  {
    id: 'user_012',
    tenantId: 'tenant_012',
    tenantName: 'Vertex Learning',
    name: 'Arjun Singh',
    email: 'arjun@vertexlearning.org',
    role: 'tenant_admin',
    status: 'active',
    lastLoginAt: dayjs().subtract(22, 'minute').toISOString(),
    createdAt: dayjs().subtract(260, 'day').toISOString(),
  },
  {
    id: 'user_013',
    tenantId: 'tenant_012',
    tenantName: 'Vertex Learning',
    name: 'Ivy Ortega',
    email: 'ivy@vertexlearning.org',
    role: 'analyst',
    status: 'active',
    lastLoginAt: dayjs().subtract(2, 'hour').toISOString(),
    createdAt: dayjs().subtract(224, 'day').toISOString(),
  },
  {
    id: 'user_014',
    tenantId: 'tenant_002',
    tenantName: 'Velora Mobility',
    name: 'Owen Lewis',
    email: 'owen@velora.io',
    role: 'member',
    status: 'active',
    lastLoginAt: dayjs().subtract(6, 'hour').toISOString(),
    createdAt: dayjs().subtract(280, 'day').toISOString(),
  },
  {
    id: 'user_015',
    tenantId: 'tenant_004',
    tenantName: 'Astra Logistics',
    name: 'Amelia Cole',
    email: 'amelia@astralogistics.com',
    role: 'member',
    status: 'active',
    lastLoginAt: dayjs().subtract(29, 'minute').toISOString(),
    createdAt: dayjs().subtract(150, 'day').toISOString(),
  },
  {
    id: 'user_016',
    tenantId: 'tenant_003',
    tenantName: 'Cedar Financial',
    name: 'Henry Scott',
    email: 'henry@cedarfi.com',
    role: 'manager',
    status: 'active',
    lastLoginAt: dayjs().subtract(36, 'hour').toISOString(),
    createdAt: dayjs().subtract(19, 'day').toISOString(),
  },
  {
    id: 'user_017',
    tenantId: 'tenant_006',
    tenantName: 'Bluegrid Energy',
    name: 'Ella Price',
    email: 'ella@bluegrid.energy',
    role: 'analyst',
    status: 'active',
    lastLoginAt: dayjs().subtract(17, 'minute').toISOString(),
    createdAt: dayjs().subtract(470, 'day').toISOString(),
  },
  {
    id: 'user_018',
    tenantId: 'tenant_008',
    tenantName: 'Nexa Travel Group',
    name: 'Caleb Reed',
    email: 'caleb@nexatravel.com',
    role: 'member',
    status: 'disabled',
    lastLoginAt: dayjs().subtract(52, 'day').toISOString(),
    createdAt: dayjs().subtract(120, 'day').toISOString(),
  },
  {
    id: 'user_019',
    tenantId: 'tenant_009',
    tenantName: 'Atlas Bio',
    name: 'Harper Evans',
    email: 'harper@atlasbio.io',
    role: 'tenant_admin',
    status: 'active',
    lastLoginAt: dayjs().subtract(9, 'hour').toISOString(),
    createdAt: dayjs().subtract(100, 'day').toISOString(),
  },
  {
    id: 'user_020',
    tenantId: 'tenant_011',
    tenantName: 'Solstice Media',
    name: 'Benjamin Hughes',
    email: 'benjamin@solstice.media',
    role: 'member',
    status: 'active',
    lastLoginAt: dayjs().subtract(1, 'day').toISOString(),
    createdAt: dayjs().subtract(135, 'day').toISOString(),
  },
];

const userActivitiesByUser: Record<string, UserActivityItem[]> = users.reduce<Record<string, UserActivityItem[]>>(
  (acc, user, index) => {
    acc[user.id] = [
      {
        id: `activity_${index}_1`,
        userId: user.id,
        action: 'Signed in',
        resource: 'Auth Session',
        timestamp: dayjs(user.lastLoginAt).toISOString(),
        ipAddress: `192.168.1.${(index % 80) + 11}`,
      },
      {
        id: `activity_${index}_2`,
        userId: user.id,
        action: 'Updated profile',
        resource: 'User Preferences',
        timestamp: dayjs(user.lastLoginAt).subtract(2, 'hour').toISOString(),
        ipAddress: `192.168.1.${(index % 80) + 11}`,
      },
      {
        id: `activity_${index}_3`,
        userId: user.id,
        action: 'Viewed dashboard',
        resource: 'Analytics Overview',
        timestamp: dayjs(user.lastLoginAt).subtract(4, 'hour').toISOString(),
        ipAddress: `192.168.1.${(index % 80) + 11}`,
      },
    ];
    return acc;
  },
  {},
);

const integrations: IntegrationMonitorItem[] = [
  {
    id: 'integration_1',
    name: 'WhatsApp',
    connectedTenants: 8,
    tokenStatus: 'valid',
    health: 'healthy',
    lastCheckedAt: dayjs().subtract(2, 'minute').toISOString(),
    errorCount24h: 1,
  },
  {
    id: 'integration_2',
    name: 'Email Provider',
    connectedTenants: 11,
    tokenStatus: 'expiring',
    health: 'degraded',
    lastCheckedAt: dayjs().subtract(4, 'minute').toISOString(),
    errorCount24h: 9,
  },
  {
    id: 'integration_3',
    name: 'Payment Gateway',
    connectedTenants: 10,
    tokenStatus: 'valid',
    health: 'healthy',
    lastCheckedAt: dayjs().subtract(1, 'minute').toISOString(),
    errorCount24h: 0,
  },
  {
    id: 'integration_4',
    name: 'Webhooks',
    connectedTenants: 12,
    tokenStatus: 'expired',
    health: 'down',
    lastCheckedAt: dayjs().subtract(7, 'minute').toISOString(),
    errorCount24h: 27,
  },
];

const automationLogs: AutomationLog[] = Array.from({ length: 32 }, (_, index) => {
  const tenant = tenants[index % tenants.length];
  const status: AutomationLog['status'] =
    index % 7 === 0 ? 'failed' : index % 5 === 0 ? 'running' : 'success';

  return {
    id: `auto_${index + 1}`,
    workflowName: ['Lead Nurture', 'Payment Reminder', 'Data Sync', 'Compliance Check'][index % 4],
    tenantName: tenant.companyName,
    triggerSource: ['Cron', 'Webhook', 'Manual', 'Queue'][index % 4],
    status,
    durationMs: 260 + index * 35,
    executedAt: dayjs().subtract(index * 19, 'minute').toISOString(),
  };
});

const auditLogs: AuditLog[] = Array.from({ length: 48 }, (_, index) => {
  const category: AuditLog['category'] =
    index % 4 === 0
      ? 'admin_action'
      : index % 4 === 1
        ? 'tenant_update'
        : index % 4 === 2
          ? 'permission_change'
          : 'settings_update';
  const actor = ['System Bot', 'Ava Thomson', 'Kai Morgan', 'Platform Admin'][index % 4];
  const tenant = tenants[index % tenants.length];

  return {
    id: `audit_${index + 1}`,
    actor,
    action: ['Updated policy', 'Changed plan', 'Revoked access', 'Enabled feature'][index % 4],
    target: ['Platform Settings', 'Tenant Plan', 'User Permissions', 'Feature Flags'][index % 4],
    category,
    tenantName: category === 'admin_action' ? undefined : tenant.companyName,
    createdAt: dayjs().subtract(index * 23, 'minute').toISOString(),
  };
});

const buildSeries = (days: number, min: number, max: number): { date: string; value: number }[] => {
  const spread = max - min;
  return Array.from({ length: days }, (_, index) => ({
    date: dayjs().subtract(days - index - 1, 'day').format('YYYY-MM-DD'),
    value: min + Math.round(Math.sin(index / 4) * (spread / 4) + spread * 0.6 + (index % 3) * 12),
  }));
};

let featureManagement: FeatureManagementResponse = {
  planConfigs: [
    {
      planId: 'plan_starter',
      planName: 'Starter',
      features: {
        auditExport: false,
        apiAccess: true,
        advancedAutomation: false,
        sso: false,
        customDomain: false,
      },
      limits: {
        users: 15,
        messagesPerMonth: 25000,
        storageGb: 25,
      },
    },
    {
      planId: 'plan_growth',
      planName: 'Growth',
      features: {
        auditExport: true,
        apiAccess: true,
        advancedAutomation: true,
        sso: false,
        customDomain: true,
      },
      limits: {
        users: 80,
        messagesPerMonth: 160000,
        storageGb: 200,
      },
    },
    {
      planId: 'plan_scale',
      planName: 'Scale',
      features: {
        auditExport: true,
        apiAccess: true,
        advancedAutomation: true,
        sso: true,
        customDomain: true,
      },
      limits: {
        users: 220,
        messagesPerMonth: 450000,
        storageGb: 600,
      },
    },
    {
      planId: 'plan_enterprise',
      planName: 'Enterprise',
      features: {
        auditExport: true,
        apiAccess: true,
        advancedAutomation: true,
        sso: true,
        customDomain: true,
      },
      limits: {
        users: 1200,
        messagesPerMonth: 2000000,
        storageGb: 3000,
      },
    },
  ],
  featureFlags: [
    {
      id: 'ff_1',
      key: 'new-automation-engine',
      description: 'Routes workflows through v2 orchestration runtime.',
      enabled: true,
      rolloutPercentage: 65,
    },
    {
      id: 'ff_2',
      key: 'predictive-health',
      description: 'Enables anomaly alerts for queue and API behavior.',
      enabled: false,
      rolloutPercentage: 0,
    },
    {
      id: 'ff_3',
      key: 'granular-rbac',
      description: 'Adds module-level permissions and scoped tokens.',
      enabled: true,
      rolloutPercentage: 30,
    },
  ],
};

let platformSettings: PlatformSettings = {
  supportEmail: 'support@platform.example',
  allowedDomains: ['northwindlabs.com', 'velora.io', 'atlasbio.io'],
  maintenanceMode: false,
  sessionTimeoutMinutes: 45,
};

let notifications: NotificationItem[] = [
  {
    id: 'notice_1',
    title: 'Webhook retries exceeded threshold in US-East.',
    timestamp: dayjs().subtract(6, 'minute').toISOString(),
    read: false,
  },
  {
    id: 'notice_2',
    title: 'Payment gateway maintenance window starts in 2 hours.',
    timestamp: dayjs().subtract(19, 'minute').toISOString(),
    read: false,
  },
  {
    id: 'notice_3',
    title: 'New enterprise tenant onboarded: Harbor Clinical.',
    timestamp: dayjs().subtract(2, 'hour').toISOString(),
    read: true,
  },
];

const allBillingPlans: BillingPlanType[] = ['trial', 'monthly', 'yearly', 'lifetime'];

let billingCoupons: BillingCoupon[] = [
  {
    id: 'coupon_001',
    code: 'WELCOME10',
    scope: 'all',
    discountType: 'percent',
    discountValue: 10,
    maxDiscountAmountPaise: 30000,
    active: true,
    validFrom: dayjs().subtract(10, 'day').toISOString(),
    validUntil: dayjs().add(60, 'day').toISOString(),
    usageLimit: 500,
    usedCount: 84,
    applicablePlanTypes: ['monthly', 'yearly'],
    razorpayOfferId: 'offer_welcome10',
    createdAt: dayjs().subtract(25, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: 'coupon_002',
    code: 'LIFETIME500',
    scope: 'subscription',
    discountType: 'fixed',
    discountValue: 50000,
    maxDiscountAmountPaise: null,
    active: true,
    validFrom: dayjs().subtract(5, 'day').toISOString(),
    validUntil: dayjs().add(20, 'day').toISOString(),
    usageLimit: 100,
    usedCount: 12,
    applicablePlanTypes: ['lifetime'],
    razorpayOfferId: 'offer_lifetime500',
    createdAt: dayjs().subtract(7, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'coupon_003',
    code: 'USAGE5',
    scope: 'usage',
    discountType: 'percent',
    discountValue: 5,
    maxDiscountAmountPaise: 15000,
    active: false,
    validFrom: dayjs().subtract(45, 'day').toISOString(),
    validUntil: dayjs().subtract(1, 'day').toISOString(),
    usageLimit: 1000,
    usedCount: 1000,
    applicablePlanTypes: ['trial', 'monthly', 'yearly', 'lifetime'],
    razorpayOfferId: null,
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: dayjs().subtract(3, 'day').toISOString(),
  },
];

let billingUsageConfigs: BillingUsageConfig[] = [
  {
    id: 'usage_cfg_trial',
    planType: 'trial',
    featureConfigs: [
      { featureKey: 'messages', freeLimit: 1000, overageUnitPricePaise: 15 },
      { featureKey: 'contacts', freeLimit: 2000, overageUnitPricePaise: 5 },
      { featureKey: 'campaigns', freeLimit: 50, overageUnitPricePaise: 2500 },
    ],
    updatedByUserId: 'user_super_admin',
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: dayjs().subtract(25, 'day').toISOString(),
  },
  {
    id: 'usage_cfg_monthly',
    planType: 'monthly',
    featureConfigs: [
      { featureKey: 'messages', freeLimit: 1000, overageUnitPricePaise: 15 },
      { featureKey: 'contacts', freeLimit: 2000, overageUnitPricePaise: 5 },
      { featureKey: 'campaigns', freeLimit: 50, overageUnitPricePaise: 2500 },
    ],
    updatedByUserId: 'user_super_admin',
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: dayjs().subtract(15, 'day').toISOString(),
  },
  {
    id: 'usage_cfg_yearly',
    planType: 'yearly',
    featureConfigs: [
      { featureKey: 'messages', freeLimit: 3000, overageUnitPricePaise: 12 },
      { featureKey: 'contacts', freeLimit: 4000, overageUnitPricePaise: 4 },
      { featureKey: 'campaigns', freeLimit: 120, overageUnitPricePaise: 2000 },
    ],
    updatedByUserId: 'user_super_admin',
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: dayjs().subtract(10, 'day').toISOString(),
  },
  {
    id: 'usage_cfg_lifetime',
    planType: 'lifetime',
    featureConfigs: [
      { featureKey: 'messages', freeLimit: 6000, overageUnitPricePaise: 8 },
      { featureKey: 'contacts', freeLimit: 8000, overageUnitPricePaise: 3 },
      { featureKey: 'campaigns', freeLimit: 240, overageUnitPricePaise: 1600 },
    ],
    updatedByUserId: 'user_super_admin',
    createdAt: dayjs().subtract(60, 'day').toISOString(),
    updatedAt: dayjs().subtract(5, 'day').toISOString(),
  },
];

const tenantTrialWindows: Record<string, { trialStartAt: string | null; trialEndAt: string | null }> = tenants.reduce(
  (acc, tenant) => {
    const defaultStart = dayjs(tenant.createdAt);
    acc[tenant.id] = {
      trialStartAt: defaultStart.toISOString(),
      trialEndAt: defaultStart.add(30, 'day').toISOString(),
    };
    return acc;
  },
  {} as Record<string, { trialStartAt: string | null; trialEndAt: string | null }>,
);

const appendAuditLog = (params: {
  actor: string;
  action: string;
  target: string;
  category: AuditLog['category'];
  tenantName?: string;
}) => {
  auditLogs.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actor: params.actor,
    action: params.action,
    target: params.target,
    category: params.category,
    tenantName: params.tenantName,
    createdAt: dayjs().toISOString(),
  });
};

const filterBySearch = (value: string, search: string) =>
  value.toLowerCase().includes(search.toLowerCase());

const getOverview = async (): Promise<AdminOverviewResponse> => {
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
  const totalUsers = tenants.reduce((sum, tenant) => sum + tenant.usersCount, 0);

  return withLatency({
    summary: {
      totalTenants: tenants.length,
      activeTenants,
      totalUsers,
      newSignups30d: tenants.filter((tenant) => dayjs(tenant.createdAt).isAfter(dayjs().subtract(30, 'day'))).length,
      activeSessions: 481,
      apiRequestsToday: 184902,
      monthlyRevenue: tenants.reduce((sum, tenant) => sum + tenant.monthlySpend, 0),
      systemHealthPercent: 98.7,
    },
    tenantGrowth: buildSeries(30, 6, 40),
    userActivityTrend: buildSeries(30, 130, 640),
    revenueGrowth: buildSeries(30, 4200, 22000),
  });
};

const getTenants = async (params: TenantListParams = {}): Promise<PaginatedResponse<Tenant>> => {
  const {
    page = 1,
    pageSize = 10,
    plan = 'all',
    search = '',
    status = 'all',
  } = params;

  const filtered = tenants
    .filter((tenant) => (plan === 'all' ? true : tenant.plan === plan))
    .filter((tenant) => (status === 'all' ? true : tenant.status === status))
    .filter((tenant) => {
      if (!search.trim()) {
        return true;
      }
      return filterBySearch(tenant.companyName, search) || filterBySearch(tenant.ownerEmail, search);
    })
    .sort((first, second) => dayjs(second.createdAt).valueOf() - dayjs(first.createdAt).valueOf());

  return withLatency(paginate(filtered, page, pageSize));
};

const getTenantById = async (tenantId: string): Promise<Tenant | null> => {
  const tenant = tenants.find((item) => item.id === tenantId) ?? null;
  return withLatency(tenant);
};

const updateTenantStatus = async (tenantId: string, status: TenantStatus): Promise<Tenant | null> => {
  const tenantIndex = tenants.findIndex((item) => item.id === tenantId);
  if (tenantIndex === -1) {
    return withLatency(null);
  }

  tenants[tenantIndex] = {
    ...tenants[tenantIndex],
    status,
    lastActivity: dayjs().toISOString(),
  };

  return withLatency(tenants[tenantIndex]);
};

const changeTenantPlan = async (tenantId: string, plan: Tenant['plan']): Promise<Tenant | null> => {
  const tenantIndex = tenants.findIndex((item) => item.id === tenantId);
  if (tenantIndex === -1) {
    return withLatency(null);
  }

  tenants[tenantIndex] = {
    ...tenants[tenantIndex],
    plan,
  };

  return withLatency(tenants[tenantIndex]);
};

const impersonateTenant = async (
  tenantId: string,
  actorName = 'Platform Admin',
): Promise<TenantImpersonationSession | null> => {
  const tenant = tenants.find((item) => item.id === tenantId);

  if (!tenant) {
    return withLatency(null);
  }

  const randomToken = `${tenantId}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

  return withLatency({
    tenantId: tenant.id,
    tenantName: tenant.companyName,
    actorName,
    sessionToken: randomToken,
    expiresAt: dayjs().add(15, 'minute').toISOString(),
    launchUrl: `/impersonate/${tenant.id}?token=${randomToken}`,
  });
};

const getUsers = async (params: UserListParams = {}): Promise<PaginatedResponse<User>> => {
  const {
    page = 1,
    pageSize = 10,
    role = 'all',
    search = '',
    status = 'all',
    tenantId = 'all',
  } = params;

  const filtered = users
    .filter((user) => (tenantId === 'all' ? true : user.tenantId === tenantId))
    .filter((user) => (status === 'all' ? true : user.status === status))
    .filter((user) => (role === 'all' ? true : user.role === role))
    .filter((user) => {
      if (!search.trim()) {
        return true;
      }
      return (
        filterBySearch(user.name, search) ||
        filterBySearch(user.email, search) ||
        filterBySearch(user.tenantName, search)
      );
    })
    .sort((first, second) => dayjs(second.lastLoginAt).valueOf() - dayjs(first.lastLoginAt).valueOf());

  return withLatency(paginate(filtered, page, pageSize));
};

const getUserActivity = async (userId: string): Promise<UserActivityItem[]> => {
  return withLatency(userActivitiesByUser[userId] ?? []);
};

const getBilling = async (): Promise<BillingResponse> => {
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
  const plans: BillingResponse['plans'] = [
    {
      id: 'subscription_plan_monthly',
      name: 'Monthly',
      billingCycle: 'monthly',
      price: 299,
      activeTenants: Math.max(1, Math.floor(activeTenants * 0.52)),
      includedUsers: 25,
      includedStorageGb: 50,
    },
    {
      id: 'subscription_plan_yearly',
      name: 'Yearly',
      billingCycle: 'yearly',
      price: 3000,
      activeTenants: Math.max(1, Math.floor(activeTenants * 0.35)),
      includedUsers: 40,
      includedStorageGb: 100,
    },
    {
      id: 'subscription_plan_lifetime',
      name: 'Lifetime',
      billingCycle: 'one_time',
      price: 9999,
      activeTenants: Math.max(0, Math.floor(activeTenants * 0.13)),
      includedUsers: 80,
      includedStorageGb: 250,
    },
  ];

  const invoices: Invoice[] = tenants.slice(0, 10).map((tenant, index) => {
    const status: Invoice['status'] = index % 6 === 0 ? 'pending' : index % 5 === 0 ? 'failed' : 'paid';
    return {
      id: `invoice_${index + 1}`,
      tenantName: tenant.companyName,
      amount: tenant.monthlySpend || 299,
      status,
      issuedAt: dayjs().subtract(index + 2, 'day').toISOString(),
      dueAt: dayjs().subtract(index - 2, 'day').toISOString(),
    };
  });

  const payments: Payment[] = tenants.slice(0, 10).map((tenant, index) => {
    const status: Payment['status'] = index % 9 === 0 ? 'refunded' : 'paid';
    return {
      id: `payment_${index + 1}`,
      tenantName: tenant.companyName,
      amount: tenant.monthlySpend || 299,
      status,
      method: ['card', 'ach', 'wire'][index % 3],
      paidAt: dayjs().subtract(index * 4, 'hour').toISOString(),
    };
  });

  return withLatency({
    metrics: {
      mrr: tenants.reduce((sum, tenant) => sum + tenant.monthlySpend, 0),
      activeSubscriptions: tenants.filter((tenant) => tenant.status === 'active').length,
      trialUsers: users.filter((user) => {
        const tenant = tenants.find((item) => item.id === user.tenantId);
        return tenant?.status === 'trial';
      }).length,
      churnRate: 2.8,
    },
    invoices,
    payments,
    plans,
  });
};

const runMonthlyUsageBilling = async (
  referenceDate?: string,
): Promise<MonthlyUsageBillingResult> => {
  const refDate = referenceDate ? dayjs(referenceDate) : dayjs();
  const previousMonth = refDate.subtract(1, 'month');
  const cycleStart = previousMonth.startOf('month').toISOString();
  const cycleEnd = previousMonth.endOf('month').toISOString();

  const scanned = 9;
  const generated = 7;
  const failedTenants =
    Math.random() > 0.6
      ? [{ tenantId: 'tenant_005', error: 'Gateway order creation timeout' }]
      : [];

  appendAuditLog({
    actor: 'Platform Admin',
    action: 'Ran monthly usage billing job (mock)',
    target: 'Billing Job',
    category: 'admin_action',
  });

  return withLatency({
    cycleStart,
    cycleEnd,
    scanned,
    generated,
    failedTenants,
  });
};

const runBillingReconciliation = async (
  lookbackHours?: number,
): Promise<BillingReconciliationResult> => {
  const lookback = lookbackHours && lookbackHours > 0 ? Math.floor(lookbackHours) : 72;
  const since = dayjs().subtract(lookback, 'hour').toISOString();

  const scannedSubscriptions = 14;
  const updatedSubscriptions = 5;
  const scannedInvoices = 21;
  const paidInvoices = 4;
  const failures =
    Math.random() > 0.65
      ? [{ entity: 'invoice', id: 'invoice_4', error: 'Remote payment fetch temporarily unavailable' }]
      : [];

  appendAuditLog({
    actor: 'Platform Admin',
    action: 'Ran Razorpay reconciliation (mock)',
    target: 'Billing Job',
    category: 'admin_action',
  });

  return withLatency({
    lookbackHours: lookback,
    since,
    scannedSubscriptions,
    updatedSubscriptions,
    scannedInvoices,
    paidInvoices,
    failures,
  });
};

const getBillingUsageConfigs = async (planType?: string): Promise<BillingUsageConfig[]> => {
  const filtered = planType
    ? billingUsageConfigs.filter((config) => config.planType === planType)
    : billingUsageConfigs;

  const planOrder: BillingPlanType[] = ['trial', 'monthly', 'yearly', 'lifetime'];
  const sorted = [...filtered].sort(
    (first, second) => planOrder.indexOf(first.planType) - planOrder.indexOf(second.planType),
  );

  return withLatency(sorted);
};

const upsertBillingUsageConfig = async (
  planType: string,
  features: UsageFeatureConfig[],
): Promise<BillingUsageConfig> => {
  const normalizedPlanType = planType as BillingPlanType;
  const normalizedFeatures = features.map((feature) => ({
    featureKey: feature.featureKey.trim(),
    freeLimit: Number(feature.freeLimit),
    overageUnitPricePaise: Number(feature.overageUnitPricePaise),
  }));

  const index = billingUsageConfigs.findIndex((item) => item.planType === normalizedPlanType);
  const timestamp = dayjs().toISOString();

  if (index >= 0) {
    billingUsageConfigs[index] = {
      ...billingUsageConfigs[index],
      featureConfigs: normalizedFeatures,
      updatedByUserId: 'user_super_admin',
      updatedAt: timestamp,
    };

    appendAuditLog({
      actor: 'Platform Admin',
      action: `Updated usage config for ${normalizedPlanType}`,
      target: 'Usage Configuration',
      category: 'settings_update',
    });

    return withLatency(billingUsageConfigs[index]);
  }

  const created: BillingUsageConfig = {
    id: `usage_cfg_${normalizedPlanType}_${Date.now().toString(36)}`,
    planType: normalizedPlanType,
    featureConfigs: normalizedFeatures,
    updatedByUserId: 'user_super_admin',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  billingUsageConfigs.push(created);

  appendAuditLog({
    actor: 'Platform Admin',
    action: `Created usage config for ${normalizedPlanType}`,
    target: 'Usage Configuration',
    category: 'settings_update',
  });

  return withLatency(created);
};

const getBillingCoupons = async (
  params: CouponListParams = {},
): Promise<PaginatedResponse<BillingCoupon>> => {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    scope,
    active,
  } = params;

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = billingCoupons
    .filter((coupon) => (scope ? coupon.scope === scope : true))
    .filter((coupon) => (typeof active === 'boolean' ? coupon.active === active : true))
    .filter((coupon) => {
      if (!normalizedSearch) {
        return true;
      }
      return filterBySearch(coupon.code, normalizedSearch);
    })
    .sort((first, second) => dayjs(second.createdAt).valueOf() - dayjs(first.createdAt).valueOf());

  return withLatency(paginate(filtered, page, pageSize));
};

const createBillingCoupon = async (payload: CouponUpsertPayload): Promise<BillingCoupon> => {
  const now = dayjs().toISOString();
  const coupon: BillingCoupon = {
    id: `coupon_${Date.now().toString(36)}`,
    code: payload.code.trim().toUpperCase(),
    scope: payload.scope,
    discountType: payload.discountType,
    discountValue: payload.discountValue,
    maxDiscountAmountPaise: payload.maxDiscountAmountPaise ?? null,
    active: payload.active ?? true,
    validFrom: payload.validFrom ?? null,
    validUntil: payload.validUntil ?? null,
    usageLimit: payload.usageLimit ?? null,
    usedCount: 0,
    applicablePlanTypes: payload.applicablePlanTypes ?? allBillingPlans,
    razorpayOfferId: payload.razorpayOfferId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  billingCoupons.unshift(coupon);
  appendAuditLog({
    actor: 'Platform Admin',
    action: `Created coupon ${coupon.code}`,
    target: 'Billing Coupon',
    category: 'admin_action',
  });

  return withLatency(coupon);
};

const updateBillingCoupon = async (
  couponId: string,
  payload: CouponPatchPayload,
): Promise<BillingCoupon | null> => {
  const index = billingCoupons.findIndex((item) => item.id === couponId);
  if (index === -1) {
    return withLatency(null);
  }

  const existing = billingCoupons[index];
  const updated: BillingCoupon = {
    ...existing,
    code: payload.code ? payload.code.trim().toUpperCase() : existing.code,
    scope: payload.scope ?? existing.scope,
    discountType: payload.discountType ?? existing.discountType,
    discountValue: payload.discountValue ?? existing.discountValue,
    maxDiscountAmountPaise:
      payload.maxDiscountAmountPaise === undefined
        ? existing.maxDiscountAmountPaise
        : payload.maxDiscountAmountPaise,
    active: payload.active ?? existing.active,
    validFrom:
      payload.validFrom === undefined
        ? existing.validFrom
        : payload.validFrom,
    validUntil:
      payload.validUntil === undefined
        ? existing.validUntil
        : payload.validUntil,
    usageLimit:
      payload.usageLimit === undefined
        ? existing.usageLimit
        : payload.usageLimit,
    applicablePlanTypes: payload.applicablePlanTypes ?? existing.applicablePlanTypes,
    razorpayOfferId:
      payload.razorpayOfferId === undefined
        ? existing.razorpayOfferId
        : payload.razorpayOfferId,
    updatedAt: dayjs().toISOString(),
  };

  billingCoupons[index] = updated;
  appendAuditLog({
    actor: 'Platform Admin',
    action: `Updated coupon ${updated.code}`,
    target: 'Billing Coupon',
    category: 'settings_update',
  });

  return withLatency(updated);
};

const deleteBillingCoupon = async (
  couponId: string,
  reason?: string,
): Promise<CouponDeleteResult> => {
  const index = billingCoupons.findIndex((item) => item.id === couponId);
  if (index === -1) {
    return withLatency({ deleted: false, deactivated: false, couponId });
  }

  const coupon = billingCoupons[index];

  if (coupon.usedCount > 0) {
    billingCoupons[index] = {
      ...coupon,
      active: false,
      updatedAt: dayjs().toISOString(),
    };

    appendAuditLog({
      actor: 'Platform Admin',
      action: `Deactivated coupon ${coupon.code}${reason ? ` (${reason})` : ''}`,
      target: 'Billing Coupon',
      category: 'settings_update',
    });

    return withLatency({
      deleted: false,
      deactivated: true,
      couponId: coupon.id,
    });
  }

  billingCoupons = billingCoupons.filter((item) => item.id !== couponId);

  appendAuditLog({
    actor: 'Platform Admin',
    action: `Deleted coupon ${coupon.code}${reason ? ` (${reason})` : ''}`,
    target: 'Billing Coupon',
    category: 'settings_update',
  });

  return withLatency({
    deleted: true,
    deactivated: false,
    couponId,
  });
};

const updateTenantTrial = async (
  tenantId: string,
  payload: TenantTrialUpdatePayload,
): Promise<TenantTrialUpdateResult | null> => {
  const tenant = tenants.find((item) => item.id === tenantId);
  if (!tenant) {
    return withLatency(null);
  }

  const previous = tenantTrialWindows[tenantId] ?? {
    trialStartAt: dayjs(tenant.createdAt).toISOString(),
    trialEndAt: dayjs(tenant.createdAt).add(30, 'day').toISOString(),
  };

  const nextStart = payload.trialStartAt ?? previous.trialStartAt;
  const nextEnd = payload.trialEndAt;

  tenantTrialWindows[tenantId] = {
    trialStartAt: nextStart,
    trialEndAt: nextEnd,
  };

  tenant.status = dayjs(nextEnd).isAfter(dayjs()) ? 'trial' : tenant.status === 'trial' ? 'inactive' : tenant.status;
  tenant.lastActivity = dayjs().toISOString();

  appendAuditLog({
    actor: 'Platform Admin',
    action: `Updated trial for ${tenant.companyName}${payload.reason ? ` (${payload.reason})` : ''}`,
    target: 'Tenant Trial',
    category: 'tenant_update',
    tenantName: tenant.companyName,
  });

  return withLatency({
    id: `trial_${tenantId}`,
    tenantId,
    trialStartAt: nextStart,
    trialEndAt: nextEnd,
    status: tenant.status,
  });
};

const getIntegrations = async (): Promise<IntegrationMonitorItem[]> => withLatency(integrations);

const getAutomationLogs = async (
  params: AutomationLogParams = {},
): Promise<PaginatedResponse<AutomationLog>> => {
  const { page = 1, pageSize = 10, search = '', status = 'all' } = params;

  const filtered = automationLogs
    .filter((item) => (status === 'all' ? true : item.status === status))
    .filter((item) => {
      if (!search.trim()) {
        return true;
      }
      return (
        filterBySearch(item.workflowName, search) ||
        filterBySearch(item.tenantName, search) ||
        filterBySearch(item.triggerSource, search)
      );
    })
    .sort((first, second) => dayjs(second.executedAt).valueOf() - dayjs(first.executedAt).valueOf());

  return withLatency(paginate(filtered, page, pageSize));
};

const getAuditLogs = async (params: AuditLogParams = {}): Promise<PaginatedResponse<AuditLog>> => {
  const { page = 1, pageSize = 12, category = 'all', search = '' } = params;

  const filtered = auditLogs
    .filter((item) => (category === 'all' ? true : item.category === category))
    .filter((item) => {
      if (!search.trim()) {
        return true;
      }

      const byTenant = item.tenantName ? filterBySearch(item.tenantName, search) : false;
      return filterBySearch(item.actor, search) || filterBySearch(item.action, search) || byTenant;
    })
    .sort((first, second) => dayjs(second.createdAt).valueOf() - dayjs(first.createdAt).valueOf());

  return withLatency(paginate(filtered, page, pageSize));
};

const getSystemHealth = async (): Promise<SystemHealthResponse> =>
  withLatency({
    metrics: [
      {
        key: 'api_latency',
        label: 'API Latency',
        value: 124,
        threshold: 200,
        unit: 'ms',
        health: 'healthy',
      },
      {
        key: 'background_jobs',
        label: 'Background Jobs',
        value: 97,
        threshold: 100,
        unit: '%',
        health: 'healthy',
      },
      {
        key: 'queue_depth',
        label: 'Queue Status',
        value: 320,
        threshold: 500,
        unit: 'jobs',
        health: 'healthy',
      },
      {
        key: 'error_rate',
        label: 'Error Rate',
        value: 1.2,
        threshold: 2,
        unit: '%',
        health: 'degraded',
      },
      {
        key: 'uptime',
        label: 'Server Uptime',
        value: 99.982,
        threshold: 99.9,
        unit: 'uptime',
        health: 'healthy',
      },
    ],
    alerts: [
      {
        id: 'alert_1',
        severity: 'warning',
        title: 'Webhook retries increased',
        description: 'Retry queue grew 26% in the last 15 minutes for Webhooks integration.',
        createdAt: dayjs().subtract(18, 'minute').toISOString(),
      },
      {
        id: 'alert_2',
        severity: 'critical',
        title: 'Token expiration detected',
        description: 'Email provider credentials for 3 tenants expire within 24 hours.',
        createdAt: dayjs().subtract(47, 'minute').toISOString(),
      },
      {
        id: 'alert_3',
        severity: 'info',
        title: 'Node group rolled successfully',
        description: 'Production node group update completed with zero failed checks.',
        createdAt: dayjs().subtract(1, 'hour').toISOString(),
      },
    ],
  });

const getFeatureManagement = async (): Promise<FeatureManagementResponse> => withLatency(featureManagement);

const updatePlanFeature = async (
  planId: string,
  featureKey: string,
  enabled: boolean,
): Promise<FeatureManagementResponse> => {
  featureManagement = {
    ...featureManagement,
    planConfigs: featureManagement.planConfigs.map((plan) =>
      plan.planId === planId
        ? {
            ...plan,
            features: {
              ...plan.features,
              [featureKey]: enabled,
            },
          }
        : plan,
    ),
  };

  return withLatency(featureManagement);
};

const updatePlanLimit = async (
  planId: string,
  field: 'users' | 'messagesPerMonth' | 'storageGb',
  value: number,
): Promise<FeatureManagementResponse> => {
  featureManagement = {
    ...featureManagement,
    planConfigs: featureManagement.planConfigs.map((plan) =>
      plan.planId === planId
        ? {
            ...plan,
            limits: {
              ...plan.limits,
              [field]: value,
            },
          }
        : plan,
    ),
  };

  return withLatency(featureManagement);
};

const updateFeatureFlag = async (
  flagId: string,
  enabled: boolean,
  rolloutPercentage: number,
): Promise<FeatureManagementResponse> => {
  featureManagement = {
    ...featureManagement,
    featureFlags: featureManagement.featureFlags.map((flag) =>
      flag.id === flagId
        ? {
            ...flag,
            enabled,
            rolloutPercentage,
          }
        : flag,
    ),
  };

  return withLatency(featureManagement);
};

const getSettings = async (): Promise<PlatformSettings> => withLatency(platformSettings);

const updateSettings = async (payload: PlatformSettings): Promise<PlatformSettings> => {
  platformSettings = {
    ...payload,
  };
  return withLatency(platformSettings);
};

const getNotifications = async (): Promise<NotificationItem[]> => withLatency(notifications);

const markNotificationRead = async (id: string): Promise<NotificationItem[]> => {
  notifications = notifications.map((item) =>
    item.id === id
      ? {
          ...item,
          read: true,
        }
      : item,
  );

  return withLatency(notifications);
};

export const mockAdminApi = {
  getOverview,
  getTenants,
  getTenantById,
  updateTenantStatus,
  changeTenantPlan,
  impersonateTenant,
  getUsers,
  getUserActivity,
  getBilling,
  runMonthlyUsageBilling,
  runBillingReconciliation,
  getBillingUsageConfigs,
  upsertBillingUsageConfig,
  getBillingCoupons,
  createBillingCoupon,
  updateBillingCoupon,
  deleteBillingCoupon,
  updateTenantTrial,
  getIntegrations,
  getAutomationLogs,
  getAuditLogs,
  getSystemHealth,
  getFeatureManagement,
  updatePlanFeature,
  updatePlanLimit,
  updateFeatureFlag,
  getSettings,
  updateSettings,
  getNotifications,
  markNotificationRead,
};

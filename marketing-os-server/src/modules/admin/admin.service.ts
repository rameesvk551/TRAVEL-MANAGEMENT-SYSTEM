export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}

type TenantStatus = 'active' | 'suspended' | 'trial' | 'inactive';
type TenantPlan = 'Starter' | 'Growth' | 'Scale' | 'Enterprise';
type UserStatus = 'active' | 'invited' | 'disabled';
type BillingStatus = 'paid' | 'pending' | 'failed' | 'refunded';

interface TenantRecord {
    id: string;
    companyName: string;
    plan: TenantPlan;
    usersCount: number;
    status: TenantStatus;
    createdAt: string;
    lastActivity: string;
    ownerEmail: string;
    region: string;
    monthlySpend: number;
    featureFlags: string[];
}

interface UserRecord {
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

interface TenantImpersonationSession {
    tenantId: string;
    tenantName: string;
    actorName: string;
    sessionToken: string;
    expiresAt: string;
    launchUrl: string;
}

interface PlatformSettings {
    supportEmail: string;
    allowedDomains: string[];
    maintenanceMode: boolean;
    sessionTimeoutMinutes: number;
}

const nowIso = () => new Date().toISOString();

const daysAgoIso = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const minutesAgoIso = (minutes: number) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() - minutes);
    return date.toISOString();
};

const paginate = <T>(items: T[], page = 1, pageSize = 10): PaginatedResult<T> => {
    const start = (page - 1) * pageSize;
    return {
        items: items.slice(start, start + pageSize),
        total: items.length,
        page,
        pageSize,
    };
};

const buildSeries = (days: number, min: number, max: number) => {
    const spread = max - min;
    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - index - 1));
        return {
            date: date.toISOString().slice(0, 10),
            value: min + Math.round(Math.sin(index / 4) * (spread / 3) + spread * 0.55 + (index % 3) * 8),
        };
    });
};

export class AdminService {
    private tenants: TenantRecord[] = [
        {
            id: 'tenant_001',
            companyName: 'Northwind Labs',
            plan: 'Enterprise',
            usersCount: 164,
            status: 'active',
            createdAt: daysAgoIso(460),
            lastActivity: minutesAgoIso(5),
            ownerEmail: 'ops@northwindlabs.com',
            region: 'US-East',
            monthlySpend: 12490,
            featureFlags: ['ai-insights', 'custom-domain'],
        },
        {
            id: 'tenant_002',
            companyName: 'Velora Mobility',
            plan: 'Scale',
            usersCount: 91,
            status: 'active',
            createdAt: daysAgoIso(340),
            lastActivity: minutesAgoIso(24),
            ownerEmail: 'admin@velora.io',
            region: 'US-West',
            monthlySpend: 8180,
            featureFlags: ['sandbox-api'],
        },
        {
            id: 'tenant_003',
            companyName: 'Cedar Financial',
            plan: 'Growth',
            usersCount: 38,
            status: 'trial',
            createdAt: daysAgoIso(21),
            lastActivity: minutesAgoIso(68),
            ownerEmail: 'team@cedarfi.com',
            region: 'US-Central',
            monthlySpend: 1290,
            featureFlags: ['sandbox-api'],
        },
        {
            id: 'tenant_004',
            companyName: 'Pioneer Retail',
            plan: 'Growth',
            usersCount: 44,
            status: 'suspended',
            createdAt: daysAgoIso(410),
            lastActivity: daysAgoIso(12),
            ownerEmail: 'owner@pioneerretail.co',
            region: 'US-East',
            monthlySpend: 0,
            featureFlags: [],
        },
    ];

    private users: UserRecord[] = [
        {
            id: 'user_001',
            tenantId: 'tenant_001',
            tenantName: 'Northwind Labs',
            name: 'Avery Chen',
            email: 'avery.chen@northwindlabs.com',
            role: 'tenant_admin',
            status: 'active',
            lastLoginAt: minutesAgoIso(9),
            createdAt: daysAgoIso(420),
        },
        {
            id: 'user_002',
            tenantId: 'tenant_002',
            tenantName: 'Velora Mobility',
            name: 'Mina Diaz',
            email: 'mina.diaz@velora.io',
            role: 'tenant_admin',
            status: 'active',
            lastLoginAt: minutesAgoIso(63),
            createdAt: daysAgoIso(320),
        },
        {
            id: 'user_003',
            tenantId: 'tenant_003',
            tenantName: 'Cedar Financial',
            name: 'Noah Rivera',
            email: 'noah@cedarfi.com',
            role: 'analyst',
            status: 'invited',
            lastLoginAt: daysAgoIso(7),
            createdAt: daysAgoIso(14),
        },
        {
            id: 'user_super',
            tenantId: 'platform',
            tenantName: 'Platform',
            name: 'Platform Super Admin',
            email: 'superadmin@platform.local',
            role: 'super_admin',
            status: 'active',
            lastLoginAt: minutesAgoIso(2),
            createdAt: daysAgoIso(700),
        },
    ];

    private featureManagement = {
        planConfigs: [
            {
                planId: 'plan_starter',
                planName: 'Starter' as TenantPlan,
                features: { apiAccess: true, advancedAutomation: false, sso: false, customDomain: false },
                limits: { users: 15, messagesPerMonth: 25000, storageGb: 25 },
            },
            {
                planId: 'plan_growth',
                planName: 'Growth' as TenantPlan,
                features: { apiAccess: true, advancedAutomation: true, sso: false, customDomain: true },
                limits: { users: 80, messagesPerMonth: 160000, storageGb: 200 },
            },
            {
                planId: 'plan_scale',
                planName: 'Scale' as TenantPlan,
                features: { apiAccess: true, advancedAutomation: true, sso: true, customDomain: true },
                limits: { users: 220, messagesPerMonth: 450000, storageGb: 600 },
            },
            {
                planId: 'plan_enterprise',
                planName: 'Enterprise' as TenantPlan,
                features: { apiAccess: true, advancedAutomation: true, sso: true, customDomain: true },
                limits: { users: 1200, messagesPerMonth: 2000000, storageGb: 3000 },
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
        ],
    };

    private settings: PlatformSettings = {
        supportEmail: 'support@platform.example',
        allowedDomains: ['northwindlabs.com', 'velora.io', 'cedarfi.com'],
        maintenanceMode: false,
        sessionTimeoutMinutes: 45,
    };

    private notifications = [
        {
            id: 'notice_1',
            title: 'Webhook retries exceeded threshold in US-East.',
            timestamp: minutesAgoIso(6),
            read: false,
        },
        {
            id: 'notice_2',
            title: 'Payment gateway maintenance window starts in 2 hours.',
            timestamp: minutesAgoIso(19),
            read: false,
        },
    ];

    getOverview() {
        return {
            summary: {
                totalTenants: this.tenants.length,
                activeTenants: this.tenants.filter((tenant) => tenant.status === 'active').length,
                totalUsers: this.tenants.reduce((sum, tenant) => sum + tenant.usersCount, 0),
                newSignups30d: this.tenants.filter((tenant) => new Date(tenant.createdAt) > new Date(daysAgoIso(30))).length,
                activeSessions: 481,
                apiRequestsToday: 184902,
                monthlyRevenue: this.tenants.reduce((sum, tenant) => sum + tenant.monthlySpend, 0),
                systemHealthPercent: 98.7,
            },
            tenantGrowth: buildSeries(30, 6, 40),
            userActivityTrend: buildSeries(30, 130, 640),
            revenueGrowth: buildSeries(30, 4200, 22000),
        };
    }

    getTenants(params: { page?: number; pageSize?: number; search?: string; status?: TenantStatus | 'all'; plan?: TenantPlan | 'all' }) {
        const { page = 1, pageSize = 10, search = '', status = 'all', plan = 'all' } = params;

        const filtered = this.tenants
            .filter((tenant) => (status === 'all' ? true : tenant.status === status))
            .filter((tenant) => (plan === 'all' ? true : tenant.plan === plan))
            .filter((tenant) => {
                if (!search.trim()) {
                    return true;
                }
                const query = search.toLowerCase();
                return tenant.companyName.toLowerCase().includes(query) || tenant.ownerEmail.toLowerCase().includes(query);
            });

        return paginate(filtered, page, pageSize);
    }

    getTenantById(tenantId: string) {
        return this.tenants.find((tenant) => tenant.id === tenantId) ?? null;
    }

    updateTenantStatus(tenantId: string, status: TenantStatus) {
        const index = this.tenants.findIndex((tenant) => tenant.id === tenantId);
        if (index < 0) {
            return null;
        }

        this.tenants[index] = { ...this.tenants[index], status, lastActivity: nowIso() };
        return this.tenants[index];
    }

    updateTenantPlan(tenantId: string, plan: TenantPlan) {
        const index = this.tenants.findIndex((tenant) => tenant.id === tenantId);
        if (index < 0) {
            return null;
        }

        this.tenants[index] = { ...this.tenants[index], plan };
        return this.tenants[index];
    }

    impersonateTenant(tenantId: string, actorName = 'Platform Admin'): TenantImpersonationSession | null {
        const tenant = this.tenants.find((item) => item.id === tenantId);
        if (!tenant) {
            return null;
        }

        const sessionToken = `${tenantId}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        return {
            tenantId: tenant.id,
            tenantName: tenant.companyName,
            actorName,
            sessionToken,
            expiresAt,
            launchUrl: `/impersonate/${tenant.id}?token=${sessionToken}`,
        };
    }

    getUsers(params: { page?: number; pageSize?: number; search?: string; status?: UserStatus | 'all'; role?: UserRecord['role'] | 'all'; tenantId?: string | 'all' }) {
        const { page = 1, pageSize = 10, search = '', status = 'all', role = 'all', tenantId = 'all' } = params;

        const filtered = this.users
            .filter((user) => (status === 'all' ? true : user.status === status))
            .filter((user) => (role === 'all' ? true : user.role === role))
            .filter((user) => (tenantId === 'all' ? true : user.tenantId === tenantId))
            .filter((user) => {
                if (!search.trim()) {
                    return true;
                }
                const query = search.toLowerCase();
                return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query) || user.tenantName.toLowerCase().includes(query);
            });

        return paginate(filtered, page, pageSize);
    }

    getUserActivity(userId: string) {
        return [
            {
                id: `activity_${userId}_1`,
                userId,
                action: 'Signed in',
                resource: 'Auth Session',
                timestamp: minutesAgoIso(12),
                ipAddress: '192.168.1.22',
            },
            {
                id: `activity_${userId}_2`,
                userId,
                action: 'Updated profile',
                resource: 'User Preferences',
                timestamp: minutesAgoIso(120),
                ipAddress: '192.168.1.22',
            },
        ];
    }

    getBilling() {
        const plans = [
            {
                id: 'monthly',
                name: 'Monthly',
                price: 299,
                billingCycle: 'monthly',
                activeTenants: Math.max(1, Math.floor(this.tenants.length * 0.5)),
                includedUsers: 25,
                includedStorageGb: 50,
            },
            {
                id: 'yearly',
                name: 'Yearly',
                price: 3000,
                billingCycle: 'yearly',
                activeTenants: Math.max(1, Math.floor(this.tenants.length * 0.3)),
                includedUsers: 40,
                includedStorageGb: 100,
            },
            {
                id: 'lifetime',
                name: 'Lifetime',
                price: 9999,
                billingCycle: 'one_time',
                activeTenants: Math.max(0, Math.floor(this.tenants.length * 0.1)),
                includedUsers: 80,
                includedStorageGb: 250,
            },
        ];

        const invoices = this.tenants.map((tenant, index) => {
            const status: BillingStatus = index % 6 === 0 ? 'pending' : index % 5 === 0 ? 'failed' : 'paid';
            return {
                id: `invoice_${index + 1}`,
                tenantName: tenant.companyName,
                amount: tenant.monthlySpend || 299,
                status,
                issuedAt: daysAgoIso(index + 2),
                dueAt: daysAgoIso(index - 2),
            };
        });

        const payments = this.tenants.map((tenant, index) => {
            const status: BillingStatus = index % 9 === 0 ? 'refunded' : 'paid';
            return {
                id: `payment_${index + 1}`,
                tenantName: tenant.companyName,
                amount: tenant.monthlySpend || 299,
                status,
                method: ['card', 'ach', 'wire'][index % 3],
                paidAt: minutesAgoIso(index * 120),
            };
        });

        return {
            metrics: {
                mrr: this.tenants.reduce((sum, tenant) => sum + tenant.monthlySpend, 0),
                activeSubscriptions: this.tenants.filter((tenant) => tenant.status === 'active').length,
                trialUsers: this.users.filter((user) => {
                    const tenant = this.tenants.find((item) => item.id === user.tenantId);
                    return tenant?.status === 'trial';
                }).length,
                churnRate: 2.8,
            },
            invoices,
            payments,
            plans,
        };
    }

    getIntegrations() {
        return [
            { id: 'integration_1', name: 'WhatsApp', connectedTenants: 2, tokenStatus: 'valid', health: 'healthy', lastCheckedAt: minutesAgoIso(2), errorCount24h: 1 },
            { id: 'integration_2', name: 'Email Provider', connectedTenants: 3, tokenStatus: 'expiring', health: 'degraded', lastCheckedAt: minutesAgoIso(4), errorCount24h: 9 },
            { id: 'integration_3', name: 'Payment Gateway', connectedTenants: 3, tokenStatus: 'valid', health: 'healthy', lastCheckedAt: minutesAgoIso(1), errorCount24h: 0 },
            { id: 'integration_4', name: 'Webhooks', connectedTenants: 4, tokenStatus: 'expired', health: 'down', lastCheckedAt: minutesAgoIso(7), errorCount24h: 27 },
        ];
    }

    getAutomationLogs(params: { page?: number; pageSize?: number; search?: string; status?: 'success' | 'failed' | 'running' | 'all' }) {
        const { page = 1, pageSize = 10, search = '', status = 'all' } = params;

        const logs = Array.from({ length: 24 }, (_, index) => {
            const tenant = this.tenants[index % this.tenants.length];
            const logStatus = index % 7 === 0 ? 'failed' : index % 5 === 0 ? 'running' : 'success';
            return {
                id: `auto_${index + 1}`,
                workflowName: ['Lead Nurture', 'Payment Reminder', 'Data Sync'][index % 3],
                tenantName: tenant.companyName,
                triggerSource: ['Cron', 'Webhook', 'Manual'][index % 3],
                status: logStatus,
                durationMs: 260 + index * 35,
                executedAt: minutesAgoIso(index * 19),
            };
        });

        const filtered = logs
            .filter((log) => (status === 'all' ? true : log.status === status))
            .filter((log) => {
                if (!search.trim()) {
                    return true;
                }
                const query = search.toLowerCase();
                return log.workflowName.toLowerCase().includes(query) || log.tenantName.toLowerCase().includes(query) || log.triggerSource.toLowerCase().includes(query);
            });

        return paginate(filtered, page, pageSize);
    }

    getAuditLogs(params: { page?: number; pageSize?: number; search?: string; category?: 'admin_action' | 'tenant_update' | 'permission_change' | 'settings_update' | 'all' }) {
        const { page = 1, pageSize = 12, search = '', category = 'all' } = params;

        const logs = Array.from({ length: 32 }, (_, index) => {
            const categoryValue = index % 4 === 0 ? 'admin_action' : index % 4 === 1 ? 'tenant_update' : index % 4 === 2 ? 'permission_change' : 'settings_update';
            const tenant = this.tenants[index % this.tenants.length];
            return {
                id: `audit_${index + 1}`,
                actor: ['System Bot', 'Ava Thomson', 'Kai Morgan', 'Platform Admin'][index % 4],
                action: ['Updated policy', 'Changed plan', 'Revoked access', 'Enabled feature'][index % 4],
                target: ['Platform Settings', 'Tenant Plan', 'User Permissions', 'Feature Flags'][index % 4],
                category: categoryValue,
                tenantName: categoryValue === 'admin_action' ? undefined : tenant.companyName,
                createdAt: minutesAgoIso(index * 23),
            };
        });

        const filtered = logs
            .filter((log) => (category === 'all' ? true : log.category === category))
            .filter((log) => {
                if (!search.trim()) {
                    return true;
                }
                const query = search.toLowerCase();
                return log.actor.toLowerCase().includes(query) || log.action.toLowerCase().includes(query) || (log.tenantName ? log.tenantName.toLowerCase().includes(query) : false);
            });

        return paginate(filtered, page, pageSize);
    }

    getSystemHealth() {
        return {
            metrics: [
                { key: 'api_latency', label: 'API Latency', value: 124, threshold: 200, unit: 'ms', health: 'healthy' },
                { key: 'background_jobs', label: 'Background Jobs', value: 97, threshold: 100, unit: '%', health: 'healthy' },
                { key: 'queue_depth', label: 'Queue Status', value: 320, threshold: 500, unit: 'jobs', health: 'healthy' },
                { key: 'error_rate', label: 'Error Rate', value: 1.2, threshold: 2, unit: '%', health: 'degraded' },
                { key: 'uptime', label: 'Server Uptime', value: 99.982, threshold: 99.9, unit: 'uptime', health: 'healthy' },
            ],
            alerts: [
                { id: 'alert_1', severity: 'warning', title: 'Webhook retries increased', description: 'Retry queue grew 26% in the last 15 minutes for Webhooks integration.', createdAt: minutesAgoIso(18) },
                { id: 'alert_2', severity: 'critical', title: 'Token expiration detected', description: 'Email provider credentials for 3 tenants expire within 24 hours.', createdAt: minutesAgoIso(47) },
            ],
        };
    }

    getFeatureManagement() {
        return this.featureManagement;
    }

    updatePlanFeature(planId: string, featureKey: string, enabled: boolean) {
        this.featureManagement = {
            ...this.featureManagement,
            planConfigs: this.featureManagement.planConfigs.map((plan) =>
                plan.planId === planId
                    ? { ...plan, features: { ...plan.features, [featureKey]: enabled } }
                    : plan,
            ),
        };
        return this.featureManagement;
    }

    updatePlanLimit(planId: string, field: 'users' | 'messagesPerMonth' | 'storageGb', value: number) {
        this.featureManagement = {
            ...this.featureManagement,
            planConfigs: this.featureManagement.planConfigs.map((plan) =>
                plan.planId === planId
                    ? { ...plan, limits: { ...plan.limits, [field]: value } }
                    : plan,
            ),
        };
        return this.featureManagement;
    }

    updateFeatureFlag(flagId: string, enabled: boolean, rolloutPercentage: number) {
        this.featureManagement = {
            ...this.featureManagement,
            featureFlags: this.featureManagement.featureFlags.map((flag) =>
                flag.id === flagId ? { ...flag, enabled, rolloutPercentage } : flag,
            ),
        };
        return this.featureManagement;
    }

    getSettings() {
        return this.settings;
    }

    updateSettings(payload: PlatformSettings) {
        this.settings = payload;
        return this.settings;
    }

    getNotifications() {
        return this.notifications;
    }

    markNotificationRead(id: string) {
        this.notifications = this.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification,
        );
        return this.notifications;
    }
}

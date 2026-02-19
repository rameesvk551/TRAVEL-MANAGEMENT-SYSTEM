import { createHash } from 'crypto';
import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Tenant } from '../../database/models/Tenant.js';
import { User } from '../../database/models/User.js';
import { BillingAuditLogModel } from './models/BillingAuditLogModel.js';
import { BillingCouponModel } from './models/BillingCouponModel.js';
import { BillingInvoiceModel, type BillingInvoiceLineItem } from './models/BillingInvoiceModel.js';
import { BillingPaymentModel } from './models/BillingPaymentModel.js';
import { BillingSubscriptionModel } from './models/BillingSubscriptionModel.js';
import { BillingUsageConfigModel } from './models/BillingUsageConfigModel.js';
import { BillingUsageCycleModel } from './models/BillingUsageCycleModel.js';
import { BillingWebhookEventModel } from './models/BillingWebhookEventModel.js';
import type { BillingOnboardingPort } from './billing.contracts.js';
import {
    BILLING_CURRENCY,
    BILLING_WRITE_GUARD_BYPASS_PREFIXES,
    DEFAULT_TRIAL_DAYS,
    DEFAULT_USAGE_FEATURES,
    PLAN_PRICES_PAISE,
    READ_ONLY_HTTP_METHODS,
    SUPER_ADMIN_ROLES,
    WEBHOOK_EVENT_TYPES,
    type CouponDiscountType,
    type CouponScope,
    type DiscountResult,
    type InvoiceStatus,
    type PaymentSourceType,
    type PaymentStatus,
    type SubscriptionStatus,
    type UsageFeatureConfig,
    type UsageFeatureCounter,
    type BillingPlanType,
} from './billing.types.js';
import { RazorpayClient } from './RazorpayClient.js';

interface BillingServiceOptions {
    trialDays?: number;
}

interface CouponValidationInput {
    code: string;
    scope: CouponScope;
    planType?: BillingPlanType;
}

interface CouponValidationResult {
    valid: boolean;
    reason: string | null;
    coupon: BillingCouponModel | null;
}

interface WriteAccessDecision {
    allowed: boolean;
    reason: string | null;
    statusCode: number;
}

interface UsageTrackingInput {
    tenantId: string;
    featureKey: string;
    quantity: number;
    metadata?: Record<string, unknown>;
}

interface TrialUpdateInput {
    tenantId: string;
    actorUserId: string;
    reason?: string;
    trialStartAt?: Date;
    trialEndAt: Date;
}

const addDays = (value: Date, days: number): Date => {
    const next = new Date(value);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
};

const startOfMonthUtc = (value: Date): Date =>
    new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));

const endOfMonthUtc = (value: Date): Date =>
    new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0, 23, 59, 59, 999));

const normalizeCouponCode = (value: string): string => value.trim().toUpperCase();

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string' && value.length > 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

export class BillingService implements BillingOnboardingPort {
    private readonly trialDays: number;

    constructor(
        private readonly razorpayClient: RazorpayClient,
        options: BillingServiceOptions = {},
    ) {
        this.trialDays = options.trialDays ?? DEFAULT_TRIAL_DAYS;
    }

    async createTrialForTenant(params: { tenantId: string; performedByUserId?: string }): Promise<void> {
        await this.getOrCreateTrialSubscription(params.tenantId, params.performedByUserId || null);
        await this.ensureUsageConfigs();
    }

    async getCurrentSubscription(tenantId: string) {
        const subscription = await this.getOrCreateTrialSubscription(tenantId);
        const access = this.computeAccessState(subscription, new Date());

        return {
            id: subscription.id,
            tenantId: subscription.tenant_id,
            planType: subscription.plan_type,
            status: subscription.status,
            trialStartAt: subscription.trial_start_at,
            trialEndAt: subscription.trial_end_at,
            currentPeriodStart: subscription.current_period_start,
            currentPeriodEnd: subscription.current_period_end,
            razorpayCustomerId: subscription.razorpay_customer_id,
            razorpaySubscriptionId: subscription.razorpay_subscription_id,
            lastPaymentAt: subscription.last_payment_at,
            writeBlockedOverride: subscription.write_blocked_override,
            access,
        };
    }

    async decideWriteAccess(input: {
        tenantId: string;
        method: string;
        path: string;
        role: string;
    }): Promise<WriteAccessDecision> {
        if (READ_ONLY_HTTP_METHODS.has(input.method.toUpperCase())) {
            return { allowed: true, reason: null, statusCode: 200 };
        }

        const normalizedPath = input.path.toLowerCase();
        if (BILLING_WRITE_GUARD_BYPASS_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
            return { allowed: true, reason: null, statusCode: 200 };
        }

        if (SUPER_ADMIN_ROLES.has(input.role.toLowerCase())) {
            return { allowed: true, reason: null, statusCode: 200 };
        }

        const subscription = await this.getOrCreateTrialSubscription(input.tenantId);
        const access = this.computeAccessState(subscription, new Date());

        if (access.canWrite) {
            return { allowed: true, reason: null, statusCode: 200 };
        }

        return {
            allowed: false,
            reason: access.reason,
            statusCode: 402,
        };
    }

    async validateCoupon(input: CouponValidationInput): Promise<CouponValidationResult> {
        const code = normalizeCouponCode(input.code);
        const coupon = await BillingCouponModel.findOne({ where: { code } });

        if (!coupon) {
            return { valid: false, reason: 'Coupon not found', coupon: null };
        }

        if (!coupon.active) {
            return { valid: false, reason: 'Coupon is inactive', coupon: null };
        }

        const now = new Date();
        if (coupon.valid_from && coupon.valid_from > now) {
            return { valid: false, reason: 'Coupon is not active yet', coupon: null };
        }

        if (coupon.valid_until && coupon.valid_until < now) {
            return { valid: false, reason: 'Coupon has expired', coupon: null };
        }

        if (coupon.usage_limit !== null && coupon.usage_limit !== undefined && coupon.used_count >= coupon.usage_limit) {
            return { valid: false, reason: 'Coupon usage limit reached', coupon: null };
        }

        if (!(coupon.scope === 'all' || coupon.scope === input.scope)) {
            return {
                valid: false,
                reason: `Coupon cannot be applied to ${input.scope}`,
                coupon: null,
            };
        }

        if (input.planType && Array.isArray(coupon.applicable_plan_types) && coupon.applicable_plan_types.length > 0) {
            if (!coupon.applicable_plan_types.includes(input.planType)) {
                return {
                    valid: false,
                    reason: `Coupon does not apply to ${input.planType} plan`,
                    coupon: null,
                };
            }
        }

        return {
            valid: true,
            reason: null,
            coupon,
        };
    }

    async createSubscriptionCheckout(input: {
        tenantId: string;
        planType: 'monthly' | 'yearly';
        couponCode?: string;
        requestedByUserId: string;
    }) {
        const tenant = await Tenant.findByPk(input.tenantId);
        const user = await User.findByPk(input.requestedByUserId);

        if (!tenant) {
            throw new Error('Tenant not found');
        }

        if (!user) {
            throw new Error('User not found');
        }

        const subscription = await this.getOrCreateTrialSubscription(input.tenantId, input.requestedByUserId);

        if (subscription.plan_type === 'lifetime' && subscription.status === 'active') {
            throw new Error('Workspace already has an active lifetime subscription');
        }

        const coupon = await this.resolveCouponForCheckout({
            couponCode: input.couponCode,
            scope: 'subscription',
            planType: input.planType,
        });

        if (coupon && !coupon.razorpay_offer_id) {
            throw new Error('Coupon cannot be applied to recurring subscription without Razorpay offer mapping');
        }

        const customerId = await this.ensureRazorpayCustomer(subscription, {
            tenantName: tenant.name,
            email: user.email,
            tenantId: tenant.id,
        });

        const created = await this.razorpayClient.createRecurringSubscription({
            planType: input.planType,
            customerId,
            couponOfferId: coupon?.razorpay_offer_id || undefined,
            notes: {
                tenantId: tenant.id,
                tenantName: tenant.name,
                planType: input.planType,
                couponCode: coupon?.code || '',
            },
        });

        const now = new Date();
        await subscription.update({
            plan_type: input.planType,
            status: 'trialing',
            razorpay_subscription_id: created.id,
            metadata: {
                ...subscription.metadata,
                pendingPlanType: input.planType,
                checkoutRequestedAt: now.toISOString(),
                checkoutUserId: input.requestedByUserId,
                appliedCouponCode: coupon?.code || null,
            },
        });

        return {
            subscriptionId: created.id,
            status: created.status,
            shortUrl: created.short_url,
            planType: input.planType,
            couponCode: coupon?.code || null,
        };
    }

    async createLifetimeCheckout(input: {
        tenantId: string;
        requestedByUserId: string;
        couponCode?: string;
    }) {
        const tenant = await Tenant.findByPk(input.tenantId);
        const user = await User.findByPk(input.requestedByUserId);

        if (!tenant || !user) {
            throw new Error('Tenant or user not found');
        }

        const subscription = await this.getOrCreateTrialSubscription(input.tenantId, input.requestedByUserId);
        const coupon = await this.resolveCouponForCheckout({
            couponCode: input.couponCode,
            scope: 'subscription',
            planType: 'lifetime',
        });

        const subtotal = PLAN_PRICES_PAISE.lifetime;
        const discount = this.applyDiscount(subtotal, coupon);
        const total = Math.max(0, subtotal - discount.discountAmountPaise);

        const invoice = await BillingInvoiceModel.create({
            tenant_id: input.tenantId,
            invoice_type: 'lifetime_purchase',
            status: 'issued',
            line_items: [
                {
                    featureKey: 'lifetime_plan',
                    description: 'Lifetime platform access',
                    quantity: 1,
                    unitAmountPaise: PLAN_PRICES_PAISE.lifetime,
                    amountPaise: PLAN_PRICES_PAISE.lifetime,
                },
            ],
            subtotal_amount_paise: subtotal,
            discount_amount_paise: discount.discountAmountPaise,
            total_amount_paise: total,
            coupon_code: discount.couponCode,
            currency: BILLING_CURRENCY,
            due_at: addDays(new Date(), 7),
            issued_at: new Date(),
            metadata: {
                tenantName: tenant.name,
                requestedByUserId: input.requestedByUserId,
            },
        });

        const order = await this.razorpayClient.createOneTimeOrder({
            amountPaise: total,
            receipt: `lifetime_${invoice.id}`,
            notes: {
                tenantId: tenant.id,
                invoiceId: invoice.id,
                invoiceType: 'lifetime_purchase',
            },
            offerId: coupon?.razorpay_offer_id || undefined,
        });

        await invoice.update({
            status: 'pending_payment',
            razorpay_order_id: order.id,
        });

        await subscription.update({
            metadata: {
                ...subscription.metadata,
                pendingLifetimeInvoiceId: invoice.id,
            },
        });

        return {
            invoiceId: invoice.id,
            orderId: order.id,
            amountPaise: total,
            currency: BILLING_CURRENCY,
            couponCode: discount.couponCode,
        };
    }

    async createUsageInvoiceCheckout(input: {
        tenantId: string;
        invoiceId: string;
        couponCode?: string;
    }) {
        const invoice = await BillingInvoiceModel.findOne({
            where: {
                id: input.invoiceId,
                tenant_id: input.tenantId,
            },
        });

        if (!invoice) {
            throw new Error('Invoice not found');
        }

        if (invoice.status === 'paid') {
            throw new Error('Invoice already paid');
        }

        const subtotal = toNumber(invoice.subtotal_amount_paise);
        let totalAmountPaise = toNumber(invoice.total_amount_paise);
        let discountAmountPaise = toNumber(invoice.discount_amount_paise);
        let couponCode = invoice.coupon_code;

        if (input.couponCode) {
            const coupon = await this.resolveCouponForCheckout({
                couponCode: input.couponCode,
                scope: 'usage',
                planType: undefined,
            });
            const discount = this.applyDiscount(subtotal, coupon);

            totalAmountPaise = discount.totalAmountPaise;
            discountAmountPaise = discount.discountAmountPaise;
            couponCode = discount.couponCode;

            await invoice.update({
                total_amount_paise: totalAmountPaise,
                discount_amount_paise: discountAmountPaise,
                coupon_code: couponCode,
            });
        }

        const order = await this.razorpayClient.createOneTimeOrder({
            amountPaise: totalAmountPaise,
            receipt: `usage_${invoice.id}`,
            notes: {
                tenantId: invoice.tenant_id,
                invoiceId: invoice.id,
                invoiceType: invoice.invoice_type,
            },
        });

        await invoice.update({
            status: 'pending_payment',
            razorpay_order_id: order.id,
        });

        return {
            invoiceId: invoice.id,
            orderId: order.id,
            amountPaise: totalAmountPaise,
            discountAmountPaise,
            couponCode,
            currency: invoice.currency,
        };
    }

    async trackUsage(input: UsageTrackingInput) {
        if (!input.featureKey?.trim()) {
            throw new Error('featureKey is required');
        }

        if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
            throw new Error('quantity must be greater than zero');
        }

        const subscription = await this.getOrCreateTrialSubscription(input.tenantId);
        const access = this.computeAccessState(subscription, new Date());

        if (!access.canWrite) {
            throw new Error(`Write access denied: ${access.reason || 'subscription is inactive'}`);
        }

        const now = new Date();
        const cycleStart = startOfMonthUtc(now);
        const cycleEnd = endOfMonthUtc(now);
        const usageConfig = await this.getUsageConfigForPlan(subscription.plan_type);

        let cycle = await BillingUsageCycleModel.findOne({
            where: {
                tenant_id: input.tenantId,
                cycle_start: cycleStart,
            },
        });

        if (!cycle) {
            cycle = await BillingUsageCycleModel.create({
                tenant_id: input.tenantId,
                plan_type: subscription.plan_type,
                cycle_start: cycleStart,
                cycle_end: cycleEnd,
                feature_counters: [],
                total_overage_amount_paise: 0,
                status: 'open',
            });
        }

        const counters = Array.isArray(cycle.feature_counters)
            ? [...cycle.feature_counters]
            : [];
        const config = usageConfig.find((item) => item.featureKey === input.featureKey);

        const featureConfig = config || {
            featureKey: input.featureKey,
            freeLimit: 0,
            overageUnitPricePaise: 0,
        };

        const existingIndex = counters.findIndex((item) => item.featureKey === input.featureKey);
        const existingCounter: UsageFeatureCounter =
            existingIndex >= 0
                ? counters[existingIndex]
                : {
                    featureKey: input.featureKey,
                    usedUnits: 0,
                    freeLimit: featureConfig.freeLimit,
                    overageUnits: 0,
                    overageUnitPricePaise: featureConfig.overageUnitPricePaise,
                    overageAmountPaise: 0,
                };

        const usedUnits = existingCounter.usedUnits + input.quantity;
        const overageUnits = Math.max(0, usedUnits - featureConfig.freeLimit);
        const overageAmountPaise = overageUnits * featureConfig.overageUnitPricePaise;

        const nextCounter: UsageFeatureCounter = {
            featureKey: input.featureKey,
            usedUnits,
            freeLimit: featureConfig.freeLimit,
            overageUnits,
            overageUnitPricePaise: featureConfig.overageUnitPricePaise,
            overageAmountPaise,
        };

        if (existingIndex >= 0) {
            counters[existingIndex] = nextCounter;
        } else {
            counters.push(nextCounter);
        }

        const totalOverage = counters.reduce((sum, item) => sum + item.overageAmountPaise, 0);

        await cycle.update({
            feature_counters: counters,
            total_overage_amount_paise: totalOverage,
            last_tracked_at: now,
            updated_at: now,
        });

        return {
            tenantId: input.tenantId,
            cycleStart,
            cycleEnd,
            feature: nextCounter,
            totalOverageAmountPaise: totalOverage,
        };
    }

    async getUsageStats(input: { tenantId: string; month?: string }) {
        const monthReference = input.month ? new Date(`${input.month}-01T00:00:00.000Z`) : new Date();
        const cycleStart = startOfMonthUtc(monthReference);

        const cycle = await BillingUsageCycleModel.findOne({
            where: {
                tenant_id: input.tenantId,
                cycle_start: cycleStart,
            },
        });

        if (!cycle) {
            const subscription = await this.getOrCreateTrialSubscription(input.tenantId);
            const config = await this.getUsageConfigForPlan(subscription.plan_type);

            return {
                tenantId: input.tenantId,
                cycleStart,
                cycleEnd: endOfMonthUtc(monthReference),
                planType: subscription.plan_type,
                counters: config.map((item) => ({
                    featureKey: item.featureKey,
                    usedUnits: 0,
                    freeLimit: item.freeLimit,
                    overageUnits: 0,
                    overageUnitPricePaise: item.overageUnitPricePaise,
                    overageAmountPaise: 0,
                })),
                totalOverageAmountPaise: 0,
                status: 'open',
            };
        }

        return {
            tenantId: cycle.tenant_id,
            cycleStart: cycle.cycle_start,
            cycleEnd: cycle.cycle_end,
            planType: cycle.plan_type,
            counters: cycle.feature_counters,
            totalOverageAmountPaise: toNumber(cycle.total_overage_amount_paise),
            status: cycle.status,
        };
    }

    async getPaymentHistory(input: { tenantId: string; page?: number; pageSize?: number }) {
        const page = input.page && input.page > 0 ? input.page : 1;
        const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;

        const { count, rows } = await BillingPaymentModel.findAndCountAll({
            where: { tenant_id: input.tenantId },
            order: [['created_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            items: rows,
            total: count,
            page,
            pageSize,
        };
    }

    async getPendingInvoices(tenantId: string) {
        return BillingInvoiceModel.findAll({
            where: {
                tenant_id: tenantId,
                status: {
                    [Op.in]: ['issued', 'pending_payment'] as InvoiceStatus[],
                },
            },
            order: [['created_at', 'DESC']],
        });
    }

    async getUsageConfigs(input: { planType?: BillingPlanType } = {}) {
        await this.ensureUsageConfigs();

        const where = input.planType
            ? {
                plan_type: input.planType,
            }
            : undefined;

        const configs = await BillingUsageConfigModel.findAll({
            where,
        });

        const planOrder: BillingPlanType[] = ['trial', 'monthly', 'yearly', 'lifetime'];
        const orderIndex = new Map(planOrder.map((plan, index) => [plan, index]));

        return configs.sort(
            (first, second) =>
                (orderIndex.get(first.plan_type) ?? Number.MAX_SAFE_INTEGER) -
                (orderIndex.get(second.plan_type) ?? Number.MAX_SAFE_INTEGER),
        );
    }

    async upsertUsageConfig(input: {
        actorUserId: string;
        actorTenantId: string;
        planType: BillingPlanType;
        features: UsageFeatureConfig[];
    }) {
        const existing = await BillingUsageConfigModel.findOne({ where: { plan_type: input.planType } });

        if (existing) {
            const beforeState = { featureConfigs: existing.feature_configs };
            await existing.update({
                feature_configs: input.features,
                updated_by_user_id: input.actorUserId,
            });

            await this.recordAudit({
                tenantId: input.actorTenantId,
                actorUserId: input.actorUserId,
                actionType: 'usage_config_updated',
                beforeState,
                afterState: { featureConfigs: input.features },
                metadata: { planType: input.planType },
            });

            return existing;
        }

        const created = await BillingUsageConfigModel.create({
            plan_type: input.planType,
            feature_configs: input.features,
            updated_by_user_id: input.actorUserId,
        });

        await this.recordAudit({
            tenantId: input.actorTenantId,
            actorUserId: input.actorUserId,
            actionType: 'usage_config_created',
            afterState: { featureConfigs: input.features },
            metadata: { planType: input.planType },
        });

        return created;
    }

    async createCoupon(input: {
        actorUserId: string;
        actorTenantId: string;
        code: string;
        scope: CouponScope;
        discountType: CouponDiscountType;
        discountValue: number;
        maxDiscountAmountPaise?: number;
        usageLimit?: number;
        validFrom?: Date;
        validUntil?: Date;
        applicablePlanTypes?: BillingPlanType[];
        razorpayOfferId?: string;
        metadata?: Record<string, unknown>;
    }) {
        const code = normalizeCouponCode(input.code);

        const coupon = await BillingCouponModel.create({
            code,
            scope: input.scope,
            discount_type: input.discountType,
            discount_value: input.discountValue,
            max_discount_amount_paise: input.maxDiscountAmountPaise ?? null,
            usage_limit: input.usageLimit ?? null,
            valid_from: input.validFrom ?? null,
            valid_until: input.validUntil ?? null,
            applicable_plan_types: input.applicablePlanTypes ?? [],
            razorpay_offer_id: input.razorpayOfferId ?? null,
            metadata: input.metadata ?? {},
            created_by_user_id: input.actorUserId,
        });

        await this.recordAudit({
            tenantId: input.actorTenantId,
            actorUserId: input.actorUserId,
            actionType: 'coupon_created',
            afterState: {
                id: coupon.id,
                code: coupon.code,
                scope: coupon.scope,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                active: coupon.active,
            },
        });

        return coupon;
    }

    async getCoupons(input: {
        page?: number;
        pageSize?: number;
        search?: string;
        scope?: CouponScope;
        active?: boolean;
    }) {
        const page = input.page && input.page > 0 ? input.page : 1;
        const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;
        const whereClause: Record<string, unknown> = {};

        if (typeof input.active === 'boolean') {
            whereClause.active = input.active;
        }

        if (input.scope) {
            whereClause.scope = input.scope;
        }

        if (input.search?.trim()) {
            whereClause.code = {
                [Op.iLike]: `%${input.search.trim()}%`,
            };
        }

        const { count, rows } = await BillingCouponModel.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            items: rows,
            total: count,
            page,
            pageSize,
        };
    }

    async updateCoupon(input: {
        couponId: string;
        actorUserId?: string;
        actorTenantId?: string;
        code?: string;
        scope?: CouponScope;
        discountType?: CouponDiscountType;
        discountValue?: number;
        active?: boolean;
        validFrom?: Date | null;
        validUntil?: Date | null;
        usageLimit?: number | null;
        maxDiscountAmountPaise?: number | null;
        applicablePlanTypes?: BillingPlanType[];
        razorpayOfferId?: string | null;
    }) {
        const coupon = await BillingCouponModel.findByPk(input.couponId);

        if (!coupon) {
            throw new Error('Coupon not found');
        }

        const beforeState = {
            code: coupon.code,
            scope: coupon.scope,
            discountType: coupon.discount_type,
            discountValue: coupon.discount_value,
            active: coupon.active,
            validFrom: coupon.valid_from,
            validUntil: coupon.valid_until,
            usageLimit: coupon.usage_limit,
            maxDiscountAmountPaise: coupon.max_discount_amount_paise,
            applicablePlanTypes: coupon.applicable_plan_types,
            razorpayOfferId: coupon.razorpay_offer_id,
        };

        await coupon.update({
            code: input.code ? normalizeCouponCode(input.code) : coupon.code,
            scope: input.scope ?? coupon.scope,
            discount_type: input.discountType ?? coupon.discount_type,
            discount_value:
                input.discountValue === undefined
                    ? coupon.discount_value
                    : input.discountValue,
            active: input.active ?? coupon.active,
            valid_from: input.validFrom === undefined ? coupon.valid_from : input.validFrom,
            valid_until: input.validUntil === undefined ? coupon.valid_until : input.validUntil,
            usage_limit: input.usageLimit === undefined ? coupon.usage_limit : input.usageLimit,
            max_discount_amount_paise:
                input.maxDiscountAmountPaise === undefined
                    ? coupon.max_discount_amount_paise
                    : input.maxDiscountAmountPaise,
            applicable_plan_types:
                input.applicablePlanTypes === undefined
                    ? coupon.applicable_plan_types
                    : input.applicablePlanTypes,
            razorpay_offer_id:
                input.razorpayOfferId === undefined
                    ? coupon.razorpay_offer_id
                    : input.razorpayOfferId,
        });

        if (input.actorTenantId) {
            await this.recordAudit({
                tenantId: input.actorTenantId,
                actorUserId: input.actorUserId || null,
                actionType: 'coupon_updated',
                beforeState,
                afterState: {
                    code: coupon.code,
                    scope: coupon.scope,
                    discountType: coupon.discount_type,
                    discountValue: coupon.discount_value,
                    active: coupon.active,
                    validFrom: coupon.valid_from,
                    validUntil: coupon.valid_until,
                    usageLimit: coupon.usage_limit,
                    maxDiscountAmountPaise: coupon.max_discount_amount_paise,
                    applicablePlanTypes: coupon.applicable_plan_types,
                    razorpayOfferId: coupon.razorpay_offer_id,
                },
                metadata: {
                    couponId: coupon.id,
                    code: coupon.code,
                },
            });
        }

        return coupon;
    }

    async deleteCoupon(input: {
        couponId: string;
        actorUserId: string;
        actorTenantId: string;
        reason?: string;
    }) {
        const coupon = await BillingCouponModel.findByPk(input.couponId);

        if (!coupon) {
            throw new Error('Coupon not found');
        }

        const beforeState = {
            id: coupon.id,
            code: coupon.code,
            active: coupon.active,
            usedCount: coupon.used_count,
            usageLimit: coupon.usage_limit,
            validFrom: coupon.valid_from,
            validUntil: coupon.valid_until,
        };

        if (coupon.used_count > 0) {
            await coupon.update({
                active: false,
                metadata: {
                    ...(coupon.metadata || {}),
                    deletedAt: new Date().toISOString(),
                    deletedBy: input.actorUserId,
                },
            });

            await this.recordAudit({
                tenantId: input.actorTenantId,
                actorUserId: input.actorUserId,
                actionType: 'coupon_deactivated',
                reason: input.reason,
                beforeState,
                afterState: {
                    id: coupon.id,
                    code: coupon.code,
                    active: coupon.active,
                },
                metadata: {
                    couponId: coupon.id,
                    softDelete: true,
                },
            });

            return {
                deleted: false,
                deactivated: true,
                coupon,
            };
        }

        await coupon.destroy();

        await this.recordAudit({
            tenantId: input.actorTenantId,
            actorUserId: input.actorUserId,
            actionType: 'coupon_deleted',
            reason: input.reason,
            beforeState,
            metadata: {
                couponId: input.couponId,
                softDelete: false,
            },
        });

        return {
            deleted: true,
            deactivated: false,
            couponId: input.couponId,
        };
    }

    async updateTrialWindow(input: TrialUpdateInput) {
        const subscription = await this.getOrCreateTrialSubscription(input.tenantId);

        const beforeState = {
            trialStartAt: subscription.trial_start_at,
            trialEndAt: subscription.trial_end_at,
            status: subscription.status,
        };

        const previousTrialEnd = subscription.trial_end_at;
        const actionType = this.resolveTrialActionType(previousTrialEnd, input.trialEndAt);

        await subscription.update({
            trial_start_at: input.trialStartAt ?? subscription.trial_start_at ?? new Date(),
            trial_end_at: input.trialEndAt,
            status:
                subscription.plan_type === 'trial' || subscription.status === 'trialing'
                    ? 'trialing'
                    : subscription.status,
            metadata: {
                ...subscription.metadata,
                trialUpdatedAt: new Date().toISOString(),
                trialUpdatedBy: input.actorUserId,
            },
        });

        await this.recordAudit({
            tenantId: input.tenantId,
            actorUserId: input.actorUserId,
            actionType,
            reason: input.reason,
            beforeState,
            afterState: {
                trialStartAt: subscription.trial_start_at,
                trialEndAt: subscription.trial_end_at,
                status: subscription.status,
            },
        });

        return subscription;
    }

    async getBillingAuditLogs(input: { tenantId?: string; page?: number; pageSize?: number }) {
        const page = input.page && input.page > 0 ? input.page : 1;
        const pageSize = input.pageSize && input.pageSize > 0 ? input.pageSize : 20;

        const whereClause = input.tenantId
            ? { tenant_id: input.tenantId }
            : undefined;

        const { count, rows } = await BillingAuditLogModel.findAndCountAll({
            where: whereClause,
            order: [['created_at', 'DESC']],
            offset: (page - 1) * pageSize,
            limit: pageSize,
        });

        return {
            items: rows,
            total: count,
            page,
            pageSize,
        };
    }

    async runMonthlyUsageBilling(referenceDate: Date = new Date()) {
        const previousMonthDate = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() - 1, 1));
        const cycleStart = startOfMonthUtc(previousMonthDate);
        const cycleEnd = endOfMonthUtc(previousMonthDate);

        const openCycles = await BillingUsageCycleModel.findAll({
            where: {
                status: 'open',
                cycle_start: cycleStart,
                cycle_end: cycleEnd,
            },
        });

        let generated = 0;
        const failedTenants: Array<{ tenantId: string; error: string }> = [];

        for (const cycle of openCycles) {
            try {
                const totalOverage = toNumber(cycle.total_overage_amount_paise);
                if (totalOverage <= 0) {
                    await cycle.update({ status: 'invoiced' });
                    continue;
                }

                const alreadyGenerated = await BillingInvoiceModel.findOne({
                    where: {
                        tenant_id: cycle.tenant_id,
                        invoice_type: 'usage_overage',
                        cycle_start: cycle.cycle_start,
                        cycle_end: cycle.cycle_end,
                    },
                });

                if (alreadyGenerated) {
                    await cycle.update({
                        status: 'invoiced',
                        invoiced_invoice_id: alreadyGenerated.id,
                    });
                    continue;
                }

                const lineItems: BillingInvoiceLineItem[] = (cycle.feature_counters || [])
                    .filter((counter) => counter.overageUnits > 0)
                    .map((counter) => ({
                        featureKey: counter.featureKey,
                        description: `${counter.featureKey} overage for cycle ${cycleStart.toISOString().slice(0, 7)}`,
                        quantity: counter.overageUnits,
                        unitAmountPaise: counter.overageUnitPricePaise,
                        amountPaise: counter.overageAmountPaise,
                    }));

                const invoice = await BillingInvoiceModel.create({
                    tenant_id: cycle.tenant_id,
                    invoice_type: 'usage_overage',
                    status: 'issued',
                    cycle_start: cycle.cycle_start,
                    cycle_end: cycle.cycle_end,
                    line_items: lineItems,
                    subtotal_amount_paise: totalOverage,
                    total_amount_paise: totalOverage,
                    discount_amount_paise: 0,
                    currency: BILLING_CURRENCY,
                    due_at: addDays(new Date(), 7),
                    issued_at: new Date(),
                    metadata: {
                        autoGenerated: true,
                    },
                });

                const order = await this.razorpayClient.createOneTimeOrder({
                    amountPaise: totalOverage,
                    receipt: `usage_${invoice.id}`,
                    notes: {
                        tenantId: cycle.tenant_id,
                        invoiceId: invoice.id,
                        invoiceType: 'usage_overage',
                    },
                });

                await invoice.update({
                    status: 'pending_payment',
                    razorpay_order_id: order.id,
                });

                await cycle.update({
                    status: 'invoiced',
                    invoiced_invoice_id: invoice.id,
                });

                generated += 1;
            } catch (error) {
                failedTenants.push({
                    tenantId: cycle.tenant_id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            cycleStart,
            cycleEnd,
            scanned: openCycles.length,
            generated,
            failedTenants,
        };
    }

    async runRazorpayReconciliation(input: { lookbackHours?: number } = {}) {
        const lookbackHours =
            Number.isFinite(input.lookbackHours) && (input.lookbackHours || 0) > 0
                ? Math.floor(input.lookbackHours as number)
                : 72;
        const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

        const subscriptions = await BillingSubscriptionModel.findAll({
            where: {
                razorpay_subscription_id: { [Op.ne]: null },
                updated_at: { [Op.gte]: since },
            },
            order: [['updated_at', 'DESC']],
            limit: 500,
        });

        const invoices = await BillingInvoiceModel.findAll({
            where: {
                status: { [Op.in]: ['issued', 'pending_payment'] as InvoiceStatus[] },
                razorpay_order_id: { [Op.ne]: null },
                updated_at: { [Op.gte]: since },
            },
            order: [['updated_at', 'DESC']],
            limit: 500,
        });

        let updatedSubscriptions = 0;
        let paidInvoices = 0;
        const failures: Array<{ entity: string; id: string; error: string }> = [];

        for (const subscription of subscriptions) {
            if (!subscription.razorpay_subscription_id) {
                continue;
            }

            try {
                const remoteSubscription = await this.razorpayClient.fetchSubscription(subscription.razorpay_subscription_id);
                const remoteStatusRaw =
                    typeof remoteSubscription.status === 'string' ? remoteSubscription.status : '';
                const nextStatus = this.mapRazorpaySubscriptionStatus(remoteStatusRaw);
                const nextPeriodStart = this.toUnixDate(remoteSubscription.current_start);
                const nextPeriodEnd = this.toUnixDate(remoteSubscription.current_end);
                const nextPlanType = nextStatus === 'active' ? this.resolvePendingPlanType(subscription) : subscription.plan_type;

                const statusChanged = nextStatus !== subscription.status;
                const periodStartChanged =
                    nextPeriodStart &&
                    (!subscription.current_period_start ||
                        nextPeriodStart.getTime() !== subscription.current_period_start.getTime());
                const periodEndChanged =
                    nextPeriodEnd &&
                    (!subscription.current_period_end ||
                        nextPeriodEnd.getTime() !== subscription.current_period_end.getTime());
                const planTypeChanged = nextPlanType !== subscription.plan_type;

                if (!(statusChanged || periodStartChanged || periodEndChanged || planTypeChanged)) {
                    continue;
                }

                await subscription.update({
                    status: nextStatus,
                    plan_type: nextPlanType,
                    current_period_start: nextPeriodStart || subscription.current_period_start,
                    current_period_end: nextPeriodEnd || subscription.current_period_end,
                    last_payment_at: nextStatus === 'active' ? new Date() : subscription.last_payment_at,
                });

                updatedSubscriptions += 1;
            } catch (error) {
                failures.push({
                    entity: 'subscription',
                    id: subscription.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        for (const invoice of invoices) {
            if (!invoice.razorpay_order_id) {
                continue;
            }

            try {
                const remoteOrder = await this.razorpayClient.fetchOrder(invoice.razorpay_order_id);
                const orderStatus = typeof remoteOrder.status === 'string' ? remoteOrder.status : '';
                const amountPaid = toNumber(remoteOrder.amount_paid);
                const invoiceTotal = toNumber(invoice.total_amount_paise);

                if (!(orderStatus === 'paid' || amountPaid >= invoiceTotal)) {
                    continue;
                }

                const paymentList = await this.razorpayClient.fetchPaymentsForOrder(invoice.razorpay_order_id);
                const capturedPayment =
                    paymentList.find((item) => this.mapRazorpayPaymentStatus(item.status) === 'captured') || null;

                const paymentId = capturedPayment && typeof capturedPayment.id === 'string' ? capturedPayment.id : null;
                const paymentAmount = capturedPayment ? toNumber(capturedPayment.amount) : invoiceTotal;
                const paymentCurrency =
                    capturedPayment && typeof capturedPayment.currency === 'string'
                        ? capturedPayment.currency
                        : invoice.currency;

                await sequelize.transaction(async (transaction) => {
                    const lockedInvoice = await BillingInvoiceModel.findByPk(invoice.id, { transaction });
                    if (!lockedInvoice || lockedInvoice.status === 'paid') {
                        return;
                    }

                    await lockedInvoice.update(
                        {
                            status: 'paid',
                            paid_at: new Date(),
                            razorpay_payment_id: paymentId || lockedInvoice.razorpay_payment_id,
                        },
                        { transaction },
                    );

                    if (lockedInvoice.coupon_code) {
                        await this.incrementCouponUsage(lockedInvoice.coupon_code, transaction);
                    }

                    let subscriptionId: string | null = null;
                    const sourceType: PaymentSourceType =
                        lockedInvoice.invoice_type === 'lifetime_purchase'
                            ? 'lifetime_purchase'
                            : 'usage_invoice';

                    if (lockedInvoice.invoice_type === 'lifetime_purchase') {
                        const subscription = await this.getOrCreateTrialSubscription(
                            lockedInvoice.tenant_id,
                            undefined,
                            transaction,
                        );
                        subscriptionId = subscription.id;

                        await subscription.update(
                            {
                                plan_type: 'lifetime',
                                status: 'active',
                                current_period_start: new Date(),
                                current_period_end: null,
                                last_payment_at: new Date(),
                            },
                            { transaction },
                        );
                    }

                    await this.recordPaymentFromWebhook(
                        {
                            tenantId: lockedInvoice.tenant_id,
                            invoiceId: lockedInvoice.id,
                            subscriptionId,
                            sourceType,
                            amountPaise: paymentAmount,
                            currency: paymentCurrency,
                            razorpayPaymentId: paymentId,
                            razorpayOrderId: lockedInvoice.razorpay_order_id,
                            status: 'captured',
                            rawPayload: {
                                source: 'reconciliation',
                                order: remoteOrder,
                                payment: capturedPayment,
                            },
                        },
                        transaction,
                    );
                });

                paidInvoices += 1;
            } catch (error) {
                failures.push({
                    entity: 'invoice',
                    id: invoice.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return {
            lookbackHours,
            since,
            scannedSubscriptions: subscriptions.length,
            updatedSubscriptions,
            scannedInvoices: invoices.length,
            paidInvoices,
            failures,
        };
    }

    async processRazorpayWebhook(input: {
        eventId: string;
        signature: string;
        rawBody: string | Buffer;
        payload: Record<string, unknown>;
    }) {
        if (!input.signature) {
            throw new Error('Missing Razorpay signature header');
        }

        const verified = this.razorpayClient.verifyWebhookSignature(input.rawBody, input.signature);
        if (!verified) {
            throw new Error('Webhook signature verification failed');
        }

        const eventType = String(input.payload.event || 'unknown');
        const eventId = input.eventId || this.fallbackEventId(eventType, input.rawBody);
        const existing = await BillingWebhookEventModel.findOne({ where: { event_id: eventId } });

        if (existing) {
            return { duplicate: true, eventId, eventType };
        }

        const processingResult = await sequelize.transaction(async (transaction) => {
            const entity = this.resolveWebhookEntity(input.payload);

            let tenantId: string | null = entity.tenantId || null;

            if (!WEBHOOK_EVENT_TYPES.has(eventType)) {
                await BillingWebhookEventModel.create(
                    {
                        event_id: eventId,
                        event_type: eventType,
                        tenant_id: tenantId,
                        payload: input.payload,
                        processed_at: new Date(),
                    },
                    { transaction },
                );

                return {
                    duplicate: false,
                    ignored: true,
                    eventId,
                    eventType,
                    tenantId,
                };
            }

            switch (eventType) {
                case 'subscription.activated': {
                    const razorpaySubscriptionId = entity.subscriptionId;
                    if (!razorpaySubscriptionId) {
                        throw new Error('Missing subscription id in webhook payload');
                    }

                    const subscription = await BillingSubscriptionModel.findOne({
                        where: { razorpay_subscription_id: razorpaySubscriptionId },
                        transaction,
                    });

                    if (!subscription) {
                        throw new Error(`Subscription not found for Razorpay id ${razorpaySubscriptionId}`);
                    }

                    tenantId = subscription.tenant_id;

                    await subscription.update(
                        {
                            status: 'active',
                            current_period_start: entity.currentPeriodStart || subscription.current_period_start,
                            current_period_end: entity.currentPeriodEnd || subscription.current_period_end,
                            plan_type: this.resolvePendingPlanType(subscription),
                            last_payment_at: subscription.last_payment_at || new Date(),
                        },
                        { transaction },
                    );

                    break;
                }
                case 'subscription.pending':
                case 'subscription.halted':
                case 'subscription.paused':
                case 'subscription.resumed':
                case 'subscription.completed':
                case 'subscription.updated':
                case 'subscription.charged': {
                    const subscriptionId = entity.subscriptionId;
                    if (!subscriptionId) {
                        throw new Error(`Missing subscription id in ${eventType} payload`);
                    }

                    const subscription = await BillingSubscriptionModel.findOne({
                        where: { razorpay_subscription_id: subscriptionId },
                        transaction,
                    });

                    if (!subscription) {
                        throw new Error(`Subscription not found for ${subscriptionId}`);
                    }

                    tenantId = subscription.tenant_id;
                    const nextStatus =
                        eventType === 'subscription.charged' || eventType === 'subscription.resumed'
                            ? 'active'
                            : this.mapRazorpaySubscriptionStatus(entity.subscriptionStatus || eventType.split('.')[1]);
                    const nextPlanType =
                        eventType === 'subscription.charged' || eventType === 'subscription.resumed'
                            ? this.resolvePendingPlanType(subscription)
                            : subscription.plan_type;

                    await subscription.update(
                        {
                            status: nextStatus,
                            plan_type: nextPlanType,
                            current_period_start: entity.currentPeriodStart || subscription.current_period_start,
                            current_period_end: entity.currentPeriodEnd || subscription.current_period_end,
                            last_payment_at:
                                eventType === 'subscription.charged'
                                    ? new Date()
                                    : subscription.last_payment_at,
                        },
                        { transaction },
                    );

                    if (eventType === 'subscription.charged' && entity.paymentId) {
                        await this.recordPaymentFromWebhook(
                            {
                                tenantId: subscription.tenant_id,
                                subscriptionId: subscription.id,
                                sourceType: 'subscription',
                                amountPaise: entity.amountPaise,
                                currency: entity.currency || BILLING_CURRENCY,
                                razorpayPaymentId: entity.paymentId,
                                razorpayOrderId: entity.orderId,
                                razorpaySubscriptionId: entity.subscriptionId,
                                status: 'captured',
                                rawPayload: input.payload,
                            },
                            transaction,
                        );
                    }

                    break;
                }
                case 'payment.captured': {
                    const paymentId = entity.paymentId;
                    if (!paymentId) {
                        throw new Error('Missing payment id in captured payload');
                    }

                    let sourceType: PaymentSourceType = 'subscription';
                    let invoiceId: string | null = null;
                    let subscriptionId: string | null = null;

                    if (entity.orderId) {
                        const invoice = await BillingInvoiceModel.findOne({
                            where: { razorpay_order_id: entity.orderId },
                            transaction,
                        });

                        if (invoice) {
                            invoiceId = invoice.id;
                            tenantId = invoice.tenant_id;
                            sourceType =
                                invoice.invoice_type === 'lifetime_purchase'
                                    ? 'lifetime_purchase'
                                    : 'usage_invoice';

                            if (invoice.status !== 'paid') {
                                await invoice.update(
                                    {
                                        status: 'paid',
                                        paid_at: new Date(),
                                        razorpay_payment_id: paymentId,
                                    },
                                    { transaction },
                                );

                                if (invoice.coupon_code) {
                                    await this.incrementCouponUsage(invoice.coupon_code, transaction);
                                }

                                if (invoice.invoice_type === 'lifetime_purchase') {
                                    const subscription = await this.getOrCreateTrialSubscription(
                                        invoice.tenant_id,
                                        undefined,
                                        transaction,
                                    );
                                    subscriptionId = subscription.id;

                                    await subscription.update(
                                        {
                                            plan_type: 'lifetime',
                                            status: 'active',
                                            trial_end_at: subscription.trial_end_at,
                                            current_period_start: new Date(),
                                            current_period_end: null,
                                            last_payment_at: new Date(),
                                        },
                                        { transaction },
                                    );
                                }
                            }
                        }
                    }

                    if (!invoiceId && entity.subscriptionId) {
                        const subscription = await BillingSubscriptionModel.findOne({
                            where: { razorpay_subscription_id: entity.subscriptionId },
                            transaction,
                        });

                        if (subscription) {
                            subscriptionId = subscription.id;
                            tenantId = subscription.tenant_id;
                            sourceType = 'subscription';

                            await subscription.update(
                                {
                                    status: 'active',
                                    last_payment_at: new Date(),
                                },
                                { transaction },
                            );
                        }
                    }

                    if (!tenantId) {
                        throw new Error('Unable to resolve tenant for payment.captured event');
                    }

                    await this.recordPaymentFromWebhook(
                        {
                            tenantId,
                            invoiceId,
                            subscriptionId,
                            sourceType,
                            amountPaise: entity.amountPaise,
                            currency: entity.currency || BILLING_CURRENCY,
                            razorpayPaymentId: paymentId,
                            razorpayOrderId: entity.orderId,
                            razorpaySubscriptionId: entity.subscriptionId,
                            status: 'captured',
                            rawPayload: input.payload,
                        },
                        transaction,
                    );

                    break;
                }
                case 'payment.failed': {
                    const paymentId = entity.paymentId;
                    if (!paymentId) {
                        throw new Error('Missing payment id in failed payload');
                    }

                    let sourceType: PaymentSourceType = 'subscription';
                    let invoiceId: string | null = null;
                    let subscriptionId: string | null = null;

                    if (entity.orderId) {
                        const invoice = await BillingInvoiceModel.findOne({
                            where: { razorpay_order_id: entity.orderId },
                            transaction,
                        });

                        if (invoice) {
                            invoiceId = invoice.id;
                            tenantId = invoice.tenant_id;
                            sourceType =
                                invoice.invoice_type === 'lifetime_purchase'
                                    ? 'lifetime_purchase'
                                    : 'usage_invoice';

                            if (invoice.status !== 'paid') {
                                await invoice.update(
                                    {
                                        status: 'failed',
                                    },
                                    { transaction },
                                );
                            }
                        }
                    }

                    if (entity.subscriptionId) {
                        const subscription = await BillingSubscriptionModel.findOne({
                            where: { razorpay_subscription_id: entity.subscriptionId },
                            transaction,
                        });

                        if (subscription) {
                            subscriptionId = subscription.id;
                            tenantId = subscription.tenant_id;
                            sourceType = 'subscription';

                            await subscription.update(
                                {
                                    status: 'past_due',
                                },
                                { transaction },
                            );
                        }
                    }

                    if (!tenantId) {
                        throw new Error('Unable to resolve tenant for payment.failed event');
                    }

                    await this.recordPaymentFromWebhook(
                        {
                            tenantId,
                            invoiceId,
                            subscriptionId,
                            sourceType,
                            amountPaise: entity.amountPaise,
                            currency: entity.currency || BILLING_CURRENCY,
                            razorpayPaymentId: paymentId,
                            razorpayOrderId: entity.orderId,
                            razorpaySubscriptionId: entity.subscriptionId,
                            status: this.mapRazorpayPaymentStatus(entity.paymentStatus),
                            failureReason: entity.paymentErrorDescription,
                            rawPayload: input.payload,
                        },
                        transaction,
                    );

                    break;
                }
                case 'subscription.cancelled': {
                    const subscriptionId = entity.subscriptionId;
                    if (!subscriptionId) {
                        throw new Error('Missing subscription id in cancelled payload');
                    }

                    const subscription = await BillingSubscriptionModel.findOne({
                        where: { razorpay_subscription_id: subscriptionId },
                        transaction,
                    });

                    if (!subscription) {
                        throw new Error(`Subscription not found for ${subscriptionId}`);
                    }

                    tenantId = subscription.tenant_id;

                    await subscription.update(
                        {
                            status: 'cancelled',
                            current_period_end: entity.currentPeriodEnd || subscription.current_period_end,
                        },
                        { transaction },
                    );

                    break;
                }
                default:
                    break;
            }

            await BillingWebhookEventModel.create(
                {
                    event_id: eventId,
                    event_type: eventType,
                    tenant_id: tenantId,
                    payload: input.payload,
                    processed_at: new Date(),
                },
                { transaction },
            );

            return {
                duplicate: false,
                eventId,
                eventType,
                tenantId,
            };
        });

        return processingResult;
    }

    private async recordPaymentFromWebhook(
        input: {
            tenantId: string;
            invoiceId?: string | null;
            subscriptionId?: string | null;
            sourceType: PaymentSourceType;
            amountPaise: number;
            currency: string;
            razorpayPaymentId?: string | null;
            razorpayOrderId?: string | null;
            razorpaySubscriptionId?: string | null;
            status: PaymentStatus;
            failureReason?: string | null;
            rawPayload: Record<string, unknown>;
        },
        transaction: Transaction,
    ) {
        if (input.razorpayPaymentId) {
            const existing = await BillingPaymentModel.findOne({
                where: { razorpay_payment_id: input.razorpayPaymentId },
                transaction,
            });

            if (existing) {
                return existing;
            }
        }

        return BillingPaymentModel.create(
            {
                tenant_id: input.tenantId,
                billing_invoice_id: input.invoiceId || null,
                billing_subscription_id: input.subscriptionId || null,
                source_type: input.sourceType,
                status: input.status,
                amount_paise: input.amountPaise,
                currency: input.currency,
                razorpay_payment_id: input.razorpayPaymentId || null,
                razorpay_order_id: input.razorpayOrderId || null,
                razorpay_subscription_id: input.razorpaySubscriptionId || null,
                failure_reason: input.failureReason || null,
                captured_at: input.status === 'captured' ? new Date() : null,
                raw_payload: input.rawPayload,
            },
            { transaction },
        );
    }

    private resolveWebhookEntity(payload: Record<string, unknown>) {
        const payloadObject = payload.payload as Record<string, unknown> | undefined;
        const subscriptionEntity = ((payloadObject?.subscription as Record<string, unknown> | undefined)
            ?.entity ||
            (payloadObject?.subscription as Record<string, unknown> | undefined)) as
            | Record<string, unknown>
            | undefined;
        const paymentEntity = ((payloadObject?.payment as Record<string, unknown> | undefined)
            ?.entity ||
            (payloadObject?.payment as Record<string, unknown> | undefined)) as
            | Record<string, unknown>
            | undefined;

        const subscriptionFromPayment = paymentEntity?.subscription_id;
        const subscriptionNotes = subscriptionEntity?.notes as Record<string, unknown> | undefined;
        const paymentNotes = paymentEntity?.notes as Record<string, unknown> | undefined;

        return {
            tenantId:
                (typeof subscriptionNotes?.tenantId === 'string' ? subscriptionNotes.tenantId : null) ||
                (typeof paymentNotes?.tenantId === 'string' ? paymentNotes.tenantId : null) ||
                null,
            subscriptionId:
                (typeof subscriptionEntity?.id === 'string' ? subscriptionEntity.id : null) ||
                (typeof subscriptionFromPayment === 'string' ? subscriptionFromPayment : null),
            subscriptionStatus:
                typeof subscriptionEntity?.status === 'string' ? subscriptionEntity.status.toLowerCase() : '',
            paymentId: typeof paymentEntity?.id === 'string' ? paymentEntity.id : null,
            paymentStatus: typeof paymentEntity?.status === 'string' ? paymentEntity.status.toLowerCase() : '',
            orderId: typeof paymentEntity?.order_id === 'string' ? paymentEntity.order_id : null,
            paymentErrorDescription:
                typeof paymentEntity?.error_description === 'string'
                    ? paymentEntity.error_description
                    : typeof paymentEntity?.error_reason === 'string'
                      ? paymentEntity.error_reason
                      : null,
            amountPaise: toNumber(paymentEntity?.amount),
            currency: typeof paymentEntity?.currency === 'string' ? paymentEntity.currency : BILLING_CURRENCY,
            currentPeriodStart: this.toUnixDate(subscriptionEntity?.current_start),
            currentPeriodEnd: this.toUnixDate(subscriptionEntity?.current_end),
        };
    }

    private fallbackEventId(eventType: string, rawBody: string | Buffer): string {
        const digest = createHash('sha256').update(rawBody).digest('hex');
        return `${eventType}:${digest}`;
    }

    private toUnixDate(value: unknown): Date | null {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return null;
        }

        return new Date(value * 1000);
    }

    private mapRazorpaySubscriptionStatus(status: unknown): SubscriptionStatus {
        const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';

        switch (normalized) {
            case 'active':
                return 'active';
            case 'pending':
            case 'created':
                return 'trialing';
            case 'halted':
            case 'paused':
                return 'past_due';
            case 'cancelled':
                return 'cancelled';
            case 'completed':
                return 'expired';
            default:
                return 'inactive';
        }
    }

    private mapRazorpayPaymentStatus(status: unknown): PaymentStatus {
        const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';

        if (normalized === 'captured') {
            return 'captured';
        }

        if (normalized === 'refunded') {
            return 'refunded';
        }

        if (normalized === 'created' || normalized === 'authorized') {
            return 'created';
        }

        return 'failed';
    }

    private resolvePendingPlanType(subscription: BillingSubscriptionModel): BillingPlanType {
        const pendingPlan = subscription.metadata?.pendingPlanType;
        if (
            typeof pendingPlan === 'string' &&
            (pendingPlan === 'monthly' || pendingPlan === 'yearly' || pendingPlan === 'lifetime')
        ) {
            return pendingPlan;
        }

        if (subscription.plan_type === 'trial') {
            return 'monthly';
        }

        return subscription.plan_type;
    }

    private async incrementCouponUsage(code: string, transaction: Transaction) {
        const coupon = await BillingCouponModel.findOne({
            where: { code: normalizeCouponCode(code) },
            transaction,
        });

        if (!coupon) {
            return;
        }

        await coupon.update(
            {
                used_count: coupon.used_count + 1,
            },
            { transaction },
        );
    }

    private async getOrCreateTrialSubscription(
        tenantId: string,
        createdByUserId?: string | null,
        transaction?: Transaction,
    ) {
        const existing = await BillingSubscriptionModel.findOne({
            where: { tenant_id: tenantId },
            transaction,
        });

        if (existing) {
            return existing;
        }

        const now = new Date();
        const trialEnd = addDays(now, this.trialDays);

        const created = await BillingSubscriptionModel.create(
            {
                tenant_id: tenantId,
                plan_type: 'trial',
                status: 'trialing',
                trial_start_at: now,
                trial_end_at: trialEnd,
                current_period_start: now,
                current_period_end: trialEnd,
                created_by_user_id: createdByUserId || null,
                metadata: {
                    source: 'auto_trial_bootstrap',
                },
            },
            { transaction },
        );

        await this.recordAudit(
            {
                tenantId,
                actorUserId: createdByUserId || null,
                actionType: 'trial_created',
                afterState: {
                    trialStartAt: now,
                    trialEndAt: trialEnd,
                    status: 'trialing',
                },
            },
            transaction,
        );

        return created;
    }

    private computeAccessState(subscription: BillingSubscriptionModel, now: Date) {
        if (subscription.write_blocked_override) {
            return {
                canWrite: false,
                canRead: true,
                reason: 'write_blocked_override',
            };
        }

        if (subscription.status === 'active') {
            if (subscription.plan_type === 'lifetime') {
                return { canWrite: true, canRead: true, reason: null };
            }

            if (!subscription.current_period_end || subscription.current_period_end >= now) {
                return { canWrite: true, canRead: true, reason: null };
            }

            return {
                canWrite: false,
                canRead: true,
                reason: 'subscription_period_expired',
            };
        }

        if (subscription.status === 'trialing') {
            if (subscription.trial_end_at && subscription.trial_end_at >= now) {
                return {
                    canWrite: true,
                    canRead: true,
                    reason: null,
                };
            }

            return {
                canWrite: false,
                canRead: true,
                reason: 'trial_expired',
            };
        }

        return {
            canWrite: false,
            canRead: true,
            reason: `subscription_${subscription.status}`,
        };
    }

    private async ensureUsageConfigs() {
        const defaultConfigs: Record<BillingPlanType, UsageFeatureConfig[]> = {
            trial: DEFAULT_USAGE_FEATURES,
            monthly: DEFAULT_USAGE_FEATURES,
            yearly: [
                { featureKey: 'messages', freeLimit: 1000, overageUnitPricePaise: 12 },
                { featureKey: 'contacts', freeLimit: 2500, overageUnitPricePaise: 4 },
                { featureKey: 'campaigns', freeLimit: 70, overageUnitPricePaise: 2200 },
            ],
            lifetime: [
                { featureKey: 'messages', freeLimit: 1200, overageUnitPricePaise: 10 },
                { featureKey: 'contacts', freeLimit: 3000, overageUnitPricePaise: 3 },
                { featureKey: 'campaigns', freeLimit: 80, overageUnitPricePaise: 1800 },
            ],
        };

        for (const [planType, featureConfigs] of Object.entries(defaultConfigs)) {
            await BillingUsageConfigModel.findOrCreate({
                where: { plan_type: planType as BillingPlanType },
                defaults: {
                    plan_type: planType as BillingPlanType,
                    feature_configs: featureConfigs,
                },
            });
        }
    }

    private async getUsageConfigForPlan(planType: BillingPlanType): Promise<UsageFeatureConfig[]> {
        await this.ensureUsageConfigs();

        const config = await BillingUsageConfigModel.findOne({
            where: { plan_type: planType },
        });

        if (config?.feature_configs?.length) {
            return config.feature_configs;
        }

        const trialConfig = await BillingUsageConfigModel.findOne({
            where: { plan_type: 'trial' },
        });

        return trialConfig?.feature_configs || DEFAULT_USAGE_FEATURES;
    }

    private async resolveCouponForCheckout(input: {
        couponCode?: string;
        scope: CouponScope;
        planType?: BillingPlanType;
    }) {
        if (!input.couponCode) {
            return null;
        }

        const validation = await this.validateCoupon({
            code: input.couponCode,
            scope: input.scope,
            planType: input.planType,
        });

        if (!validation.valid || !validation.coupon) {
            throw new Error(validation.reason || 'Invalid coupon');
        }

        return validation.coupon;
    }

    private applyDiscount(subtotalAmountPaise: number, coupon: BillingCouponModel | null): DiscountResult {
        if (!coupon) {
            return {
                subtotalAmountPaise,
                discountAmountPaise: 0,
                totalAmountPaise: subtotalAmountPaise,
                couponCode: null,
            };
        }

        let discountAmountPaise = 0;

        if (coupon.discount_type === 'fixed') {
            discountAmountPaise = coupon.discount_value;
        }

        if (coupon.discount_type === 'percent') {
            discountAmountPaise = Math.floor((subtotalAmountPaise * coupon.discount_value) / 100);
        }

        if (coupon.max_discount_amount_paise !== null && coupon.max_discount_amount_paise !== undefined) {
            discountAmountPaise = Math.min(discountAmountPaise, coupon.max_discount_amount_paise);
        }

        discountAmountPaise = Math.max(0, Math.min(discountAmountPaise, subtotalAmountPaise));

        return {
            subtotalAmountPaise,
            discountAmountPaise,
            totalAmountPaise: subtotalAmountPaise - discountAmountPaise,
            couponCode: coupon.code,
        };
    }

    private async ensureRazorpayCustomer(
        subscription: BillingSubscriptionModel,
        input: { tenantName: string; email: string; tenantId: string },
    ): Promise<string> {
        if (subscription.razorpay_customer_id) {
            return subscription.razorpay_customer_id;
        }

        const customer = await this.razorpayClient.createCustomer({
            name: input.tenantName,
            email: input.email,
            tenantId: input.tenantId,
        });

        await subscription.update({
            razorpay_customer_id: customer.id,
        });

        return customer.id;
    }

    private resolveTrialActionType(previousTrialEnd: Date | null | undefined, nextTrialEnd: Date): string {
        if (!previousTrialEnd) {
            return 'trial_set';
        }

        if (nextTrialEnd.getTime() > previousTrialEnd.getTime()) {
            return 'trial_extended';
        }

        if (nextTrialEnd.getTime() < previousTrialEnd.getTime()) {
            return 'trial_reduced';
        }

        return 'trial_set';
    }

    private async recordAudit(
        input: {
            tenantId: string;
            actorUserId?: string | null;
            actionType: string;
            reason?: string;
            beforeState?: Record<string, unknown>;
            afterState?: Record<string, unknown>;
            metadata?: Record<string, unknown>;
        },
        transaction?: Transaction,
    ) {
        await BillingAuditLogModel.create(
            {
                tenant_id: input.tenantId,
                actor_user_id: input.actorUserId || null,
                action_type: input.actionType,
                reason: input.reason || null,
                before_state: input.beforeState || {},
                after_state: input.afterState || {},
                metadata: input.metadata || {},
            },
            transaction ? { transaction } : undefined,
        );
    }
}

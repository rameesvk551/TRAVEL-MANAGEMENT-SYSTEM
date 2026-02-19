import { NextFunction, Request, Response } from 'express';
import { BillingService } from './billing.service.js';
import {
    type BillingPlanType,
    type CouponDiscountType,
    type CouponScope,
    type UsageFeatureConfig,
} from './billing.types.js';
import { AppError } from '../../shared/errors/AppError.js';

const BILLING_PLAN_TYPES = new Set<BillingPlanType>(['trial', 'monthly', 'yearly', 'lifetime']);
const COUPON_SCOPES = new Set<CouponScope>(['subscription', 'usage', 'all']);
const COUPON_DISCOUNT_TYPES = new Set<CouponDiscountType>(['fixed', 'percent']);

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        tenantId: string;
        role: string;
    };
    rawBody?: Buffer;
};

export class BillingController {
    constructor(private readonly billingService: BillingService) {}

    getCurrentSubscription = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const data = await this.billingService.getCurrentSubscription(user.tenantId);

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getUsageStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const month = typeof req.query.month === 'string' ? req.query.month : undefined;
            const data = await this.billingService.getUsageStats({ tenantId: user.tenantId, month });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getPaymentHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const page = this.parsePositiveInteger(req.query.page, 'page');
            const pageSize = this.parsePositiveInteger(req.query.pageSize, 'pageSize');
            const data = await this.billingService.getPaymentHistory({
                tenantId: user.tenantId,
                page: page || undefined,
                pageSize: pageSize || undefined,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getPendingInvoices = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const data = await this.billingService.getPendingInvoices(user.tenantId);

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    validateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const code = String(req.body?.code || '').trim();
            const scope = String(req.body?.scope || '').trim().toLowerCase() as CouponScope;
            const planTypeRaw = req.body?.planType;
            const planType =
                typeof planTypeRaw === 'string' && BILLING_PLAN_TYPES.has(planTypeRaw as BillingPlanType)
                    ? (planTypeRaw as BillingPlanType)
                    : undefined;

            if (!code) {
                throw new AppError('code is required', 400);
            }

            if (!COUPON_SCOPES.has(scope)) {
                throw new AppError('scope must be one of subscription|usage|all', 400);
            }

            const data = await this.billingService.validateCoupon({ code, scope, planType });
            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    createSubscriptionCheckout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const planType = String(req.body?.planType || '').trim() as 'monthly' | 'yearly';
            const couponCode =
                typeof req.body?.couponCode === 'string' && req.body.couponCode.trim().length > 0
                    ? req.body.couponCode
                    : undefined;

            if (!(planType === 'monthly' || planType === 'yearly')) {
                throw new AppError('planType must be monthly or yearly', 400);
            }

            const data = await this.billingService.createSubscriptionCheckout({
                tenantId: user.tenantId,
                planType,
                couponCode,
                requestedByUserId: user.id,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    createLifetimeCheckout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const couponCode =
                typeof req.body?.couponCode === 'string' && req.body.couponCode.trim().length > 0
                    ? req.body.couponCode
                    : undefined;

            const data = await this.billingService.createLifetimeCheckout({
                tenantId: user.tenantId,
                requestedByUserId: user.id,
                couponCode,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    createUsageInvoiceCheckout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const invoiceId = String(req.body?.invoiceId || '').trim();
            const couponCode =
                typeof req.body?.couponCode === 'string' && req.body.couponCode.trim().length > 0
                    ? req.body.couponCode
                    : undefined;

            if (!invoiceId) {
                throw new AppError('invoiceId is required', 400);
            }

            const data = await this.billingService.createUsageInvoiceCheckout({
                tenantId: user.tenantId,
                invoiceId,
                couponCode,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    trackUsage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const featureKey = String(req.body?.featureKey || '').trim();
            const quantity = Number(req.body?.quantity);
            const metadata =
                req.body?.metadata && typeof req.body.metadata === 'object'
                    ? (req.body.metadata as Record<string, unknown>)
                    : undefined;

            if (!featureKey) {
                throw new AppError('featureKey is required', 400);
            }

            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new AppError('quantity must be greater than 0', 400);
            }

            const data = await this.billingService.trackUsage({
                tenantId: user.tenantId,
                featureKey,
                quantity,
                metadata,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getBillingAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const tenantId =
                typeof req.query.tenantId === 'string' && req.query.tenantId.trim().length > 0
                    ? req.query.tenantId
                    : undefined;
            const page = this.parsePositiveInteger(req.query.page, 'page');
            const pageSize = this.parsePositiveInteger(req.query.pageSize, 'pageSize');

            const data = await this.billingService.getBillingAuditLogs({
                tenantId,
                page: page || undefined,
                pageSize: pageSize || undefined,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getCoupons = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const page = this.parsePositiveInteger(req.query.page, 'page');
            const pageSize = this.parsePositiveInteger(req.query.pageSize, 'pageSize');
            const search = typeof req.query.search === 'string' ? req.query.search : undefined;
            const scope =
                typeof req.query.scope === 'string' && COUPON_SCOPES.has(req.query.scope as CouponScope)
                    ? (req.query.scope as CouponScope)
                    : undefined;
            const active = this.parseBooleanQuery(req.query.active, 'active');

            const data = await this.billingService.getCoupons({
                page: page || undefined,
                pageSize: pageSize || undefined,
                search,
                scope,
                active,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    getUsageConfigs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const planTypeRaw = typeof req.query.planType === 'string' ? req.query.planType.trim() : '';
            const planType =
                planTypeRaw && BILLING_PLAN_TYPES.has(planTypeRaw as BillingPlanType)
                    ? (planTypeRaw as BillingPlanType)
                    : undefined;

            if (planTypeRaw && !planType) {
                throw new AppError('planType must be one of trial|monthly|yearly|lifetime', 400);
            }

            const data = await this.billingService.getUsageConfigs({
                planType,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    upsertUsageConfig = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const planType = String(req.params.planType || '').trim() as BillingPlanType;
            const features = req.body?.features as UsageFeatureConfig[] | undefined;

            if (!BILLING_PLAN_TYPES.has(planType)) {
                throw new AppError('planType must be one of trial|monthly|yearly|lifetime', 400);
            }

            if (!Array.isArray(features) || features.length === 0) {
                throw new AppError('features must be a non-empty array', 400);
            }

            for (const feature of features) {
                if (!feature || typeof feature.featureKey !== 'string' || !feature.featureKey.trim()) {
                    throw new AppError('Each feature requires featureKey', 400);
                }
                if (!Number.isFinite(feature.freeLimit) || feature.freeLimit < 0) {
                    throw new AppError('Each feature requires freeLimit >= 0', 400);
                }
                if (!Number.isFinite(feature.overageUnitPricePaise) || feature.overageUnitPricePaise < 0) {
                    throw new AppError('Each feature requires overageUnitPricePaise >= 0', 400);
                }
            }

            const data = await this.billingService.upsertUsageConfig({
                actorUserId: user.id,
                actorTenantId: user.tenantId,
                planType,
                features,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    createCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const code = String(req.body?.code || '').trim();
            const scope = String(req.body?.scope || '').trim().toLowerCase() as CouponScope;
            const discountType = String(req.body?.discountType || '').trim().toLowerCase() as CouponDiscountType;
            const discountValue = Number(req.body?.discountValue);
            const maxDiscountAmountPaise = this.parseNullableNumber(req.body?.maxDiscountAmountPaise);
            const usageLimit = this.parseNullableNumber(req.body?.usageLimit);
            const validFrom = this.parseOptionalDate(req.body?.validFrom, 'validFrom');
            const validUntil = this.parseOptionalDate(req.body?.validUntil, 'validUntil');
            const applicablePlanTypes = this.parsePlanTypeArray(req.body?.applicablePlanTypes);
            const razorpayOfferId =
                typeof req.body?.razorpayOfferId === 'string' && req.body.razorpayOfferId.trim().length > 0
                    ? req.body.razorpayOfferId.trim()
                    : undefined;
            const metadata =
                req.body?.metadata && typeof req.body.metadata === 'object'
                    ? (req.body.metadata as Record<string, unknown>)
                    : undefined;

            if (!code) {
                throw new AppError('code is required', 400);
            }
            if (!COUPON_SCOPES.has(scope)) {
                throw new AppError('scope must be one of subscription|usage|all', 400);
            }
            if (!COUPON_DISCOUNT_TYPES.has(discountType)) {
                throw new AppError('discountType must be fixed or percent', 400);
            }
            if (!Number.isFinite(discountValue) || discountValue <= 0) {
                throw new AppError('discountValue must be greater than 0', 400);
            }

            const data = await this.billingService.createCoupon({
                actorUserId: user.id,
                actorTenantId: user.tenantId,
                code,
                scope,
                discountType,
                discountValue,
                maxDiscountAmountPaise: maxDiscountAmountPaise ?? undefined,
                usageLimit: usageLimit ?? undefined,
                validFrom: validFrom ?? undefined,
                validUntil: validUntil ?? undefined,
                applicablePlanTypes: applicablePlanTypes ?? undefined,
                razorpayOfferId,
                metadata,
            });

            res.status(201).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    updateCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const couponId = String(req.params.couponId || '').trim();
            if (!couponId) {
                throw new AppError('couponId is required', 400);
            }

            const code =
                typeof req.body?.code === 'string' && req.body.code.trim().length > 0
                    ? req.body.code.trim()
                    : undefined;
            const scope =
                typeof req.body?.scope === 'string' && req.body.scope.trim().length > 0
                    ? (req.body.scope.trim().toLowerCase() as CouponScope)
                    : undefined;
            const discountType =
                typeof req.body?.discountType === 'string' && req.body.discountType.trim().length > 0
                    ? (req.body.discountType.trim().toLowerCase() as CouponDiscountType)
                    : undefined;
            const discountValue =
                req.body?.discountValue === undefined || req.body.discountValue === null || req.body.discountValue === ''
                    ? undefined
                    : Number(req.body.discountValue);

            if (scope !== undefined && !COUPON_SCOPES.has(scope)) {
                throw new AppError('scope must be one of subscription|usage|all', 400);
            }

            if (discountType !== undefined && !COUPON_DISCOUNT_TYPES.has(discountType)) {
                throw new AppError('discountType must be fixed or percent', 400);
            }

            if (discountValue !== undefined && (!Number.isFinite(discountValue) || discountValue <= 0)) {
                throw new AppError('discountValue must be greater than 0', 400);
            }

            const data = await this.billingService.updateCoupon({
                couponId,
                actorUserId: user.id,
                actorTenantId: user.tenantId,
                code,
                scope,
                discountType,
                discountValue,
                active: typeof req.body?.active === 'boolean' ? req.body.active : undefined,
                validFrom: this.parseOptionalDateOrNull(req.body?.validFrom, 'validFrom'),
                validUntil: this.parseOptionalDateOrNull(req.body?.validUntil, 'validUntil'),
                usageLimit: this.parseOptionalNumberOrNull(req.body?.usageLimit, 'usageLimit'),
                maxDiscountAmountPaise: this.parseOptionalNumberOrNull(
                    req.body?.maxDiscountAmountPaise,
                    'maxDiscountAmountPaise',
                ),
                applicablePlanTypes: this.parsePlanTypeArray(req.body?.applicablePlanTypes) ?? undefined,
                razorpayOfferId:
                    req.body?.razorpayOfferId === null
                        ? null
                        : typeof req.body?.razorpayOfferId === 'string'
                          ? req.body.razorpayOfferId
                          : undefined,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    deleteCoupon = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const couponId = String(req.params.couponId || '').trim();
            const reason =
                typeof req.body?.reason === 'string' && req.body.reason.trim().length > 0
                    ? req.body.reason.trim()
                    : undefined;

            if (!couponId) {
                throw new AppError('couponId is required', 400);
            }

            const data = await this.billingService.deleteCoupon({
                couponId,
                actorUserId: user.id,
                actorTenantId: user.tenantId,
                reason,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    updateTrialWindow = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const user = this.getAuthenticatedUser(req);
            const tenantId = String(req.params.tenantId || '').trim();
            const trialEndAt = this.parseRequiredDate(req.body?.trialEndAt, 'trialEndAt');
            const trialStartAt = this.parseOptionalDate(req.body?.trialStartAt, 'trialStartAt');
            const reason =
                typeof req.body?.reason === 'string' && req.body.reason.trim().length > 0
                    ? req.body.reason.trim()
                    : undefined;

            if (!tenantId) {
                throw new AppError('tenantId is required', 400);
            }

            const data = await this.billingService.updateTrialWindow({
                tenantId,
                actorUserId: user.id,
                reason,
                trialStartAt: trialStartAt ?? undefined,
                trialEndAt,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    runMonthlyUsageBilling = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const referenceDate = this.parseOptionalDate(req.body?.referenceDate, 'referenceDate');
            const data = await this.billingService.runMonthlyUsageBilling(referenceDate || new Date());

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    runRazorpayReconciliation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const lookbackHours = this.parsePositiveInteger(req.body?.lookbackHours, 'lookbackHours');
            const data = await this.billingService.runRazorpayReconciliation({
                lookbackHours: lookbackHours || undefined,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    handleWebhook = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const signatureHeader = req.headers['x-razorpay-signature'];
            const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

            if (!signature || typeof signature !== 'string') {
                throw new AppError('Missing x-razorpay-signature header', 400);
            }

            const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body || {}), 'utf8');
            let payload: Record<string, unknown>;

            if (Buffer.isBuffer(req.body)) {
                payload = JSON.parse(req.body.toString('utf8')) as Record<string, unknown>;
            } else {
                payload = (req.body || {}) as Record<string, unknown>;
            }

            const eventIdHeader = req.headers['x-razorpay-event-id'];
            const eventIdFromHeader = Array.isArray(eventIdHeader) ? eventIdHeader[0] : eventIdHeader;
            const eventIdFromBody = typeof payload?.['event_id'] === 'string' ? payload['event_id'] : '';
            const eventId = eventIdFromHeader || eventIdFromBody || '';

            const data = await this.billingService.processRazorpayWebhook({
                eventId,
                signature,
                rawBody,
                payload,
            });

            res.status(200).json({ status: 'success', data });
        } catch (error) {
            next(error);
        }
    };

    private getAuthenticatedUser(req: AuthenticatedRequest) {
        if (!req.user) {
            throw new AppError('Not authenticated', 401);
        }
        return req.user;
    }

    private parseRequiredDate(value: unknown, fieldName: string): Date {
        const parsed = this.parseOptionalDate(value, fieldName);
        if (!parsed) {
            throw new AppError(`${fieldName} is required`, 400);
        }
        return parsed;
    }

    private parseOptionalDate(value: unknown, fieldName: string): Date | null {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        const parsed = new Date(String(value));
        if (Number.isNaN(parsed.getTime())) {
            throw new AppError(`${fieldName} must be a valid date`, 400);
        }
        return parsed;
    }

    private parseOptionalDateOrNull(value: unknown, fieldName: string): Date | null | undefined {
        if (value === undefined) {
            return undefined;
        }
        if (value === null || value === '') {
            return null;
        }
        return this.parseOptionalDate(value, fieldName);
    }

    private parsePositiveInteger(value: unknown, fieldName: string): number | null {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }

        return parsed;
    }

    private parseNullableNumber(value: unknown): number | null {
        if (value === undefined || value === null || value === '') {
            return null;
        }

        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            throw new AppError('Numeric value is invalid', 400);
        }

        return parsed;
    }

    private parseOptionalNumberOrNull(value: unknown, fieldName: string): number | null | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (value === null || value === '') {
            return null;
        }

        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            throw new AppError(`${fieldName} must be a valid number`, 400);
        }

        return parsed;
    }

    private parseBooleanQuery(value: unknown, fieldName: string): boolean | undefined {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true' || normalized === '1') {
                return true;
            }
            if (normalized === 'false' || normalized === '0') {
                return false;
            }
        }

        throw new AppError(`${fieldName} must be true or false`, 400);
    }

    private parsePlanTypeArray(value: unknown): BillingPlanType[] | null {
        if (value === undefined || value === null) {
            return null;
        }

        if (!Array.isArray(value)) {
            throw new AppError('applicablePlanTypes must be an array', 400);
        }

        const planTypes: BillingPlanType[] = [];
        for (const planType of value) {
            if (typeof planType !== 'string' || !BILLING_PLAN_TYPES.has(planType as BillingPlanType)) {
                throw new AppError('applicablePlanTypes contains an invalid plan type', 400);
            }
            planTypes.push(planType as BillingPlanType);
        }

        return planTypes;
    }
}

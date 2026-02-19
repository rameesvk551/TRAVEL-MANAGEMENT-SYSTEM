export const BILLING_CURRENCY = 'INR' as const;
export const DEFAULT_TRIAL_DAYS = 30;

export const PLAN_PRICES_PAISE = {
    monthly: 29900,
    yearly: 300000,
    lifetime: 999900,
} as const;

export type BillingPlanType = keyof typeof PLAN_PRICES_PAISE | 'trial';

export type SubscriptionStatus =
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'cancelled'
    | 'expired'
    | 'inactive';

export type InvoiceType = 'usage_overage' | 'lifetime_purchase';

export type InvoiceStatus = 'draft' | 'issued' | 'pending_payment' | 'paid' | 'void' | 'failed';

export type PaymentStatus = 'created' | 'captured' | 'failed' | 'refunded';

export type PaymentSourceType = 'subscription' | 'usage_invoice' | 'lifetime_purchase';

export type CouponScope = 'subscription' | 'usage' | 'all';

export type CouponDiscountType = 'fixed' | 'percent';

export interface UsageFeatureConfig {
    featureKey: string;
    freeLimit: number;
    overageUnitPricePaise: number;
}

export interface UsageFeatureCounter {
    featureKey: string;
    usedUnits: number;
    freeLimit: number;
    overageUnits: number;
    overageUnitPricePaise: number;
    overageAmountPaise: number;
}

export interface DiscountResult {
    discountAmountPaise: number;
    couponCode: string | null;
    subtotalAmountPaise: number;
    totalAmountPaise: number;
}

export const SUPER_ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'owner']);

export const ADMIN_ROLES = new Set(['super_admin', 'platform_admin', 'owner', 'admin']);

export const READ_ONLY_HTTP_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const DEFAULT_USAGE_FEATURES: UsageFeatureConfig[] = [
    { featureKey: 'messages', freeLimit: 1000, overageUnitPricePaise: 15 },
    { featureKey: 'contacts', freeLimit: 2000, overageUnitPricePaise: 5 },
    { featureKey: 'campaigns', freeLimit: 50, overageUnitPricePaise: 2500 },
    { featureKey: 'emails', freeLimit: 500, overageUnitPricePaise: 5 },
];

export const WEBHOOK_EVENT_TYPES = new Set([
    'subscription.activated',
    'subscription.pending',
    'subscription.charged',
    'subscription.halted',
    'subscription.paused',
    'subscription.resumed',
    'subscription.completed',
    'subscription.updated',
    'payment.captured',
    'payment.failed',
    'subscription.cancelled',
]);

export const BILLING_WRITE_GUARD_BYPASS_PREFIXES = [
    '/api/v1/billing/checkout',
    '/api/v1/billing/coupons/validate',
    '/api/v1/billing/webhooks',
];

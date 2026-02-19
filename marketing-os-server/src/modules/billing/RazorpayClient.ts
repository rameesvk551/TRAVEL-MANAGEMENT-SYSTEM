import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';

type BillingPlanType = 'monthly' | 'yearly';

export interface RazorpayClientConfig {
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    monthlyPlanId?: string;
    yearlyPlanId?: string;
}

interface CreateRecurringSubscriptionInput {
    planType: BillingPlanType;
    customerId: string;
    couponOfferId?: string;
    notes?: Record<string, string>;
}

interface CreateOneTimeOrderInput {
    amountPaise: number;
    receipt: string;
    notes?: Record<string, string>;
    offerId?: string;
}

interface CreateCustomerInput {
    name: string;
    email: string;
    tenantId: string;
}

export class RazorpayClient {
    private readonly client: Razorpay;
    private readonly cfg: RazorpayClientConfig;

    constructor(config: RazorpayClientConfig) {
        this.cfg = config;
        this.client = new Razorpay({
            key_id: config.keyId,
            key_secret: config.keySecret,
        });
    }

    async createRecurringSubscription(input: CreateRecurringSubscriptionInput): Promise<any> {
        const planId =
            input.planType === 'monthly' ? this.cfg.monthlyPlanId : this.cfg.yearlyPlanId;

        if (!planId) {
            throw new Error(`Missing Razorpay plan id for ${input.planType}`);
        }

        return this.client.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            quantity: 1,
            total_count: 1200,
            offer_id: input.couponOfferId,
            notes: input.notes,
        } as any);
    }

    async createOneTimeOrder(input: CreateOneTimeOrderInput): Promise<any> {
        return this.client.orders.create({
            amount: input.amountPaise,
            currency: 'INR',
            receipt: input.receipt,
            notes: input.notes,
            offer_id: input.offerId,
        } as any);
    }

    async fetchSubscription(subscriptionId: string): Promise<any> {
        return this.client.subscriptions.fetch(subscriptionId);
    }

    async fetchOrder(orderId: string): Promise<any> {
        return this.client.orders.fetch(orderId);
    }

    async fetchPaymentsForOrder(orderId: string): Promise<any[]> {
        const response = await this.client.orders.fetchPayments(orderId);
        return Array.isArray((response as any)?.items) ? (response as any).items : [];
    }

    async createCustomer(input: CreateCustomerInput): Promise<any> {
        return this.client.customers.create({
            name: input.name,
            email: input.email,
            notes: {
                tenantId: input.tenantId,
            },
        } as any);
    }

    verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
        if (!this.cfg.webhookSecret) {
            return false;
        }

        const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
        const expected = createHmac('sha256', this.cfg.webhookSecret)
            .update(payload)
            .digest('hex');

        const expectedBuf = Buffer.from(expected, 'utf8');
        const signatureBuf = Buffer.from(signature, 'utf8');

        if (expectedBuf.length !== signatureBuf.length) {
            return false;
        }

        return timingSafeEqual(expectedBuf, signatureBuf);
    }
}

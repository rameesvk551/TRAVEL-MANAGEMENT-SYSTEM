-- =============================================
-- Module 24: Subscription & Usage Billing
-- =============================================

CREATE TABLE IF NOT EXISTS billing_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial|monthly|yearly|lifetime
    status VARCHAR(20) NOT NULL DEFAULT 'trialing', -- trialing|active|past_due|cancelled|expired|inactive
    trial_start_at TIMESTAMPTZ,
    trial_end_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    razorpay_customer_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255) UNIQUE,
    last_payment_at TIMESTAMPTZ,
    write_blocked_override BOOLEAN NOT NULL DEFAULT false,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_usage_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_type VARCHAR(20) NOT NULL UNIQUE,
    feature_configs JSONB NOT NULL DEFAULT '[]',
    updated_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_usage_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'trial',
    cycle_start TIMESTAMPTZ NOT NULL,
    cycle_end TIMESTAMPTZ NOT NULL,
    feature_counters JSONB NOT NULL DEFAULT '[]',
    total_overage_amount_paise INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open|invoiced
    invoiced_invoice_id UUID,
    last_tracked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT billing_usage_cycles_tenant_cycle_unique UNIQUE (tenant_id, cycle_start)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_type VARCHAR(30) NOT NULL, -- usage_overage|lifetime_purchase
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft|issued|pending_payment|paid|void|failed
    cycle_start TIMESTAMPTZ,
    cycle_end TIMESTAMPTZ,
    line_items JSONB NOT NULL DEFAULT '[]',
    subtotal_amount_paise INTEGER NOT NULL DEFAULT 0,
    discount_amount_paise INTEGER NOT NULL DEFAULT 0,
    total_amount_paise INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    coupon_code VARCHAR(50),
    due_at TIMESTAMPTZ,
    issued_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    razorpay_order_id VARCHAR(255) UNIQUE,
    razorpay_payment_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    billing_invoice_id UUID REFERENCES billing_invoices(id) ON DELETE SET NULL,
    billing_subscription_id UUID REFERENCES billing_subscriptions(id) ON DELETE SET NULL,
    source_type VARCHAR(30) NOT NULL, -- subscription|usage_invoice|lifetime_purchase
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- created|captured|failed|refunded
    amount_paise INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    razorpay_payment_id VARCHAR(255) UNIQUE,
    razorpay_order_id VARCHAR(255),
    razorpay_subscription_id VARCHAR(255),
    failure_reason TEXT,
    captured_at TIMESTAMPTZ,
    raw_payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    scope VARCHAR(20) NOT NULL DEFAULT 'all', -- subscription|usage|all
    discount_type VARCHAR(20) NOT NULL, -- fixed|percent
    discount_value INTEGER NOT NULL,
    max_discount_amount_paise INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    applicable_plan_types JSONB NOT NULL DEFAULT '[]',
    razorpay_offer_id VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users(id),
    action_type VARCHAR(80) NOT NULL,
    reason TEXT,
    before_state JSONB NOT NULL DEFAULT '{}',
    after_state JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_usage_cycles_tenant_status
    ON billing_usage_cycles(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_tenant_status
    ON billing_invoices(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_billing_payments_tenant_created
    ON billing_payments(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_audit_logs_tenant_created
    ON billing_audit_logs(tenant_id, created_at DESC);

-- Seed default feature-wise usage config
INSERT INTO billing_usage_configs (plan_type, feature_configs)
VALUES
    ('trial', '[{"featureKey":"messages","freeLimit":1000,"overageUnitPricePaise":15},{"featureKey":"contacts","freeLimit":2000,"overageUnitPricePaise":5},{"featureKey":"campaigns","freeLimit":50,"overageUnitPricePaise":2500}]'::jsonb),
    ('monthly', '[{"featureKey":"messages","freeLimit":1000,"overageUnitPricePaise":15},{"featureKey":"contacts","freeLimit":2000,"overageUnitPricePaise":5},{"featureKey":"campaigns","freeLimit":50,"overageUnitPricePaise":2500}]'::jsonb),
    ('yearly', '[{"featureKey":"messages","freeLimit":1000,"overageUnitPricePaise":12},{"featureKey":"contacts","freeLimit":2500,"overageUnitPricePaise":4},{"featureKey":"campaigns","freeLimit":70,"overageUnitPricePaise":2200}]'::jsonb),
    ('lifetime', '[{"featureKey":"messages","freeLimit":1200,"overageUnitPricePaise":10},{"featureKey":"contacts","freeLimit":3000,"overageUnitPricePaise":3},{"featureKey":"campaigns","freeLimit":80,"overageUnitPricePaise":1800}]'::jsonb)
ON CONFLICT (plan_type) DO NOTHING;

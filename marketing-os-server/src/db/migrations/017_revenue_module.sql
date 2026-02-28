-- =============================================
-- Module 2: Revenue & Financial Monitoring
-- =============================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    customer_id VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    plan_name VARCHAR(100) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'basic',  -- basic, pro, enterprise
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, cancelled, past_due, trialing, paused
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_interval VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly, quarterly
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    customer_id VARCHAR(255) NOT NULL,
    type VARCHAR(30) NOT NULL, -- payment, refund, credit, adjustment
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) DEFAULT 'completed', -- completed, pending, failed
    payment_method VARCHAR(50),
    channel VARCHAR(50), -- stripe, razorpay, manual
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue snapshots (daily aggregates for fast queries)
CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    snapshot_date DATE NOT NULL,
    mrr DECIMAL(12,2) DEFAULT 0,
    arr DECIMAL(12,2) DEFAULT 0,
    total_customers INT DEFAULT 0,
    active_subscriptions INT DEFAULT 0,
    new_subscriptions INT DEFAULT 0,
    churned_subscriptions INT DEFAULT 0,
    expansion_revenue DECIMAL(12,2) DEFAULT 0,
    contraction_revenue DECIMAL(12,2) DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_refunds DECIMAL(12,2) DEFAULT 0,
    net_revenue DECIMAL(12,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_revenue_snapshots_date ON revenue_snapshots(tenant_id, snapshot_date);

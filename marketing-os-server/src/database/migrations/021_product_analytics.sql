-- =============================================
-- Module 6: Product & User Behavior
-- =============================================

CREATE TABLE IF NOT EXISTS product_feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    action VARCHAR(50) DEFAULT 'used', -- used, viewed, activated, deactivated
    session_id VARCHAR(255),
    duration_seconds INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    duration_seconds INT DEFAULT 0,
    pages_viewed INT DEFAULT 0,
    device_type VARCHAR(30),
    browser VARCHAR(50),
    country VARCHAR(100),
    entry_page TEXT,
    exit_page TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cohort_type VARCHAR(50), -- signup_date, first_purchase, feature_adoption
    period VARCHAR(20), -- weekly, monthly
    data JSONB DEFAULT '{}', -- {periods: [{label, users, active, retention}]}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_tenant ON product_feature_usage(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON product_feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_product_sessions_tenant ON product_sessions(tenant_id, session_start);
CREATE INDEX IF NOT EXISTS idx_product_cohorts_tenant ON product_cohorts(tenant_id);

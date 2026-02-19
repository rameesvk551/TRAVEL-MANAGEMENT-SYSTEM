-- =============================================
-- Module 8: Ads & Campaign Control
-- =============================================

CREATE TABLE IF NOT EXISTS ad_campaigns_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    platform VARCHAR(30) NOT NULL, -- meta, google, tiktok, linkedin
    external_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    objective VARCHAR(50),
    daily_budget DECIMAL(12,2),
    lifetime_budget DECIMAL(12,2),
    spend DECIMAL(12,2) DEFAULT 0,
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    ctr DECIMAL(8,4) DEFAULT 0,
    cpc DECIMAL(8,4) DEFAULT 0,
    roas DECIMAL(8,4) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(30) DEFAULT 'landing_page', -- landing_page, email_subject, ad_creative, cta
    status VARCHAR(20) DEFAULT 'running', -- running, completed, stopped
    variant_a JSONB NOT NULL, -- {name, description, url/content}
    variant_b JSONB NOT NULL,
    variant_a_visitors INT DEFAULT 0,
    variant_b_visitors INT DEFAULT 0,
    variant_a_conversions INT DEFAULT 0,
    variant_b_conversions INT DEFAULT 0,
    winner VARCHAR(1), -- 'A' or 'B'
    confidence DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_tenant ON ad_campaigns_unified(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON ad_campaigns_unified(tenant_id, platform);
CREATE INDEX IF NOT EXISTS idx_ab_tests_tenant ON ab_tests(tenant_id);

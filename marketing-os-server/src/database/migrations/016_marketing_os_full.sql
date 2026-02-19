-- Full schema for Marketing OS modules (growth, revenue, CRM, email, product, ads, monitoring, whatsapp opt-in)
-- Run on PostgreSQL 13+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- Growth & Acquisition
-- ========================
CREATE TABLE IF NOT EXISTS tracking_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fingerprint TEXT,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen  TIMESTAMPTZ DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_tenant ON tracking_visitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_fingerprint ON tracking_visitors(fingerprint);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_country ON tracking_visitors(country);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_device ON tracking_visitors(device_type);

CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(255),
    page_url TEXT,
    page_title VARCHAR(500),
    referrer_url TEXT,
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_events_tenant ON tracking_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_visitor ON tracking_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON tracking_events(created_at);

CREATE TABLE IF NOT EXISTS tracking_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID,
    session_id VARCHAR(255),
    source_type VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    medium VARCHAR(255),
    campaign VARCHAR(255),
    referrer_url TEXT,
    landing_page TEXT,
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_tenant ON tracking_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_type ON tracking_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_campaign ON tracking_sources(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_created ON tracking_sources(created_at);

CREATE TABLE IF NOT EXISTS tracking_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID,
    event_id UUID,
    source_id UUID,
    campaign_id UUID,
    conversion_type VARCHAR(100) NOT NULL,
    conversion_value NUMERIC(12,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    landing_page TEXT,
    attribution_model VARCHAR(50) DEFAULT 'last_touch',
    attribution_data JSONB DEFAULT '{}'::jsonb,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_tenant ON tracking_conversions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_type ON tracking_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_campaign ON tracking_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_created ON tracking_conversions(created_at);

CREATE TABLE IF NOT EXISTS tracking_ad_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    campaign_id VARCHAR(255),
    campaign_name VARCHAR(500),
    ad_set_id VARCHAR(255),
    ad_set_name VARCHAR(500),
    ad_id VARCHAR(255),
    ad_name VARCHAR(500),
    date DATE NOT NULL,
    spend NUMERIC(12,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue NUMERIC(12,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_costs_tenant ON tracking_ad_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_costs_platform ON tracking_ad_costs(platform);
CREATE INDEX IF NOT EXISTS idx_ad_costs_campaign ON tracking_ad_costs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_costs_date ON tracking_ad_costs(date);

CREATE TABLE IF NOT EXISTS tracking_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tracking_funnels_tenant ON tracking_funnels(tenant_id);

-- ========================
-- Revenue & Finance
-- ========================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id VARCHAR(255),
    plan VARCHAR(255),
    amount NUMERIC(12,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'active',
    billing_interval VARCHAR(20) DEFAULT 'monthly',
    trial_start DATE,
    trial_end DATE,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id VARCHAR(255),
    amount NUMERIC(12,2) NOT NULL,
    currency CHAR(3) DEFAULT 'USD',
    type VARCHAR(30) NOT NULL, -- payment | refund | adjustment
    status VARCHAR(30) DEFAULT 'completed',
    channel VARCHAR(50),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE TABLE IF NOT EXISTS revenue_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    snapshot_date DATE NOT NULL,
    total_revenue NUMERIC(14,2) DEFAULT 0,
    total_refunds NUMERIC(14,2) DEFAULT 0,
    net_revenue NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, snapshot_date)
);

-- ========================
-- CRM & Lead Intelligence
-- ========================
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    title VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual',
    status VARCHAR(50) DEFAULT 'new',
    score INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    owner_id UUID,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(20) DEFAULT '#4F46E5',
    is_won BOOLEAN DEFAULT FALSE,
    is_lost BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_stages_tenant ON crm_pipeline_stages(tenant_id);

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    stage_id UUID,
    title VARCHAR(255),
    value NUMERIC(12,2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'USD',
    probability INTEGER DEFAULT 50,
    expected_close_date DATE,
    owner_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON crm_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage_id);

CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    deal_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'follow_up',
    due_date TIMESTAMPTZ,
    assigned_to UUID,
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_tenant ON crm_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);

CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_tenant ON crm_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);

-- ========================
-- Email & Drip
-- ========================
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) DEFAULT '',
    from_name VARCHAR(255) DEFAULT '',
    from_email VARCHAR(255) DEFAULT '',
    segment_id UUID,
    status VARCHAR(50) DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant ON email_campaigns(tenant_id);

CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    campaign_id UUID,
    recipient_id VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_events_tenant ON email_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    html_content TEXT,
    text_content TEXT,
    category VARCHAR(100) DEFAULT 'promotional',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON email_templates(tenant_id);

CREATE TABLE IF NOT EXISTS drip_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50) DEFAULT 'signup',
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drip_sequences_tenant ON drip_sequences(tenant_id);

CREATE TABLE IF NOT EXISTS drip_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (sequence_id, recipient_email)
);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_tenant ON drip_enrollments(tenant_id);

-- ========================
-- Product & Usage Analytics
-- ========================
CREATE TABLE IF NOT EXISTS product_feature_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id VARCHAR(255),
    feature_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) DEFAULT 'used',
    session_id VARCHAR(255),
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feature_usage_tenant ON product_feature_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON product_feature_usage(feature_name);

CREATE TABLE IF NOT EXISTS product_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id VARCHAR(255),
    session_start TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    referrer TEXT,
    pages_viewed INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_sessions_tenant ON product_sessions(tenant_id);

CREATE TABLE IF NOT EXISTS product_cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255),
    definition JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_cohorts_tenant ON product_cohorts(tenant_id);

-- ========================
-- Ads & A/B Testing
-- ========================
CREATE TABLE IF NOT EXISTS ad_campaigns_unified (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    name VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    objective VARCHAR(100),
    daily_budget NUMERIC(12,2) DEFAULT 0,
    spend NUMERIC(12,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC(10,4),
    cpc NUMERIC(12,4),
    roas NUMERIC(12,4),
    start_date DATE,
    end_date DATE,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_tenant ON ad_campaigns_unified(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_platform ON ad_campaigns_unified(platform);

CREATE TABLE IF NOT EXISTS ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'landing_page',
    variant_a JSONB DEFAULT '{}'::jsonb,
    variant_b JSONB DEFAULT '{}'::jsonb,
    variant_a_visitors INTEGER DEFAULT 0,
    variant_b_visitors INTEGER DEFAULT 0,
    variant_a_conversions INTEGER DEFAULT 0,
    variant_b_conversions INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ab_tests_tenant ON ab_tests(tenant_id);

-- ========================
-- Monitoring & Alerts
-- ========================
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL,
    threshold NUMERIC(12,4) NOT NULL,
    channel VARCHAR(30) DEFAULT 'email',
    recipients JSONB DEFAULT '[]'::jsonb,
    cooldown_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON alert_rules(tenant_id);

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rule_id UUID,
    metric_value NUMERIC(14,4),
    message TEXT,
    channel VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alert_history_tenant ON alert_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100),
    schedule VARCHAR(100),
    recipients JSONB DEFAULT '[]'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant ON scheduled_reports(tenant_id);

CREATE TABLE IF NOT EXISTS custom_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_tenant ON custom_dashboards(tenant_id);

-- ========================
-- WhatsApp Opt-In (used by container)
-- ========================
CREATE TABLE IF NOT EXISTS whatsapp_opt_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    country_code VARCHAR(10),
    status VARCHAR(30) DEFAULT 'OPTED_IN',
    source VARCHAR(50),
    channel VARCHAR(50),
    permissions JSONB DEFAULT '[]'::jsonb,
    legal_basis VARCHAR(100),
    consented_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    opt_out_reason VARCHAR(255),
    recorded_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, phone_number)
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_opt_ins_tenant ON whatsapp_opt_ins(tenant_id);


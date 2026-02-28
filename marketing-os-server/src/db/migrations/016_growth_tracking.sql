-- Migration: 016_growth_tracking.sql
-- Growth & Acquisition Tracking Module tables

-- =======================================
-- VISITORS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    fingerprint VARCHAR(255),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    visit_count INTEGER DEFAULT 1,
    device_type VARCHAR(50),     -- desktop, mobile, tablet
    browser VARCHAR(100),
    os VARCHAR(100),
    country VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_visitors_tenant ON tracking_visitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_fingerprint ON tracking_visitors(fingerprint);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_first_seen ON tracking_visitors(first_seen);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_country ON tracking_visitors(country);
CREATE INDEX IF NOT EXISTS idx_tracking_visitors_device ON tracking_visitors(device_type);

-- =======================================
-- TRACKING EVENTS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID REFERENCES tracking_visitors(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- pageview, click, form_submit, conversion, custom
    event_name VARCHAR(255),
    page_url TEXT,
    page_title VARCHAR(500),
    referrer_url TEXT,
    session_id VARCHAR(255),
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_tenant ON tracking_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_visitor ON tracking_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created ON tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_session ON tracking_events(session_id);

-- =======================================
-- TRAFFIC SOURCES TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID REFERENCES tracking_visitors(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    source_type VARCHAR(50) NOT NULL, -- organic, paid, direct, referral, social, email
    source VARCHAR(255),      -- google, facebook, twitter, etc.
    medium VARCHAR(255),      -- cpc, organic, referral, email, social
    campaign VARCHAR(255),
    referrer_url TEXT,
    landing_page TEXT,
    -- UTM params
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_sources_tenant ON tracking_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_visitor ON tracking_sources(visitor_id);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_type ON tracking_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_campaign ON tracking_sources(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_tracking_sources_created ON tracking_sources(created_at);

-- =======================================
-- CONVERSIONS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    visitor_id UUID REFERENCES tracking_visitors(id) ON DELETE SET NULL,
    event_id UUID REFERENCES tracking_events(id) ON DELETE SET NULL,
    source_id UUID REFERENCES tracking_sources(id) ON DELETE SET NULL,
    campaign_id UUID,          -- Links to marketing_campaigns if applicable
    conversion_type VARCHAR(100) NOT NULL, -- signup, purchase, lead, subscription, custom
    conversion_value DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    landing_page TEXT,
    attribution_model VARCHAR(50) DEFAULT 'last_touch', -- last_touch, first_touch, linear, time_decay
    attribution_data JSONB DEFAULT '{}',  -- Stores multi-touch attribution chain
    properties JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_conversions_tenant ON tracking_conversions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_type ON tracking_conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_campaign ON tracking_conversions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_created ON tracking_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_conversions_visitor ON tracking_conversions(visitor_id);

-- =======================================
-- AD COSTS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_ad_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,   -- meta, google, tiktok, linkedin
    campaign_id VARCHAR(255),
    campaign_name VARCHAR(500),
    ad_set_id VARCHAR(255),
    ad_set_name VARCHAR(500),
    ad_id VARCHAR(255),
    ad_name VARCHAR(500),
    date DATE NOT NULL,
    spend DECIMAL(12,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_ad_costs_tenant ON tracking_ad_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_ad_costs_platform ON tracking_ad_costs(platform);
CREATE INDEX IF NOT EXISTS idx_tracking_ad_costs_date ON tracking_ad_costs(date);
CREATE INDEX IF NOT EXISTS idx_tracking_ad_costs_campaign ON tracking_ad_costs(campaign_id);

-- =======================================
-- FUNNELS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS tracking_funnels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',  -- [{name, eventType, eventName, url}]
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_funnels_tenant ON tracking_funnels(tenant_id);

-- =============================================
-- Module 5: Email & Engagement
-- =============================================

CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    from_name VARCHAR(100),
    from_email VARCHAR(255),
    template_id UUID,
    segment_id VARCHAR(255),
    status VARCHAR(30) DEFAULT 'draft', -- draft, scheduled, sending, sent, paused
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    bounced_count INT DEFAULT 0,
    unsubscribed_count INT DEFAULT 0,
    complained_count INT DEFAULT 0,
    ab_test_config JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    html_content TEXT,
    text_content TEXT,
    category VARCHAR(50), -- promotional, transactional, newsletter
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    campaign_id UUID REFERENCES email_campaigns(id),
    recipient_email VARCHAR(255) NOT NULL,
    event_type VARCHAR(30) NOT NULL, -- sent, delivered, opened, clicked, bounced, unsubscribed, complained
    link_url TEXT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drip_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trigger_type VARCHAR(50), -- signup, purchase, tag_added, manual
    steps JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    enrolled_count INT DEFAULT 0,
    completed_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant ON email_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_date ON email_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_drip_sequences_tenant ON drip_sequences(tenant_id);

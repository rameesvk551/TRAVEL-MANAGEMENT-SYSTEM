-- =============================================
-- Module 4: WhatsApp Analytics Enhancement
-- =============================================

CREATE TABLE IF NOT EXISTS whatsapp_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    template_id VARCHAR(255),
    template_name VARCHAR(255),
    date DATE NOT NULL,
    sent INT DEFAULT 0,
    delivered INT DEFAULT 0,
    read_count INT DEFAULT 0,
    replied INT DEFAULT 0,
    failed INT DEFAULT 0,
    clicks INT DEFAULT 0,
    avg_response_time_seconds INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, template_id, date)
);

CREATE TABLE IF NOT EXISTS whatsapp_followup_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(50), -- abandoned_chat, no_reply, post_purchase
    steps JSONB DEFAULT '[]', -- [{delay: '1h', template_id: '...', message: '...'}, ...]
    is_active BOOLEAN DEFAULT true,
    total_enrolled INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_analytics_tenant ON whatsapp_analytics(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_wa_followup_tenant ON whatsapp_followup_sequences(tenant_id);

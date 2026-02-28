-- Create Marketing Segments Table
CREATE TABLE IF NOT EXISTS marketing_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filters JSONB DEFAULT '[]',
    is_dynamic BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_segments_tenant_id ON marketing_segments(tenant_id);

-- Create Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- BROADCAST, DRIP, TRIGGERED
    channel VARCHAR(50) NOT NULL, -- WHATSAPP, EMAIL, SMS
    status VARCHAR(50) NOT NULL, -- DRAFT, SCHEDULED, RUNNING, PAUSED, COMPLETED, FAILED
    
    segment_id UUID REFERENCES marketing_segments(id) ON DELETE SET NULL,
    
    tag_ids TEXT[], -- Postgres Array of Strings/UUIDs
    excluded_tag_ids TEXT[], 
    
    template_id VARCHAR(255),
    template_params JSONB,
    content TEXT,
    
    scheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats
    total_leads INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_tenant_id ON marketing_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_scheduled_at ON marketing_campaigns(scheduled_at);

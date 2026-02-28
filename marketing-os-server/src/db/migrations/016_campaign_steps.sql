-- Create Marketing Campaign Steps Table
CREATE TABLE IF NOT EXISTS marketing_campaign_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    
    step_order INTEGER NOT NULL,
    delay INTEGER NOT NULL DEFAULT 0, -- In minutes
    
    template_id VARCHAR(255),
    template_params JSONB,
    content TEXT,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaign_steps_campaign_id ON marketing_campaign_steps(campaign_id);

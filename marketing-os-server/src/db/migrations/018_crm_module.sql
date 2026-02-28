-- =============================================
-- Module 3: CRM & Lead Intelligence
-- =============================================

CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    title VARCHAR(255),
    source VARCHAR(50), -- website, whatsapp, referral, ads, manual
    status VARCHAR(30) DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
    score INT DEFAULT 0,
    owner_id VARCHAR(255),
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    last_activity_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    position INT DEFAULT 0,
    color VARCHAR(7) DEFAULT '#4F46E5',
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    lead_id UUID REFERENCES crm_leads(id),
    stage_id UUID REFERENCES crm_pipeline_stages(id),
    title VARCHAR(255) NOT NULL,
    value DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    probability INT DEFAULT 50,
    expected_close_date DATE,
    closed_at TIMESTAMPTZ,
    owner_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    lead_id UUID REFERENCES crm_leads(id),
    deal_id UUID REFERENCES crm_deals(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(30) DEFAULT 'follow_up', -- follow_up, call, email, meeting, task
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    assigned_to VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    lead_id UUID REFERENCES crm_leads(id),
    type VARCHAR(30) NOT NULL, -- email, call, whatsapp, note, meeting, page_view
    title VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(tenant_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tenant ON crm_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_tenant ON crm_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);

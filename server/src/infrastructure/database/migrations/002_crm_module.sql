-- 002_crm_module.sql

-- Contacts (Unified Person/Customer)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Ensure extension is available
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    travel_history JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    marketing_consent BOOLEAN DEFAULT false,
    social_handles JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_contact_email_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_phone ON contacts(tenant_id, phone);
-- Note: uuid_generate_v4() requires checking extension, or use gen_random_uuid() (pg 13+)

-- Pipelines (Workflows)
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    stages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (Enhancement: Add CRM columns to existing table)
-- We use DO block for safe ADD COLUMN or just standard ALTER with IF NOT EXISTS (Pg 9.6+)

ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_id VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source_platform VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS travel_preferences JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_leads_tenant_pipeline ON leads(tenant_id, pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(tenant_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads(tenant_id, contact_id);

-- Activities (History & Tasks)
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    assigned_to_id UUID REFERENCES users(id),
    created_by_id UUID NOT NULL, 
    
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    outcome VARCHAR(50),
    
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_tenant_lead ON activities(tenant_id, lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_scheduled ON activities(tenant_id, scheduled_at) WHERE status = 'PENDING';


-- 002_crm_module.sql

-- Contacts (Unified Person/Customer)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    -- Improve search performance
    CONSTRAINT unique_contact_email_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_contacts_tenant_phone ON contacts(tenant_id, phone);
CREATE INDEX idx_contacts_search ON contacts USING GIN(to_tsvector('english', first_name || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));

-- Pipelines (Workflows)
CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    stages JSONB NOT NULL DEFAULT '[]', -- Array of {id, name, color, type, order}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (Sales Opportunities)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    pipeline_id UUID REFERENCES pipelines(id),
    stage_id VARCHAR(100), -- ID from the pipeline stages JSON
    
    contact_id UUID REFERENCES contacts(id),
    name VARCHAR(255) NOT NULL, -- Snapshot/Fallback
    email VARCHAR(255),
    phone VARCHAR(50),
    
    assigned_to_id UUID REFERENCES users(id),
    source VARCHAR(50),
    source_platform VARCHAR(100),
    
    travel_preferences JSONB DEFAULT '{}',
    
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    status VARCHAR(50), -- Deprecated/Legacy support
    score INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    notes TEXT,
    lost_reason TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_tenant_pipeline ON leads(tenant_id, pipeline_id);
CREATE INDEX idx_leads_stage ON leads(tenant_id, stage_id);
CREATE INDEX idx_leads_contact ON leads(tenant_id, contact_id);

-- Activities (History & Tasks)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    
    assigned_to_id UUID REFERENCES users(id),
    created_by_id UUID NOT NULL, -- references users(id) via app logic (audit)
    
    type VARCHAR(50) NOT NULL, -- CALL, EMAIL, etc.
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

CREATE INDEX idx_activities_tenant_lead ON activities(tenant_id, lead_id);
CREATE INDEX idx_activities_scheduled ON activities(tenant_id, scheduled_at) WHERE status = 'PENDING';

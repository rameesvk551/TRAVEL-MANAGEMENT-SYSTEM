-- =============================================
-- Lead Management Module Enhancements
-- Safe migration: all ALTER TABLE uses IF NOT EXISTS / nullable / defaults
-- =============================================

-- ──────────────────────────────────────────────
-- 1. Extend existing leads table
-- ──────────────────────────────────────────────

ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duplicate_of UUID;

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
CREATE INDEX IF NOT EXISTS idx_leads_engagement ON leads(engagement_score);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_leads_duplicate ON leads(is_duplicate) WHERE is_duplicate = true;

-- ──────────────────────────────────────────────
-- 2. Pipeline stages (customizable per tenant)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#4F46E5',
    position INT DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stages_tenant ON lead_pipeline_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stages_position ON lead_pipeline_stages(tenant_id, position);

-- ──────────────────────────────────────────────
-- 3. Lead notes (team collaboration)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_tenant ON lead_notes(tenant_id);

-- ──────────────────────────────────────────────
-- 4. Lead scoring rules (configurable per tenant)
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    score_delta INT NOT NULL DEFAULT 0,
    conditions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_scoring_rules_tenant ON lead_scoring_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_rules_event ON lead_scoring_rules(event_type);

-- ──────────────────────────────────────────────
-- 5. Lead duplicates log
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_duplicates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    duplicate_lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    match_type VARCHAR(30) NOT NULL, -- phone, email, name_location
    match_score DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, merged, dismissed
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_duplicates_tenant ON lead_duplicates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_lead ON lead_duplicates(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_status ON lead_duplicates(status);

-- ──────────────────────────────────────────────
-- 6. Lead assignment rules
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    strategy VARCHAR(30) NOT NULL DEFAULT 'round_robin', -- round_robin, rule_based, manual
    conditions JSONB DEFAULT '{}',
    agent_ids UUID[] DEFAULT '{}',
    last_assigned_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_assignment_rules_tenant ON lead_assignment_rules(tenant_id);

-- ──────────────────────────────────────────────
-- 7. Follow-up reminders
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_follow_up_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    assigned_to UUID,
    due_date TIMESTAMPTZ NOT NULL,
    note TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    completed_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_followups_tenant ON lead_follow_up_reminders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lead_followups_due ON lead_follow_up_reminders(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_lead_followups_assigned ON lead_follow_up_reminders(assigned_to) WHERE status = 'pending';

-- ──────────────────────────────────────────────
-- 8. Add FK from leads.pipeline_stage_id
-- ──────────────────────────────────────────────

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_leads_pipeline_stage'
    ) THEN
        ALTER TABLE leads
        ADD CONSTRAINT fk_leads_pipeline_stage
        FOREIGN KEY (pipeline_stage_id) REFERENCES lead_pipeline_stages(id)
        ON DELETE SET NULL;
    END IF;
END $$;

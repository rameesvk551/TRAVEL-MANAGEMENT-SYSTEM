-- WhatsApp Meta App Review compliance audit logs

CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    actor_type VARCHAR(30) NOT NULL DEFAULT 'SYSTEM', -- USER | SYSTEM | WEBHOOK
    actor_id VARCHAR(255),
    actor_phone VARCHAR(30),
    entity_type VARCHAR(80),
    entity_id VARCHAR(255),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_audit_tenant_created
    ON whatsapp_audit_logs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_audit_event
    ON whatsapp_audit_logs (tenant_id, event_type, created_at DESC);

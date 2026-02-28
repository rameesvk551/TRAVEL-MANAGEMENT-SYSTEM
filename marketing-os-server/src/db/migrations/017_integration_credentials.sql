-- Tenant-scoped ad integration credentials
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS growth_integration_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_growth_integration_credentials_tenant
    ON growth_integration_credentials(tenant_id);

CREATE INDEX IF NOT EXISTS idx_growth_integration_credentials_platform
    ON growth_integration_credentials(platform);

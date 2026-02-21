-- Multi-tenant WhatsApp Business Account configuration
-- Stores per-tenant credentials for BYO and Managed scenarios

CREATE TABLE IF NOT EXISTS whatsapp_business_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           VARCHAR(255) NOT NULL UNIQUE,
  credential_source   VARCHAR(20) NOT NULL DEFAULT 'own',        -- 'own' (BYO) | 'managed'
  status              VARCHAR(50) NOT NULL DEFAULT 'pending',     -- pending | connected | disconnected | error
  onboarding_method   VARCHAR(50) DEFAULT 'manual',               -- manual | embedded_signup

  -- Credentials
  access_token        TEXT,              -- BYO: tenant's token | Managed: NULL (uses system token from env)
  phone_number_id     VARCHAR(255),
  waba_id             VARCHAR(255),
  business_id         VARCHAR(255),

  -- Phone number info
  phone_display       VARCHAR(100),
  verified_name       VARCHAR(255),
  quality_rating      VARCHAR(10),

  -- Business profile
  business_name       VARCHAR(255),
  webhook_verify_token VARCHAR(255),
  features            JSONB DEFAULT '{"catalogEnabled":false,"cartEnabled":false,"paymentsEnabled":false,"flowsEnabled":false}',
  rate_limits         JSONB DEFAULT '{}',

  -- Timestamps
  connected_at        TIMESTAMPTZ,
  last_sync_at        TIMESTAMPTZ,
  error_message       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wbc_tenant ON whatsapp_business_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wbc_waba   ON whatsapp_business_configs(waba_id);
CREATE INDEX IF NOT EXISTS idx_wbc_status ON whatsapp_business_configs(status);

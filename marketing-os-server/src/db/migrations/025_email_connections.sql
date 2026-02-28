CREATE TABLE IF NOT EXISTS "email_connections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspace_id" UUID NOT NULL,
  "provider" VARCHAR(50) NOT NULL DEFAULT 'smtp',
  "from_email" VARCHAR(255) NOT NULL,
  "from_name" VARCHAR(255) NOT NULL,
  "smtp_host" VARCHAR(255) NOT NULL,
  "smtp_port" INTEGER NOT NULL,
  "username" VARCHAR(255),
  "encrypted_password" TEXT,
  "daily_limit" INTEGER NOT NULL DEFAULT 1000,
  "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
  "status" VARCHAR(50) NOT NULL DEFAULT 'connected',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_email_connections_workspace_id" ON "email_connections" ("workspace_id");

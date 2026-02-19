-- =============================================
-- Module 9: Monitoring & Alerts
-- =============================================

CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    metric VARCHAR(100) NOT NULL, -- mrr_drop, churn_spike, spend_threshold, conversion_drop
    condition VARCHAR(20) NOT NULL, -- gt, lt, eq, gte, lte, change_pct
    threshold DECIMAL(12,2) NOT NULL,
    channel VARCHAR(30) DEFAULT 'email', -- email, slack, webhook, whatsapp
    recipients JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    cooldown_minutes INT DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    rule_id UUID REFERENCES alert_rules(id),
    metric VARCHAR(100) NOT NULL,
    current_value DECIMAL(12,2),
    threshold_value DECIMAL(12,2),
    message TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- sent, acknowledged, resolved
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- daily_summary, weekly_digest, monthly_report, custom
    schedule VARCHAR(50) NOT NULL, -- daily, weekly, monthly, cron expression
    recipients JSONB DEFAULT '[]',
    config JSONB DEFAULT '{}', -- {modules: [], metrics: [], format: 'pdf|html'}
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    next_send_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]', -- [{widgetType, position, size, config}]
    is_default BOOLEAN DEFAULT false,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_tenant ON alert_history(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_tenant ON scheduled_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_tenant ON custom_dashboards(tenant_id);

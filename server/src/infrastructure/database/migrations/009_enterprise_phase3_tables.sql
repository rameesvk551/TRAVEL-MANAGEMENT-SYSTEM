-- Migration: 009_enterprise_phase3_tables.sql
-- Enterprise Phase 3: Approval Workflows, Performance Tracking, HR Analytics, Cost Centers, Payroll Export

-- =======================================
-- APPROVAL WORKFLOW TABLES
-- =======================================

-- Approval chain templates
CREATE TABLE IF NOT EXISTS hrms.approval_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('LEAVE', 'EXPENSE', 'OVERTIME', 'TRAVEL', 'DOCUMENT', 'SALARY_CHANGE', 'PROMOTION', 'TERMINATION')),
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    UNIQUE(tenant_id, name)
);

-- Approval chain steps/levels
CREATE TABLE IF NOT EXISTS hrms.approval_chain_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain_id UUID NOT NULL REFERENCES hrms.approval_chains(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    approver_type VARCHAR(30) NOT NULL CHECK (approver_type IN ('DIRECT_MANAGER', 'DEPARTMENT_HEAD', 'HR_MANAGER', 'FINANCE_MANAGER', 'SPECIFIC_USER', 'ROLE', 'CUSTOM')),
    approver_id UUID, -- specific user id if SPECIFIC_USER
    approver_role VARCHAR(50), -- role name if ROLE type
    can_skip BOOLEAN DEFAULT FALSE,
    skip_condition JSONB, -- conditions when step can be auto-skipped
    auto_approve_after_days INT, -- auto-approve if no action after X days
    escalation_after_days INT, -- escalate to next level if no action
    escalation_to UUID, -- user to escalate to
    requires_comment BOOLEAN DEFAULT FALSE,
    min_amount DECIMAL(12, 2), -- for expense/budget approvals
    max_amount DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chain_id, step_order)
);

-- Approval requests (instances)
CREATE TABLE IF NOT EXISTS hrms.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    chain_id UUID NOT NULL REFERENCES hrms.approval_chains(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL, -- ID of the leave/expense/etc being approved
    requestor_id UUID NOT NULL REFERENCES hrms.employees(id),
    current_step INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB, -- additional context about the request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual approval actions
CREATE TABLE IF NOT EXISTS hrms.approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES hrms.approval_requests(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES hrms.approval_chain_steps(id),
    step_order INT NOT NULL,
    approver_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVED', 'REJECTED', 'RETURNED', 'DELEGATED', 'SKIPPED', 'ESCALATED')),
    comments TEXT,
    delegated_to UUID REFERENCES users(id),
    action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_chains_tenant ON hrms.approval_chains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_chains_type ON hrms.approval_chains(entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant ON hrms.approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON hrms.approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_requestor ON hrms.approval_requests(requestor_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON hrms.approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON hrms.approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver ON hrms.approval_actions(approver_id);

-- =======================================
-- PERFORMANCE MANAGEMENT TABLES
-- =======================================

-- Performance review cycles
CREATE TABLE IF NOT EXISTS hrms.performance_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cycle_type VARCHAR(20) NOT NULL CHECK (cycle_type IN ('ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'MONTHLY', 'PROJECT_BASED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal_setting_deadline DATE,
    self_review_deadline DATE,
    manager_review_deadline DATE,
    calibration_deadline DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'GOAL_SETTING', 'IN_REVIEW', 'CALIBRATION', 'COMPLETED', 'ARCHIVED')),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL
);

-- Performance goals/objectives
CREATE TABLE IF NOT EXISTS hrms.performance_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    cycle_id UUID NOT NULL REFERENCES hrms.performance_cycles(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    parent_goal_id UUID REFERENCES hrms.performance_goals(id), -- for cascaded goals
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('BUSINESS', 'DEVELOPMENT', 'TEAM', 'PERSONAL', 'COMPANY')),
    measurement_type VARCHAR(30) NOT NULL CHECK (measurement_type IN ('QUANTITATIVE', 'QUALITATIVE', 'MILESTONE', 'BINARY')),
    target_value DECIMAL(12, 2),
    target_unit VARCHAR(50),
    current_value DECIMAL(12, 2) DEFAULT 0,
    weight DECIMAL(5, 2) DEFAULT 100, -- percentage weight
    start_date DATE,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DEFERRED')),
    progress INT DEFAULT 0, -- 0-100
    is_key_result BOOLEAN DEFAULT FALSE,
    aligned_to_okr VARCHAR(255), -- company OKR reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL
);

-- Goal progress updates/check-ins
CREATE TABLE IF NOT EXISTS hrms.goal_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES hrms.performance_goals(id) ON DELETE CASCADE,
    progress_value DECIMAL(12, 2),
    progress_percentage INT,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance reviews
CREATE TABLE IF NOT EXISTS hrms.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    cycle_id UUID NOT NULL REFERENCES hrms.performance_cycles(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES hrms.employees(id),
    review_type VARCHAR(30) NOT NULL CHECK (review_type IN ('SELF', 'MANAGER', 'PEER', '360', 'SKIP_LEVEL', 'EXTERNAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'ACKNOWLEDGED', 'COMPLETED')),
    overall_rating DECIMAL(3, 2), -- e.g., 4.5 out of 5
    rating_scale VARCHAR(20) DEFAULT '5_POINT', -- 5_POINT, 4_POINT, 3_POINT, LETTER
    strengths TEXT,
    areas_for_improvement TEXT,
    achievements TEXT,
    manager_comments TEXT,
    employee_comments TEXT,
    development_plan TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cycle_id, employee_id, reviewer_id, review_type)
);

-- Review competency ratings
CREATE TABLE IF NOT EXISTS hrms.review_competency_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES hrms.performance_reviews(id) ON DELETE CASCADE,
    competency_name VARCHAR(100) NOT NULL,
    competency_category VARCHAR(50),
    rating DECIMAL(3, 2) NOT NULL,
    weight DECIMAL(5, 2) DEFAULT 100,
    comments TEXT,
    evidence TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance feedback (continuous)
CREATE TABLE IF NOT EXISTS hrms.performance_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    from_employee_id UUID NOT NULL REFERENCES hrms.employees(id),
    to_employee_id UUID NOT NULL REFERENCES hrms.employees(id),
    feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('PRAISE', 'CONSTRUCTIVE', 'REQUEST', 'GENERAL', 'RECOGNITION')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_private BOOLEAN DEFAULT TRUE, -- only visible to recipient and their manager
    message TEXT NOT NULL,
    related_goal_id UUID REFERENCES hrms.performance_goals(id),
    badges JSONB DEFAULT '[]', -- recognition badges/tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf_cycles_tenant ON hrms.performance_cycles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf_cycles_status ON hrms.performance_cycles(status);
CREATE INDEX IF NOT EXISTS idx_perf_goals_cycle ON hrms.performance_goals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_perf_goals_employee ON hrms.performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_goals_status ON hrms.performance_goals(status);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_cycle ON hrms.performance_reviews(cycle_id);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_employee ON hrms.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_feedback_to ON hrms.performance_feedback(to_employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_feedback_from ON hrms.performance_feedback(from_employee_id);

-- =======================================
-- HR ANALYTICS & METRICS TABLES
-- =======================================

-- Metric definitions
CREATE TABLE IF NOT EXISTS hrms.metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('WORKFORCE', 'RECRUITMENT', 'RETENTION', 'ENGAGEMENT', 'PERFORMANCE', 'COMPENSATION', 'ATTENDANCE', 'TRAINING', 'COMPLIANCE', 'CUSTOM')),
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('NUMBER', 'PERCENTAGE', 'CURRENCY', 'RATIO', 'DURATION', 'COUNT')),
    calculation_formula TEXT, -- SQL or formula for computing
    aggregation_type VARCHAR(20) CHECK (aggregation_type IN ('SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'LATEST')),
    target_value DECIMAL(12, 2),
    target_direction VARCHAR(10) CHECK (target_direction IN ('HIGHER', 'LOWER', 'EQUAL', 'RANGE')),
    target_min DECIMAL(12, 2),
    target_max DECIMAL(12, 2),
    unit VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    refresh_frequency VARCHAR(20) DEFAULT 'DAILY' CHECK (refresh_frequency IN ('REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Metric snapshots (historical data)
CREATE TABLE IF NOT EXISTS hrms.metric_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    metric_id UUID NOT NULL REFERENCES hrms.metric_definitions(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    value DECIMAL(16, 4) NOT NULL,
    previous_value DECIMAL(16, 4),
    change_value DECIMAL(16, 4),
    change_percentage DECIMAL(8, 4),
    breakdown JSONB, -- dimensional breakdown (by dept, location, etc.)
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_id, snapshot_date, period_type)
);

-- Metric trends for analysis
CREATE TABLE IF NOT EXISTS hrms.metric_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    metric_id UUID NOT NULL REFERENCES hrms.metric_definitions(id) ON DELETE CASCADE,
    trend_type VARCHAR(20) NOT NULL CHECK (trend_type IN ('MOVING_AVG', 'YOY', 'MOM', 'QOQ', 'FORECAST')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    trend_value DECIMAL(16, 4),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('UP', 'DOWN', 'STABLE')),
    confidence_level DECIMAL(5, 2),
    data_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard configurations
CREATE TABLE IF NOT EXISTS hrms.analytics_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    dashboard_type VARCHAR(30) NOT NULL CHECK (dashboard_type IN ('HR_OVERVIEW', 'RECRUITMENT', 'RETENTION', 'PERFORMANCE', 'COMPENSATION', 'COMPLIANCE', 'EXECUTIVE', 'CUSTOM')),
    layout JSONB NOT NULL DEFAULT '[]', -- widget positions and sizes
    filters JSONB DEFAULT '{}', -- default filters
    refresh_interval INT DEFAULT 300, -- seconds
    is_default BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_with JSONB DEFAULT '[]', -- user/role ids
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS hrms.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES hrms.analytics_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(30) NOT NULL CHECK (widget_type IN ('METRIC_CARD', 'LINE_CHART', 'BAR_CHART', 'PIE_CHART', 'DONUT_CHART', 'TABLE', 'HEATMAP', 'GAUGE', 'SPARKLINE', 'COMPARISON')),
    title VARCHAR(100) NOT NULL,
    metric_ids UUID[] DEFAULT '{}', -- metrics to display
    query_config JSONB, -- custom query configuration
    visualization_config JSONB NOT NULL DEFAULT '{}', -- colors, legends, etc.
    position_x INT NOT NULL DEFAULT 0,
    position_y INT NOT NULL DEFAULT 0,
    width INT NOT NULL DEFAULT 4, -- grid units
    height INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metric_defs_tenant ON hrms.metric_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metric_defs_category ON hrms.metric_definitions(category);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_metric ON hrms.metric_snapshots(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_snapshots_date ON hrms.metric_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_tenant ON hrms.analytics_dashboards(tenant_id);

-- =======================================
-- COST CENTER & LABOR COST TABLES
-- =======================================

-- Cost centers
CREATE TABLE IF NOT EXISTS hrms.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES hrms.cost_centers(id),
    cost_center_type VARCHAR(30) NOT NULL CHECK (cost_center_type IN ('DEPARTMENT', 'PROJECT', 'LOCATION', 'PRODUCT_LINE', 'BUSINESS_UNIT', 'CUSTOM')),
    manager_id UUID REFERENCES hrms.employees(id),
    budget_amount DECIMAL(14, 2),
    budget_currency VARCHAR(3) DEFAULT 'IDR',
    fiscal_year INT,
    is_active BOOLEAN DEFAULT TRUE,
    gl_account_code VARCHAR(50), -- general ledger integration
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Employee cost allocations (for split allocations)
CREATE TABLE IF NOT EXISTS hrms.employee_cost_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL REFERENCES hrms.employees(id) ON DELETE CASCADE,
    cost_center_id UUID NOT NULL REFERENCES hrms.cost_centers(id),
    allocation_percentage DECIMAL(5, 2) NOT NULL CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Labor cost records
CREATE TABLE IF NOT EXISTS hrms.labor_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL REFERENCES hrms.employees(id),
    cost_center_id UUID NOT NULL REFERENCES hrms.cost_centers(id),
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    cost_type VARCHAR(30) NOT NULL CHECK (cost_type IN ('SALARY', 'OVERTIME', 'BONUS', 'ALLOWANCE', 'INSURANCE', 'TAX', 'PENSION', 'TRAINING', 'RECRUITMENT', 'OTHER')),
    amount DECIMAL(14, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR',
    allocation_percentage DECIMAL(5, 2) DEFAULT 100,
    notes TEXT,
    source_reference VARCHAR(100), -- payroll run id, expense id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget vs Actual tracking
CREATE TABLE IF NOT EXISTS hrms.cost_center_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    cost_center_id UUID NOT NULL REFERENCES hrms.cost_centers(id),
    fiscal_year INT NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('MONTHLY', 'QUARTERLY', 'YEARLY')),
    period_number INT, -- month/quarter number
    budget_amount DECIMAL(14, 2) NOT NULL,
    actual_amount DECIMAL(14, 2) DEFAULT 0,
    variance_amount DECIMAL(14, 2) GENERATED ALWAYS AS (budget_amount - actual_amount) STORED,
    variance_percentage DECIMAL(8, 4),
    currency VARCHAR(3) DEFAULT 'IDR',
    status VARCHAR(20) DEFAULT 'ON_TRACK' CHECK (status IN ('ON_TRACK', 'AT_RISK', 'OVER_BUDGET', 'UNDER_BUDGET')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cost_center_id, fiscal_year, period_type, period_number)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON hrms.cost_centers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON hrms.cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_employee ON hrms.employee_cost_allocations(employee_id);
CREATE INDEX IF NOT EXISTS idx_cost_allocations_center ON hrms.employee_cost_allocations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_labor_costs_employee ON hrms.labor_costs(employee_id);
CREATE INDEX IF NOT EXISTS idx_labor_costs_center ON hrms.labor_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_labor_costs_period ON hrms.labor_costs(period_year, period_month);

-- =======================================
-- PAYROLL EXPORT TABLES
-- =======================================

-- Export templates
CREATE TABLE IF NOT EXISTS hrms.payroll_export_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN ('CSV', 'XLSX', 'PDF', 'XML', 'JSON', 'BANK_FILE', 'TAX_FILE')),
    target_system VARCHAR(50), -- e.g., 'BANK_BCA', 'TAX_EFILING', 'ACCOUNTING_SAP'
    field_mappings JSONB NOT NULL, -- column definitions and mappings
    header_config JSONB, -- header row config
    footer_config JSONB, -- footer/summary config
    formatting_rules JSONB, -- date formats, number formats, etc.
    validation_rules JSONB, -- validation before export
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export history
CREATE TABLE IF NOT EXISTS hrms.payroll_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    template_id UUID REFERENCES hrms.payroll_export_templates(id),
    payroll_run_id UUID, -- reference to payroll run
    export_type VARCHAR(30) NOT NULL CHECK (export_type IN ('PAYSLIP', 'BANK_TRANSFER', 'TAX_REPORT', 'SUMMARY', 'JOURNAL_ENTRY', 'AUDIT', 'CUSTOM')),
    period_year INT NOT NULL,
    period_month INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size INT,
    record_count INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(16, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    error_message TEXT,
    exported_by UUID NOT NULL REFERENCES users(id),
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Export field audit trail
CREATE TABLE IF NOT EXISTS hrms.payroll_export_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_id UUID NOT NULL REFERENCES hrms.payroll_exports(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES hrms.employees(id),
    row_data JSONB NOT NULL, -- exported data for this employee
    validation_status VARCHAR(20) DEFAULT 'VALID' CHECK (validation_status IN ('VALID', 'WARNING', 'ERROR')),
    validation_messages JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_templates_tenant ON hrms.payroll_export_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_tenant ON hrms.payroll_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exports_period ON hrms.payroll_exports(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_export_details_export ON hrms.payroll_export_details(export_id);

-- =======================================
-- INSERT DEFAULT METRICS
-- =======================================

-- Note: These will be inserted per tenant when needed
-- Sample metric definitions structure:
/*
INSERT INTO hrms.metric_definitions (tenant_id, name, code, category, data_type, calculation_formula, target_value, target_direction, unit)
VALUES 
-- Workforce Metrics
('tenant-id', 'Headcount', 'HEADCOUNT', 'WORKFORCE', 'COUNT', 'SELECT COUNT(*) FROM hrms.employees WHERE status = ''ACTIVE''', NULL, NULL, 'employees'),
('tenant-id', 'Turnover Rate', 'TURNOVER_RATE', 'RETENTION', 'PERCENTAGE', NULL, 10, 'LOWER', '%'),
('tenant-id', 'Average Tenure', 'AVG_TENURE', 'WORKFORCE', 'DURATION', NULL, NULL, 'HIGHER', 'months'),
('tenant-id', 'Gender Ratio', 'GENDER_RATIO', 'WORKFORCE', 'RATIO', NULL, NULL, 'EQUAL', NULL),
-- Performance Metrics  
('tenant-id', 'Goal Completion Rate', 'GOAL_COMPLETION', 'PERFORMANCE', 'PERCENTAGE', NULL, 80, 'HIGHER', '%'),
('tenant-id', 'Average Performance Score', 'AVG_PERF_SCORE', 'PERFORMANCE', 'NUMBER', NULL, 3.5, 'HIGHER', NULL),
-- Attendance Metrics
('tenant-id', 'Absenteeism Rate', 'ABSENTEEISM', 'ATTENDANCE', 'PERCENTAGE', NULL, 3, 'LOWER', '%'),
('tenant-id', 'Overtime Hours', 'OVERTIME_HOURS', 'ATTENDANCE', 'DURATION', NULL, NULL, 'LOWER', 'hours'),
-- Compensation Metrics
('tenant-id', 'Labor Cost per Employee', 'LABOR_COST_PER_EMP', 'COMPENSATION', 'CURRENCY', NULL, NULL, NULL, 'IDR'),
('tenant-id', 'Benefits Cost Ratio', 'BENEFITS_RATIO', 'COMPENSATION', 'PERCENTAGE', NULL, 30, 'RANGE', '%');
*/

-- =======================================
-- TRIGGER FOR UPDATED_AT
-- =======================================

CREATE OR REPLACE FUNCTION hrms.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'hrms' 
        AND column_name = 'updated_at'
        AND table_name IN (
            'approval_chains', 'approval_requests', 'performance_cycles', 
            'performance_goals', 'performance_reviews', 'metric_definitions',
            'analytics_dashboards', 'dashboard_widgets', 'cost_centers',
            'employee_cost_allocations', 'cost_center_budgets', 'payroll_export_templates'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON hrms.%I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON hrms.%I
            FOR EACH ROW
            EXECUTE FUNCTION hrms.update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

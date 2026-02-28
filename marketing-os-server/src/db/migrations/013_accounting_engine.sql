-- ============================================================================
-- ACCOUNTING ENGINE - DATABASE SCHEMA
-- ============================================================================
-- This migration creates the complete financial accounting infrastructure
-- following double-entry accounting principles with full audit trail.
--
-- Design Principles:
-- 1. Immutable ledger - entries cannot be modified after posting
-- 2. Branch-aware - every transaction belongs to exactly one branch
-- 3. Full audit trail - complete traceability to source documents
-- 4. Multi-currency ready - supports currency conversion
-- 5. Hierarchical COA - parent-child account relationships
-- ============================================================================

-- ============================================================================
-- 1. CHART OF ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Account identification
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Account classification
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')),
    sub_type VARCHAR(30),
    normal_balance VARCHAR(10) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    
    -- Hierarchy
    parent_account_id UUID REFERENCES public.accounts(id),
    level INTEGER NOT NULL DEFAULT 1,
    is_header BOOLEAN NOT NULL DEFAULT false,
    
    -- Account properties
    is_bank_account BOOLEAN NOT NULL DEFAULT false,
    is_system_account BOOLEAN NOT NULL DEFAULT false,
    is_tax_account BOOLEAN NOT NULL DEFAULT false,
    allow_branch_posting BOOLEAN NOT NULL DEFAULT true,
    
    -- Currency & Tax
    currency VARCHAR(3) DEFAULT 'INR',
    tax_rate DECIMAL(5,2),
    
    -- Cost center
    cost_center_id UUID,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.users(id),
    
    -- Audit
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON public.accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(tenant_id, account_type);
CREATE INDEX IF NOT EXISTS idx_accounts_parent ON public.accounts(tenant_id, parent_account_id);
CREATE INDEX IF NOT EXISTS idx_accounts_code ON public.accounts(tenant_id, code);

-- ============================================================================
-- 2. COST CENTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_cost_center_id UUID REFERENCES public.cost_centers(id),
    level INTEGER NOT NULL DEFAULT 1,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant ON public.cost_centers(tenant_id);

-- ============================================================================
-- 3. FISCAL YEARS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fiscal_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    year INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    is_current BOOLEAN NOT NULL DEFAULT false,
    is_closed BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, year)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_years_tenant ON public.fiscal_years(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_current ON public.fiscal_years(tenant_id, is_current);

-- ============================================================================
-- 4. FISCAL PERIODS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    
    fiscal_year INTEGER NOT NULL,
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'SOFT_CLOSED', 'CLOSED', 'LOCKED')),
    
    -- Close tracking
    opening_balances_posted BOOLEAN NOT NULL DEFAULT false,
    closing_balances_posted BOOLEAN NOT NULL DEFAULT false,
    retained_earnings_posted BOOLEAN NOT NULL DEFAULT false,
    
    adjustments_allowed BOOLEAN NOT NULL DEFAULT true,
    adjustment_deadline TIMESTAMPTZ,
    
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.users(id),
    locked_at TIMESTAMPTZ,
    locked_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, branch_id, fiscal_year, period_number)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant ON public.fiscal_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status ON public.fiscal_periods(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_year ON public.fiscal_periods(tenant_id, fiscal_year);

-- ============================================================================
-- 5. JOURNAL ENTRIES (Header)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    -- Entry identification
    entry_number VARCHAR(50),
    entry_date DATE NOT NULL,
    posting_date DATE,
    
    -- Type & Status
    entry_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (
        entry_type IN ('STANDARD', 'REVERSING', 'RECURRING', 'ADJUSTING', 'OPENING', 'CLOSING', 'INTER_BRANCH')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'POSTED', 'REVERSED', 'PENDING_APPROVAL')
    ),
    
    description TEXT NOT NULL,
    
    -- Source tracking (audit trail)
    source_module VARCHAR(30) NOT NULL,
    source_record_id UUID,
    source_record_type VARCHAR(50),
    
    -- Totals
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1,
    
    -- Fiscal period
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    
    -- Reversal tracking
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversed_by_entry_id UUID REFERENCES public.journal_entries(id),
    reverses_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Approval workflow
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Notes
    notes TEXT,
    attachments TEXT[],
    
    -- Audit
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT journal_entries_balanced CHECK (total_debit = total_credit)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tenant ON public.journal_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_branch ON public.journal_entries(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON public.journal_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_number ON public.journal_entries(tenant_id, entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_source ON public.journal_entries(tenant_id, source_module, source_record_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_fiscal ON public.journal_entries(tenant_id, fiscal_year, fiscal_period);

-- ============================================================================
-- 6. JOURNAL LINES (Detail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    
    -- Account
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    account_code VARCHAR(20),
    account_name VARCHAR(255),
    
    -- Amounts
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1,
    base_currency_amount DECIMAL(18,2),
    
    -- Dimensions for reporting
    branch_id UUID REFERENCES public.branches(id),
    cost_center_id UUID REFERENCES public.cost_centers(id),
    trip_id UUID,
    booking_id UUID,
    vendor_id UUID,
    customer_id UUID,
    employee_id UUID,
    
    -- Tax
    tax_code VARCHAR(20),
    tax_amount DECIMAL(18,2) DEFAULT 0,
    
    -- Description
    description TEXT,
    line_number INTEGER NOT NULL,
    
    -- Constraints
    CONSTRAINT journal_lines_single_sided CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0) OR
        (debit_amount = 0 AND credit_amount = 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON public.journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_trip ON public.journal_lines(trip_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_booking ON public.journal_lines(booking_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_vendor ON public.journal_lines(vendor_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_customer ON public.journal_lines(customer_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_employee ON public.journal_lines(employee_id);

-- ============================================================================
-- 7. GENERAL LEDGER (Immutable Posted Entries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    -- Account
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    
    -- Journal reference
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id),
    journal_line_id UUID NOT NULL REFERENCES public.journal_lines(id),
    entry_number VARCHAR(50) NOT NULL,
    
    -- Transaction details
    entry_date DATE NOT NULL,
    posting_date DATE NOT NULL,
    description TEXT NOT NULL,
    
    -- Amounts (immutable)
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    running_balance DECIMAL(18,2) NOT NULL,
    
    -- Currency
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1,
    base_currency_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    base_currency_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    -- Dimensions (denormalized for reporting performance)
    customer_id UUID,
    vendor_id UUID,
    employee_id UUID,
    trip_id UUID,
    booking_id UUID,
    cost_center_id UUID,
    
    -- Source tracking
    source_module VARCHAR(30) NOT NULL,
    source_record_id UUID,
    
    -- Fiscal period
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    
    -- Entry type
    entry_type VARCHAR(20) NOT NULL DEFAULT 'POSTED',
    
    -- Audit (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES public.users(id),
    
    -- Constraints
    CONSTRAINT ledger_entries_single_sided CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);

-- Critical indexes for ledger queries
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tenant ON public.ledger_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON public.ledger_entries(tenant_id, account_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_branch ON public.ledger_entries(tenant_id, branch_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_date ON public.ledger_entries(tenant_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_fiscal ON public.ledger_entries(tenant_id, fiscal_year, fiscal_period);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_customer ON public.ledger_entries(tenant_id, customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_entries_vendor ON public.ledger_entries(tenant_id, vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_entries_employee ON public.ledger_entries(tenant_id, employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_entries_trip ON public.ledger_entries(tenant_id, trip_id) WHERE trip_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_entries_booking ON public.ledger_entries(tenant_id, booking_id) WHERE booking_id IS NOT NULL;

-- ============================================================================
-- 8. ACCOUNT BALANCES (Materialized Summary for Performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    branch_id UUID REFERENCES public.branches(id),
    
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    
    opening_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    debit_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, account_id, branch_id, fiscal_year, fiscal_period)
);

CREATE INDEX IF NOT EXISTS idx_account_balances_account ON public.account_balances(tenant_id, account_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_period ON public.account_balances(tenant_id, fiscal_year, fiscal_period);

-- ============================================================================
-- 9. TAX CODES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tax_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('GST', 'VAT', 'SALES_TAX', 'SERVICE_TAX', 'TDS', 'WITHHOLDING', 'CUSTOM')),
    tax_category VARCHAR(20) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    calculation_method VARCHAR(10) NOT NULL DEFAULT 'EXCLUSIVE' CHECK (calculation_method IN ('EXCLUSIVE', 'INCLUSIVE')),
    
    -- Account mapping
    input_tax_account_id UUID REFERENCES public.accounts(id),
    output_tax_account_id UUID REFERENCES public.accounts(id),
    expense_account_id UUID REFERENCES public.accounts(id),
    
    -- Validity
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Special flags
    is_reverse_charge BOOLEAN NOT NULL DEFAULT false,
    is_compound BOOLEAN NOT NULL DEFAULT false,
    compound_on_tax_codes TEXT[],
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_tax_codes_tenant ON public.tax_codes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_codes_type ON public.tax_codes(tenant_id, tax_type);

-- ============================================================================
-- 10. TAX REGISTRATIONS (Branch-level tax IDs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tax_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    tax_type VARCHAR(20) NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    state_code VARCHAR(5),
    
    registration_date DATE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    filing_frequency VARCHAR(20) CHECK (filing_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUALLY')),
    composition_scheme BOOLEAN NOT NULL DEFAULT false,
    reverse_charge_applicable BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, branch_id, tax_type)
);

CREATE INDEX IF NOT EXISTS idx_tax_registrations_branch ON public.tax_registrations(tenant_id, branch_id);

-- ============================================================================
-- 11. TAX TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tax_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    tax_code_id UUID NOT NULL REFERENCES public.tax_codes(id),
    tax_code VARCHAR(20) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(20) NOT NULL,
    tax_category VARCHAR(20) NOT NULL,
    
    -- Source
    source_module VARCHAR(30) NOT NULL,
    source_record_id UUID NOT NULL,
    journal_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Transaction details
    transaction_date DATE NOT NULL,
    place_of_supply VARCHAR(20) NOT NULL,
    
    -- Amounts
    taxable_amount DECIMAL(18,2) NOT NULL,
    tax_amount DECIMAL(18,2) NOT NULL,
    total_amount DECIMAL(18,2) NOT NULL,
    
    -- Party
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('CUSTOMER', 'VENDOR', 'EMPLOYEE')),
    party_id UUID NOT NULL,
    party_name VARCHAR(255) NOT NULL,
    party_tax_id VARCHAR(50),
    
    -- Tax direction
    is_input_tax BOOLEAN NOT NULL,
    is_reverse_charge BOOLEAN NOT NULL DEFAULT false,
    
    -- Credit tracking
    is_credited BOOLEAN NOT NULL DEFAULT false,
    credited_at TIMESTAMPTZ,
    
    -- Fiscal period
    fiscal_year INTEGER NOT NULL,
    fiscal_period INTEGER NOT NULL,
    
    -- Filing status
    is_reported BOOLEAN NOT NULL DEFAULT false,
    reported_in_return VARCHAR(50),
    reported_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tax_transactions_tenant ON public.tax_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_branch ON public.tax_transactions(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_period ON public.tax_transactions(tenant_id, fiscal_year, fiscal_period);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_party ON public.tax_transactions(tenant_id, party_type, party_id);
CREATE INDEX IF NOT EXISTS idx_tax_transactions_type ON public.tax_transactions(tenant_id, tax_type, is_input_tax);

-- ============================================================================
-- 12. BANK ACCOUNTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    
    -- Link to COA
    account_id UUID NOT NULL REFERENCES public.accounts(id),
    
    -- Bank details
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CURRENT', 'SAVINGS', 'CASH_CREDIT', 'OVERDRAFT', 'PAYMENT_GATEWAY')),
    
    ifsc_code VARCHAR(20),
    swift_code VARCHAR(20),
    
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    opening_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(18,2) NOT NULL DEFAULT 0,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    
    -- Reconciliation
    last_reconciled_date DATE,
    last_reconciled_balance DECIMAL(18,2),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant ON public.bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_branch ON public.bank_accounts(tenant_id, branch_id);

-- ============================================================================
-- 13. BANK TRANSACTIONS (for reconciliation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    
    transaction_date DATE NOT NULL,
    value_date DATE,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    
    debit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    balance DECIMAL(18,2),
    
    -- Reconciliation
    is_reconciled BOOLEAN NOT NULL DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES public.users(id),
    matched_ledger_entry_id UUID REFERENCES public.ledger_entries(id),
    matched_journal_entry_id UUID REFERENCES public.journal_entries(id),
    
    -- Import tracking
    imported_from VARCHAR(100),
    imported_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON public.bank_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON public.bank_transactions(bank_account_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_reconciled ON public.bank_transactions(bank_account_id, is_reconciled);

-- ============================================================================
-- 14. ACCOUNTING AUDIT LOG (Immutable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    
    -- What was affected
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- What happened
    action VARCHAR(30) NOT NULL,
    
    -- Who did it
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('USER', 'SYSTEM', 'API')),
    actor_id UUID,
    actor_name VARCHAR(255),
    
    -- Before and after (for changes)
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    source_module VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON public.accounting_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.accounting_audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON public.accounting_audit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.accounting_audit_log(tenant_id, actor_id);

-- ============================================================================
-- 15. SEQUENCE COUNTERS (for entry numbers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accounting_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    
    sequence_type VARCHAR(30) NOT NULL,
    prefix VARCHAR(10),
    current_value INTEGER NOT NULL DEFAULT 0,
    fiscal_year INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(tenant_id, branch_id, sequence_type, fiscal_year)
);

-- ============================================================================
-- 16. INTER-BRANCH TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.inter_branch_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    from_branch_id UUID NOT NULL REFERENCES public.branches(id),
    to_branch_id UUID NOT NULL REFERENCES public.branches(id),
    
    transaction_date DATE NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    description TEXT NOT NULL,
    
    transfer_type VARCHAR(30) NOT NULL CHECK (transfer_type IN ('FUND', 'EXPENSE_ALLOCATION', 'REVENUE_SHARE')),
    
    -- Journal entries created
    from_branch_journal_id UUID REFERENCES public.journal_entries(id),
    to_branch_journal_id UUID REFERENCES public.journal_entries(id),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inter_branch_tenant ON public.inter_branch_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inter_branch_from ON public.inter_branch_transactions(from_branch_id);
CREATE INDEX IF NOT EXISTS idx_inter_branch_to ON public.inter_branch_transactions(to_branch_id);

-- ============================================================================
-- 17. HELPER FUNCTIONS
-- ============================================================================

-- Function to get next sequence number
CREATE OR REPLACE FUNCTION get_next_accounting_sequence(
    p_tenant_id UUID,
    p_branch_id UUID,
    p_sequence_type VARCHAR(30),
    p_prefix VARCHAR(10) DEFAULT NULL,
    p_fiscal_year INTEGER DEFAULT NULL
) RETURNS VARCHAR(50) AS $$
DECLARE
    v_next_value INTEGER;
    v_result VARCHAR(50);
BEGIN
    -- Insert or update sequence
    INSERT INTO public.accounting_sequences (tenant_id, branch_id, sequence_type, prefix, current_value, fiscal_year)
    VALUES (p_tenant_id, p_branch_id, p_sequence_type, p_prefix, 1, p_fiscal_year)
    ON CONFLICT (tenant_id, branch_id, sequence_type, fiscal_year)
    DO UPDATE SET current_value = accounting_sequences.current_value + 1, updated_at = NOW()
    RETURNING current_value INTO v_next_value;
    
    -- Format result
    IF p_prefix IS NOT NULL THEN
        v_result := p_prefix || LPAD(v_next_value::TEXT, 6, '0');
    ELSE
        v_result := LPAD(v_next_value::TEXT, 8, '0');
    END IF;
    
    IF p_fiscal_year IS NOT NULL THEN
        v_result := p_fiscal_year::TEXT || '/' || v_result;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balances after ledger posting
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.account_balances (
        tenant_id, account_id, branch_id, fiscal_year, fiscal_period,
        debit_total, credit_total, closing_balance, last_updated
    )
    VALUES (
        NEW.tenant_id, NEW.account_id, NEW.branch_id, NEW.fiscal_year, NEW.fiscal_period,
        NEW.debit_amount, NEW.credit_amount, NEW.debit_amount - NEW.credit_amount, NOW()
    )
    ON CONFLICT (tenant_id, account_id, branch_id, fiscal_year, fiscal_period)
    DO UPDATE SET
        debit_total = account_balances.debit_total + NEW.debit_amount,
        credit_total = account_balances.credit_total + NEW.credit_amount,
        closing_balance = account_balances.closing_balance + (NEW.debit_amount - NEW.credit_amount),
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic balance updates
DROP TRIGGER IF EXISTS trigger_update_account_balance ON public.ledger_entries;
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT ON public.ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- ============================================================================
-- 18. VIEWS FOR REPORTING
-- ============================================================================

-- Trial Balance View
CREATE OR REPLACE VIEW public.v_trial_balance AS
SELECT 
    a.tenant_id,
    a.id as account_id,
    a.code as account_code,
    a.name as account_name,
    a.account_type,
    a.level,
    a.is_header,
    COALESCE(SUM(CASE WHEN a.normal_balance = 'DEBIT' 
        THEN ab.closing_balance 
        ELSE 0 END), 0) as debit_balance,
    COALESCE(SUM(CASE WHEN a.normal_balance = 'CREDIT' 
        THEN ab.closing_balance 
        ELSE 0 END), 0) as credit_balance
FROM public.accounts a
LEFT JOIN public.account_balances ab ON a.id = ab.account_id
GROUP BY a.tenant_id, a.id, a.code, a.name, a.account_type, a.level, a.is_header, a.normal_balance;

-- P&L Summary View
CREATE OR REPLACE VIEW public.v_profit_loss AS
SELECT 
    ab.tenant_id,
    ab.branch_id,
    ab.fiscal_year,
    ab.fiscal_period,
    a.account_type,
    a.sub_type,
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN ab.credit_total - ab.debit_total ELSE 0 END) as revenue,
    SUM(CASE WHEN a.account_type = 'EXPENSE' THEN ab.debit_total - ab.credit_total ELSE 0 END) as expenses,
    SUM(CASE WHEN a.account_type = 'REVENUE' THEN ab.credit_total - ab.debit_total ELSE 0 END) -
    SUM(CASE WHEN a.account_type = 'EXPENSE' THEN ab.debit_total - ab.credit_total ELSE 0 END) as net_profit
FROM public.account_balances ab
JOIN public.accounts a ON ab.account_id = a.id
WHERE a.account_type IN ('REVENUE', 'EXPENSE')
GROUP BY ab.tenant_id, ab.branch_id, ab.fiscal_year, ab.fiscal_period, a.account_type, a.sub_type;

COMMENT ON TABLE public.accounts IS 'Chart of Accounts - hierarchical account structure for double-entry accounting';
COMMENT ON TABLE public.journal_entries IS 'Journal entries - immutable double-entry transactions';
COMMENT ON TABLE public.ledger_entries IS 'General Ledger - posted transactions (immutable after creation)';
COMMENT ON TABLE public.tax_codes IS 'Tax configuration - GST/VAT/TDS codes with rates and accounts';
COMMENT ON TABLE public.bank_accounts IS 'Bank accounts for reconciliation';
COMMENT ON TABLE public.accounting_audit_log IS 'Immutable audit trail for all accounting activities';

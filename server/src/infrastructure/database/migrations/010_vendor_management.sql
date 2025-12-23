-- Vendor & Supplier Management System Migration
-- Comprehensive vendor, contract, rate, payable, and settlement management

-- ============================================================================
-- VENDOR TYPES ENUM
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE vendor_type AS ENUM (
        'TRANSPORT',      -- Vehicle owners (cars, jeeps, buses)
        'HOTEL',          -- Hotels, homestays, lodges
        'EQUIPMENT',      -- Equipment rental vendors
        'GUIDE',          -- Local guides, instructors
        'PERMIT_AGENT',   -- Permit & compliance agents
        'CATERING',       -- Food service providers
        'OTHER'           -- Extensible for future types
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- VENDOR STATUS ENUM
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE vendor_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'PENDING_VERIFICATION',
        'BLACKLISTED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- VENDORS (SINGLE SOURCE OF TRUTH)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identity
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    vendor_type vendor_type NOT NULL,
    vendor_code VARCHAR(50), -- Internal reference code
    
    -- Contact
    primary_contact_name VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    primary_contact_email VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    
    -- Locations served (JSONB array of regions/cities)
    service_regions JSONB DEFAULT '[]',
    
    -- Financial
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    upi_id VARCHAR(100),
    tax_id VARCHAR(50), -- GST/PAN
    tax_type VARCHAR(20), -- 'GST', 'PAN', etc.
    payment_preference VARCHAR(20) DEFAULT 'BANK', -- 'BANK', 'UPI', 'CASH'
    default_currency VARCHAR(3) DEFAULT 'INR',
    
    -- Compliance (JSONB for flexible document tracking)
    compliance_documents JSONB DEFAULT '[]',
    -- Structure: [{type: 'LICENSE', number: 'xxx', expiry: 'date', verified: bool}]
    
    -- Operational
    service_capacity INTEGER, -- e.g., number of vehicles, rooms
    availability_calendar JSONB DEFAULT '{}', -- Flexible availability
    blackout_dates JSONB DEFAULT '[]', -- Dates when unavailable
    
    -- Performance metrics (calculated/cached)
    reliability_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    total_assignments INTEGER DEFAULT 0,
    completed_assignments INTEGER DEFAULT 0,
    cancelled_assignments INTEGER DEFAULT 0,
    dispute_count INTEGER DEFAULT 0,
    on_time_rate DECIMAL(5,2) DEFAULT 100.00, -- percentage
    
    -- Internal rating (1-5 stars)
    internal_rating DECIMAL(2,1) DEFAULT 0.0,
    internal_notes TEXT,
    
    -- Status
    status vendor_status DEFAULT 'PENDING_VERIFICATION',
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Type-specific attributes
    attributes JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT vendors_tenant_code_unique UNIQUE(tenant_id, vendor_code)
);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(tenant_id, vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vendors_search ON vendors USING gin(to_tsvector('english', legal_name || ' ' || display_name));

-- ============================================================================
-- VENDOR CONTACTS (Multiple contacts per vendor)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- e.g., 'Owner', 'Manager', 'Driver'
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    is_emergency BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor ON vendor_contacts(vendor_id);

-- ============================================================================
-- VENDOR CONTRACTS (Versioned, non-destructive)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE contract_status AS ENUM (
        'DRAFT',
        'ACTIVE',
        'EXPIRED',
        'TERMINATED',
        'RENEWED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Contract identity
    contract_number VARCHAR(100),
    version INTEGER DEFAULT 1,
    
    -- Validity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Terms
    services_covered JSONB DEFAULT '[]', -- List of service types
    cancellation_terms TEXT,
    penalty_clauses JSONB DEFAULT '{}',
    advance_rules JSONB DEFAULT '{}', -- {percentage: 20, days_before: 7}
    settlement_cycle VARCHAR(20) DEFAULT 'TRIP_END', -- 'DAILY', 'WEEKLY', 'MONTHLY', 'TRIP_END'
    payment_terms_days INTEGER DEFAULT 7, -- Days after service to settle
    
    -- Documents
    contract_document_url TEXT,
    
    -- Status
    status contract_status DEFAULT 'DRAFT',
    signed_at TIMESTAMPTZ,
    signed_by_vendor VARCHAR(255),
    signed_by_tenant UUID REFERENCES users(id),
    
    -- Previous version tracking
    previous_version_id UUID REFERENCES vendor_contracts(id),
    
    -- Notes
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor ON vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_status ON vendor_contracts(status);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_dates ON vendor_contracts(start_date, end_date);

-- ============================================================================
-- VENDOR RATES (Versioned, date-bound, non-destructive)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE rate_type AS ENUM (
        'PER_DAY',
        'PER_NIGHT',
        'PER_TRIP',
        'PER_KM',
        'PER_PERSON',
        'PER_UNIT',
        'FLAT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES vendor_contracts(id),
    
    -- Rate identity
    rate_name VARCHAR(255) NOT NULL, -- e.g., 'Standard Vehicle Rate', 'Peak Season'
    rate_type rate_type NOT NULL,
    
    -- Validity (for seasonal pricing)
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Pricing
    base_rate DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Conditions
    min_quantity INTEGER DEFAULT 1, -- Minimum units/days/km
    max_quantity INTEGER,
    
    -- Group size slabs (JSONB)
    -- Structure: [{min_pax: 1, max_pax: 5, rate: 1000}, {min_pax: 6, max_pax: 10, rate: 900}]
    group_slabs JSONB DEFAULT '[]',
    
    -- Distance slabs (for transport)
    -- Structure: [{min_km: 0, max_km: 100, rate: 15}, {min_km: 101, max_km: 200, rate: 12}]
    distance_slabs JSONB DEFAULT '[]',
    
    -- Inclusions/Exclusions
    inclusions JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    
    -- Version tracking
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES vendor_rates(id),
    is_current BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_rates_vendor ON vendor_rates(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_rates_validity ON vendor_rates(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_vendor_rates_current ON vendor_rates(vendor_id, is_current) WHERE is_current = true;

-- ============================================================================
-- VENDOR ASSIGNMENTS (Linking to bookings/trips)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'REQUESTED',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'COMPLETED',
        'PARTIALLY_COMPLETED',
        'CANCELLED',
        'DISPUTED',
        'REPLACED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Link to booking/resource/departure
    booking_id UUID REFERENCES bookings(id),
    resource_id UUID REFERENCES resources(id),
    departure_id UUID, -- Link to departure_instances if exists
    
    -- Assignment details
    assignment_type VARCHAR(50), -- 'TRANSPORT', 'ACCOMMODATION', etc.
    service_description TEXT,
    
    -- Dates
    service_start_date DATE NOT NULL,
    service_end_date DATE NOT NULL,
    
    -- Rate applied
    rate_id UUID REFERENCES vendor_rates(id),
    rate_snapshot JSONB DEFAULT '{}', -- Frozen rate at assignment time
    
    -- Quantity/Units
    quantity INTEGER DEFAULT 1,
    unit_type VARCHAR(20), -- 'days', 'nights', 'km', 'persons', 'units'
    
    -- Pricing
    gross_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status
    status assignment_status DEFAULT 'REQUESTED',
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Replacement tracking
    replaced_by_id UUID REFERENCES vendor_assignments(id),
    replaces_id UUID REFERENCES vendor_assignments(id),
    
    -- Fulfilment tracking
    fulfilment_percentage DECIMAL(5,2) DEFAULT 0.00,
    fulfilment_notes TEXT,
    
    -- Customer feedback (if applicable)
    customer_rating DECIMAL(2,1),
    customer_feedback TEXT,
    
    -- Internal
    internal_notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_assignments_vendor ON vendor_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_booking ON vendor_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_status ON vendor_assignments(status);
CREATE INDEX IF NOT EXISTS idx_vendor_assignments_dates ON vendor_assignments(service_start_date, service_end_date);

-- ============================================================================
-- VENDOR PAYABLES (Settlement Engine)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE payable_status AS ENUM (
        'DRAFT',
        'PENDING',
        'APPROVED',
        'PARTIALLY_SETTLED',
        'FULLY_SETTLED',
        'ON_HOLD',
        'DISPUTED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES vendor_assignments(id),
    
    -- Payable reference
    payable_number VARCHAR(100),
    
    -- Amounts
    gross_amount DECIMAL(12,2) NOT NULL,
    advance_paid DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    penalties DECIMAL(12,2) DEFAULT 0,
    adjustments DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    net_payable DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Deduction breakdown (JSONB)
    deduction_details JSONB DEFAULT '[]',
    -- Structure: [{reason: 'Late arrival', amount: 500}]
    
    -- Due date
    due_date DATE,
    
    -- Status
    status payable_status DEFAULT 'DRAFT',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    
    -- Amounts settled
    amount_settled DECIMAL(12,2) DEFAULT 0,
    
    -- Notes
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payables_vendor ON vendor_payables(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payables_status ON vendor_payables(status);
CREATE INDEX IF NOT EXISTS idx_vendor_payables_due ON vendor_payables(due_date);

-- ============================================================================
-- VENDOR SETTLEMENTS (Payments made to vendors)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE settlement_method AS ENUM (
        'BANK_TRANSFER',
        'UPI',
        'CASH',
        'CHEQUE',
        'ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    
    -- Settlement reference
    settlement_number VARCHAR(100),
    
    -- Linked payables (can settle multiple at once)
    payable_ids UUID[] DEFAULT '{}',
    
    -- Amount
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Payment details
    payment_method settlement_method NOT NULL,
    payment_reference VARCHAR(255), -- Transaction ID, cheque number, etc.
    payment_date DATE NOT NULL,
    
    -- Bank details snapshot
    bank_details_snapshot JSONB DEFAULT '{}',
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Notes
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_settlements_vendor ON vendor_settlements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_settlements_date ON vendor_settlements(payment_date);

-- Junction table for settlement-payable many-to-many
CREATE TABLE IF NOT EXISTS vendor_settlement_payables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    settlement_id UUID NOT NULL REFERENCES vendor_settlements(id) ON DELETE CASCADE,
    payable_id UUID NOT NULL REFERENCES vendor_payables(id) ON DELETE CASCADE,
    amount_applied DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(settlement_id, payable_id)
);

-- ============================================================================
-- VENDOR DISPUTES
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE dispute_status AS ENUM (
        'OPEN',
        'UNDER_REVIEW',
        'RESOLVED_VENDOR_FAVOR',
        'RESOLVED_TENANT_FAVOR',
        'RESOLVED_COMPROMISE',
        'CLOSED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS vendor_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES vendor_assignments(id),
    payable_id UUID REFERENCES vendor_payables(id),
    
    -- Dispute details
    dispute_number VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    dispute_type VARCHAR(50), -- 'SERVICE_QUALITY', 'PAYMENT', 'CANCELLATION', etc.
    
    -- Amounts in dispute
    disputed_amount DECIMAL(12,2),
    resolved_amount DECIMAL(12,2),
    
    -- Evidence/Documents
    evidence_urls JSONB DEFAULT '[]',
    
    -- Status
    status dispute_status DEFAULT 'OPEN',
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    -- Resolution
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    
    -- Adjustment ledger entry
    adjustment_amount DECIMAL(12,2) DEFAULT 0,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_disputes_vendor ON vendor_disputes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_disputes_status ON vendor_disputes(status);

-- ============================================================================
-- VENDOR AUDIT LOG (No deletions, only reversals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id),
    
    -- Entity tracking
    entity_type VARCHAR(50) NOT NULL, -- 'VENDOR', 'CONTRACT', 'RATE', 'ASSIGNMENT', 'PAYABLE', 'SETTLEMENT', 'DISPUTE'
    entity_id UUID NOT NULL,
    
    -- Action
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'REVERSAL', etc.
    
    -- Data
    old_values JSONB,
    new_values JSONB,
    
    -- User
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Notes
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_vendor_audit_entity ON vendor_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vendor_audit_vendor ON vendor_audit_log(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_audit_date ON vendor_audit_log(performed_at);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update vendor performance metrics
CREATE OR REPLACE FUNCTION update_vendor_performance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status IN ('COMPLETED', 'CANCELLED') THEN
        UPDATE vendors SET
            total_assignments = (
                SELECT COUNT(*) FROM vendor_assignments 
                WHERE vendor_id = NEW.vendor_id
            ),
            completed_assignments = (
                SELECT COUNT(*) FROM vendor_assignments 
                WHERE vendor_id = NEW.vendor_id AND status = 'COMPLETED'
            ),
            cancelled_assignments = (
                SELECT COUNT(*) FROM vendor_assignments 
                WHERE vendor_id = NEW.vendor_id AND status = 'CANCELLED'
            ),
            updated_at = NOW()
        WHERE id = NEW.vendor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vendor_performance ON vendor_assignments;
CREATE TRIGGER trigger_vendor_performance
    AFTER UPDATE ON vendor_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_performance();

-- Auto-generate payable number
CREATE OR REPLACE FUNCTION generate_payable_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(payable_number FROM 'PAY-([0-9]+)') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM vendor_payables
    WHERE tenant_id = NEW.tenant_id;
    
    NEW.payable_number := 'PAY-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payable_number ON vendor_payables;
CREATE TRIGGER trigger_payable_number
    BEFORE INSERT ON vendor_payables
    FOR EACH ROW
    WHEN (NEW.payable_number IS NULL)
    EXECUTE FUNCTION generate_payable_number();

-- Auto-generate settlement number
CREATE OR REPLACE FUNCTION generate_settlement_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(settlement_number FROM 'STL-([0-9]+)') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM vendor_settlements
    WHERE tenant_id = NEW.tenant_id;
    
    NEW.settlement_number := 'STL-' || LPAD(seq_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_settlement_number ON vendor_settlements;
CREATE TRIGGER trigger_settlement_number
    BEFORE INSERT ON vendor_settlements
    FOR EACH ROW
    WHEN (NEW.settlement_number IS NULL)
    EXECUTE FUNCTION generate_settlement_number();

-- Updated_at trigger for all vendor tables
CREATE OR REPLACE FUNCTION update_vendor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all vendor tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['vendors', 'vendor_contacts', 'vendor_contracts', 'vendor_rates', 
                              'vendor_assignments', 'vendor_payables', 'vendor_settlements', 'vendor_disputes']
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_update_%s_timestamp ON %s', t, t);
        EXECUTE format('
            CREATE TRIGGER trigger_update_%s_timestamp
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_vendor_updated_at()
        ', t, t);
    END LOOP;
END $$;

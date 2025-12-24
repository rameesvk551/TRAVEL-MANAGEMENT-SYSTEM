-- ============================================================================
-- GEAR MANAGEMENT SYSTEM - Database Schema
-- Enterprise-grade trekking/adventure equipment management
-- ============================================================================

-- Extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GEAR WAREHOUSES / LOCATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'MAIN', -- MAIN, BASE_CAMP, TRANSIT, PARTNER, MOBILE
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INTEGER, -- meters above sea level
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    operating_hours VARCHAR(255),
    capacity INTEGER DEFAULT 0,
    zones TEXT[], -- Array of zone codes
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_gear_warehouses_tenant ON gear_warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_warehouses_type ON gear_warehouses(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_gear_warehouses_active ON gear_warehouses(tenant_id, is_active);

-- ============================================================================
-- GEAR CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES gear_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- SHELTER, SLEEPING, CLOTHING, CLIMBING, SAFETY, etc.
    description TEXT,
    is_safety_critical BOOLEAN DEFAULT false,
    inspection_interval_days INTEGER DEFAULT 90,
    maintenance_interval_days INTEGER DEFAULT 180,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_gear_categories_tenant ON gear_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_categories_parent ON gear_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_gear_categories_type ON gear_categories(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_gear_categories_safety ON gear_categories(tenant_id, is_safety_critical);

-- ============================================================================
-- GEAR ITEMS (Master Catalog)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES gear_categories(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    brand VARCHAR(255),
    serial_number VARCHAR(255),
    barcode VARCHAR(255),
    qr_code VARCHAR(255),
    rfid_tag VARCHAR(255),
    
    -- Ownership
    ownership_type VARCHAR(50) NOT NULL DEFAULT 'OWNED', -- OWNED, RENTED_IN, SUBLEASED, CUSTOMER
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    
    -- Variants
    size VARCHAR(20), -- XXS, XS, S, M, L, XL, XXL, 1P, 2P, etc.
    size_value VARCHAR(50),
    color VARCHAR(50),
    
    -- Condition & Health
    condition VARCHAR(20) NOT NULL DEFAULT 'NEW', -- NEW, EXCELLENT, GOOD, FAIR, WORN, CRITICAL, UNSAFE, RETIRED
    condition_score INTEGER DEFAULT 100 CHECK (condition_score >= 0 AND condition_score <= 100),
    
    -- Financials
    purchase_date DATE,
    purchase_price DECIMAL(12, 2) DEFAULT 0,
    current_value DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    warranty_expiry DATE,
    
    -- Lifespan Tracking
    expected_lifespan_days INTEGER DEFAULT 365,
    expected_lifespan_trips INTEGER DEFAULT 50,
    total_trips_used INTEGER DEFAULT 0,
    total_days_used INTEGER DEFAULT 0,
    
    -- Maintenance Schedule
    last_inspection_date DATE,
    next_inspection_due DATE,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    
    -- Safety & Rental
    is_safety_critical BOOLEAN DEFAULT false,
    is_rentable BOOLEAN DEFAULT false,
    rental_price_per_day DECIMAL(12, 2) DEFAULT 0,
    rental_price_per_trip DECIMAL(12, 2) DEFAULT 0,
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Location
    warehouse_id UUID REFERENCES gear_warehouses(id) ON DELETE SET NULL,
    location_id UUID, -- Future location granularity
    
    -- Metadata
    specifications JSONB DEFAULT '{}',
    notes TEXT,
    images TEXT[],
    documents TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_gear_items_tenant ON gear_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_category ON gear_items(category_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_sku ON gear_items(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_gear_items_condition ON gear_items(tenant_id, condition);
CREATE INDEX IF NOT EXISTS idx_gear_items_safety ON gear_items(tenant_id, is_safety_critical);
CREATE INDEX IF NOT EXISTS idx_gear_items_warehouse ON gear_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_inspection ON gear_items(tenant_id, next_inspection_due);
CREATE INDEX IF NOT EXISTS idx_gear_items_maintenance ON gear_items(tenant_id, next_maintenance_due);
CREATE INDEX IF NOT EXISTS idx_gear_items_rentable ON gear_items(tenant_id, is_rentable);
CREATE INDEX IF NOT EXISTS idx_gear_items_barcode ON gear_items(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_gear_items_serial ON gear_items(tenant_id, serial_number);

-- ============================================================================
-- GEAR INVENTORY (Real-time Status)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES gear_warehouses(id) ON DELETE SET NULL,
    location_id UUID,
    
    -- Location Details
    zone_code VARCHAR(50),
    shelf_code VARCHAR(50),
    bin_code VARCHAR(50),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    -- AVAILABLE, RESERVED, ASSIGNED, IN_USE, IN_TRANSIT, UNDER_MAINTENANCE,
    -- UNDER_INSPECTION, DAMAGED, LOST, RENTED_OUT, QUARANTINE, RETIRED
    previous_status VARCHAR(50),
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    status_changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status_reason TEXT,
    
    -- Assignment Context
    trip_id UUID,
    rental_id UUID,
    reserved_until TIMESTAMPTZ,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_guest_id UUID,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(gear_item_id) -- One inventory record per item
);

CREATE INDEX IF NOT EXISTS idx_gear_inventory_tenant ON gear_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_inventory_item ON gear_inventory(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_inventory_warehouse ON gear_inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_gear_inventory_status ON gear_inventory(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gear_inventory_trip ON gear_inventory(trip_id);
CREATE INDEX IF NOT EXISTS idx_gear_inventory_rental ON gear_inventory(rental_id);

-- ============================================================================
-- GEAR ASSIGNMENTS (Trip-wise)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL,
    booking_id UUID,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    
    -- Assignment Type
    assignment_type VARCHAR(50) NOT NULL DEFAULT 'PARTICIPANT',
    -- PARTICIPANT, SHARED, GUIDE, EMERGENCY, SUPPORT
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED',
    -- PLANNED, RESERVED, ISSUED, IN_USE, RETURNED, PARTIAL_RETURN,
    -- DAMAGED, LOST, REPLACED, CANCELLED
    
    -- Assignee
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_to_guest_id UUID,
    assigned_to_name VARCHAR(255),
    assigned_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Issue Details
    planned_issue_date DATE,
    actual_issue_date TIMESTAMPTZ,
    issued_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    issue_notes TEXT,
    issue_condition VARCHAR(50),
    
    -- Return Details
    planned_return_date DATE,
    actual_return_date TIMESTAMPTZ,
    received_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    return_notes TEXT,
    return_condition VARCHAR(50),
    return_condition_score INTEGER,
    
    -- Replacement
    replaced_by_item_id UUID REFERENCES gear_items(id) ON DELETE SET NULL,
    replacement_reason TEXT,
    damage_report_id UUID,
    
    -- Verification
    checklist_completed BOOLEAN DEFAULT false,
    checklist_data JSONB DEFAULT '{}',
    gps_coordinates VARCHAR(100),
    signature_data TEXT, -- Base64 encoded signature
    photos TEXT[],
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_assignments_tenant ON gear_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_assignments_trip ON gear_assignments(trip_id);
CREATE INDEX IF NOT EXISTS idx_gear_assignments_booking ON gear_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_gear_assignments_item ON gear_assignments(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_assignments_status ON gear_assignments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gear_assignments_dates ON gear_assignments(planned_issue_date, planned_return_date);

-- ============================================================================
-- GEAR RENTALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rental_number VARCHAR(50) NOT NULL,
    
    -- Type & Status
    rental_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER, PARTNER, CORPORATE, EMERGENCY
    pricing_model VARCHAR(50) NOT NULL DEFAULT 'PER_DAY', -- PER_DAY, PER_TRIP, PER_WEEK, CUSTOM
    status VARCHAR(50) NOT NULL DEFAULT 'QUOTE',
    -- QUOTE, RESERVED, ACTIVE, OVERDUE, RETURNED, RETURNED_DAMAGED, EXTENDED, CANCELLED, DISPUTED
    
    -- Customer
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_id_type VARCHAR(50),
    customer_id_number VARCHAR(100),
    partner_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    
    -- Context
    trip_id UUID,
    booking_id UUID,
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_return_date DATE,
    total_days INTEGER,
    
    -- Pricing
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    discount_reason VARCHAR(255),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Deposit
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    deposit_paid DECIMAL(12, 2) DEFAULT 0,
    deposit_refunded DECIMAL(12, 2) DEFAULT 0,
    deposit_forfeited DECIMAL(12, 2) DEFAULT 0,
    
    -- Penalties
    damage_charges DECIMAL(12, 2) DEFAULT 0,
    late_return_charges DECIMAL(12, 2) DEFAULT 0,
    late_return_days INTEGER DEFAULT 0,
    late_fee_per_day DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Workflow
    issued_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ,
    received_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ,
    
    -- Terms
    terms TEXT,
    signature_data TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, rental_number)
);

CREATE INDEX IF NOT EXISTS idx_gear_rentals_tenant ON gear_rentals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_number ON gear_rentals(tenant_id, rental_number);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_status ON gear_rentals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_customer ON gear_rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_dates ON gear_rentals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_gear_rentals_trip ON gear_rentals(trip_id);

-- ============================================================================
-- GEAR RENTAL ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_rental_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES gear_rentals(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    daily_rate DECIMAL(12, 2) DEFAULT 0,
    trip_rate DECIMAL(12, 2) DEFAULT 0,
    days INTEGER DEFAULT 1,
    subtotal DECIMAL(12, 2) DEFAULT 0,
    deposit_amount DECIMAL(12, 2) DEFAULT 0,
    return_condition VARCHAR(50),
    damage_report_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_rental_items_rental ON gear_rental_items(rental_id);
CREATE INDEX IF NOT EXISTS idx_gear_rental_items_gear ON gear_rental_items(gear_item_id);

-- ============================================================================
-- GEAR DAMAGE REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_damage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    trip_id UUID,
    assignment_id UUID REFERENCES gear_assignments(id) ON DELETE SET NULL,
    rental_id UUID REFERENCES gear_rentals(id) ON DELETE SET NULL,
    
    -- Reporting
    reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    incident_date DATE,
    incident_location VARCHAR(255),
    
    -- Severity & Responsibility
    severity VARCHAR(50) NOT NULL, -- MINOR, MODERATE, MAJOR, TOTAL_LOSS
    responsibility VARCHAR(50) NOT NULL, -- NORMAL_WEAR, CUSTOMER, STAFF, VENDOR, FORCE_MAJEURE, MANUFACTURING, UNKNOWN, THEFT
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    -- REPORTED, UNDER_REVIEW, ASSESSED, REPAIR_SCHEDULED, IN_REPAIR, REPAIRED, WRITTEN_OFF, INSURANCE_CLAIM, RESOLVED, DISPUTED
    
    -- Description
    description TEXT NOT NULL,
    damage_details JSONB DEFAULT '{}',
    photos TEXT[],
    videos TEXT[],
    
    -- Assessment
    assessed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ,
    assessment_notes TEXT,
    
    -- Costs
    estimated_repair_cost DECIMAL(12, 2) DEFAULT 0,
    actual_repair_cost DECIMAL(12, 2) DEFAULT 0,
    replacement_cost DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Insurance
    insurance_covered BOOLEAN DEFAULT false,
    insurance_claim_id VARCHAR(100),
    insurance_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Customer Charge
    charged_to_customer BOOLEAN DEFAULT false,
    customer_charge_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Repair
    repair_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    repair_start_date DATE,
    repair_end_date DATE,
    repair_notes TEXT,
    
    -- Resolution
    resolution_notes TEXT,
    resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_damage_tenant ON gear_damage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_damage_item ON gear_damage_reports(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_damage_trip ON gear_damage_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_gear_damage_status ON gear_damage_reports(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gear_damage_severity ON gear_damage_reports(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_gear_damage_responsibility ON gear_damage_reports(tenant_id, responsibility);

-- ============================================================================
-- GEAR MAINTENANCE
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    damage_report_id UUID REFERENCES gear_damage_reports(id) ON DELETE SET NULL,
    
    -- Type & Priority
    maintenance_type VARCHAR(50) NOT NULL, -- INSPECTION, CLEANING, REPAIR, REPLACEMENT_PART, CALIBRATION, CERTIFICATION, RECALL, UPGRADE
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, PENDING_PARTS, COMPLETED, FAILED, CANCELLED
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Schedule
    scheduled_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Assignment
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    
    -- Costs
    estimated_cost DECIMAL(12, 2) DEFAULT 0,
    actual_cost DECIMAL(12, 2) DEFAULT 0,
    labor_cost DECIMAL(12, 2) DEFAULT 0,
    parts_cost DECIMAL(12, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Work Details
    parts_used JSONB DEFAULT '[]',
    work_performed TEXT,
    
    -- Condition Tracking
    condition_before VARCHAR(50),
    condition_after VARCHAR(50),
    condition_score_before INTEGER,
    condition_score_after INTEGER,
    
    -- Next Schedule
    next_maintenance_due DATE,
    next_inspection_due DATE,
    
    -- Attachments
    photos TEXT[],
    documents TEXT[],
    notes TEXT,
    
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_maintenance_tenant ON gear_maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_maintenance_item ON gear_maintenance(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_maintenance_status ON gear_maintenance(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_gear_maintenance_priority ON gear_maintenance(tenant_id, priority);
CREATE INDEX IF NOT EXISTS idx_gear_maintenance_scheduled ON gear_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_gear_maintenance_type ON gear_maintenance(tenant_id, maintenance_type);

-- ============================================================================
-- GEAR AUDIT LOG (Immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gear_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL, -- No FK to allow logging even if item deleted
    
    -- Action
    action VARCHAR(50) NOT NULL,
    -- CREATED, UPDATED, DELETED, STATUS_CHANGED, CONDITION_CHANGED, LOCATION_CHANGED,
    -- ASSIGNED, ISSUED, RETURNED, DAMAGED, REPAIRED, RENTED, RENTAL_RETURNED,
    -- INSPECTED, MAINTAINED, TRANSFERRED, RETIRED, REACTIVATED
    
    -- Entity Context
    entity_type VARCHAR(50) NOT NULL, -- gear_items, gear_assignments, gear_rentals, etc.
    entity_id UUID,
    
    -- Change Details
    previous_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    changed_fields TEXT[],
    reason TEXT,
    
    -- Actor
    performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by_name VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    gps_coordinates VARCHAR(100),
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gear_audit_tenant ON gear_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gear_audit_item ON gear_audit_logs(gear_item_id);
CREATE INDEX IF NOT EXISTS idx_gear_audit_action ON gear_audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_gear_audit_entity ON gear_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gear_audit_date ON gear_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_gear_audit_user ON gear_audit_logs(performed_by_user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at triggers
CREATE TRIGGER update_gear_warehouses_updated_at BEFORE UPDATE ON gear_warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_categories_updated_at BEFORE UPDATE ON gear_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_items_updated_at BEFORE UPDATE ON gear_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_inventory_updated_at BEFORE UPDATE ON gear_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_assignments_updated_at BEFORE UPDATE ON gear_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_rentals_updated_at BEFORE UPDATE ON gear_rentals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_damage_reports_updated_at BEFORE UPDATE ON gear_damage_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_maintenance_updated_at BEFORE UPDATE ON gear_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Gear Availability Summary View
CREATE OR REPLACE VIEW gear_availability_summary AS
SELECT 
    g.tenant_id,
    gc.type as category_type,
    gc.name as category_name,
    gw.name as warehouse_name,
    gw.code as warehouse_code,
    inv.status,
    COUNT(*) as item_count,
    SUM(CASE WHEN g.condition IN ('UNSAFE', 'RETIRED') THEN 1 ELSE 0 END) as unsafe_count,
    SUM(CASE WHEN g.next_inspection_due < NOW() THEN 1 ELSE 0 END) as inspection_overdue_count
FROM gear_items g
JOIN gear_categories gc ON g.category_id = gc.id
LEFT JOIN gear_inventory inv ON g.id = inv.gear_item_id
LEFT JOIN gear_warehouses gw ON inv.warehouse_id = gw.id
WHERE g.is_active = true
GROUP BY g.tenant_id, gc.type, gc.name, gw.name, gw.code, inv.status;

-- Gear Financial Summary View
CREATE OR REPLACE VIEW gear_financial_summary AS
SELECT 
    g.tenant_id,
    gc.type as category_type,
    COUNT(*) as total_items,
    SUM(g.purchase_price) as total_purchase_value,
    SUM(g.current_value) as total_current_value,
    AVG(g.condition_score) as avg_condition_score,
    SUM(CASE WHEN g.is_rentable THEN 1 ELSE 0 END) as rentable_items,
    SUM(g.rental_price_per_day) as total_daily_rental_potential
FROM gear_items g
JOIN gear_categories gc ON g.category_id = gc.id
WHERE g.is_active = true
GROUP BY g.tenant_id, gc.type;

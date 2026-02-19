-- Travel Inventory System - Departure-Centric Schema
-- Migration 004: Inventory Management Module
-- 
-- CORE CONCEPT: Think in DEPARTURES, not Tours.
-- Each departure date is its own inventory object with capacity tracking.

-- ============================================================================
-- DEPARTURE INSTANCES (The heart of inventory management)
-- ============================================================================
-- A Resource (Tour/Trek/Activity) is a TEMPLATE
-- A DepartureInstance is REAL INVENTORY for a specific date

CREATE TABLE IF NOT EXISTS departure_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- Departure timing
    departure_date DATE NOT NULL,
    departure_time TIME,
    end_date DATE,  -- For multi-day tours/treks
    cutoff_datetime TIMESTAMPTZ,  -- No bookings after this
    
    -- Capacity management
    total_capacity INTEGER NOT NULL DEFAULT 1,
    blocked_seats INTEGER NOT NULL DEFAULT 0,  -- VIP/Staff reserves
    overbooking_limit INTEGER NOT NULL DEFAULT 0,
    min_participants INTEGER DEFAULT 1,  -- For guaranteed departure
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    -- SCHEDULED, OPEN, FEW_LEFT, FULL, WAITLIST, CLOSED, CANCELLED, DEPARTED
    is_guaranteed BOOLEAN DEFAULT false,
    
    -- Pricing (can override resource base price)
    price_override DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Configuration
    attributes JSONB DEFAULT '{}',  -- Custom fields per departure
    
    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, resource_id, departure_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_departures_tenant_date 
    ON departure_instances(tenant_id, departure_date);
CREATE INDEX IF NOT EXISTS idx_departures_resource 
    ON departure_instances(resource_id, departure_date);
CREATE INDEX IF NOT EXISTS idx_departures_status 
    ON departure_instances(tenant_id, status, departure_date);

-- ============================================================================
-- INVENTORY HOLDS (Time-bound seat reservations)
-- ============================================================================
-- Holds LOCK inventory before payment is complete
-- Auto-expire to prevent inventory deadlock

CREATE TABLE IF NOT EXISTS inventory_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    departure_id UUID NOT NULL REFERENCES departure_instances(id) ON DELETE CASCADE,
    booking_id UUID,  -- Set when booking is created
    
    seat_count INTEGER NOT NULL DEFAULT 1,
    
    -- Source tracking
    source VARCHAR(20) NOT NULL,  -- WEBSITE, ADMIN, OTA, MANUAL
    source_platform VARCHAR(50),  -- viator, booking.com, etc.
    
    -- Hold type affects TTL
    hold_type VARCHAR(30) NOT NULL DEFAULT 'CART',
    -- CART (15min), PAYMENT_PENDING (30min), APPROVAL_PENDING (24h)
    
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Who created this hold
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100),  -- For anonymous website users
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,  -- NULL = active, set when released
    release_reason VARCHAR(30)  -- CONFIRMED, EXPIRED, CANCELLED, MANUAL
);

CREATE INDEX IF NOT EXISTS idx_holds_departure_active 
    ON inventory_holds(departure_id) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holds_expiry 
    ON inventory_holds(expires_at) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_holds_booking 
    ON inventory_holds(booking_id) WHERE booking_id IS NOT NULL;

-- ============================================================================
-- SEAT BLOCKS (Staff/VIP/Channel reservations)
-- ============================================================================
-- Different from holds - these are long-term allocations

CREATE TABLE IF NOT EXISTS seat_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    departure_id UUID NOT NULL REFERENCES departure_instances(id) ON DELETE CASCADE,
    
    seat_count INTEGER NOT NULL,
    block_type VARCHAR(30) NOT NULL,  -- STAFF, VIP, CHANNEL_QUOTA, MAINTENANCE
    
    -- For channel quotas
    channel VARCHAR(30),  -- WEBSITE, OTA_VIATOR, OTA_GYG, etc.
    
    reason TEXT,
    
    -- Validity period
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,  -- NULL = permanent until departure
    
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    
    CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX IF NOT EXISTS idx_blocks_departure 
    ON seat_blocks(departure_id) WHERE released_at IS NULL;

-- ============================================================================
-- WAITLIST (When departure is full)
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    departure_id UUID NOT NULL REFERENCES departure_instances(id) ON DELETE CASCADE,
    
    position INTEGER NOT NULL,  -- Queue position
    seat_count INTEGER NOT NULL DEFAULT 1,
    
    -- Guest details
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(50),
    
    -- Source tracking
    source VARCHAR(20) NOT NULL,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    -- WAITING, NOTIFIED, CONVERTED, EXPIRED, CANCELLED
    
    notified_at TIMESTAMPTZ,
    notification_expires_at TIMESTAMPTZ,  -- Time-limited offer
    converted_booking_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_departure 
    ON waitlist_entries(departure_id, position) WHERE status = 'WAITING';

-- ============================================================================
-- PAYMENTS (Flexible payment tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_type VARCHAR(20) NOT NULL,  -- FULL, DEPOSIT, PARTIAL, BALANCE
    method VARCHAR(30) NOT NULL,  -- CARD, UPI, BANK_TRANSFER, CASH, CHEQUE, OTA_COLLECT
    
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED
    
    -- Gateway integration
    gateway VARCHAR(30),  -- razorpay, stripe, paypal, manual
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    gateway_response JSONB DEFAULT '{}',
    
    -- Payment links (for async payments)
    payment_link_id VARCHAR(255),
    payment_link_url TEXT,
    link_expires_at TIMESTAMPTZ,
    link_sent_at TIMESTAMPTZ,
    
    -- Manual payment tracking
    received_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100),
    
    -- Refund tracking
    refund_amount DECIMAL(12,2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_booking 
    ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status 
    ON payments(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway 
    ON payments(gateway, gateway_payment_id);

-- ============================================================================
-- ENHANCE BOOKINGS TABLE (Add inventory-aware columns)
-- ============================================================================

-- Add new columns to existing bookings table
DO $$
BEGIN
    -- Departure reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'departure_id') THEN
        ALTER TABLE bookings ADD COLUMN departure_id UUID REFERENCES departure_instances(id);
    END IF;
    
    -- Human-readable booking number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'booking_number') THEN
        ALTER TABLE bookings ADD COLUMN booking_number VARCHAR(30);
    END IF;
    
    -- Hold reference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'hold_id') THEN
        ALTER TABLE bookings ADD COLUMN hold_id UUID REFERENCES inventory_holds(id);
    END IF;
    
    -- Enhanced status (replace simple status)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'lifecycle_status') THEN
        ALTER TABLE bookings ADD COLUMN lifecycle_status VARCHAR(30) DEFAULT 'DRAFT';
        -- DRAFT, HELD, PENDING_PAYMENT, PAYMENT_UNCERTAIN, CONFIRMED, 
        -- PENDING_APPROVAL, CANCELLED, REFUNDED, NO_SHOW, COMPLETED
    END IF;
    
    -- Status reason
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'status_reason') THEN
        ALTER TABLE bookings ADD COLUMN status_reason VARCHAR(50);
    END IF;
    
    -- Payment tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'amount_paid') THEN
        ALTER TABLE bookings ADD COLUMN amount_paid DECIMAL(12,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'amount_due') THEN
        ALTER TABLE bookings ADD COLUMN amount_due DECIMAL(12,2);
    END IF;
    
    -- Additional guest details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'additional_guests') THEN
        ALTER TABLE bookings ADD COLUMN additional_guests JSONB DEFAULT '[]';
    END IF;
    
    -- Confirmation timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'confirmed_at') THEN
        ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMPTZ;
    END IF;
    
    -- Cancellation timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
        ALTER TABLE bookings ADD COLUMN cancelled_at TIMESTAMPTZ;
    END IF;
END
$$;

-- ============================================================================
-- INVENTORY EVENTS (Audit trail for all inventory changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    departure_id UUID NOT NULL REFERENCES departure_instances(id) ON DELETE CASCADE,
    
    event_type VARCHAR(50) NOT NULL,
    -- HOLD_CREATED, HOLD_RELEASED, HOLD_EXPIRED, HOLD_EXTENDED,
    -- BOOKING_CONFIRMED, BOOKING_CANCELLED,
    -- BLOCK_CREATED, BLOCK_RELEASED,
    -- CAPACITY_CHANGED, STATUS_CHANGED,
    -- OVERBOOKING_DETECTED, OVERBOOKING_RESOLVED
    
    -- References
    booking_id UUID,
    hold_id UUID,
    block_id UUID,
    
    -- Change details
    seat_count INTEGER,
    previous_value JSONB,  -- Snapshot before change
    new_value JSONB,       -- Snapshot after change
    
    -- Actor
    actor_type VARCHAR(20) NOT NULL,  -- USER, SYSTEM, OTA, CRON
    actor_id UUID,
    actor_name VARCHAR(255),
    
    -- Context
    source VARCHAR(30),
    ip_address INET,
    user_agent TEXT,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_events_departure 
    ON inventory_events(departure_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_events_booking 
    ON inventory_events(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_events_type 
    ON inventory_events(tenant_id, event_type, created_at DESC);

-- ============================================================================
-- BOOKING NUMBER SEQUENCE (Human-readable IDs)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number(p_tenant_id UUID, p_resource_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(3);
    v_year VARCHAR(4);
    v_seq INTEGER;
BEGIN
    -- Prefix based on resource type
    v_prefix := CASE p_resource_type
        WHEN 'TREK' THEN 'TRK'
        WHEN 'TOUR' THEN 'TUR'
        WHEN 'ACTIVITY' THEN 'ACT'
        WHEN 'ROOM' THEN 'HTL'
        ELSE 'BKG'
    END;
    
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_seq := nextval('booking_number_seq');
    
    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPUTED COLUMNS VIEW (Inventory calculations)
-- ============================================================================

CREATE OR REPLACE VIEW departure_inventory_view AS
SELECT 
    d.id,
    d.tenant_id,
    d.resource_id,
    d.departure_date,
    d.departure_time,
    d.total_capacity,
    d.blocked_seats,
    d.overbooking_limit,
    d.status,
    d.version,
    
    -- Calculated: Sellable capacity
    (d.total_capacity - d.blocked_seats) AS sellable_capacity,
    
    -- Calculated: Active holds
    COALESCE(h.held_seats, 0) AS held_seats,
    
    -- Calculated: Confirmed bookings
    COALESCE(b.confirmed_seats, 0) AS confirmed_seats,
    
    -- Calculated: Available seats
    (d.total_capacity - d.blocked_seats - COALESCE(h.held_seats, 0) - COALESCE(b.confirmed_seats, 0)) AS available_seats,
    
    -- Calculated: Can still book (including overbooking)
    (d.total_capacity - d.blocked_seats + d.overbooking_limit - COALESCE(h.held_seats, 0) - COALESCE(b.confirmed_seats, 0)) AS bookable_seats,
    
    -- Calculated: Waitlist count
    COALESCE(w.waitlist_count, 0) AS waitlist_count,
    
    -- Source breakdown
    COALESCE(b.website_bookings, 0) AS website_bookings,
    COALESCE(b.ota_bookings, 0) AS ota_bookings,
    COALESCE(b.manual_bookings, 0) AS manual_bookings
    
FROM departure_instances d

LEFT JOIN (
    SELECT 
        departure_id,
        SUM(seat_count) AS held_seats
    FROM inventory_holds
    WHERE released_at IS NULL AND expires_at > NOW()
    GROUP BY departure_id
) h ON h.departure_id = d.id

LEFT JOIN (
    SELECT 
        departure_id,
        SUM(guest_count) AS confirmed_seats,
        SUM(CASE WHEN source = 'DIRECT' THEN guest_count ELSE 0 END) AS website_bookings,
        SUM(CASE WHEN source = 'OTA' THEN guest_count ELSE 0 END) AS ota_bookings,
        SUM(CASE WHEN source IN ('MANUAL', 'CSV', 'EMAIL') THEN guest_count ELSE 0 END) AS manual_bookings
    FROM bookings
    WHERE lifecycle_status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
    GROUP BY departure_id
) b ON b.departure_id = d.id

LEFT JOIN (
    SELECT 
        departure_id,
        COUNT(*) AS waitlist_count
    FROM waitlist_entries
    WHERE status = 'WAITING'
    GROUP BY departure_id
) w ON w.departure_id = d.id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update departure status based on availability
CREATE OR REPLACE FUNCTION update_departure_status()
RETURNS TRIGGER AS $$
DECLARE
    v_inv RECORD;
    v_new_status VARCHAR(20);
BEGIN
    -- Get current inventory state
    SELECT * INTO v_inv FROM departure_inventory_view WHERE id = NEW.departure_id;
    
    IF v_inv IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Determine new status
    IF v_inv.available_seats <= 0 AND v_inv.bookable_seats <= 0 THEN
        v_new_status := 'FULL';
    ELSIF v_inv.available_seats < (v_inv.sellable_capacity * 0.2) THEN
        v_new_status := 'FEW_LEFT';
    ELSE
        v_new_status := 'OPEN';
    END IF;
    
    -- Update if changed
    IF v_inv.status != v_new_status AND v_inv.status NOT IN ('CLOSED', 'CANCELLED', 'DEPARTED') THEN
        UPDATE departure_instances 
        SET status = v_new_status, updated_at = NOW()
        WHERE id = NEW.departure_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to bookings
DROP TRIGGER IF EXISTS trigger_update_departure_status ON bookings;
CREATE TRIGGER trigger_update_departure_status
    AFTER INSERT OR UPDATE OF lifecycle_status, guest_count ON bookings
    FOR EACH ROW
    WHEN (NEW.departure_id IS NOT NULL)
    EXECUTE FUNCTION update_departure_status();

-- Apply trigger to holds
DROP TRIGGER IF EXISTS trigger_update_departure_status_holds ON inventory_holds;
CREATE TRIGGER trigger_update_departure_status_holds
    AFTER INSERT OR UPDATE OF released_at ON inventory_holds
    FOR EACH ROW
    EXECUTE FUNCTION update_departure_status();

-- Auto-update timestamp
CREATE TRIGGER update_departures_updated_at 
    BEFORE UPDATE ON departure_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at 
    BEFORE UPDATE ON waitlist_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORED PROCEDURES FOR ATOMIC OPERATIONS
-- ============================================================================

-- Atomic hold creation with inventory check
CREATE OR REPLACE FUNCTION create_inventory_hold(
    p_tenant_id UUID,
    p_departure_id UUID,
    p_seat_count INTEGER,
    p_source VARCHAR,
    p_source_platform VARCHAR,
    p_hold_type VARCHAR,
    p_ttl_minutes INTEGER,
    p_created_by_id UUID DEFAULT NULL,
    p_session_id VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    hold_id UUID,
    error_code VARCHAR,
    error_message TEXT
) AS $$
DECLARE
    v_departure RECORD;
    v_available INTEGER;
    v_hold_id UUID;
BEGIN
    -- Lock the departure row
    SELECT * INTO v_departure 
    FROM departure_instances 
    WHERE id = p_departure_id AND tenant_id = p_tenant_id
    FOR UPDATE;
    
    IF v_departure IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'NOT_FOUND', 'Departure not found';
        RETURN;
    END IF;
    
    IF v_departure.status IN ('CLOSED', 'CANCELLED', 'DEPARTED') THEN
        RETURN QUERY SELECT false, NULL::UUID, 'CLOSED', 'Departure is no longer accepting bookings';
        RETURN;
    END IF;
    
    -- Calculate available seats
    SELECT available_seats INTO v_available 
    FROM departure_inventory_view 
    WHERE id = p_departure_id;
    
    IF v_available < p_seat_count THEN
        -- Check if overbooking is allowed
        SELECT bookable_seats INTO v_available 
        FROM departure_inventory_view 
        WHERE id = p_departure_id;
        
        IF v_available < p_seat_count THEN
            RETURN QUERY SELECT false, NULL::UUID, 'NO_AVAILABILITY', 
                'Only ' || GREATEST(v_available, 0) || ' seats available';
            RETURN;
        END IF;
    END IF;
    
    -- Create the hold
    INSERT INTO inventory_holds (
        tenant_id, departure_id, seat_count, source, source_platform,
        hold_type, expires_at, created_by_id, session_id
    ) VALUES (
        p_tenant_id, p_departure_id, p_seat_count, p_source, p_source_platform,
        p_hold_type, NOW() + (p_ttl_minutes || ' minutes')::INTERVAL,
        p_created_by_id, p_session_id
    ) RETURNING id INTO v_hold_id;
    
    -- Log the event
    INSERT INTO inventory_events (
        tenant_id, departure_id, event_type, hold_id, seat_count,
        actor_type, actor_id, source, new_value
    ) VALUES (
        p_tenant_id, p_departure_id, 'HOLD_CREATED', v_hold_id, p_seat_count,
        CASE WHEN p_created_by_id IS NOT NULL THEN 'USER' ELSE 'SYSTEM' END,
        p_created_by_id, p_source,
        jsonb_build_object('hold_type', p_hold_type, 'expires_at', NOW() + (p_ttl_minutes || ' minutes')::INTERVAL)
    );
    
    -- Update version
    UPDATE departure_instances 
    SET version = version + 1, updated_at = NOW()
    WHERE id = p_departure_id;
    
    RETURN QUERY SELECT true, v_hold_id, NULL::VARCHAR, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Atomic hold release
CREATE OR REPLACE FUNCTION release_inventory_hold(
    p_hold_id UUID,
    p_reason VARCHAR,
    p_actor_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_hold RECORD;
BEGIN
    SELECT * INTO v_hold FROM inventory_holds WHERE id = p_hold_id FOR UPDATE;
    
    IF v_hold IS NULL OR v_hold.released_at IS NOT NULL THEN
        RETURN false;
    END IF;
    
    UPDATE inventory_holds 
    SET released_at = NOW(), release_reason = p_reason
    WHERE id = p_hold_id;
    
    -- Log the event
    INSERT INTO inventory_events (
        tenant_id, departure_id, event_type, hold_id, seat_count,
        actor_type, actor_id, new_value
    ) VALUES (
        v_hold.tenant_id, v_hold.departure_id, 'HOLD_RELEASED', p_hold_id, v_hold.seat_count,
        CASE WHEN p_actor_id IS NOT NULL THEN 'USER' ELSE 'SYSTEM' END,
        p_actor_id,
        jsonb_build_object('reason', p_reason)
    );
    
    -- Update departure version
    UPDATE departure_instances 
    SET version = version + 1, updated_at = NOW()
    WHERE id = v_hold.departure_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Atomic booking confirmation
CREATE OR REPLACE FUNCTION confirm_booking(
    p_booking_id UUID,
    p_hold_id UUID,
    p_actor_id UUID DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    error_code VARCHAR,
    error_message TEXT
) AS $$
DECLARE
    v_booking RECORD;
    v_hold RECORD;
BEGIN
    -- Lock booking
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;
    
    IF v_booking IS NULL THEN
        RETURN QUERY SELECT false, 'NOT_FOUND', 'Booking not found';
        RETURN;
    END IF;
    
    IF v_booking.lifecycle_status = 'CONFIRMED' THEN
        RETURN QUERY SELECT true, NULL::VARCHAR, NULL::TEXT;  -- Idempotent
        RETURN;
    END IF;
    
    -- Release the hold
    IF p_hold_id IS NOT NULL THEN
        PERFORM release_inventory_hold(p_hold_id, 'CONFIRMED', p_actor_id);
    END IF;
    
    -- Update booking
    UPDATE bookings 
    SET 
        lifecycle_status = 'CONFIRMED',
        confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Log the event
    INSERT INTO inventory_events (
        tenant_id, departure_id, event_type, booking_id, seat_count,
        actor_type, actor_id, source
    ) VALUES (
        v_booking.tenant_id, v_booking.departure_id, 'BOOKING_CONFIRMED', 
        p_booking_id, v_booking.guest_count,
        CASE WHEN p_actor_id IS NOT NULL THEN 'USER' ELSE 'SYSTEM' END,
        p_actor_id, v_booking.source
    );
    
    RETURN QUERY SELECT true, NULL::VARCHAR, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CRON JOB HELPER: Expire stale holds
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_stale_holds()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_hold RECORD;
BEGIN
    FOR v_hold IN 
        SELECT id FROM inventory_holds 
        WHERE released_at IS NULL AND expires_at < NOW()
        FOR UPDATE SKIP LOCKED
    LOOP
        PERFORM release_inventory_hold(v_hold.id, 'EXPIRED', NULL);
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE departure_instances IS 'Real inventory for each departure date. A Resource is a template, a Departure is sellable inventory.';
COMMENT ON TABLE inventory_holds IS 'Time-bound seat reservations. Auto-expire to prevent inventory deadlock.';
COMMENT ON TABLE seat_blocks IS 'Long-term seat allocations for staff, VIP, or channel quotas.';
COMMENT ON TABLE waitlist_entries IS 'Queue for customers waiting for cancellations when departure is full.';
COMMENT ON TABLE payments IS 'Flexible payment tracking with support for partial payments and multiple methods.';
COMMENT ON TABLE inventory_events IS 'Complete audit trail for all inventory changes.';
COMMENT ON VIEW departure_inventory_view IS 'Computed view showing real-time availability calculations.';
COMMENT ON FUNCTION create_inventory_hold IS 'Atomic hold creation with row-level locking to prevent race conditions.';
COMMENT ON FUNCTION release_inventory_hold IS 'Atomic hold release with event logging.';
COMMENT ON FUNCTION confirm_booking IS 'Atomic booking confirmation that releases hold and updates inventory.';
COMMENT ON FUNCTION expire_stale_holds IS 'Cron job helper to clean up expired holds.';

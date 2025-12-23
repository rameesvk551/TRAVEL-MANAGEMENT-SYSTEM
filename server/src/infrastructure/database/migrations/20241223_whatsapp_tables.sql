-- infrastructure/database/migrations/20241223_whatsapp_tables.sql
-- WhatsApp Integration Schema

-- Conversation Contexts
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    whatsapp_thread_id VARCHAR(255) NOT NULL,
    
    -- Primary actor
    primary_actor_type VARCHAR(50) NOT NULL,
    primary_actor_user_id UUID,
    primary_actor_employee_id UUID,
    primary_actor_contact_id UUID,
    primary_actor_phone VARCHAR(20) NOT NULL,
    primary_actor_name VARCHAR(255) NOT NULL,
    
    -- State machine
    state VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    workflow_progress JSONB,
    
    -- Session management
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_expires_at TIMESTAMPTZ NOT NULL,
    message_count INTEGER DEFAULT 0,
    
    -- Flags
    is_opted_in BOOLEAN DEFAULT TRUE,
    is_escalated BOOLEAN DEFAULT FALSE,
    requires_human_review BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    provider_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, whatsapp_thread_id)
);

CREATE INDEX idx_wa_conv_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_wa_conv_phone ON whatsapp_conversations(primary_actor_phone);
CREATE INDEX idx_wa_conv_state ON whatsapp_conversations(state);
CREATE INDEX idx_wa_conv_escalated ON whatsapp_conversations(is_escalated) WHERE is_escalated = TRUE;

-- Linked Entities (Many-to-Many)
CREATE TABLE IF NOT EXISTS whatsapp_conversation_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- LEAD, BOOKING, DEPARTURE, etc.
    entity_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    linked_by VARCHAR(20) DEFAULT 'SYSTEM'
);

CREATE INDEX idx_wa_entities_conv ON whatsapp_conversation_entities(conversation_id);
CREATE INDEX idx_wa_entities_entity ON whatsapp_conversation_entities(entity_type, entity_id);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id),
    
    -- Provider references
    provider_message_id VARCHAR(255) NOT NULL,
    provider_timestamp TIMESTAMPTZ NOT NULL,
    
    -- Direction & participants
    direction VARCHAR(10) NOT NULL, -- INBOUND, OUTBOUND
    sender_phone VARCHAR(20) NOT NULL,
    recipient_phone VARCHAR(20) NOT NULL,
    
    -- Content
    message_type VARCHAR(20) NOT NULL,
    text_content JSONB,
    media_content JSONB,
    location_content JSONB,
    contact_content JSONB,
    interactive_content JSONB,
    template_content JSONB,
    
    -- Response tracking
    reply_to_message_id VARCHAR(255),
    selected_button_id VARCHAR(100),
    selected_list_item_id VARCHAR(100),
    
    -- Delivery tracking
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    status_timestamps JSONB DEFAULT '{}',
    failure_reason TEXT,
    
    -- Business context
    linked_lead_id UUID,
    linked_booking_id UUID,
    linked_trip_id UUID,
    handled_by_user_id UUID,
    
    -- Processing
    is_processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    requires_response BOOLEAN DEFAULT FALSE,
    
    -- Idempotency
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wa_msg_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX idx_wa_msg_conv ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_msg_provider ON whatsapp_messages(provider_message_id);
CREATE INDEX idx_wa_msg_created ON whatsapp_messages(created_at);
CREATE INDEX idx_wa_msg_unprocessed ON whatsapp_messages(is_processed) WHERE is_processed = FALSE;

-- Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    template_name VARCHAR(100) NOT NULL,
    provider_template_id VARCHAR(255),
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    
    category VARCHAR(20) NOT NULL,
    use_case VARCHAR(50) NOT NULL,
    
    header_type VARCHAR(20),
    header_content TEXT,
    body_content TEXT NOT NULL,
    footer_content TEXT,
    
    variables JSONB DEFAULT '[]',
    buttons JSONB DEFAULT '[]',
    
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    
    requires_opt_in BOOLEAN DEFAULT FALSE,
    min_interval_minutes INTEGER DEFAULT 60,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    
    UNIQUE(tenant_id, template_name, language)
);

CREATE INDEX idx_wa_tmpl_tenant ON whatsapp_templates(tenant_id);
CREATE INDEX idx_wa_tmpl_status ON whatsapp_templates(status);
CREATE INDEX idx_wa_tmpl_usecase ON whatsapp_templates(use_case);

-- Opt-In Records
CREATE TABLE IF NOT EXISTS whatsapp_opt_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    phone_number VARCHAR(20) NOT NULL,
    contact_id UUID,
    lead_id UUID,
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    opt_in_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    opt_out_date TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    source VARCHAR(50) NOT NULL,
    consent_text TEXT NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    allow_utility_messages BOOLEAN DEFAULT TRUE,
    allow_marketing_messages BOOLEAN DEFAULT FALSE,
    
    audit_log JSONB DEFAULT '[]',
    
    last_message_sent_at TIMESTAMPTZ,
    last_message_received_at TIMESTAMPTZ,
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, phone_number)
);

CREATE INDEX idx_wa_opt_tenant ON whatsapp_opt_ins(tenant_id);
CREATE INDEX idx_wa_opt_phone ON whatsapp_opt_ins(phone_number);
CREATE INDEX idx_wa_opt_status ON whatsapp_opt_ins(status);

-- Unified Timeline
CREATE TABLE IF NOT EXISTS unified_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    
    -- Parent entity (one must be set)
    lead_id UUID,
    booking_id UUID,
    departure_id UUID,
    trip_assignment_id UUID,
    
    -- Entry details
    source VARCHAR(50) NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    
    -- Actor
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(20) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_phone VARCHAR(20),
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Rich content
    media JSONB,
    location JSONB,
    
    -- References
    whatsapp_message_id UUID REFERENCES whatsapp_messages(id),
    external_ref VARCHAR(255),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    previous_value VARCHAR(255),
    new_value VARCHAR(255),
    
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_tenant ON unified_timeline(tenant_id);
CREATE INDEX idx_timeline_lead ON unified_timeline(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_timeline_booking ON unified_timeline(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_timeline_departure ON unified_timeline(departure_id) WHERE departure_id IS NOT NULL;
CREATE INDEX idx_timeline_trip ON unified_timeline(trip_assignment_id) WHERE trip_assignment_id IS NOT NULL;
CREATE INDEX idx_timeline_occurred ON unified_timeline(occurred_at);
CREATE INDEX idx_timeline_type ON unified_timeline(entry_type);

-- Row-Level Security
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_opt_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE unified_timeline ENABLE ROW LEVEL SECURITY;

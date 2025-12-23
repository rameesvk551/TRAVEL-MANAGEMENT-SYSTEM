-- Migration: WhatsApp Operations Layer
-- Version: 010
-- Description: Add WhatsApp integration tables for operations control interface
-- Date: 2024-12-23

-- ============================================================================
-- WHATSAPP CONVERSATIONS
-- ============================================================================
-- Tracks active WhatsApp conversation sessions with context and state

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identity
    phone_number VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business Object Binding
    bound_object_type VARCHAR(50), -- 'LEAD', 'BOOKING', 'TRIP', 'PAYMENT', 'TASK'
    bound_object_id UUID,
    
    -- State Machine
    current_state VARCHAR(100) NOT NULL DEFAULT 'IDLE',
    state_data JSONB DEFAULT '{}',
    
    -- Session Management
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_conv_phone ON whatsapp_conversations(tenant_id, phone_number);
CREATE INDEX idx_whatsapp_conv_user ON whatsapp_conversations(tenant_id, user_id);
CREATE INDEX idx_whatsapp_conv_object ON whatsapp_conversations(tenant_id, bound_object_type, bound_object_id);
CREATE INDEX idx_whatsapp_conv_active ON whatsapp_conversations(tenant_id, is_active, expires_at);

COMMENT ON TABLE whatsapp_conversations IS 'Active WhatsApp conversation sessions with state tracking';
COMMENT ON COLUMN whatsapp_conversations.bound_object_type IS 'Type of business object this conversation is about';
COMMENT ON COLUMN whatsapp_conversations.state_data IS 'Current state machine data for the conversation';

-- ============================================================================
-- WHATSAPP MESSAGES
-- ============================================================================
-- Stores all WhatsApp messages (inbound and outbound)

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    -- Message Direction
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    
    -- Message Type
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
        'TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 
        'TEMPLATE', 'LOCATION', 'CONTACT', 'INTERACTIVE'
    )),
    
    -- Participants
    sender_phone VARCHAR(50),
    recipient_phone VARCHAR(50),
    
    -- Content
    content TEXT,
    media_url VARCHAR(500),
    media_type VARCHAR(50),
    media_size INTEGER,
    
    -- Provider Details
    external_message_id VARCHAR(255),
    provider_name VARCHAR(50) DEFAULT 'meta',
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'SENT' CHECK (status IN (
        'QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    )),
    
    -- Timestamps
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Error Handling
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_msg_conversation ON whatsapp_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_whatsapp_msg_external ON whatsapp_messages(external_message_id);
CREATE INDEX idx_whatsapp_msg_status ON whatsapp_messages(tenant_id, status, sent_at DESC);

COMMENT ON TABLE whatsapp_messages IS 'All WhatsApp messages with delivery tracking';
COMMENT ON COLUMN whatsapp_messages.external_message_id IS 'Message ID from WhatsApp provider';

-- ============================================================================
-- WHATSAPP TEMPLATES
-- ============================================================================
-- Pre-approved message templates with role-based access

CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Template Identity
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'MARKETING', 'TRANSACTIONAL', 'OPERATIONAL', 'AUTHENTICATION'
    )),
    language VARCHAR(10) DEFAULT 'en',
    
    -- Template Content
    header TEXT,
    body TEXT NOT NULL,
    footer TEXT,
    
    -- Interactive Elements
    buttons JSONB DEFAULT '[]',
    
    -- Template Variables
    variables JSONB DEFAULT '[]',
    
    -- Access Control
    allowed_roles JSONB DEFAULT '[]',
    requires_approval BOOLEAN DEFAULT false,
    
    -- Provider Details
    provider_template_id VARCHAR(255),
    provider_name VARCHAR(50) DEFAULT 'meta',
    
    -- Status
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'
    )),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    
    -- Usage Stats
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_whatsapp_tmpl_tenant ON whatsapp_templates(tenant_id, status);
CREATE INDEX idx_whatsapp_tmpl_category ON whatsapp_templates(tenant_id, category);

COMMENT ON TABLE whatsapp_templates IS 'Pre-approved WhatsApp message templates';
COMMENT ON COLUMN whatsapp_templates.variables IS 'Array of variable names used in template';
COMMENT ON COLUMN whatsapp_templates.allowed_roles IS 'Array of roles permitted to use this template';

-- ============================================================================
-- TIMELINE ENTRIES (UNIFIED)
-- ============================================================================
-- Single source of truth for all activities on business objects

CREATE TABLE IF NOT EXISTS timeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Object Reference
    object_type VARCHAR(50) NOT NULL CHECK (object_type IN (
        'LEAD', 'BOOKING', 'TRIP', 'PAYMENT', 'DEPARTURE', 'EMPLOYEE', 'TASK'
    )),
    object_id UUID NOT NULL,
    
    -- Event Classification
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'MESSAGE', 'STATUS_CHANGE', 'PAYMENT', 'MEDIA', 'NOTE', 
        'ASSIGNMENT', 'ISSUE', 'RESOLUTION', 'SYSTEM'
    )),
    source VARCHAR(50) NOT NULL CHECK (source IN (
        'WHATSAPP', 'WEB', 'API', 'SYSTEM', 'EMAIL', 'MOBILE'
    )),
    
    -- Actor
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    actor_phone VARCHAR(50),
    
    -- Content
    content JSONB NOT NULL,
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_object ON timeline_entries(tenant_id, object_type, object_id, timestamp DESC);
CREATE INDEX idx_timeline_actor ON timeline_entries(tenant_id, actor_id, timestamp DESC);
CREATE INDEX idx_timeline_type ON timeline_entries(tenant_id, event_type, timestamp DESC);
CREATE INDEX idx_timeline_source ON timeline_entries(tenant_id, source, timestamp DESC);

COMMENT ON TABLE timeline_entries IS 'Unified timeline of all activities on business objects';
COMMENT ON COLUMN timeline_entries.content IS 'Event content with text, media, or metadata';

-- ============================================================================
-- WHATSAPP AUDIT LOGS
-- ============================================================================
-- Comprehensive audit trail for all WhatsApp operations

CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Timestamp
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Actor
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role VARCHAR(50),
    phone_number VARCHAR(50),
    
    -- Action
    action VARCHAR(255) NOT NULL,
    object_type VARCHAR(50),
    object_id UUID,
    
    -- Request/Response
    request_data JSONB,
    response_data JSONB,
    
    -- Result
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Context
    ip_address VARCHAR(50),
    user_agent VARCHAR(500),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_audit_user ON whatsapp_audit_logs(tenant_id, user_id, timestamp DESC);
CREATE INDEX idx_whatsapp_audit_action ON whatsapp_audit_logs(tenant_id, action, timestamp DESC);
CREATE INDEX idx_whatsapp_audit_success ON whatsapp_audit_logs(tenant_id, success, timestamp DESC);
CREATE INDEX idx_whatsapp_audit_timestamp ON whatsapp_audit_logs(tenant_id, timestamp DESC);

COMMENT ON TABLE whatsapp_audit_logs IS 'Audit trail for all WhatsApp operations';
COMMENT ON COLUMN whatsapp_audit_logs.action IS 'Action performed (e.g., SEND_MESSAGE, CREATE_LEAD, etc.)';

-- ============================================================================
-- WHATSAPP MEDIA
-- ============================================================================
-- Track media files uploaded/downloaded via WhatsApp

CREATE TABLE IF NOT EXISTS whatsapp_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Message Reference
    message_id UUID REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    
    -- Media Details
    media_type VARCHAR(50) NOT NULL CHECK (media_type IN (
        'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT'
    )),
    file_name VARCHAR(500),
    mime_type VARCHAR(100),
    file_size INTEGER,
    
    -- Storage
    storage_url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    
    -- Provider Details
    provider_media_id VARCHAR(255),
    provider_name VARCHAR(50) DEFAULT 'meta',
    
    -- Status
    upload_status VARCHAR(50) DEFAULT 'PENDING' CHECK (upload_status IN (
        'PENDING', 'UPLOADED', 'FAILED', 'DELETED'
    )),
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_media_message ON whatsapp_media(message_id);
CREATE INDEX idx_whatsapp_media_provider ON whatsapp_media(provider_media_id);
CREATE INDEX idx_whatsapp_media_tenant ON whatsapp_media(tenant_id, media_type, created_at DESC);

COMMENT ON TABLE whatsapp_media IS 'Media files sent/received via WhatsApp';

-- ============================================================================
-- WHATSAPP OPT INS/OUTS
-- ============================================================================
-- Track user preferences for WhatsApp communications

CREATE TABLE IF NOT EXISTS whatsapp_opt_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Identity
    phone_number VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Opt-in Status
    opted_in BOOLEAN DEFAULT true,
    
    -- Categories
    marketing_opted_in BOOLEAN DEFAULT false,
    transactional_opted_in BOOLEAN DEFAULT true,
    operational_opted_in BOOLEAN DEFAULT true,
    
    -- Timestamps
    opted_in_at TIMESTAMPTZ,
    opted_out_at TIMESTAMPTZ,
    
    -- Source
    opt_in_source VARCHAR(100),
    opt_out_reason VARCHAR(500),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, phone_number)
);

CREATE INDEX idx_whatsapp_optin_phone ON whatsapp_opt_ins(tenant_id, phone_number);
CREATE INDEX idx_whatsapp_optin_user ON whatsapp_opt_ins(tenant_id, user_id);
CREATE INDEX idx_whatsapp_optin_status ON whatsapp_opt_ins(tenant_id, opted_in);

COMMENT ON TABLE whatsapp_opt_ins IS 'User preferences for WhatsApp communications';

-- ============================================================================
-- WHATSAPP BROADCAST LISTS
-- ============================================================================
-- Manage broadcast lists for bulk messaging

CREATE TABLE IF NOT EXISTS whatsapp_broadcast_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- List Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Criteria
    criteria JSONB DEFAULT '{}',
    
    -- Stats
    recipient_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_whatsapp_bcast_tenant ON whatsapp_broadcast_lists(tenant_id, is_active);

COMMENT ON TABLE whatsapp_broadcast_lists IS 'Broadcast lists for bulk WhatsApp messaging';

-- ============================================================================
-- WHATSAPP BROADCAST RECIPIENTS
-- ============================================================================
-- Recipients in broadcast lists

CREATE TABLE IF NOT EXISTS whatsapp_broadcast_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_list_id UUID NOT NULL REFERENCES whatsapp_broadcast_lists(id) ON DELETE CASCADE,
    
    phone_number VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(broadcast_list_id, phone_number)
);

CREATE INDEX idx_whatsapp_bcast_recip ON whatsapp_broadcast_recipients(broadcast_list_id);

COMMENT ON TABLE whatsapp_broadcast_recipients IS 'Recipients in broadcast lists';

-- ============================================================================
-- WHATSAPP CONFIGURATIONS
-- ============================================================================
-- Tenant-specific WhatsApp configurations

CREATE TABLE IF NOT EXISTS whatsapp_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Provider Settings
    provider_name VARCHAR(50) NOT NULL DEFAULT 'meta',
    provider_config JSONB NOT NULL DEFAULT '{}',
    
    -- Phone Number
    business_phone_number VARCHAR(50) NOT NULL,
    display_name VARCHAR(255),
    
    -- Features
    features_enabled JSONB DEFAULT '{}',
    
    -- Rate Limits
    hourly_message_limit INTEGER DEFAULT 1000,
    daily_message_limit INTEGER DEFAULT 10000,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

CREATE INDEX idx_whatsapp_config_tenant ON whatsapp_configurations(tenant_id);

COMMENT ON TABLE whatsapp_configurations IS 'Tenant-specific WhatsApp configurations';

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Ensure proper permissions (adjust based on your DB user)

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

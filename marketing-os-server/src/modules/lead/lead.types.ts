/**
 * Lead module type definitions.
 * CRM layer for WhatsApp Sales Automation.
 */

// ============================
// CORE ENUMS
// ============================

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'interested' | 'negotiating' | 'converted' | 'lost';
export type LeadSource = 'whatsapp' | 'website' | 'referral' | 'import' | 'manual' | 'widget' | 'form' | 'csv' | 'api';

export type LeadActivityType =
    | 'created'
    | 'status_changed'
    | 'message_received'
    | 'message_sent'
    | 'order_placed'
    | 'order_completed'
    | 'flow_started'
    | 'flow_completed'
    | 'data_captured'
    | 'assigned'
    | 'auto_assigned'
    | 'note_added'
    | 'note_added_internal'
    | 'tag_added'
    | 'tag_removed'
    | 'call_logged'
    | 'email_tracked'
    | 'follow_up_set'
    | 'follow_up_completed'
    | 'pipeline_stage_changed'
    | 'duplicate_detected'
    | 'csv_imported'
    | 'score_changed';

// ============================
// CORE LEAD INTERFACE
// ============================

export interface Lead {
    id: string;
    tenant_id: string;
    phone: string;
    name?: string;
    email?: string;
    status: LeadStatus;
    source: LeadSource;
    assigned_to?: string;
    tags: string[];
    collected_data: LeadCollectedData;
    interest_categories: string[];
    budget_range?: BudgetRange;
    location?: string;
    score: number;
    last_message_at?: Date;
    last_order_at?: Date;
    total_orders: number;
    total_spent: number;
    first_contact_at: Date;
    converted_at?: Date;
    notes?: string;
    custom_fields: Record<string, any>;
    // New enhancement fields
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    pipeline_stage_id?: string;
    company?: string;
    job_title?: string;
    last_activity_at?: Date;
    engagement_score: number;
    is_duplicate: boolean;
    duplicate_of?: string;
    created_at: Date;
    updated_at: Date;
}

export interface LeadCollectedData {
    name?: string;
    email?: string;
    budget?: string;
    location?: string;
    product_interest?: string;
    company?: string;
    job_title?: string;
    timeline?: string;
    pain_points?: string[];
    [key: string]: any;
}

export interface BudgetRange {
    min?: number;
    max?: number;
    currency: string;
}

// ============================
// UTM DATA
// ============================

export interface UTMData {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

// ============================
// LEAD DTOs
// ============================

export interface CreateLeadDTO {
    phone: string;
    name?: string;
    email?: string;
    source?: LeadSource;
    tags?: string[];
    collected_data?: Partial<LeadCollectedData>;
    interest_categories?: string[];
    notes?: string;
    // New fields
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    company?: string;
    job_title?: string;
    pipeline_stage_id?: string;
    custom_fields?: Record<string, any>;
}

export interface UpdateLeadDTO {
    name?: string;
    email?: string;
    status?: LeadStatus;
    assigned_to?: string;
    tags?: string[];
    collected_data?: Partial<LeadCollectedData>;
    interest_categories?: string[];
    budget_range?: BudgetRange;
    location?: string;
    notes?: string;
    custom_fields?: Record<string, any>;
    // New fields
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    pipeline_stage_id?: string;
    company?: string;
    job_title?: string;
    engagement_score?: number;
    is_duplicate?: boolean;
    duplicate_of?: string;
}

export interface LeadFilters {
    status?: LeadStatus;
    source?: LeadSource;
    assigned_to?: string;
    tags?: string[];
    search?: string;
    has_orders?: boolean;
    created_after?: Date;
    created_before?: Date;
    pipeline_stage_id?: string;
    min_score?: number;
    max_score?: number;
    utm_source?: string;
    utm_campaign?: string;
    is_duplicate?: boolean;
    limit?: number;
    offset?: number;
}

// ============================
// LEAD ACTIVITY
// ============================

export interface LeadActivity {
    id: string;
    lead_id: string;
    tenant_id: string;
    type: LeadActivityType;
    description: string;
    metadata?: Record<string, any>;
    performed_by?: string;
    created_at: Date;
}

export interface CreateLeadActivityDTO {
    lead_id: string;
    type: LeadActivityType;
    description: string;
    metadata?: Record<string, any>;
    performed_by?: string;
}

// ============================
// LEAD STATS
// ============================

export interface LeadStats {
    total: number;
    by_status: Record<LeadStatus, number>;
    by_source: Record<LeadSource, number>;
    new_today: number;
    new_this_week: number;
    converted_this_month: number;
    average_score: number;
}

// ============================
// PIPELINE TYPES
// ============================

export interface PipelineStage {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    position: number;
    is_default: boolean;
    is_won: boolean;
    is_lost: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreatePipelineStageDTO {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    position?: number;
    is_default?: boolean;
    is_won?: boolean;
    is_lost?: boolean;
}

export interface UpdatePipelineStageDTO {
    name?: string;
    description?: string;
    color?: string;
    position?: number;
    is_won?: boolean;
    is_lost?: boolean;
}

export interface KanbanBoard {
    stages: Array<PipelineStage & { leads: Lead[]; count: number }>;
}

// ============================
// LEAD NOTES
// ============================

export interface LeadNote {
    id: string;
    lead_id: string;
    tenant_id: string;
    content: string;
    is_internal: boolean;
    created_by?: string;
    updated_at: Date;
    created_at: Date;
}

export interface CreateLeadNoteDTO {
    lead_id: string;
    content: string;
    is_internal?: boolean;
    created_by?: string;
}

export interface UpdateLeadNoteDTO {
    content: string;
}

// ============================
// LEAD SCORING RULES
// ============================

export interface LeadScoringRule {
    id: string;
    tenant_id: string;
    name: string;
    event_type: string;
    score_delta: number;
    conditions: Record<string, any>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateLeadScoringRuleDTO {
    name: string;
    event_type: string;
    score_delta: number;
    conditions?: Record<string, any>;
    is_active?: boolean;
}

// ============================
// LEAD DUPLICATES
// ============================

export interface LeadDuplicateMatch {
    id: string;
    tenant_id: string;
    lead_id: string;
    duplicate_lead_id: string;
    match_type: 'phone' | 'email' | 'name_location';
    match_score: number;
    status: 'pending' | 'merged' | 'dismissed';
    resolved_by?: string;
    resolved_at?: Date;
    created_at: Date;
}

// ============================
// LEAD ASSIGNMENT RULES
// ============================

export interface LeadAssignmentRule {
    id: string;
    tenant_id: string;
    name: string;
    strategy: 'round_robin' | 'rule_based' | 'manual';
    conditions: Record<string, any>;
    agent_ids: string[];
    last_assigned_index: number;
    is_active: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
}

export interface CreateLeadAssignmentRuleDTO {
    name: string;
    strategy: 'round_robin' | 'rule_based' | 'manual';
    conditions?: Record<string, any>;
    agent_ids: string[];
    priority?: number;
}

// ============================
// FOLLOW-UP REMINDERS
// ============================

export interface LeadFollowUpReminder {
    id: string;
    lead_id: string;
    tenant_id: string;
    assigned_to?: string;
    due_date: Date;
    note?: string;
    status: 'pending' | 'completed' | 'cancelled';
    completed_at?: Date;
    created_by?: string;
    created_at: Date;
}

export interface CreateFollowUpReminderDTO {
    lead_id: string;
    assigned_to?: string;
    due_date: Date;
    note?: string;
}

// ============================
// CSV IMPORT
// ============================

export interface CSVImportRecord {
    phone: string;
    name?: string;
    email?: string;
    source?: LeadSource;
    tags?: string[];
    notes?: string;
    company?: string;
    job_title?: string;
    location?: string;
    custom_fields?: Record<string, any>;
}

export interface CSVImportResult {
    total: number;
    created: number;
    duplicates: number;
    errors: number;
    error_details: Array<{ row: number; error: string }>;
}

// ============================
// ANALYTICS TYPES
// ============================

export interface ConversionFunnel {
    stages: Array<{
        stage: string;
        count: number;
        conversion_rate: number;
        avg_time_in_stage_hours: number;
    }>;
}

export interface AgentPerformance {
    agents: Array<{
        agent_id: string;
        leads_assigned: number;
        leads_converted: number;
        conversion_rate: number;
        avg_response_time_hours: number;
        total_activities: number;
    }>;
}

export interface SourceAnalytics {
    sources: Array<{
        source: LeadSource;
        lead_count: number;
        conversion_rate: number;
        avg_score: number;
        total_revenue: number;
    }>;
}

export interface LeadTrend {
    data: Array<{
        period: string;
        new_leads: number;
        converted: number;
        lost: number;
    }>;
}

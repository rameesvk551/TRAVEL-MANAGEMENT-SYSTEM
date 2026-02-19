/**
 * Lead module type definitions.
 * CRM layer for WhatsApp Sales Automation.
 */

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'interested' | 'negotiating' | 'converted' | 'lost';
export type LeadSource = 'whatsapp' | 'website' | 'referral' | 'import' | 'manual';

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

export interface CreateLeadDTO {
    phone: string;
    name?: string;
    email?: string;
    source?: LeadSource;
    tags?: string[];
    collected_data?: Partial<LeadCollectedData>;
    interest_categories?: string[];
    notes?: string;
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
    limit?: number;
    offset?: number;
}

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
    | 'note_added'
    | 'tag_added'
    | 'tag_removed';

export interface CreateLeadActivityDTO {
    lead_id: string;
    type: LeadActivityType;
    description: string;
    metadata?: Record<string, any>;
    performed_by?: string;
}

export interface LeadStats {
    total: number;
    by_status: Record<LeadStatus, number>;
    by_source: Record<LeadSource, number>;
    new_today: number;
    new_this_week: number;
    converted_this_month: number;
    average_score: number;
}

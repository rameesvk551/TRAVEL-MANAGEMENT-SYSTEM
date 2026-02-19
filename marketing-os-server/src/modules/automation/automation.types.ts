/**
 * Automation module type definitions.
 * Smart automation rules for WhatsApp Sales.
 */

// ============================
// AUTOMATION RULE
// ============================

export interface AutomationRule {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    trigger_type: AutomationTriggerType;
    trigger_config: AutomationTriggerConfig;
    conditions: AutomationCondition[];
    actions: AutomationAction[];
    is_active: boolean;
    priority: number;
    cooldown_minutes?: number;
    max_executions_per_user?: number;
    created_at: Date;
    updated_at: Date;
}

// ============================
// TRIGGER TYPES
// ============================

export type AutomationTriggerType =
    | 'no_reply'           // User hasn't replied after X time
    | 'cart_abandoned'     // User has items in cart but no checkout
    | 'payment_pending'    // Order pending payment
    | 'order_status_change' // Order status changed
    | 'lead_status_change' // Lead status changed
    | 'repeat_visitor'     // User who has messaged before
    | 'scheduled'          // Run at specific times
    | 'tag_added'          // When a tag is added to lead
    | 'flow_completed'     // When a flow is completed
    | 'inactivity';        // User inactive for X time

export type AutomationTriggerConfig =
    | NoReplyTriggerConfig
    | CartAbandonedTriggerConfig
    | PaymentPendingTriggerConfig
    | OrderStatusTriggerConfig
    | LeadStatusTriggerConfig
    | RepeatVisitorTriggerConfig
    | ScheduledTriggerConfig
    | TagAddedTriggerConfig
    | FlowCompletedTriggerConfig
    | InactivityTriggerConfig;

export interface NoReplyTriggerConfig {
    type: 'no_reply';
    after_minutes: number;
}

export interface CartAbandonedTriggerConfig {
    type: 'cart_abandoned';
    after_minutes: number;
    min_cart_value?: number;
}

export interface PaymentPendingTriggerConfig {
    type: 'payment_pending';
    after_minutes: number;
    reminder_count?: number;
}

export interface OrderStatusTriggerConfig {
    type: 'order_status_change';
    from_status?: string;
    to_status: string;
}

export interface LeadStatusTriggerConfig {
    type: 'lead_status_change';
    from_status?: string;
    to_status: string;
}

export interface RepeatVisitorTriggerConfig {
    type: 'repeat_visitor';
    min_previous_visits?: number;
}

export interface ScheduledTriggerConfig {
    type: 'scheduled';
    schedule: string; // Cron expression
    timezone?: string;
}

export interface TagAddedTriggerConfig {
    type: 'tag_added';
    tags: string[];
}

export interface FlowCompletedTriggerConfig {
    type: 'flow_completed';
    flow_id?: string; // Specific flow or any
}

export interface InactivityTriggerConfig {
    type: 'inactivity';
    after_hours: number;
}

// ============================
// CONDITIONS
// ============================

export interface AutomationCondition {
    field: string;
    operator: ConditionOperator;
    value: any;
}

export type ConditionOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty'
    | 'in_list'
    | 'has_tag'
    | 'has_not_tag';

// ============================
// ACTIONS
// ============================

export interface AutomationAction {
    type: AutomationActionType;
    config: AutomationActionConfig;
    delay_minutes?: number;
}

export type AutomationActionType =
    | 'send_message'
    | 'send_template'
    | 'add_tag'
    | 'remove_tag'
    | 'update_lead_status'
    | 'assign_agent'
    | 'trigger_flow'
    | 'add_note'
    | 'send_notification'
    | 'webhook';

export type AutomationActionConfig =
    | SendMessageActionConfig
    | SendTemplateActionConfig
    | AddTagActionConfig
    | RemoveTagActionConfig
    | UpdateLeadStatusActionConfig
    | AssignAgentActionConfig
    | TriggerFlowActionConfig
    | AddNoteActionConfig
    | SendNotificationActionConfig
    | WebhookActionConfig;

export interface SendMessageActionConfig {
    type: 'send_message';
    message_template: string;
}

export interface SendTemplateActionConfig {
    type: 'send_template';
    template_name: string;
    template_params?: Record<string, string>;
}

export interface AddTagActionConfig {
    type: 'add_tag';
    tags: string[];
}

export interface RemoveTagActionConfig {
    type: 'remove_tag';
    tags: string[];
}

export interface UpdateLeadStatusActionConfig {
    type: 'update_lead_status';
    status: string;
}

export interface AssignAgentActionConfig {
    type: 'assign_agent';
    agent_id?: string;
    round_robin?: boolean;
}

export interface TriggerFlowActionConfig {
    type: 'trigger_flow';
    flow_id: string;
}

export interface AddNoteActionConfig {
    type: 'add_note';
    note_template: string;
}

export interface SendNotificationActionConfig {
    type: 'send_notification';
    channel: 'email' | 'slack' | 'webhook';
    recipients?: string[];
    message_template: string;
}

export interface WebhookActionConfig {
    type: 'webhook';
    url: string;
    method: 'GET' | 'POST';
    headers?: Record<string, string>;
    body_template?: string;
}

// ============================
// EXECUTION LOG
// ============================

export interface AutomationExecution {
    id: string;
    tenant_id: string;
    rule_id: string;
    lead_phone: string;
    lead_id?: string;
    trigger_type: AutomationTriggerType;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    actions_executed: ExecutedAction[];
    error_message?: string;
    scheduled_at: Date;
    started_at?: Date;
    completed_at?: Date;
    created_at: Date;
}

export interface ExecutedAction {
    type: AutomationActionType;
    status: 'success' | 'failed';
    error?: string;
    executed_at: Date;
}

// ============================
// DTOs
// ============================

export interface CreateAutomationRuleDTO {
    name: string;
    description?: string;
    trigger_type: AutomationTriggerType;
    trigger_config: AutomationTriggerConfig;
    conditions?: AutomationCondition[];
    actions: AutomationAction[];
    is_active?: boolean;
    priority?: number;
    cooldown_minutes?: number;
    max_executions_per_user?: number;
}

export interface UpdateAutomationRuleDTO {
    name?: string;
    description?: string;
    trigger_type?: AutomationTriggerType;
    trigger_config?: AutomationTriggerConfig;
    conditions?: AutomationCondition[];
    actions?: AutomationAction[];
    is_active?: boolean;
    priority?: number;
    cooldown_minutes?: number;
    max_executions_per_user?: number;
}

export interface AutomationFilters {
    is_active?: boolean;
    trigger_type?: AutomationTriggerType;
    search?: string;
    limit?: number;
    offset?: number;
}

// ============================
// JOB CONTEXT
// ============================

export interface AutomationJobContext {
    tenantId: string;
    leadPhone: string;
    leadId?: string;
    lead?: any;
    order?: any;
    flowSession?: any;
    cartItems?: any[];
    triggerData?: Record<string, any>;
}

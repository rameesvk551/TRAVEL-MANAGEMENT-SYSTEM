/**
 * Automation Engine — Core execution engine for automation rules.
 */

import { AutomationRepository } from './automation.repository.js';
import { LeadService } from '../lead/lead.service.js';
import { FlowEngine } from '../flow/flow.engine.js';
import type {
    AutomationRule,
    AutomationExecution,
    AutomationJobContext,
    AutomationAction,
    AutomationCondition,
    ExecutedAction,
    SendMessageActionConfig,
    AddTagActionConfig,
    RemoveTagActionConfig,
    UpdateLeadStatusActionConfig,
    TriggerFlowActionConfig,
    AddNoteActionConfig,
} from './automation.types.js';

export interface WhatsAppService {
    sendMessage(tenantId: string, phone: string, message: string): Promise<boolean>;
    sendTemplate(tenantId: string, phone: string, templateName: string, params: Record<string, string>): Promise<boolean>;
}

export class AutomationEngine {
    constructor(
        private readonly automationRepository: AutomationRepository,
        private readonly leadService: LeadService,
        private readonly flowEngine: FlowEngine,
        private readonly whatsAppService?: WhatsAppService,
    ) {}

    /**
     * Check and trigger automations for a specific trigger type.
     */
    async checkTriggersForLead(
        tenantId: string,
        leadPhone: string,
        triggerType: string,
        context: Partial<AutomationJobContext> = {}
    ): Promise<void> {
        const rules = await this.automationRepository.findByTriggerType(
            tenantId,
            triggerType as any
        );

        if (rules.length === 0) return;

        // Get lead data
        const lead = await this.leadService.getLeadByPhone(tenantId, leadPhone);

        const jobContext: AutomationJobContext = {
            tenantId,
            leadPhone,
            leadId: lead?.id,
            lead,
            ...context,
        };

        for (const rule of rules) {
            const ruleData = rule.toJSON() as AutomationRule;
            
            // Check if eligible for execution
            const isEligible = await this.checkEligibility(ruleData, jobContext);
            if (!isEligible) continue;

            // Check conditions
            const conditionsMet = this.evaluateConditions(ruleData.conditions, jobContext);
            if (!conditionsMet) continue;

            // Schedule execution
            await this.scheduleExecution(ruleData, jobContext);
        }
    }

    /**
     * Check if a rule can be executed (cooldown, limits).
     */
    private async checkEligibility(
        rule: AutomationRule,
        context: AutomationJobContext
    ): Promise<boolean> {
        // Check cooldown
        if (rule.cooldown_minutes) {
            const recentCount = await this.automationRepository.getRecentExecutionsCount(
                context.tenantId,
                rule.id,
                context.leadPhone,
                rule.cooldown_minutes
            );

            if (recentCount > 0) {
                return false;
            }
        }

        // Check max executions per user
        if (rule.max_executions_per_user) {
            const totalCount = await this.automationRepository.getTotalExecutionsCount(
                context.tenantId,
                rule.id,
                context.leadPhone
            );

            if (totalCount >= rule.max_executions_per_user) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate all conditions for a rule.
     */
    private evaluateConditions(
        conditions: AutomationCondition[],
        context: AutomationJobContext
    ): boolean {
        if (!conditions || conditions.length === 0) {
            return true;
        }

        return conditions.every(condition => this.evaluateCondition(condition, context));
    }

    /**
     * Evaluate a single condition.
     */
    private evaluateCondition(
        condition: AutomationCondition,
        context: AutomationJobContext
    ): boolean {
        const fieldValue = this.getFieldValue(condition.field, context);

        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;

            case 'not_equals':
                return fieldValue !== condition.value;

            case 'contains':
                return String(fieldValue || '').toLowerCase().includes(String(condition.value).toLowerCase());

            case 'not_contains':
                return !String(fieldValue || '').toLowerCase().includes(String(condition.value).toLowerCase());

            case 'greater_than':
                return Number(fieldValue) > Number(condition.value);

            case 'less_than':
                return Number(fieldValue) < Number(condition.value);

            case 'is_empty':
                return fieldValue === undefined || fieldValue === null || fieldValue === '';

            case 'is_not_empty':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';

            case 'in_list':
                const list = Array.isArray(condition.value) ? condition.value : [condition.value];
                return list.includes(fieldValue);

            case 'has_tag':
                const tags = context.lead?.tags || [];
                return tags.includes(condition.value);

            case 'has_not_tag':
                const leadTags = context.lead?.tags || [];
                return !leadTags.includes(condition.value);

            default:
                return false;
        }
    }

    /**
     * Get field value from context.
     */
    private getFieldValue(field: string, context: AutomationJobContext): any {
        // Handle nested fields like "lead.status" or "order.total_amount"
        const parts = field.split('.');
        let value: any = context;

        for (const part of parts) {
            if (value === undefined || value === null) break;
            value = value[part];
        }

        return value;
    }

    /**
     * Schedule an execution for later processing.
     */
    private async scheduleExecution(
        rule: AutomationRule,
        context: AutomationJobContext
    ): Promise<void> {
        // Calculate scheduled time based on first action's delay
        const firstDelay = rule.actions[0]?.delay_minutes || 0;
        const scheduledAt = new Date(Date.now() + firstDelay * 60 * 1000);

        await this.automationRepository.createExecution(
            context.tenantId,
            rule.id,
            context.leadPhone,
            rule.trigger_type,
            scheduledAt,
            context.leadId
        );
    }

    /**
     * Process pending executions (called by job scheduler).
     */
    async processPendingExecutions(): Promise<number> {
        const executions = await this.automationRepository.getPendingExecutions();
        let processed = 0;

        for (const execution of executions) {
            try {
                await this.executeAutomation(execution);
                processed++;
            } catch (error) {
                console.error(`Failed to execute automation ${execution.id}:`, error);
                await this.automationRepository.updateExecutionStatus(
                    execution.id,
                    'failed',
                    { error_message: (error as Error).message }
                );
            }
        }

        return processed;
    }

    /**
     * Execute a single automation.
     */
    private async executeAutomation(executionModel: any): Promise<void> {
        const execution = executionModel.toJSON() as AutomationExecution;
        const rule = (executionModel.rule as any)?.toJSON() as AutomationRule;

        if (!rule) {
            throw new Error('Rule not found');
        }

        // Mark as executing
        await this.automationRepository.updateExecutionStatus(
            execution.id,
            'executing',
            { started_at: new Date() }
        );

        // Get fresh lead data
        const lead = await this.leadService.getLeadByPhone(execution.tenant_id, execution.lead_phone);

        const context: AutomationJobContext = {
            tenantId: execution.tenant_id,
            leadPhone: execution.lead_phone,
            leadId: lead?.id,
            lead,
        };

        // Execute actions
        const actionsExecuted: ExecutedAction[] = [];

        for (const action of rule.actions) {
            // Apply action delay (relative to previous actions)
            if (action.delay_minutes && action.delay_minutes > 0) {
                await this.delay(action.delay_minutes * 60 * 1000);
            }

            try {
                await this.executeAction(action, context);
                actionsExecuted.push({
                    type: action.type,
                    status: 'success',
                    executed_at: new Date(),
                });
            } catch (error) {
                actionsExecuted.push({
                    type: action.type,
                    status: 'failed',
                    error: (error as Error).message,
                    executed_at: new Date(),
                });
            }
        }

        // Mark as completed
        await this.automationRepository.updateExecutionStatus(
            execution.id,
            'completed',
            {
                completed_at: new Date(),
                actions_executed: actionsExecuted,
            }
        );
    }

    /**
     * Execute a single action.
     */
    private async executeAction(
        action: AutomationAction,
        context: AutomationJobContext
    ): Promise<void> {
        switch (action.type) {
            case 'send_message':
                await this.executeSendMessage(action.config as SendMessageActionConfig, context);
                break;

            case 'add_tag':
                await this.executeAddTag(action.config as AddTagActionConfig, context);
                break;

            case 'remove_tag':
                await this.executeRemoveTag(action.config as RemoveTagActionConfig, context);
                break;

            case 'update_lead_status':
                await this.executeUpdateLeadStatus(action.config as UpdateLeadStatusActionConfig, context);
                break;

            case 'trigger_flow':
                await this.executeTriggerFlow(action.config as TriggerFlowActionConfig, context);
                break;

            case 'add_note':
                await this.executeAddNote(action.config as AddNoteActionConfig, context);
                break;

            default:
                console.warn(`Unknown action type: ${action.type}`);
        }
    }

    // ============================
    // ACTION EXECUTORS
    // ============================

    private async executeSendMessage(
        config: SendMessageActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        if (!this.whatsAppService) {
            console.warn('WhatsApp service not available');
            return;
        }

        const message = this.interpolateTemplate(config.message_template, context);
        await this.whatsAppService.sendMessage(context.tenantId, context.leadPhone, message);
    }

    private async executeAddTag(
        config: AddTagActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        if (!context.leadId) return;

        for (const tag of config.tags) {
            await this.leadService.addTag(context.tenantId, context.leadId, tag);
        }
    }

    private async executeRemoveTag(
        config: RemoveTagActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        if (!context.leadId) return;

        for (const tag of config.tags) {
            await this.leadService.removeTag(context.tenantId, context.leadId, tag);
        }
    }

    private async executeUpdateLeadStatus(
        config: UpdateLeadStatusActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        if (!context.leadId) return;

        await this.leadService.updateLead(context.tenantId, context.leadId, {
            status: config.status as any,
        });
    }

    private async executeTriggerFlow(
        config: TriggerFlowActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        await this.flowEngine.triggerFlow(
            context.tenantId,
            context.leadPhone,
            config.flow_id
        );
    }

    private async executeAddNote(
        config: AddNoteActionConfig,
        context: AutomationJobContext
    ): Promise<void> {
        if (!context.leadId) return;

        const note = this.interpolateTemplate(config.note_template, context);

        await this.leadService.logActivity(context.tenantId, {
            lead_id: context.leadId,
            type: 'note_added',
            description: note,
            metadata: { source: 'automation' },
        });
    }

    // ============================
    // HELPERS
    // ============================

    private interpolateTemplate(template: string, context: AutomationJobContext): string {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, field) => {
            return String(this.getFieldValue(field, context) || match);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

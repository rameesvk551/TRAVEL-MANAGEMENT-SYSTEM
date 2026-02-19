/**
 * Automation service — manages automation rules and executions.
 */

import { AutomationRepository } from './automation.repository.js';
import { AppError } from '../../utils/apiError.js';
import type {
    AutomationRule,
    AutomationExecution,
    CreateAutomationRuleDTO,
    UpdateAutomationRuleDTO,
    AutomationFilters,
} from './automation.types.js';

export class AutomationService {
    constructor(private readonly automationRepository: AutomationRepository) {}

    // ============================
    // RULE CRUD
    // ============================

    async getRule(tenantId: string, id: string): Promise<AutomationRule | null> {
        const rule = await this.automationRepository.findById(tenantId, id);
        return rule?.toJSON() as AutomationRule | null;
    }

    async getRules(tenantId: string, filters: AutomationFilters = {}) {
        const result = await this.automationRepository.findAll(tenantId, filters);
        return {
            data: result.rows.map(r => r.toJSON() as AutomationRule),
            total: result.count,
        };
    }

    async createRule(tenantId: string, data: CreateAutomationRuleDTO): Promise<AutomationRule> {
        // Validate
        this.validateRule(data);

        const rule = await this.automationRepository.create(tenantId, data);
        return rule.toJSON() as AutomationRule;
    }

    async updateRule(tenantId: string, id: string, data: UpdateAutomationRuleDTO): Promise<AutomationRule | null> {
        if (data.trigger_type && data.trigger_config) {
            this.validateRule(data as CreateAutomationRuleDTO);
        }

        const rule = await this.automationRepository.update(tenantId, id, data);
        if (!rule) return null;

        return rule.toJSON() as AutomationRule;
    }

    async deleteRule(tenantId: string, id: string): Promise<boolean> {
        return this.automationRepository.delete(tenantId, id);
    }

    async activateRule(tenantId: string, id: string): Promise<AutomationRule | null> {
        return this.updateRule(tenantId, id, { is_active: true });
    }

    async deactivateRule(tenantId: string, id: string): Promise<AutomationRule | null> {
        return this.updateRule(tenantId, id, { is_active: false });
    }

    private validateRule(data: CreateAutomationRuleDTO): void {
        if (!data.name) {
            throw new AppError('Name is required', 400);
        }

        if (!data.trigger_type) {
            throw new AppError('Trigger type is required', 400);
        }

        if (!data.trigger_config) {
            throw new AppError('Trigger config is required', 400);
        }

        if (!data.actions || data.actions.length === 0) {
            throw new AppError('At least one action is required', 400);
        }
    }

    // ============================
    // EXECUTION MANAGEMENT
    // ============================

    async getExecution(tenantId: string, id: string): Promise<AutomationExecution | null> {
        const execution = await this.automationRepository.getExecution(tenantId, id);
        return execution?.toJSON() as AutomationExecution | null;
    }

    async getExecutions(tenantId: string, filters: { status?: string; limit?: number; offset?: number } = {}) {
        // This would need a method in repository to get filtered executions
        // For now, return empty
        return { data: [], total: 0 };
    }

    // ============================
    // STATISTICS
    // ============================

    async getStats(tenantId: string, startDate?: Date, endDate?: Date) {
        return this.automationRepository.getExecutionStats(tenantId, startDate, endDate);
    }

    // ============================
    // CLEANUP
    // ============================

    async cleanupOldExecutions(olderThanDays: number = 30): Promise<number> {
        return this.automationRepository.cleanupOldExecutions(olderThanDays);
    }

    // ============================
    // TEMPLATE RULES
    // ============================

    async createDefaultRules(tenantId: string): Promise<AutomationRule[]> {
        const rules: AutomationRule[] = [];

        // Cart Abandonment Rule
        const cartAbandon = await this.createRule(tenantId, {
            name: 'Cart Abandonment Reminder',
            description: 'Send reminder when cart is abandoned for 30 minutes',
            trigger_type: 'cart_abandoned',
            trigger_config: {
                type: 'cart_abandoned',
                after_minutes: 30,
            },
            conditions: [],
            actions: [
                {
                    type: 'send_message',
                    config: {
                        type: 'send_message',
                        message_template: '🛒 Hey {{lead.name}}! You left some items in your cart.\n\nComplete your order now and get them delivered fast! 🚀\n\nReply "cart" to continue.',
                    },
                },
                {
                    type: 'add_tag',
                    config: {
                        type: 'add_tag',
                        tags: ['cart_reminder_sent'],
                    },
                },
            ],
            is_active: true,
            priority: 10,
            cooldown_minutes: 120,
            max_executions_per_user: 3,
        });
        rules.push(cartAbandon);

        // Payment Reminder Rule
        const paymentReminder = await this.createRule(tenantId, {
            name: 'Payment Reminder',
            description: 'Remind about pending payment after 60 minutes',
            trigger_type: 'payment_pending',
            trigger_config: {
                type: 'payment_pending',
                after_minutes: 60,
            },
            conditions: [],
            actions: [
                {
                    type: 'send_message',
                    config: {
                        type: 'send_message',
                        message_template: '⏳ Your order is waiting for payment!\n\nComplete your payment to confirm your order.\n\nNeed help? Reply "help" to connect with our team.',
                    },
                },
            ],
            is_active: true,
            priority: 10,
            cooldown_minutes: 240,
            max_executions_per_user: 2,
        });
        rules.push(paymentReminder);

        // No Reply Follow-up
        const noReply = await this.createRule(tenantId, {
            name: 'No Reply Follow-up',
            description: 'Follow up when user does not reply for 2 hours',
            trigger_type: 'no_reply',
            trigger_config: {
                type: 'no_reply',
                after_minutes: 120,
            },
            conditions: [
                { field: 'lead.status', operator: 'not_equals', value: 'converted' },
            ],
            actions: [
                {
                    type: 'send_message',
                    config: {
                        type: 'send_message',
                        message_template: '👋 Hi {{lead.name}}! Just checking in.\n\nIs there anything I can help you with?\n\nReply "menu" to see our options.',
                    },
                },
            ],
            is_active: true,
            priority: 5,
            cooldown_minutes: 480,
            max_executions_per_user: 2,
        });
        rules.push(noReply);

        // Repeat Visitor Welcome
        const repeatVisitor = await this.createRule(tenantId, {
            name: 'Repeat Visitor Welcome',
            description: 'Skip intro for returning visitors',
            trigger_type: 'repeat_visitor',
            trigger_config: {
                type: 'repeat_visitor',
                min_previous_visits: 2,
            },
            conditions: [],
            actions: [
                {
                    type: 'add_tag',
                    config: {
                        type: 'add_tag',
                        tags: ['returning_customer'],
                    },
                },
            ],
            is_active: true,
            priority: 1,
        });
        rules.push(repeatVisitor);

        return rules;
    }
}

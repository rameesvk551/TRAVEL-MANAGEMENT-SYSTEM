/**
 * Automation repository — encapsulates all database queries for the automation module.
 */

import { Op } from 'sequelize';
import { AutomationRule, AutomationExecution } from './automation.model.js';
import type {
    CreateAutomationRuleDTO,
    UpdateAutomationRuleDTO,
    AutomationFilters,
    AutomationTriggerType,
    ExecutedAction,
} from './automation.types.js';

export class AutomationRepository {
    // ============================
    // AUTOMATION RULE CRUD
    // ============================

    async findById(tenantId: string, id: string) {
        return AutomationRule.findOne({
            where: { id, tenant_id: tenantId },
        });
    }

    async findAll(tenantId: string, filters: AutomationFilters = {}) {
        const where: any = { tenant_id: tenantId };

        if (filters.is_active !== undefined) where.is_active = filters.is_active;
        if (filters.trigger_type) where.trigger_type = filters.trigger_type;

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { description: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        return AutomationRule.findAndCountAll({
            where,
            order: [['priority', 'DESC'], ['created_at', 'DESC']],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        });
    }

    async findByTriggerType(tenantId: string, triggerType: AutomationTriggerType) {
        return AutomationRule.findAll({
            where: {
                tenant_id: tenantId,
                trigger_type: triggerType,
                is_active: true,
            },
            order: [['priority', 'DESC']],
        });
    }

    async create(tenantId: string, data: CreateAutomationRuleDTO) {
        return AutomationRule.create({
            tenant_id: tenantId,
            name: data.name,
            description: data.description,
            trigger_type: data.trigger_type,
            trigger_config: data.trigger_config,
            conditions: data.conditions || [],
            actions: data.actions,
            is_active: data.is_active ?? true,
            priority: data.priority ?? 0,
            cooldown_minutes: data.cooldown_minutes,
            max_executions_per_user: data.max_executions_per_user,
        });
    }

    async update(tenantId: string, id: string, data: UpdateAutomationRuleDTO) {
        const rule = await AutomationRule.findOne({ where: { id, tenant_id: tenantId } });
        if (!rule) return null;

        await rule.update(data);
        return rule;
    }

    async delete(tenantId: string, id: string) {
        const count = await AutomationRule.destroy({ where: { id, tenant_id: tenantId } });
        return count > 0;
    }

    // ============================
    // EXECUTION MANAGEMENT
    // ============================

    async createExecution(
        tenantId: string,
        ruleId: string,
        leadPhone: string,
        triggerType: AutomationTriggerType,
        scheduledAt: Date,
        leadId?: string
    ) {
        return AutomationExecution.create({
            tenant_id: tenantId,
            rule_id: ruleId,
            lead_phone: leadPhone,
            lead_id: leadId,
            trigger_type: triggerType,
            status: 'pending',
            scheduled_at: scheduledAt,
            actions_executed: [],
        });
    }

    async getExecution(tenantId: string, id: string) {
        return AutomationExecution.findOne({
            where: { id, tenant_id: tenantId },
            include: [{ model: AutomationRule, as: 'rule' }],
        });
    }

    async getPendingExecutions(tenantId?: string) {
        const where: any = {
            status: 'pending',
            scheduled_at: { [Op.lte]: new Date() },
        };

        if (tenantId) {
            where.tenant_id = tenantId;
        }

        return AutomationExecution.findAll({
            where,
            include: [{ model: AutomationRule, as: 'rule' }],
            order: [['scheduled_at', 'ASC']],
            limit: 100,
        });
    }

    async updateExecutionStatus(
        id: string,
        status: 'pending' | 'executing' | 'completed' | 'failed',
        updates?: {
            started_at?: Date;
            completed_at?: Date;
            actions_executed?: ExecutedAction[];
            error_message?: string;
        }
    ) {
        const execution = await AutomationExecution.findByPk(id);
        if (!execution) return null;

        await execution.update({ status, ...updates });
        return execution;
    }

    async addExecutedAction(id: string, action: ExecutedAction) {
        const execution = await AutomationExecution.findByPk(id);
        if (!execution) return null;

        const actionsExecuted = [...(execution.actions_executed || []), action];
        await execution.update({ actions_executed: actionsExecuted });
        return execution;
    }

    // ============================
    // COOLDOWN & LIMITS CHECK
    // ============================

    async getRecentExecutionsCount(
        tenantId: string,
        ruleId: string,
        leadPhone: string,
        sinceMinutes: number
    ): Promise<number> {
        const since = new Date(Date.now() - sinceMinutes * 60 * 1000);

        return AutomationExecution.count({
            where: {
                tenant_id: tenantId,
                rule_id: ruleId,
                lead_phone: leadPhone,
                created_at: { [Op.gte]: since },
            },
        });
    }

    async getTotalExecutionsCount(
        tenantId: string,
        ruleId: string,
        leadPhone: string
    ): Promise<number> {
        return AutomationExecution.count({
            where: {
                tenant_id: tenantId,
                rule_id: ruleId,
                lead_phone: leadPhone,
            },
        });
    }

    async getLastExecution(
        tenantId: string,
        ruleId: string,
        leadPhone: string
    ) {
        return AutomationExecution.findOne({
            where: {
                tenant_id: tenantId,
                rule_id: ruleId,
                lead_phone: leadPhone,
            },
            order: [['created_at', 'DESC']],
        });
    }

    // ============================
    // CLEANUP
    // ============================

    async cleanupOldExecutions(olderThanDays: number) {
        const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

        const count = await AutomationExecution.destroy({
            where: {
                created_at: { [Op.lt]: cutoff },
                status: { [Op.in]: ['completed', 'failed'] },
            },
        });

        return count;
    }

    // ============================
    // ANALYTICS
    // ============================

    async getExecutionStats(tenantId: string, startDate?: Date, endDate?: Date) {
        const where: any = { tenant_id: tenantId };

        if (startDate) {
            where.created_at = { ...where.created_at, [Op.gte]: startDate };
        }
        if (endDate) {
            where.created_at = { ...where.created_at, [Op.lte]: endDate };
        }

        const total = await AutomationExecution.count({ where });

        const byStatus = await AutomationExecution.findAll({
            where,
            attributes: ['status', [AutomationExecution.sequelize!.literal('COUNT(*)'), 'count']],
            group: ['status'],
            raw: true,
        }) as any[];

        const byTrigger = await AutomationExecution.findAll({
            where,
            attributes: ['trigger_type', [AutomationExecution.sequelize!.literal('COUNT(*)'), 'count']],
            group: ['trigger_type'],
            raw: true,
        }) as any[];

        return {
            total,
            by_status: Object.fromEntries(byStatus.map(s => [s.status, parseInt(s.count)])),
            by_trigger: Object.fromEntries(byTrigger.map(s => [s.trigger_type, parseInt(s.count)])),
        };
    }
}

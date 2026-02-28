/**
 * Lead Assignment Service — Round-robin + rule-based auto-assignment.
 */

import { LeadAssignmentRuleModel, Lead } from './lead.model.js';
import type { LeadAssignmentRule, CreateLeadAssignmentRuleDTO } from './lead.types.js';

export class LeadAssignmentService {

    // ============================
    // ASSIGNMENT RULES CRUD
    // ============================

    async getRules(tenantId: string): Promise<LeadAssignmentRule[]> {
        const rules = await LeadAssignmentRuleModel.findAll({
            where: { tenant_id: tenantId },
            order: [['priority', 'DESC']],
        });
        return rules.map(r => r.toJSON() as LeadAssignmentRule);
    }

    async createRule(tenantId: string, data: CreateLeadAssignmentRuleDTO): Promise<LeadAssignmentRule> {
        const rule = await LeadAssignmentRuleModel.create({
            tenant_id: tenantId,
            name: data.name,
            strategy: data.strategy,
            conditions: data.conditions || {},
            agent_ids: data.agent_ids,
            priority: data.priority || 0,
        });
        return rule.toJSON() as LeadAssignmentRule;
    }

    async updateRule(tenantId: string, ruleId: string, data: Partial<CreateLeadAssignmentRuleDTO>): Promise<LeadAssignmentRule | null> {
        const rule = await LeadAssignmentRuleModel.findOne({ where: { id: ruleId, tenant_id: tenantId } });
        if (!rule) return null;
        await rule.update(data);
        return rule.toJSON() as LeadAssignmentRule;
    }

    async deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
        const count = await LeadAssignmentRuleModel.destroy({ where: { id: ruleId, tenant_id: tenantId } });
        return count > 0;
    }

    // ============================
    // AUTO-ASSIGNMENT ENGINE
    // ============================

    /**
     * Auto-assign a lead to an agent based on active rules.
     * Returns the assigned agent's UUID, or null if no rule matched.
     */
    async autoAssign(tenantId: string, leadId: string): Promise<string | null> {
        const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
        if (!lead) return null;

        // Get active rules ordered by priority
        const rules = await LeadAssignmentRuleModel.findAll({
            where: { tenant_id: tenantId, is_active: true },
            order: [['priority', 'DESC']],
        });

        for (const rule of rules) {
            if (rule.agent_ids.length === 0) continue;

            // Check rule-based conditions
            if (rule.strategy === 'rule_based') {
                if (!this.matchesConditions(lead, rule.conditions)) continue;
            }

            // Round-robin: pick next agent
            const nextIndex = (rule.last_assigned_index + 1) % rule.agent_ids.length;
            const agentId = rule.agent_ids[nextIndex];

            // Update the round-robin index
            await rule.update({ last_assigned_index: nextIndex });

            // Assign the lead
            await lead.update({ assigned_to: agentId, last_activity_at: new Date() });

            return agentId;
        }

        return null;
    }

    /**
     * Check if a lead matches the conditions defined in an assignment rule.
     * Conditions can match: source, tags, location, score_range.
     */
    private matchesConditions(lead: Lead, conditions: Record<string, any>): boolean {
        if (!conditions || Object.keys(conditions).length === 0) return true;

        // Source match
        if (conditions.source && lead.source !== conditions.source) return false;

        // Tag match (lead must have at least one matching tag)
        if (conditions.tags && Array.isArray(conditions.tags)) {
            const leadTags = new Set(lead.tags || []);
            if (!conditions.tags.some((t: string) => leadTags.has(t))) return false;
        }

        // Location match
        if (conditions.location && lead.location) {
            if (!lead.location.toLowerCase().includes(conditions.location.toLowerCase())) return false;
        }

        // Score range
        if (conditions.min_score !== undefined && lead.score < conditions.min_score) return false;
        if (conditions.max_score !== undefined && lead.score > conditions.max_score) return false;

        return true;
    }
}

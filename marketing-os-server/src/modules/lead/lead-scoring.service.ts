/**
 * Lead Scoring Service — Configurable scoring engine per tenant.
 */

import { LeadScoringRuleModel, Lead } from './lead.model.js';
import { LeadRepository } from './lead.repository.js';
import type { LeadScoringRule, CreateLeadScoringRuleDTO } from './lead.types.js';

// Default scoring rules (used if tenant has none configured)
const DEFAULT_SCORING: Record<string, number> = {
    message_received: 2,
    order_placed: 20,
    order_completed: 10,
    data_captured: 5,
    flow_completed: 10,
    email_provided: 5,
    name_provided: 3,
    budget_provided: 8,
    location_provided: 5,
    interest_category_added: 5,
};

export class LeadScoringService {
    constructor(private readonly leadRepository: LeadRepository) { }

    // ============================
    // SCORING RULES CRUD
    // ============================

    async getRules(tenantId: string): Promise<LeadScoringRule[]> {
        const rules = await LeadScoringRuleModel.findAll({
            where: { tenant_id: tenantId },
            order: [['event_type', 'ASC']],
        });
        return rules.map(r => r.toJSON() as LeadScoringRule);
    }

    async createRule(tenantId: string, data: CreateLeadScoringRuleDTO): Promise<LeadScoringRule> {
        const rule = await LeadScoringRuleModel.create({
            tenant_id: tenantId,
            name: data.name,
            event_type: data.event_type,
            score_delta: data.score_delta,
            conditions: data.conditions || {},
            is_active: data.is_active !== false,
        });
        return rule.toJSON() as LeadScoringRule;
    }

    async updateRule(tenantId: string, ruleId: string, data: Partial<CreateLeadScoringRuleDTO>): Promise<LeadScoringRule | null> {
        const rule = await LeadScoringRuleModel.findOne({ where: { id: ruleId, tenant_id: tenantId } });
        if (!rule) return null;
        await rule.update(data);
        return rule.toJSON() as LeadScoringRule;
    }

    async deleteRule(tenantId: string, ruleId: string): Promise<boolean> {
        const count = await LeadScoringRuleModel.destroy({ where: { id: ruleId, tenant_id: tenantId } });
        return count > 0;
    }

    // ============================
    // SCORE CALCULATION
    // ============================

    /**
     * Apply a score delta for a given event. Uses tenant-specific rules if configured,
     * otherwise falls back to defaults.
     */
    async applyScore(tenantId: string, leadId: string, eventType: string): Promise<number> {
        // Check for tenant-specific active rules
        const tenantRules = await LeadScoringRuleModel.findAll({
            where: { tenant_id: tenantId, event_type: eventType, is_active: true },
        });

        let delta = 0;
        if (tenantRules.length > 0) {
            delta = tenantRules.reduce((sum, r) => sum + r.score_delta, 0);
        } else {
            delta = DEFAULT_SCORING[eventType] || 0;
        }

        if (delta !== 0) {
            await this.leadRepository.updateScore(tenantId, leadId, delta);
        }

        return delta;
    }

    /**
     * Recalculate full score for a lead based on all their activities.
     */
    async recalculateScore(tenantId: string, leadId: string): Promise<number> {
        const activities = await this.leadRepository.getActivities(tenantId, leadId, 1000);
        let totalScore = 0;

        for (const activity of activities) {
            const activityJson = activity.toJSON() as any;
            const eventType = activityJson.type;

            const tenantRules = await LeadScoringRuleModel.findAll({
                where: { tenant_id: tenantId, event_type: eventType, is_active: true },
            });

            if (tenantRules.length > 0) {
                totalScore += tenantRules.reduce((sum, r) => sum + r.score_delta, 0);
            } else {
                totalScore += DEFAULT_SCORING[eventType] || 0;
            }
        }

        totalScore = Math.max(0, Math.min(100, totalScore));

        const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
        if (lead) {
            await lead.update({ score: totalScore });
        }

        return totalScore;
    }

    /**
     * Seed default scoring rules for a tenant.
     */
    async seedDefaults(tenantId: string): Promise<LeadScoringRule[]> {
        const existing = await LeadScoringRuleModel.count({ where: { tenant_id: tenantId } });
        if (existing > 0) return this.getRules(tenantId);

        const rules: LeadScoringRule[] = [];
        for (const [eventType, delta] of Object.entries(DEFAULT_SCORING)) {
            const name = eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            rules.push(await this.createRule(tenantId, { name, event_type: eventType, score_delta: delta }));
        }
        return rules;
    }
}

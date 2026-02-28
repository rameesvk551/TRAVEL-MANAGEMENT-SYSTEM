/**
 * Lead Automation Service — Workflow triggers based on tags, status, inactivity.
 */

import { Op } from 'sequelize';
import { Lead, LeadActivity } from './lead.model.js';
import { LeadAssignmentService } from './lead-assignment.service.js';
import type { LeadActivityType } from './lead.types.js';

export interface AutomationTrigger {
    event: 'tag_added' | 'status_changed' | 'score_threshold' | 'inactivity';
    lead_id: string;
    tenant_id: string;
    metadata?: Record<string, any>;
}

export interface AutomationAction {
    type: 'assign_agent' | 'change_status' | 'add_tag' | 'send_notification';
    config: Record<string, any>;
}

/**
 * Simple in-process automation engine.
 * For production, trigger evaluation would run as a background worker/queue.
 */
export class LeadAutomationService {
    constructor(private readonly assignmentService: LeadAssignmentService) { }

    /**
     * Evaluate triggers when an event happens on a lead.
     * Called after status changes, tag additions, etc.
     */
    async evaluateTriggers(trigger: AutomationTrigger): Promise<void> {
        const { event, lead_id, tenant_id, metadata } = trigger;

        switch (event) {
            case 'status_changed':
                await this.onStatusChanged(tenant_id, lead_id, metadata?.new_status, metadata?.old_status);
                break;
            case 'tag_added':
                await this.onTagAdded(tenant_id, lead_id, metadata?.tag);
                break;
            case 'score_threshold':
                await this.onScoreThreshold(tenant_id, lead_id, metadata?.score);
                break;
            case 'inactivity':
                // Handled by checkInactiveLeads batch job
                break;
        }
    }

    /**
     * When a lead's status changes, auto-assign if newly qualified.
     */
    private async onStatusChanged(tenantId: string, leadId: string, newStatus?: string, _oldStatus?: string): Promise<void> {
        if (newStatus === 'qualified') {
            const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
            if (lead && !lead.assigned_to) {
                await this.assignmentService.autoAssign(tenantId, leadId);
            }
        }
    }

    /**
     * When a high-priority tag is added, ensure lead is assigned.
     */
    private async onTagAdded(tenantId: string, leadId: string, tag?: string): Promise<void> {
        const highPriorityTags = ['vip', 'hot', 'urgent', 'high_priority'];
        if (tag && highPriorityTags.includes(tag.toLowerCase())) {
            const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
            if (lead && !lead.assigned_to) {
                await this.assignmentService.autoAssign(tenantId, leadId);
            }
        }
    }

    /**
     * When score crosses a threshold, auto-progress status.
     */
    private async onScoreThreshold(tenantId: string, leadId: string, score?: number): Promise<void> {
        if (!score) return;
        const lead = await Lead.findOne({ where: { id: leadId, tenant_id: tenantId } });
        if (!lead) return;

        // Auto-progress based on score thresholds
        if (score >= 40 && lead.status === 'new') {
            await lead.update({ status: 'contacted', last_activity_at: new Date() });
        } else if (score >= 60 && (lead.status === 'contacted' || lead.status === 'new')) {
            await lead.update({ status: 'qualified', last_activity_at: new Date() });
        }
    }

    /**
     * Check for inactive leads (no activity in X days).
     * Designed to be called by a background job on a schedule.
     */
    async checkInactiveLeads(tenantId: string, inactivityDays: number = 7): Promise<string[]> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - inactivityDays);

        const inactiveLeads = await Lead.findAll({
            where: {
                tenant_id: tenantId,
                status: { [Op.notIn]: ['converted', 'lost'] },
                last_activity_at: { [Op.lt]: cutoff },
            },
            attributes: ['id'],
        });

        // Could also be used through the last_message_at field
        const inactiveFromMessages = await Lead.findAll({
            where: {
                tenant_id: tenantId,
                status: { [Op.notIn]: ['converted', 'lost'] },
                last_activity_at: null as any,
                last_message_at: { [Op.lt]: cutoff },
            },
            attributes: ['id'],
        });

        const allInactive = [...inactiveLeads, ...inactiveFromMessages];
        const uniqueIds = [...new Set(allInactive.map(l => l.id))];

        // Log inactivity for each lead
        for (const leadId of uniqueIds) {
            await LeadActivity.create({
                lead_id: leadId,
                tenant_id: tenantId,
                type: 'status_changed' as LeadActivityType,
                description: `Lead inactive for ${inactivityDays}+ days`,
                metadata: { reason: 'inactivity_check', days: inactivityDays },
            });
        }

        return uniqueIds;
    }
}

/**
 * Lead service — contains all lead management business logic.
 * DB queries are delegated to LeadRepository.
 */

import { LeadRepository } from './lead.repository.js';
import { AppError } from '../../utils/apiError.js';
import type {
    Lead,
    CreateLeadDTO,
    UpdateLeadDTO,
    LeadFilters,
    LeadStatus,
    LeadCollectedData,
    LeadStats,
    CreateLeadActivityDTO,
} from './lead.types.js';

// Scoring rules configuration
const SCORING_RULES = {
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

// Status progression thresholds
const STATUS_PROGRESSION = {
    contacted: { min_score: 5 },
    qualified: { min_score: 20, required_fields: ['name'] },
    interested: { min_score: 40, required_fields: ['name', 'product_interest'] },
};

export class LeadService {
    constructor(private readonly leadRepository: LeadRepository) {}

    // ============================
    // LEAD CRUD
    // ============================

    async getLead(tenantId: string, id: string): Promise<Lead | null> {
        const lead = await this.leadRepository.findById(tenantId, id);
        return lead?.toJSON() as Lead | null;
    }

    async getLeadByPhone(tenantId: string, phone: string): Promise<Lead | null> {
        const lead = await this.leadRepository.findByPhone(tenantId, phone);
        return lead?.toJSON() as Lead | null;
    }

    async getLeads(tenantId: string, filters: LeadFilters = {}) {
        const result = await this.leadRepository.findAll(tenantId, filters);
        return {
            data: result.rows.map(r => r.toJSON() as Lead),
            total: result.count,
        };
    }

    async createLead(tenantId: string, data: CreateLeadDTO): Promise<Lead> {
        // Check if lead with this phone already exists
        const existing = await this.leadRepository.findByPhone(tenantId, data.phone);
        if (existing) {
            throw new AppError('Lead with this phone number already exists', 409);
        }

        const lead = await this.leadRepository.create(tenantId, data);

        // Log creation activity
        await this.logActivity(tenantId, {
            lead_id: lead.id,
            type: 'created',
            description: `Lead created from ${data.source || 'whatsapp'}`,
        });

        return lead.toJSON() as Lead;
    }

    async updateLead(tenantId: string, id: string, data: UpdateLeadDTO): Promise<Lead | null> {
        const lead = await this.leadRepository.update(tenantId, id, data);
        if (!lead) return null;

        // Log status change if changed
        if (data.status) {
            await this.logActivity(tenantId, {
                lead_id: id,
                type: 'status_changed',
                description: `Status changed to ${data.status}`,
                metadata: { new_status: data.status },
            });
        }

        return lead.toJSON() as Lead;
    }

    async deleteLead(tenantId: string, id: string): Promise<boolean> {
        return this.leadRepository.delete(tenantId, id);
    }

    // ============================
    // AUTO LEAD CREATION (WhatsApp Integration)
    // ============================

    /**
     * Find or create a lead when a WhatsApp message is received.
     * This is the main entry point for auto-lead creation.
     */
    async findOrCreateFromWhatsApp(
        tenantId: string,
        phone: string,
        metadata?: { name?: string; profilePicture?: string }
    ): Promise<{ lead: Lead; isNew: boolean }> {
        // Check if lead exists
        let lead = await this.leadRepository.findByPhone(tenantId, phone);
        let isNew = false;

        if (lead) {
            // Update last message timestamp
            await this.leadRepository.updateLastMessageAt(tenantId, phone);

            // Log message activity
            await this.logActivity(tenantId, {
                lead_id: lead.id,
                type: 'message_received',
                description: 'WhatsApp message received',
            });

            // Update score
            await this.updateScore(tenantId, lead.id, 'message_received');
        } else {
            // Create new lead
            lead = await this.leadRepository.create(tenantId, {
                phone,
                name: metadata?.name,
                source: 'whatsapp',
            });
            isNew = true;

            // Log creation
            await this.logActivity(tenantId, {
                lead_id: lead.id,
                type: 'created',
                description: 'Lead auto-created from WhatsApp message',
                metadata: { phone, profilePicture: metadata?.profilePicture },
            });
        }

        return { lead: lead.toJSON() as Lead, isNew };
    }

    // ============================
    // DATA COLLECTION (Flow Integration)
    // ============================

    /**
     * Capture data from conversation flow and update lead.
     */
    async captureData(
        tenantId: string,
        phone: string,
        field: string,
        value: any
    ): Promise<Lead | null> {
        const lead = await this.leadRepository.findByPhone(tenantId, phone);
        if (!lead) return null;

        // Update collected_data
        const collectedData = { ...(lead.collected_data || {}), [field]: value };
        
        // Map common fields to lead columns
        const updates: UpdateLeadDTO = { collected_data: collectedData };
        
        switch (field) {
            case 'name':
                updates.name = value;
                await this.updateScore(tenantId, lead.id, 'name_provided');
                break;
            case 'email':
                updates.email = value;
                await this.updateScore(tenantId, lead.id, 'email_provided');
                break;
            case 'location':
                updates.location = value;
                await this.updateScore(tenantId, lead.id, 'location_provided');
                break;
            case 'budget':
            case 'budget_range':
                await this.updateScore(tenantId, lead.id, 'budget_provided');
                break;
            default:
                await this.updateScore(tenantId, lead.id, 'data_captured');
        }

        const updated = await this.leadRepository.update(tenantId, lead.id, updates);
        if (!updated) return null;

        // Log activity
        await this.logActivity(tenantId, {
            lead_id: lead.id,
            type: 'data_captured',
            description: `Captured ${field}`,
            metadata: { field, value },
        });

        // Check for auto status progression
        await this.checkStatusProgression(tenantId, lead.id);

        return updated.toJSON() as Lead;
    }

    /**
     * Add interest category to lead (from product browsing/flow).
     */
    async addInterestCategory(
        tenantId: string,
        phone: string,
        category: string
    ): Promise<Lead | null> {
        const lead = await this.leadRepository.findByPhone(tenantId, phone);
        if (!lead) return null;

        const updated = await this.leadRepository.addInterestCategory(tenantId, lead.id, category);
        if (!updated) return null;

        await this.updateScore(tenantId, lead.id, 'interest_category_added');

        return updated.toJSON() as Lead;
    }

    // ============================
    // ORDER INTEGRATION
    // ============================

    /**
     * Called when an order is placed by a lead.
     */
    async onOrderPlaced(
        tenantId: string,
        phone: string,
        orderAmount: number,
        orderId: string
    ): Promise<Lead | null> {
        const lead = await this.leadRepository.findByPhone(tenantId, phone);
        if (!lead) return null;

        // Update order stats
        await this.leadRepository.incrementOrderStats(tenantId, phone, orderAmount);

        // Update score
        await this.updateScore(tenantId, lead.id, 'order_placed');

        // Log activity
        await this.logActivity(tenantId, {
            lead_id: lead.id,
            type: 'order_placed',
            description: `Order placed: ${orderId}`,
            metadata: { order_id: orderId, amount: orderAmount },
        });

        // Auto-progress status if first order
        if (lead.total_orders === 0 && lead.status === 'new') {
            await this.leadRepository.updateStatus(tenantId, lead.id, 'interested');
        }

        const updated = await this.leadRepository.findByPhone(tenantId, phone);
        return updated?.toJSON() as Lead | null;
    }

    /**
     * Called when an order is completed.
     */
    async onOrderCompleted(
        tenantId: string,
        phone: string,
        orderId: string
    ): Promise<Lead | null> {
        const lead = await this.leadRepository.findByPhone(tenantId, phone);
        if (!lead) return null;

        await this.updateScore(tenantId, lead.id, 'order_completed');

        await this.logActivity(tenantId, {
            lead_id: lead.id,
            type: 'order_completed',
            description: `Order completed: ${orderId}`,
            metadata: { order_id: orderId },
        });

        // Check if should mark as converted
        if (lead.total_orders >= 2 || Number(lead.total_spent) >= 5000) {
            await this.leadRepository.updateStatus(tenantId, lead.id, 'converted');
        }

        const updated = await this.leadRepository.findByPhone(tenantId, phone);
        return updated?.toJSON() as Lead | null;
    }

    // ============================
    // SCORING
    // ============================

    private async updateScore(
        tenantId: string,
        leadId: string,
        action: keyof typeof SCORING_RULES
    ): Promise<void> {
        const delta = SCORING_RULES[action] || 0;
        if (delta > 0) {
            await this.leadRepository.updateScore(tenantId, leadId, delta);
        }
    }

    /**
     * Check if lead should auto-progress to next status.
     */
    private async checkStatusProgression(
        tenantId: string,
        leadId: string
    ): Promise<void> {
        const lead = await this.leadRepository.findById(tenantId, leadId);
        if (!lead) return;

        const currentStatus = lead.status;
        const collectedData = lead.collected_data || {};

        // Check each progression rule
        for (const [targetStatus, rules] of Object.entries(STATUS_PROGRESSION)) {
            // Skip if already at or past this status
            if (this.statusOrder(currentStatus) >= this.statusOrder(targetStatus as LeadStatus)) {
                continue;
            }

            // Check score requirement
            if (lead.score < rules.min_score) continue;

            // Check required fields
            if (rules.required_fields) {
                const hasAllFields = rules.required_fields.every(field => {
                    return collectedData[field] || (lead as any)[field];
                });
                if (!hasAllFields) continue;
            }

            // Progress status
            await this.leadRepository.updateStatus(tenantId, leadId, targetStatus as LeadStatus);

            await this.logActivity(tenantId, {
                lead_id: leadId,
                type: 'status_changed',
                description: `Auto-progressed from ${currentStatus} to ${targetStatus}`,
                metadata: { from: currentStatus, to: targetStatus, reason: 'auto_progression' },
            });

            break; // Only progress one step at a time
        }
    }

    private statusOrder(status: LeadStatus): number {
        const order: Record<LeadStatus, number> = {
            new: 0,
            contacted: 1,
            qualified: 2,
            interested: 3,
            negotiating: 4,
            converted: 5,
            lost: -1,
        };
        return order[status] ?? 0;
    }

    // ============================
    // TAGS
    // ============================

    async addTag(tenantId: string, id: string, tag: string): Promise<Lead | null> {
        const lead = await this.leadRepository.addTag(tenantId, id, tag);
        if (!lead) return null;

        await this.logActivity(tenantId, {
            lead_id: id,
            type: 'tag_added',
            description: `Tag added: ${tag}`,
            metadata: { tag },
        });

        return lead.toJSON() as Lead;
    }

    async removeTag(tenantId: string, id: string, tag: string): Promise<Lead | null> {
        const lead = await this.leadRepository.removeTag(tenantId, id, tag);
        if (!lead) return null;

        await this.logActivity(tenantId, {
            lead_id: id,
            type: 'tag_removed',
            description: `Tag removed: ${tag}`,
            metadata: { tag },
        });

        return lead.toJSON() as Lead;
    }

    // ============================
    // ASSIGNMENT
    // ============================

    async assignLead(
        tenantId: string,
        id: string,
        assignedTo: string,
        assignedBy?: string
    ): Promise<Lead | null> {
        const lead = await this.leadRepository.update(tenantId, id, { assigned_to: assignedTo });
        if (!lead) return null;

        await this.logActivity(tenantId, {
            lead_id: id,
            type: 'assigned',
            description: `Assigned to ${assignedTo}`,
            metadata: { assigned_to: assignedTo },
            performed_by: assignedBy,
        });

        return lead.toJSON() as Lead;
    }

    // ============================
    // ACTIVITY LOGGING
    // ============================

    async logActivity(tenantId: string, data: CreateLeadActivityDTO): Promise<void> {
        await this.leadRepository.createActivity(tenantId, data);
    }

    async getActivities(tenantId: string, leadId: string, limit = 50) {
        return this.leadRepository.getActivities(tenantId, leadId, limit);
    }

    // ============================
    // STATISTICS
    // ============================

    async getStats(tenantId: string): Promise<LeadStats> {
        return this.leadRepository.getStats(tenantId);
    }

    // ============================
    // BULK OPERATIONS
    // ============================

    async bulkUpdateStatus(tenantId: string, ids: string[], status: LeadStatus): Promise<number> {
        return this.leadRepository.bulkUpdateStatus(tenantId, ids, status);
    }

    async bulkAssign(tenantId: string, ids: string[], assignedTo: string): Promise<number> {
        return this.leadRepository.bulkAssign(tenantId, ids, assignedTo);
    }

    async bulkAddTag(tenantId: string, ids: string[], tag: string): Promise<number> {
        return this.leadRepository.bulkAddTag(tenantId, ids, tag);
    }
}

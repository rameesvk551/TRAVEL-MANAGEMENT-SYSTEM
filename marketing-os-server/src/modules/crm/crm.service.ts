import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

import { SequelizeLeadRepository } from './SequelizeLeadRepository.js';

export class CRMService {
    constructor(private leadRepository?: SequelizeLeadRepository) { }

    // Lead CRUD
    async createLead(tenantId: string, data: any) {
        // Use repository if available for better abstraction
        if (this.leadRepository) {
            // Basic mapping, though repository expects Lead entity
            // For now staying with SQL to match existing style or mixed usage
        }

        const [result] = await sequelize.query(
            `INSERT INTO crm_leads (tenant_id, email, phone, first_name, last_name, company, title, source, status, score, tags, custom_fields, created_at, updated_at)
             VALUES (:tenantId, :email, :phone, :firstName, :lastName, :company, :title, :source, 'new', 0, :tags, :customFields, NOW(), NOW())
             RETURNING *`,
            {
                replacements: {
                    tenantId, email: data.email || null, phone: data.phone || null,
                    firstName: data.firstName || null, lastName: data.lastName || null,
                    company: data.company || null, title: data.title || null,
                    source: data.source || 'manual', tags: JSON.stringify(data.tags || []),
                    customFields: JSON.stringify(data.customFields || {}),
                },
                type: QueryTypes.SELECT,
            }
        );
        return result;
    }

    async bulkCreateLeads(tenantId: string, leads: any[]) {
        if (this.leadRepository) {
            return this.leadRepository.bulkCreate(tenantId, leads);
        }
        // Fallback or error if no repo
        throw new Error("LeadRepository not initialized in CRMService");
    }

    async getLeads(tenantId: string, filters: { status?: string; source?: string; search?: string; limit?: number; offset?: number }) {
        const conditions = ['tenant_id = :tenantId'];
        const replacements: any = { tenantId };
        if (filters.status) { conditions.push('status = :status'); replacements.status = filters.status; }
        if (filters.source) { conditions.push('source = :source'); replacements.source = filters.source; }
        if (filters.search) { conditions.push("(first_name ILIKE :search OR last_name ILIKE :search OR email ILIKE :search)"); replacements.search = `%${filters.search}%`; }

        const leads = await sequelize.query(
            `SELECT * FROM crm_leads WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT :limit OFFSET :offset`,
            { replacements: { ...replacements, limit: filters.limit || 50, offset: filters.offset || 0 }, type: QueryTypes.SELECT }
        );
        const [countResult] = await sequelize.query(
            `SELECT COUNT(*) as total FROM crm_leads WHERE ${conditions.join(' AND ')}`,
            { replacements, type: QueryTypes.SELECT }
        ) as any[];
        return { leads, total: parseInt(countResult?.total || '0', 10) };
    }

    async updateLead(tenantId: string, id: string, data: any) {
        await sequelize.query(
            `UPDATE crm_leads SET status = COALESCE(:status, status), score = COALESCE(:score, score),
             owner_id = COALESCE(:ownerId, owner_id), tags = COALESCE(:tags, tags),
             last_activity_at = NOW(), updated_at = NOW() WHERE id = :id AND tenant_id = :tenantId`,
            { replacements: { tenantId, id, status: data.status || null, score: data.score ?? null, ownerId: data.ownerId || null, tags: data.tags ? JSON.stringify(data.tags) : null }, type: QueryTypes.UPDATE }
        );
        const [lead] = await sequelize.query(`SELECT * FROM crm_leads WHERE id = :id`, { replacements: { id }, type: QueryTypes.SELECT });
        return lead;
    }

    // Lead Scoring
    async scoreLeads(tenantId: string): Promise<{ updated: number }> {
        // Simple scoring: +10 for email, +20 for activity, +5 per activity
        const [result] = await sequelize.query(
            `UPDATE crm_leads SET score = COALESCE(
                (SELECT COUNT(*) * 5 FROM crm_activities WHERE lead_id = crm_leads.id), 0
            ) + CASE WHEN email IS NOT NULL THEN 10 ELSE 0 END
              + CASE WHEN phone IS NOT NULL THEN 10 ELSE 0 END
            WHERE tenant_id = :tenantId RETURNING id`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];
        return { updated: Array.isArray(result) ? result.length : 0 };
    }

    // Pipeline stages
    async getPipelineStages(tenantId: string) {
        return sequelize.query(`SELECT * FROM crm_pipeline_stages WHERE tenant_id = :tenantId ORDER BY position`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    async createPipelineStage(tenantId: string, data: { name: string; color?: string; isWon?: boolean; isLost?: boolean }) {
        const [maxPos] = await sequelize.query(`SELECT COALESCE(MAX(position), 0) + 1 as next_pos FROM crm_pipeline_stages WHERE tenant_id = :tenantId`, { replacements: { tenantId }, type: QueryTypes.SELECT }) as any[];
        const [stage] = await sequelize.query(
            `INSERT INTO crm_pipeline_stages (tenant_id, name, position, color, is_won, is_lost) VALUES (:tenantId, :name, :position, :color, :isWon, :isLost) RETURNING *`,
            { replacements: { tenantId, name: data.name, position: maxPos?.next_pos || 0, color: data.color || '#4F46E5', isWon: data.isWon || false, isLost: data.isLost || false }, type: QueryTypes.SELECT }
        );
        return stage;
    }

    // Deals
    async getDeals(tenantId: string, stageId?: string) {
        const conditions = ['d.tenant_id = :tenantId'];
        const replacements: any = { tenantId };
        if (stageId) { conditions.push('d.stage_id = :stageId'); replacements.stageId = stageId; }
        return sequelize.query(
            `SELECT d.*, l.first_name, l.last_name, l.email, s.name as stage_name, s.color as stage_color
             FROM crm_deals d LEFT JOIN crm_leads l ON d.lead_id = l.id LEFT JOIN crm_pipeline_stages s ON d.stage_id = s.id
             WHERE ${conditions.join(' AND ')} ORDER BY d.created_at DESC`,
            { replacements, type: QueryTypes.SELECT }
        );
    }

    async createDeal(tenantId: string, data: any) {
        const [deal] = await sequelize.query(
            `INSERT INTO crm_deals (tenant_id, lead_id, stage_id, title, value, currency, probability, expected_close_date, owner_id)
             VALUES (:tenantId, :leadId, :stageId, :title, :value, :currency, :probability, :expectedCloseDate, :ownerId) RETURNING *`,
            { replacements: { tenantId, leadId: data.leadId || null, stageId: data.stageId || null, title: data.title, value: data.value || 0, currency: data.currency || 'USD', probability: data.probability || 50, expectedCloseDate: data.expectedCloseDate || null, ownerId: data.ownerId || null }, type: QueryTypes.SELECT }
        );
        return deal;
    }

    async moveDeal(tenantId: string, dealId: string, stageId: string) {
        await sequelize.query(`UPDATE crm_deals SET stage_id = :stageId, updated_at = NOW() WHERE id = :dealId AND tenant_id = :tenantId`, { replacements: { tenantId, dealId, stageId }, type: QueryTypes.UPDATE });
        return { success: true };
    }

    // Tasks
    async getTasks(tenantId: string, filters: { status?: string; leadId?: string }) {
        const conditions = ['tenant_id = :tenantId'];
        const replacements: any = { tenantId };
        if (filters.status) { conditions.push('status = :status'); replacements.status = filters.status; }
        if (filters.leadId) { conditions.push('lead_id = :leadId'); replacements.leadId = filters.leadId; }
        return sequelize.query(`SELECT * FROM crm_tasks WHERE ${conditions.join(' AND ')} ORDER BY due_date ASC`, { replacements, type: QueryTypes.SELECT });
    }

    async createTask(tenantId: string, data: any) {
        const [task] = await sequelize.query(
            `INSERT INTO crm_tasks (tenant_id, lead_id, deal_id, title, description, type, due_date, assigned_to)
             VALUES (:tenantId, :leadId, :dealId, :title, :description, :type, :dueDate, :assignedTo) RETURNING *`,
            { replacements: { tenantId, leadId: data.leadId || null, dealId: data.dealId || null, title: data.title, description: data.description || null, type: data.type || 'follow_up', dueDate: data.dueDate || null, assignedTo: data.assignedTo || null }, type: QueryTypes.SELECT }
        );
        return task;
    }

    // Activity timeline
    async getActivities(tenantId: string, leadId: string) {
        return sequelize.query(
            `SELECT * FROM crm_activities WHERE tenant_id = :tenantId AND lead_id = :leadId ORDER BY created_at DESC LIMIT 100`,
            { replacements: { tenantId, leadId }, type: QueryTypes.SELECT }
        );
    }

    async logActivity(tenantId: string, data: { leadId: string; type: string; title: string; description?: string }) {
        const [activity] = await sequelize.query(
            `INSERT INTO crm_activities (tenant_id, lead_id, type, title, description) VALUES (:tenantId, :leadId, :type, :title, :description) RETURNING *`,
            { replacements: { tenantId, leadId: data.leadId, type: data.type, title: data.title, description: data.description || null }, type: QueryTypes.SELECT }
        );
        return activity;
    }

    // Dashboard stats
    async getDashboard(tenantId: string) {
        const [leadStats] = await sequelize.query(
            `SELECT status, COUNT(*) as count FROM crm_leads WHERE tenant_id = :tenantId GROUP BY status`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];
        const [dealStats] = await sequelize.query(
            `SELECT COUNT(*) as total_deals, COALESCE(SUM(value), 0) as pipeline_value FROM crm_deals WHERE tenant_id = :tenantId`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];
        const [taskStats] = await sequelize.query(
            `SELECT COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW()) as overdue,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending
             FROM crm_tasks WHERE tenant_id = :tenantId`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];
        return { leads: leadStats || [], deals: dealStats || {}, tasks: taskStats || {} };
    }
}

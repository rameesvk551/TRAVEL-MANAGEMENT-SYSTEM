/**
 * Lead repository — encapsulates all database queries for the lead module.
 */

import { Op, literal } from 'sequelize';
import { Lead, LeadActivity } from './lead.model.js';
import type {
    CreateLeadDTO,
    UpdateLeadDTO,
    LeadFilters,
    CreateLeadActivityDTO,
    LeadStatus,
} from './lead.types.js';

export class LeadRepository {
    // ============================
    // LEAD CRUD
    // ============================

    async findById(tenantId: string, id: string) {
        return Lead.findOne({
            where: { id, tenant_id: tenantId },
            include: [{ model: LeadActivity, as: 'activities', limit: 20, order: [['created_at', 'DESC']] }],
        });
    }

    async findByPhone(tenantId: string, phone: string) {
        return Lead.findOne({ where: { tenant_id: tenantId, phone } });
    }

    async findByEmail(tenantId: string, email: string) {
        return Lead.findOne({ where: { tenant_id: tenantId, email } });
    }

    async findByPhoneOrEmail(tenantId: string, phone?: string, email?: string) {
        const conditions: any[] = [];
        if (phone) conditions.push({ tenant_id: tenantId, phone });
        if (email) conditions.push({ tenant_id: tenantId, email });
        if (conditions.length === 0) return null;
        return Lead.findOne({ where: { [Op.or]: conditions } });
    }

    async findAll(tenantId: string, filters: LeadFilters = {}) {
        const where: any = { tenant_id: tenantId };

        if (filters.status) where.status = filters.status;
        if (filters.source) where.source = filters.source;
        if (filters.assigned_to) where.assigned_to = filters.assigned_to;
        if (filters.pipeline_stage_id) where.pipeline_stage_id = filters.pipeline_stage_id;
        if (filters.utm_source) where.utm_source = filters.utm_source;
        if (filters.utm_campaign) where.utm_campaign = filters.utm_campaign;
        if (filters.is_duplicate !== undefined) where.is_duplicate = filters.is_duplicate;

        if (filters.min_score !== undefined || filters.max_score !== undefined) {
            where.score = {};
            if (filters.min_score !== undefined) where.score[Op.gte] = filters.min_score;
            if (filters.max_score !== undefined) where.score[Op.lte] = filters.max_score;
        }

        if (filters.tags && filters.tags.length > 0) {
            where.tags = { [Op.overlap]: filters.tags };
        }

        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${filters.search}%` } },
                { phone: { [Op.iLike]: `%${filters.search}%` } },
                { email: { [Op.iLike]: `%${filters.search}%` } },
                { company: { [Op.iLike]: `%${filters.search}%` } },
            ];
        }

        if (filters.has_orders !== undefined) {
            where.total_orders = filters.has_orders ? { [Op.gt]: 0 } : 0;
        }

        if (filters.created_after) {
            where.created_at = { ...where.created_at, [Op.gte]: filters.created_after };
        }
        if (filters.created_before) {
            where.created_at = { ...where.created_at, [Op.lte]: filters.created_before };
        }

        return Lead.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        });
    }

    async create(tenantId: string, data: CreateLeadDTO) {
        return Lead.create({
            tenant_id: tenantId,
            phone: data.phone,
            name: data.name,
            email: data.email,
            source: data.source || 'whatsapp',
            status: 'new',
            tags: data.tags || [],
            collected_data: data.collected_data || {},
            interest_categories: data.interest_categories || [],
            notes: data.notes,
            first_contact_at: new Date(),
            last_message_at: new Date(),
            last_activity_at: new Date(),
            // New fields
            utm_source: data.utm_source,
            utm_medium: data.utm_medium,
            utm_campaign: data.utm_campaign,
            utm_term: data.utm_term,
            utm_content: data.utm_content,
            company: data.company,
            job_title: data.job_title,
            pipeline_stage_id: data.pipeline_stage_id,
            custom_fields: data.custom_fields || {},
        });
    }

    async update(tenantId: string, id: string, data: UpdateLeadDTO) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;

        // Merge collected_data
        if (data.collected_data) {
            data.collected_data = { ...(lead.collected_data || {}), ...data.collected_data };
        }
        // Merge custom_fields
        if (data.custom_fields) {
            data.custom_fields = { ...(lead.custom_fields || {}), ...data.custom_fields };
        }

        await lead.update({ ...data, last_activity_at: new Date() });
        return lead;
    }

    async delete(tenantId: string, id: string) {
        const count = await Lead.destroy({ where: { id, tenant_id: tenantId } });
        return count > 0;
    }

    async updateLastMessageAt(tenantId: string, phone: string) {
        const lead = await this.findByPhone(tenantId, phone);
        if (lead) {
            await lead.update({ last_message_at: new Date(), last_activity_at: new Date() });
            return lead;
        }
        return null;
    }

    async updateStatus(tenantId: string, id: string, status: LeadStatus) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;
        const updateData: any = { status, last_activity_at: new Date() };
        if (status === 'converted') updateData.converted_at = new Date();
        await lead.update(updateData);
        return lead;
    }

    async updateScore(tenantId: string, id: string, scoreDelta: number) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;
        const newScore = Math.max(0, Math.min(100, lead.score + scoreDelta));
        await lead.update({ score: newScore });
        return lead;
    }

    async incrementOrderStats(tenantId: string, phone: string, orderAmount: number) {
        const lead = await this.findByPhone(tenantId, phone);
        if (!lead) return null;
        await lead.update({
            total_orders: lead.total_orders + 1,
            total_spent: Number(lead.total_spent) + orderAmount,
            last_order_at: new Date(),
            last_activity_at: new Date(),
        });
        return lead;
    }

    async addTag(tenantId: string, id: string, tag: string) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;
        const tags = new Set(lead.tags);
        tags.add(tag);
        await lead.update({ tags: Array.from(tags), last_activity_at: new Date() });
        return lead;
    }

    async removeTag(tenantId: string, id: string, tag: string) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;
        const tags = lead.tags.filter(t => t !== tag);
        await lead.update({ tags });
        return lead;
    }

    async addInterestCategory(tenantId: string, id: string, category: string) {
        const lead = await Lead.findOne({ where: { id, tenant_id: tenantId } });
        if (!lead) return null;
        const categories = new Set(lead.interest_categories);
        categories.add(category);
        await lead.update({ interest_categories: Array.from(categories) });
        return lead;
    }

    // ============================
    // LEAD ACTIVITIES
    // ============================

    async createActivity(tenantId: string, data: CreateLeadActivityDTO) {
        return LeadActivity.create({ tenant_id: tenantId, ...data });
    }

    async getActivities(tenantId: string, leadId: string, limit = 50) {
        return LeadActivity.findAll({
            where: { tenant_id: tenantId, lead_id: leadId },
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    /**
     * Get unified timeline — all activities for a lead (messages, notes, calls, status changes).
     */
    async getTimeline(tenantId: string, leadId: string, limit = 100) {
        return LeadActivity.findAll({
            where: { tenant_id: tenantId, lead_id: leadId },
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    // ============================
    // STATISTICS
    // ============================

    async getStats(tenantId: string) {
        const total = await Lead.count({ where: { tenant_id: tenantId } });

        const statusCounts = await Lead.findAll({
            where: { tenant_id: tenantId },
            attributes: ['status', [literal('COUNT(*)'), 'count']],
            group: ['status'], raw: true,
        }) as any[];

        const sourceCounts = await Lead.findAll({
            where: { tenant_id: tenantId },
            attributes: ['source', [literal('COUNT(*)'), 'count']],
            group: ['source'], raw: true,
        }) as any[];

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const newToday = await Lead.count({ where: { tenant_id: tenantId, created_at: { [Op.gte]: today } } });
        const newThisWeek = await Lead.count({ where: { tenant_id: tenantId, created_at: { [Op.gte]: startOfWeek } } });
        const convertedThisMonth = await Lead.count({
            where: { tenant_id: tenantId, status: 'converted', converted_at: { [Op.gte]: startOfMonth } },
        });
        const avgScore = await Lead.findOne({
            where: { tenant_id: tenantId },
            attributes: [[literal('AVG(score)'), 'avg']],
            raw: true,
        }) as any;

        return {
            total,
            by_status: Object.fromEntries(statusCounts.map(s => [s.status, parseInt(s.count)])),
            by_source: Object.fromEntries(sourceCounts.map(s => [s.source, parseInt(s.count)])),
            new_today: newToday,
            new_this_week: newThisWeek,
            converted_this_month: convertedThisMonth,
            average_score: Math.round(parseFloat(avgScore?.avg || '0')),
        };
    }

    // ============================
    // BULK OPERATIONS
    // ============================

    async bulkUpdateStatus(tenantId: string, ids: string[], status: LeadStatus) {
        const updateData: any = { status };
        if (status === 'converted') updateData.converted_at = new Date();
        const [count] = await Lead.update(updateData, { where: { tenant_id: tenantId, id: { [Op.in]: ids } } });
        return count;
    }

    async bulkAssign(tenantId: string, ids: string[], assignedTo: string) {
        const [count] = await Lead.update({ assigned_to: assignedTo }, { where: { tenant_id: tenantId, id: { [Op.in]: ids } } });
        return count;
    }

    async bulkAddTag(tenantId: string, ids: string[], tag: string) {
        const leads = await Lead.findAll({ where: { tenant_id: tenantId, id: { [Op.in]: ids } } });
        for (const lead of leads) {
            const tags = new Set(lead.tags); tags.add(tag);
            await lead.update({ tags: Array.from(tags) });
        }
        return leads.length;
    }
}

/**
 * Lead Duplicate Detection Service — Finds and manages duplicate leads.
 */

import { Op } from 'sequelize';
import { Lead, LeadDuplicateRecord } from './lead.model.js';
import type { LeadDuplicateMatch } from './lead.types.js';

export interface DuplicateCheckResult {
    is_duplicate: boolean;
    matches: LeadDuplicateMatch[];
}

export class LeadDuplicateService {

    /**
     * Check if a lead's data matches any existing lead for the tenant.
     */
    async detectDuplicates(
        tenantId: string,
        data: { phone?: string; email?: string; name?: string; location?: string },
        excludeLeadId?: string
    ): Promise<DuplicateCheckResult> {
        const matches: LeadDuplicateMatch[] = [];
        const whereBase: any = { tenant_id: tenantId };
        if (excludeLeadId) whereBase.id = { [Op.ne]: excludeLeadId };

        // 1. Exact phone match
        if (data.phone) {
            const phoneLead = await Lead.findOne({ where: { ...whereBase, phone: data.phone } });
            if (phoneLead) {
                matches.push({
                    id: '', tenant_id: tenantId,
                    lead_id: '', duplicate_lead_id: phoneLead.id,
                    match_type: 'phone', match_score: 100,
                    status: 'pending', created_at: new Date(),
                });
            }
        }

        // 2. Exact email match
        if (data.email) {
            const emailLead = await Lead.findOne({ where: { ...whereBase, email: data.email } });
            if (emailLead && !matches.some(m => m.duplicate_lead_id === emailLead.id)) {
                matches.push({
                    id: '', tenant_id: tenantId,
                    lead_id: '', duplicate_lead_id: emailLead.id,
                    match_type: 'email', match_score: 90,
                    status: 'pending', created_at: new Date(),
                });
            }
        }

        // 3. Name + location fuzzy match
        if (data.name && data.location) {
            const nameLeads = await Lead.findAll({
                where: {
                    ...whereBase,
                    name: { [Op.iLike]: `%${data.name}%` },
                    location: { [Op.iLike]: `%${data.location}%` },
                },
                limit: 5,
            });
            for (const nl of nameLeads) {
                if (!matches.some(m => m.duplicate_lead_id === nl.id)) {
                    matches.push({
                        id: '', tenant_id: tenantId,
                        lead_id: '', duplicate_lead_id: nl.id,
                        match_type: 'name_location', match_score: 60,
                        status: 'pending', created_at: new Date(),
                    });
                }
            }
        }

        return { is_duplicate: matches.length > 0, matches };
    }

    /**
     * Record detected duplicates in the database.
     */
    async recordDuplicates(tenantId: string, leadId: string, matches: LeadDuplicateMatch[]): Promise<void> {
        for (const match of matches) {
            await LeadDuplicateRecord.create({
                tenant_id: tenantId,
                lead_id: leadId,
                duplicate_lead_id: match.duplicate_lead_id,
                match_type: match.match_type,
                match_score: match.match_score,
                status: 'pending',
            });
        }

        // Mark the lead as duplicate
        await Lead.update({ is_duplicate: true }, { where: { id: leadId, tenant_id: tenantId } });
    }

    /**
     * Get pending duplicate records for a tenant.
     */
    async getPendingDuplicates(tenantId: string): Promise<LeadDuplicateMatch[]> {
        const records = await LeadDuplicateRecord.findAll({
            where: { tenant_id: tenantId, status: 'pending' },
            order: [['match_score', 'DESC']],
            limit: 100,
        });
        return records.map(r => r.toJSON() as LeadDuplicateMatch);
    }

    /**
     * Dismiss a duplicate match.
     */
    async dismissDuplicate(tenantId: string, duplicateId: string, userId?: string): Promise<boolean> {
        const record = await LeadDuplicateRecord.findOne({ where: { id: duplicateId, tenant_id: tenantId } });
        if (!record) return false;
        await record.update({ status: 'dismissed', resolved_by: userId, resolved_at: new Date() });
        return true;
    }

    /**
     * Merge duplicate into primary lead, moving activities and deleting the duplicate.
     */
    async mergeDuplicates(
        tenantId: string,
        primaryLeadId: string,
        duplicateLeadId: string,
        userId?: string
    ): Promise<boolean> {
        const primary = await Lead.findOne({ where: { id: primaryLeadId, tenant_id: tenantId } });
        const duplicate = await Lead.findOne({ where: { id: duplicateLeadId, tenant_id: tenantId } });
        if (!primary || !duplicate) return false;

        // Merge data: fill in missing fields from duplicate
        const updates: any = {};
        if (!primary.name && duplicate.name) updates.name = duplicate.name;
        if (!primary.email && duplicate.email) updates.email = duplicate.email;
        if (!primary.location && duplicate.location) updates.location = duplicate.location;
        if (!primary.company && duplicate.company) updates.company = duplicate.company;

        // Merge tags
        const mergedTags = new Set([...(primary.tags || []), ...(duplicate.tags || [])]);
        updates.tags = Array.from(mergedTags);

        // Sum order stats
        updates.total_orders = primary.total_orders + duplicate.total_orders;
        updates.total_spent = Number(primary.total_spent) + Number(duplicate.total_spent);

        // Take higher score
        updates.score = Math.max(primary.score, duplicate.score);

        if (Object.keys(updates).length > 0) {
            await primary.update(updates);
        }

        // Move activities to primary lead
        const { LeadActivity } = await import('./lead.model.js');
        await LeadActivity.update(
            { lead_id: primaryLeadId },
            { where: { lead_id: duplicateLeadId, tenant_id: tenantId } }
        );

        // Update duplicate records
        await LeadDuplicateRecord.update(
            { status: 'merged', resolved_by: userId, resolved_at: new Date() },
            { where: { tenant_id: tenantId, lead_id: primaryLeadId, duplicate_lead_id: duplicateLeadId } }
        );

        // Delete the duplicate lead
        await Lead.destroy({ where: { id: duplicateLeadId, tenant_id: tenantId } });

        return true;
    }

    /**
     * Batch scan — find all potential duplicates across the tenant.
     */
    async batchScan(tenantId: string): Promise<number> {
        const leads = await Lead.findAll({
            where: { tenant_id: tenantId, is_duplicate: false },
            attributes: ['id', 'phone', 'email', 'name', 'location'],
            order: [['created_at', 'ASC']],
        });

        let duplicatesFound = 0;

        for (let i = 0; i < leads.length; i++) {
            const lead = leads[i];
            const result = await this.detectDuplicates(tenantId, {
                phone: lead.phone, email: lead.email || undefined,
                name: lead.name || undefined, location: lead.location || undefined,
            }, lead.id);

            if (result.is_duplicate) {
                await this.recordDuplicates(tenantId, lead.id, result.matches);
                duplicatesFound++;
            }
        }

        return duplicatesFound;
    }
}

import { Op } from 'sequelize';
import { ILeadRepository } from './interfaces/ILeadRepository.js';
import { Lead } from '../campaigns/models/entities/Lead.js';
import db from '../../db/sqlmodels/db.LeadModel.js';

export class SequelizeLeadRepository implements ILeadRepository {
    async findById(id: string, tenantId: string): Promise<Lead | null> {
        const model = await db.LeadModel.findOne({
            where: { id, tenantId }
        });
        return model ? model.toEntity() : null;
    }


    async findAll(tenantId: string, options?: any): Promise<{ leads: Lead[], total: number }> {
        const { limit, offset, search, source, status, ids } = options || {};

        const where: any = { tenantId };

        if (ids && ids.length > 0) {
            where.id = { [Op.in]: ids };
        }

        if (status) where.status = status;
        if (source) where.source = source;
        if (search) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { phone: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (options.tags && options.tags.length > 0) {
            // Filter leads that have at least one of the provided tags
            // WHERE tags ?| array['tag1', 'tag2']
            // Sequelize Op.contains works for checking if array contains value
            // To check ANY, we use OR of contains, or raw query.
            // Using OR of contains:
            const tagConditions = options.tags.map((tag: string) => ({
                tags: { [Op.contains]: [tag] }
            }));

            // If we already have Op.or (from search), we need to combine them with AND
            if (where[Op.or]) {
                where[Op.and] = [
                    { [Op.or]: where[Op.or] }, // search conditions
                    { [Op.or]: tagConditions } // tag conditions
                ];
                delete where[Op.or];
            } else {
                where[Op.or] = tagConditions;
            }
        }

        const { rows, count } = await db.LeadModel.findAndCountAll({
            where,
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            order: [['createdAt', 'DESC']]
        });

        return {
            leads: rows.map(r => r.toEntity()),
            total: count
        };
    }

    async save(lead: Lead): Promise<Lead> {
        // Just a basic implementation to satisfy interface
        // Real implementation would upsert
        return lead;
    }

    // Additional methods for bulk operations
    async bulkCreate(tenantId: string, leads: Partial<db.LeadAttributes>[]): Promise<Lead[]> {
        const leadsData = leads.map(l => ({
            ...l,
            tenantId,
            source: l.source || 'import'
        })) as any[]; // Cast to any to bypass strict Optional check for now

        const created = await db.LeadModel.bulkCreate(leadsData, {
            ignoreDuplicates: true
        });
        return created.map(c => c.toEntity());
    }
}

import { Contact as ContactEntity } from '../../domain/entities/Contact.js';
import { IContactRepository, ContactFilters } from '../../domain/interfaces/IContactRepository.js';
import { Contact as ContactModel } from '../database/sequelize/models/Contact.js';
import { Op } from 'sequelize';

export class ContactRepository implements IContactRepository {
    private toEntity(model: ContactModel): ContactEntity {
        return ContactEntity.fromPersistence({
            id: model.id,
            tenantId: model.tenant_id,
            email: model.email,
            phone: model.phone,
            whatsapp: model.whatsapp,
            firstName: model.first_name,
            lastName: model.last_name,
            tags: model.tags || [],
            travelHistory: model.travel_history || {},
            preferences: model.preferences || {},
            marketingConsent: model.marketing_consent,
            socialHandles: model.social_handles || {},
            createdAt: model.created_at,
            updatedAt: model.updated_at,
        });
    }

    async save(contact: ContactEntity): Promise<ContactEntity> {
        const [model] = await ContactModel.upsert({
            id: contact.id,
            tenant_id: contact.tenantId,
            email: contact.email,
            phone: contact.phone,
            whatsapp: contact.whatsapp,
            first_name: contact.firstName,
            last_name: contact.lastName,
            tags: contact.tags,
            travel_history: contact.travelHistory,
            preferences: contact.preferences,
            marketing_consent: contact.marketingConsent,
            social_handles: contact.socialHandles,
        });
        return this.toEntity(model);
    }

    async findById(id: string, tenantId: string): Promise<ContactEntity | null> {
        const model = await ContactModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return model ? this.toEntity(model) : null;
    }

    async findByEmail(email: string, tenantId: string): Promise<ContactEntity | null> {
        const model = await ContactModel.findOne({
            where: { email, tenant_id: tenantId }
        });
        return model ? this.toEntity(model) : null;
    }

    async findByPhone(phone: string, tenantId: string): Promise<ContactEntity | null> {
        const model = await ContactModel.findOne({
            where: { phone, tenant_id: tenantId }
        });
        return model ? this.toEntity(model) : null;
    }

    async findAll(tenantId: string, filters: ContactFilters): Promise<{ contacts: ContactEntity[]; total: number }> {
        const where: any = { tenant_id: tenantId };

        if (filters.search) {
            where[Op.or] = [
                { first_name: { [Op.iLike]: `%${filters.search}%` } },
                { last_name: { [Op.iLike]: `%${filters.search}%` } },
                { email: { [Op.iLike]: `%${filters.search}%` } },
                { phone: { [Op.iLike]: `%${filters.search}%` } }
            ];
        }

        if (filters.tags && filters.tags.length > 0) {
            where.tags = { [Op.contains]: filters.tags };
        }

        const { count, rows } = await ContactModel.findAndCountAll({
            where,
            limit: filters.limit || 20,
            offset: filters.offset || 0,
            order: [['created_at', 'DESC']]
        });

        return {
            contacts: rows.map(r => this.toEntity(r)),
            total: count
        };
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await ContactModel.destroy({
            where: { id, tenant_id: tenantId }
        });
    }
}

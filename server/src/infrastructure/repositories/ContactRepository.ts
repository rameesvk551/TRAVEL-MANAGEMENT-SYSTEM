import { query } from '../database/index.js';
import { Contact } from '../../domain/entities/Contact.js';
import { IContactRepository, ContactFilters } from '../../domain/interfaces/IContactRepository.js';

interface ContactRow {
    id: string;
    tenant_id: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    first_name: string;
    last_name?: string;
    tags: string[];
    travel_history: Record<string, unknown>;
    preferences: Record<string, unknown>;
    marketing_consent: boolean;
    social_handles: Record<string, string>;
    created_at: Date;
    updated_at: Date;
}

function toEntity(row: ContactRow): Contact {
    return Contact.fromPersistence({
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        phone: row.phone,
        whatsapp: row.whatsapp,
        firstName: row.first_name,
        lastName: row.last_name,
        tags: row.tags,
        travelHistory: row.travel_history,
        preferences: row.preferences,
        marketingConsent: row.marketing_consent,
        socialHandles: row.social_handles,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export class ContactRepository implements IContactRepository {
    async save(contact: Contact): Promise<Contact> {
        const sql = `
            INSERT INTO contacts (
                id, tenant_id, email, phone, whatsapp, first_name, last_name,
                tags, travel_history, preferences, marketing_consent, social_handles,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12,
                $13, $14
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                phone = EXCLUDED.phone,
                whatsapp = EXCLUDED.whatsapp,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                tags = EXCLUDED.tags,
                travel_history = EXCLUDED.travel_history,
                preferences = EXCLUDED.preferences,
                marketing_consent = EXCLUDED.marketing_consent,
                social_handles = EXCLUDED.social_handles,
                updated_at = NOW()
            RETURNING *
        `;

        const params = [
            contact.id, contact.tenantId, contact.email, contact.phone, contact.whatsapp,
            contact.firstName, contact.lastName,
            contact.tags, contact.travelHistory, contact.preferences,
            contact.marketingConsent, contact.socialHandles,
            contact.createdAt, new Date() // updated_at
        ];

        const result = await query<ContactRow>(sql, params);
        return toEntity(result.rows[0]);
    }

    async findById(id: string, tenantId: string): Promise<Contact | null> {
        const result = await query<ContactRow>(
            'SELECT * FROM contacts WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByEmail(email: string, tenantId: string): Promise<Contact | null> {
        const result = await query<ContactRow>(
            'SELECT * FROM contacts WHERE email = $1 AND tenant_id = $2',
            [email, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findByPhone(phone: string, tenantId: string): Promise<Contact | null> {
        const result = await query<ContactRow>(
            'SELECT * FROM contacts WHERE phone = $1 AND tenant_id = $2',
            [phone, tenantId]
        );
        return result.rows[0] ? toEntity(result.rows[0]) : null;
    }

    async findAll(tenantId: string, filters: ContactFilters): Promise<{ contacts: Contact[]; total: number }> {
        let sql = 'SELECT * FROM contacts WHERE tenant_id = $1';
        const params: unknown[] = [tenantId];
        let paramIndex = 2;

        if (filters.search) {
            sql += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        if (filters.tags && filters.tags.length > 0) {
            sql += ` AND tags @> $${paramIndex++}::text[]`;
            params.push(filters.tags);
        }

        const countResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM (${sql}) as filtered_contacts`,
            params
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        sql += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(limit, offset);

        const result = await query<ContactRow>(sql, params);
        return {
            contacts: result.rows.map(toEntity),
            total
        };
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await query(
            'DELETE FROM contacts WHERE id = $1 AND tenant_id = $2',
            [id, tenantId]
        );
    }
}

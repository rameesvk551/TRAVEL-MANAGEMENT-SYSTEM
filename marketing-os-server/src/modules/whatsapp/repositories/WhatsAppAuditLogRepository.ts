import { Pool } from 'pg';

export interface WhatsAppAuditLogInput {
    tenantId: string;
    eventType: string;
    actorType?: 'USER' | 'SYSTEM' | 'WEBHOOK';
    actorId?: string;
    actorPhone?: string;
    entityType?: string;
    entityId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export function createWhatsAppAuditLogRepository(pool: Pool) {
    async function log(input: WhatsAppAuditLogInput): Promise<void> {
        await pool.query(
            `INSERT INTO whatsapp_audit_logs (
                tenant_id, event_type, actor_type, actor_id, actor_phone,
                entity_type, entity_id, payload, ip_address, user_agent
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
                input.tenantId, input.eventType, input.actorType || 'SYSTEM',
                input.actorId || null, input.actorPhone || null,
                input.entityType || null, input.entityId || null,
                JSON.stringify(input.payload || {}),
                input.ipAddress || null, input.userAgent || null,
            ],
        );
    }

    return { log };
}

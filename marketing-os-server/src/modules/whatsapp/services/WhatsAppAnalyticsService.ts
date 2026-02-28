// application/services/whatsapp/WhatsAppAnalyticsService.ts

import { Pool } from 'pg';

export function createWhatsAppAnalyticsService(pool: Pool) {

    async function getCampaignStats(tenantId: string, startDate?: Date, endDate?: Date) {
        let query = `
      SELECT 
        tmpl.id, tmpl.name, tmpl.category,
        COUNT(msg.id) as sent_count,
        COUNT(CASE WHEN msg.status = 'read' THEN 1 END) as read_count,
        COUNT(CASE WHEN msg.status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN msg.status = 'failed' THEN 1 END) as failed_count
      FROM whatsapp_templates tmpl
      LEFT JOIN whatsapp_messages msg ON msg.metadata->>'templateId' = tmpl.id::text
      WHERE tmpl.tenant_id = $1`;
        const params: any[] = [tenantId];

        if (startDate) { query += ` AND msg.created_at >= $${params.length + 1}`; params.push(startDate); }
        if (endDate) { query += ` AND msg.created_at <= $${params.length + 1}`; params.push(endDate); }
        query += ` GROUP BY tmpl.id, tmpl.name, tmpl.category`;

        const result = await pool.query(query, params);
        return result.rows.map(row => ({
            templateId: row.id, templateName: row.name, category: row.category,
            sent: parseInt(row.sent_count), delivered: parseInt(row.delivered_count),
            read: parseInt(row.read_count), failed: parseInt(row.failed_count),
            readRate: parseInt(row.sent_count) > 0 ? (parseInt(row.read_count) / parseInt(row.sent_count)) * 100 : 0,
        }));
    }

    async function getResponseTimeStats(tenantId: string) {
        return { avgResponseTimeMinutes: 15, resolutionRate: 85 };
    }

    return { getCampaignStats, getResponseTimeStats };
}

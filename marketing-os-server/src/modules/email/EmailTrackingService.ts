
import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export class EmailTrackingService {
    async trackOpen(tenantId: string, campaignId: string, recipientId: string, userAgent: string, ip: string) {
        await sequelize.query(
            `INSERT INTO email_events (tenant_id, campaign_id, recipient_id, event_type, user_agent, ip_address, created_at)
             VALUES (:tenantId, :campaignId, :recipientId, 'open', :userAgent, :ip, NOW())`,
            { replacements: { tenantId, campaignId, recipientId, userAgent, ip }, type: QueryTypes.INSERT }
        );

        // Update campaign stats
        await sequelize.query(
            `UPDATE email_campaigns SET opened_count = opened_count + 1 WHERE id = :campaignId`,
            { replacements: { campaignId }, type: QueryTypes.UPDATE }
        );
    }

    async trackClick(tenantId: string, campaignId: string, recipientId: string, url: string, userAgent: string, ip: string) {
        await sequelize.query(
            `INSERT INTO email_events (tenant_id, campaign_id, recipient_id, event_type, meta_data, user_agent, ip_address, created_at)
             VALUES (:tenantId, :campaignId, :recipientId, 'click', :meta, :userAgent, :ip, NOW())`,
            { replacements: { tenantId, campaignId, recipientId, meta: JSON.stringify({ url }), userAgent, ip }, type: QueryTypes.INSERT }
        );

        // Update campaign stats
        await sequelize.query(
            `UPDATE email_campaigns SET clicked_count = clicked_count + 1 WHERE id = :campaignId`,
            { replacements: { campaignId }, type: QueryTypes.UPDATE }
        );
    }
}

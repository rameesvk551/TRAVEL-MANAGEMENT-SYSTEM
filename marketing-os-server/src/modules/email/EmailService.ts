import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';
import { sendEmail } from './mailer.js';
import ejs from 'ejs';

export class EmailService {
    // Campaign CRUD
    async createCampaign(tenantId: string, data: any) {
        const [campaign] = await sequelize.query(
            `INSERT INTO email_campaigns (tenant_id, name, subject, from_name, from_email, segment_id, template_id, status)
             VALUES (:tenantId, :name, :subject, :fromName, :fromEmail, :segmentId, :templateId, 'draft') RETURNING *`,
            {
                replacements: {
                    tenantId,
                    name: data.name,
                    subject: data.subject || '',
                    fromName: data.fromName || '',
                    fromEmail: data.fromEmail || '',
                    segmentId: data.segmentId || null,
                    templateId: data.templateId || null
                },
                type: QueryTypes.SELECT
            }
        );
        return campaign;
    }

    async getCampaigns(tenantId: string) {
        return sequelize.query(`SELECT * FROM email_campaigns WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    async getCampaignStats(tenantId: string, campaignId: string) {
        const [stats] = await sequelize.query(
            `SELECT event_type, COUNT(*) as count FROM email_events WHERE tenant_id = :tenantId AND campaign_id = :campaignId GROUP BY event_type`,
            { replacements: { tenantId, campaignId }, type: QueryTypes.SELECT }
        ) as any[];
        return stats || [];
    }

    // Sending Logic
    async sendCampaign(tenantId: string, campaignId: string) {
        // 1. Get Campaign Details
        const [campaign] = await sequelize.query(
            `SELECT * FROM email_campaigns WHERE id = :campaignId AND tenant_id = :tenantId`,
            { replacements: { campaignId, tenantId }, type: QueryTypes.SELECT }
        ) as any[];

        if (!campaign) throw new Error('Campaign not found');
        if (campaign.status === 'sent') throw new Error('Campaign already sent');

        // 2. Get Template
        let htmlContent = '';
        if (campaign.template_id) {
            const [template] = await sequelize.query(
                `SELECT html_content FROM email_templates WHERE id = :templateId`,
                { replacements: { templateId: campaign.template_id }, type: QueryTypes.SELECT }
            ) as any[];
            htmlContent = template?.html_content || '';
        } else {
            // Fallback if no template ID, maybe content is stored directly (future expansion)
            // For now, require template
            if (!htmlContent) throw new Error('Campaign has no template or content');
        }

        // 3. Get Recipients (Mocking logic for now - normally would fetch from Segment)
        // In a real scenario, we'd query the CRM/Growth module for contacts in the segment.
        // For this MVP, we will just send to a hardcoded test list or user provided list if testing.
        // Let's assume we fetch contacts.
        const recipients = [
            { email: 'user1@example.com', name: 'User One' }, // Replace with real DB query
            { email: 'user2@example.com', name: 'User Two' }
        ];

        // 4. Send Emails
        let sentCount = 0;
        for (const recipient of recipients) {
            try {
                // Render Template with EJS
                const renderedHtml = ejs.render(htmlContent, {
                    name: recipient.name,
                    email: recipient.email,
                    ...campaign // Pass campaign details too
                });

                // Send
                await sendEmail(recipient.email, campaign.subject, renderedHtml);
                sentCount++;

                // Log Event (Sent)
                await sequelize.query(
                    `INSERT INTO email_events (tenant_id, campaign_id, recipient_email, event_type) VALUES (:tenantId, :campaignId, :email, 'sent')`,
                    { replacements: { tenantId, campaignId, email: recipient.email }, type: QueryTypes.INSERT }
                );

            } catch (error) {
                console.error(`Failed to send to ${recipient.email}:`, error);
                // Log Bounce/Fail?
                await sequelize.query(
                    `INSERT INTO email_events (tenant_id, campaign_id, recipient_email, event_type, metadata) VALUES (:tenantId, :campaignId, :email, 'bounced', :error)`,
                    { replacements: { tenantId, campaignId, email: recipient.email, error: JSON.stringify({ error: String(error) }) }, type: QueryTypes.INSERT }
                );
            }
        }

        // 5. Update Campaign Status
        await sequelize.query(
            `UPDATE email_campaigns SET status = 'sent', sent_at = NOW(), sent_count = :sentCount WHERE id = :campaignId`,
            { replacements: { sentCount, campaignId }, type: QueryTypes.UPDATE }
        );

        return { success: true, sentCount };
    }


    // Template CRUD
    async createTemplate(tenantId: string, data: any) {
        const [template] = await sequelize.query(
            `INSERT INTO email_templates (tenant_id, name, subject, html_content, text_content, category)
             VALUES (:tenantId, :name, :subject, :htmlContent, :textContent, :category) RETURNING *`,
            { replacements: { tenantId, name: data.name, subject: data.subject || '', htmlContent: data.htmlContent || '', textContent: data.textContent || '', category: data.category || 'promotional' }, type: QueryTypes.SELECT }
        );
        return template;
    }

    async getTemplates(tenantId: string) {
        return sequelize.query(`SELECT * FROM email_templates WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    async getTemplate(tenantId: string, id: string) {
        const [template] = await sequelize.query(`SELECT * FROM email_templates WHERE id = :id AND tenant_id = :tenantId`, { replacements: { id, tenantId }, type: QueryTypes.SELECT });
        return template;
    }

    async updateTemplate(tenantId: string, id: string, data: any) {
        // Build dynamic update query
        const fields = [];
        const replacements: any = { id, tenantId };

        if (data.name) { fields.push('name = :name'); replacements.name = data.name; }
        if (data.subject) { fields.push('subject = :subject'); replacements.subject = data.subject; }
        if (data.htmlContent) { fields.push('html_content = :htmlContent'); replacements.htmlContent = data.htmlContent; }
        if (data.category) { fields.push('category = :category'); replacements.category = data.category; }

        fields.push('updated_at = NOW()');

        if (fields.length === 1) return this.getTemplate(tenantId, id); // No changes

        const [updated] = await sequelize.query(
            `UPDATE email_templates SET ${fields.join(', ')} WHERE id = :id AND tenant_id = :tenantId RETURNING *`,
            { replacements, type: QueryTypes.SELECT }
        );
        return updated;
    }

    async deleteTemplate(tenantId: string, id: string) {
        await sequelize.query(`DELETE FROM email_templates WHERE id = :id AND tenant_id = :tenantId`, { replacements: { id, tenantId }, type: QueryTypes.DELETE });
        return { success: true };
    }

    // Drip sequences
    async createDripSequence(tenantId: string, data: any) {
        const [drip] = await sequelize.query(
            `INSERT INTO drip_sequences (tenant_id, name, trigger_type, steps, is_active)
             VALUES (:tenantId, :name, :triggerType, :steps, :isActive) RETURNING *`,
            { replacements: { tenantId, name: data.name, triggerType: data.triggerType || 'signup', steps: JSON.stringify(data.steps || []), isActive: data.isActive ?? true }, type: QueryTypes.SELECT }
        );
        return drip;
    }

    async getDripSequences(tenantId: string) {
        return sequelize.query(`SELECT * FROM drip_sequences WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    // Analytics dashboard
    async getDashboard(tenantId: string, start: Date, end: Date) {
        const [overview] = await sequelize.query(
            `SELECT COUNT(*) as total_campaigns,
                    SUM(sent_count) as total_sent,
                    SUM(delivered_count) as total_delivered,
                    SUM(opened_count) as total_opened,
                    SUM(clicked_count) as total_clicked,
                    SUM(bounced_count) as total_bounced,
                    SUM(unsubscribed_count) as total_unsubscribed
             FROM email_campaigns WHERE tenant_id = :tenantId AND created_at BETWEEN :start AND :end`,
            { replacements: { tenantId, start, end }, type: QueryTypes.SELECT }
        ) as any[];

        const openRate = (overview?.total_delivered || 0) > 0 ? ((overview?.total_opened || 0) / overview.total_delivered) * 100 : 0;
        const clickRate = (overview?.total_opened || 0) > 0 ? ((overview?.total_clicked || 0) / overview.total_opened) * 100 : 0;

        return {
            ...overview,
            openRate: Math.round(openRate * 100) / 100,
            clickRate: Math.round(clickRate * 100) / 100,
        };
    }
}

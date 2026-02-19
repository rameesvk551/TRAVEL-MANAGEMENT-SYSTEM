import { EmailConnection } from '../../database/models/EmailConnection.js';
import { encrypt } from '../../shared/utils/encryption.js';
import { NodemailerProvider } from './NodemailerProvider.js';

export class EmailSettingsService {
    private emailProvider: NodemailerProvider;

    constructor() {
        this.emailProvider = new NodemailerProvider();
    }

    async getSettings(tenantId: string) {
        return await EmailConnection.findOne({ where: { workspaceId: tenantId } });
    }

    async saveSettings(tenantId: string, data: any) {
        let settings = await EmailConnection.findOne({ where: { workspaceId: tenantId } });

        const payload: any = {
            workspaceId: tenantId,
            provider: data.provider || 'smtp',
            fromEmail: data.fromEmail,
            fromName: data.fromName,
            smtpHost: data.smtpHost,
            smtpPort: data.smtpPort,
            username: data.username,
            dailyLimit: data.dailyLimit,
            rateLimitPerMinute: data.rateLimitPerMinute,
            status: 'connected', // Assume connected, verify later
        };

        if (data.password) {
            payload.encryptedPassword = encrypt(data.password);
        }

        if (settings) {
            await settings.update(payload);
        } else {
            settings = await EmailConnection.create(payload);
        }

        return settings;
    }

    async testConnection(tenantId: string): Promise<{ success: boolean; message: string }> {
        const settings = await EmailConnection.findOne({ where: { workspaceId: tenantId } });
        if (!settings) {
            throw new Error('No settings found');
        }

        try {
            const valid = await this.emailProvider.verifyConnection(settings);
            if (valid) {
                await settings.update({ status: 'connected' });
                return { success: true, message: 'Connection verified successfully.' };
            } else {
                await settings.update({ status: 'failed' });
                return { success: false, message: 'Connection verification failed.' };
            }
        } catch (error: any) {
            await settings.update({ status: 'failed' });
            return { success: false, message: error.message || 'Verification error' };
        }
    }
}

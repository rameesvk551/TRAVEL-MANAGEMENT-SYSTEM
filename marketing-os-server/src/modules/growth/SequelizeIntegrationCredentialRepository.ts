import { QueryTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export interface IntegrationCredentialRecord {
    platform: string;
    credentials: Record<string, string>;
    isActive: boolean;
}

export class SequelizeIntegrationCredentialRepository {
    async getByTenant(tenantId: string): Promise<IntegrationCredentialRecord[]> {
        const rows = await sequelize.query(
            `SELECT platform, credentials, is_active
             FROM growth_integration_credentials
             WHERE tenant_id = :tenantId`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];

        return rows.map((row) => ({
            platform: row.platform,
            credentials: row.credentials || {},
            isActive: row.is_active !== false,
        }));
    }

    async getByPlatform(tenantId: string, platform: string): Promise<IntegrationCredentialRecord | null> {
        const rows = await sequelize.query(
            `SELECT platform, credentials, is_active
             FROM growth_integration_credentials
             WHERE tenant_id = :tenantId AND platform = :platform
             LIMIT 1`,
            { replacements: { tenantId, platform }, type: QueryTypes.SELECT }
        ) as any[];

        const row = rows[0];
        if (!row) return null;

        return {
            platform: row.platform,
            credentials: row.credentials || {},
            isActive: row.is_active !== false,
        };
    }

    async upsert(
        tenantId: string,
        platform: string,
        credentials: Record<string, string>,
        isActive: boolean = true,
    ): Promise<void> {
        await sequelize.query(
            `INSERT INTO growth_integration_credentials (tenant_id, platform, credentials, is_active, created_at, updated_at)
             VALUES (:tenantId, :platform, :credentials, :isActive, NOW(), NOW())
             ON CONFLICT (tenant_id, platform)
             DO UPDATE SET
               credentials = EXCLUDED.credentials,
               is_active = EXCLUDED.is_active,
               updated_at = NOW()`,
            {
                replacements: {
                    tenantId,
                    platform,
                    credentials: JSON.stringify(credentials || {}),
                    isActive,
                },
                type: QueryTypes.INSERT,
            }
        );
    }
}


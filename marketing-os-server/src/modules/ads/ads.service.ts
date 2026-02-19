import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export class AdsService {
    // Unified ad campaigns
    async getCampaigns(tenantId: string, platform?: string) {
        const conditions = ['tenant_id = :tenantId'];
        const replacements: any = { tenantId };
        if (platform) { conditions.push('platform = :platform'); replacements.platform = platform; }
        return sequelize.query(
            `SELECT * FROM ad_campaigns_unified WHERE ${conditions.join(' AND ')} ORDER BY spend DESC`,
            { replacements, type: QueryTypes.SELECT }
        );
    }

    async syncCampaign(tenantId: string, data: any) {
        const [campaign] = await sequelize.query(
            `INSERT INTO ad_campaigns_unified (tenant_id, platform, external_id, name, status, objective, daily_budget, spend, impressions, clicks, conversions, ctr, cpc, roas, start_date, end_date, synced_at)
             VALUES (:tenantId, :platform, :externalId, :name, :status, :objective, :dailyBudget, :spend, :impressions, :clicks, :conversions, :ctr, :cpc, :roas, :startDate, :endDate, NOW())
             ON CONFLICT (id) DO UPDATE SET spend = EXCLUDED.spend, impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, conversions = EXCLUDED.conversions, synced_at = NOW()
             RETURNING *`,
            { replacements: { tenantId, platform: data.platform, externalId: data.externalId || null, name: data.name, status: data.status || 'active', objective: data.objective || null, dailyBudget: data.dailyBudget || 0, spend: data.spend || 0, impressions: data.impressions || 0, clicks: data.clicks || 0, conversions: data.conversions || 0, ctr: data.ctr || 0, cpc: data.cpc || 0, roas: data.roas || 0, startDate: data.startDate || null, endDate: data.endDate || null }, type: QueryTypes.SELECT }
        );
        return campaign;
    }

    // A/B Tests
    async createABTest(tenantId: string, data: any) {
        const [test] = await sequelize.query(
            `INSERT INTO ab_tests (tenant_id, name, type, variant_a, variant_b, started_at)
             VALUES (:tenantId, :name, :type, :variantA, :variantB, NOW()) RETURNING *`,
            { replacements: { tenantId, name: data.name, type: data.type || 'landing_page', variantA: JSON.stringify(data.variantA), variantB: JSON.stringify(data.variantB) }, type: QueryTypes.SELECT }
        );
        return test;
    }

    async getABTests(tenantId: string) {
        return sequelize.query(`SELECT * FROM ab_tests WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    async recordABResult(tenantId: string, testId: string, variant: 'A' | 'B', isConversion: boolean) {
        const visitorCol = variant === 'A' ? 'variant_a_visitors' : 'variant_b_visitors';
        const convCol = variant === 'A' ? 'variant_a_conversions' : 'variant_b_conversions';
        await sequelize.query(
            `UPDATE ab_tests SET ${visitorCol} = ${visitorCol} + 1${isConversion ? `, ${convCol} = ${convCol} + 1` : ''}, updated_at = NOW() WHERE id = :testId AND tenant_id = :tenantId`,
            { replacements: { tenantId, testId }, type: QueryTypes.UPDATE }
        );
        return { success: true };
    }

    // ── Budget monitoring ─────────────────────────────────────────────
    /**
     * Check each campaign's daily spend against its budget and flag overspenders.
     */
    async getBudgetAlerts(tenantId: string) {
        return sequelize.query(
            `SELECT id, name, platform, daily_budget, spend,
                    ROUND((spend / NULLIF(daily_budget, 0)) * 100, 1) AS spend_pct,
                    CASE
                        WHEN spend > daily_budget * 1.2 THEN 'over_budget'
                        WHEN spend > daily_budget * 0.9 THEN 'near_budget'
                        ELSE 'under_budget'
                    END AS budget_status
             FROM ad_campaigns_unified
             WHERE tenant_id = :tenantId AND daily_budget > 0
             ORDER BY spend_pct DESC`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        );
    }

    // ── Creative performance ─────────────────────────────────────────
    /**
     * Rank campaigns by CTR and CPC to identify top and underperforming creatives.
     */
    async getCreativePerformance(tenantId: string) {
        return sequelize.query(
            `SELECT id, name, platform, objective,
                    impressions, clicks, conversions,
                    ROUND(ctr::numeric, 2) AS ctr,
                    ROUND(cpc::numeric, 2) AS cpc,
                    ROUND(roas::numeric, 2) AS roas,
                    CASE
                        WHEN ctr > 3 AND roas > 2 THEN 'top_performer'
                        WHEN ctr > 1.5 THEN 'average'
                        ELSE 'underperformer'
                    END AS performance_tier
             FROM ad_campaigns_unified
             WHERE tenant_id = :tenantId AND impressions > 0
             ORDER BY roas DESC, ctr DESC`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        );
    }

    // Dashboard
    async getDashboard(tenantId: string) {
        const [totalSpend] = await sequelize.query(
            `SELECT SUM(spend) as total_spend, SUM(impressions) as total_impressions, SUM(clicks) as total_clicks, SUM(conversions) as total_conversions, AVG(roas) as avg_roas
             FROM ad_campaigns_unified WHERE tenant_id = :tenantId`,
            { replacements: { tenantId }, type: QueryTypes.SELECT }
        ) as any[];
        const [byPlatform, abTests, budgetAlerts, creativePerformance] = await Promise.all([
            sequelize.query(
                `SELECT platform, SUM(spend) as spend, SUM(clicks) as clicks, SUM(conversions) as conversions
                 FROM ad_campaigns_unified WHERE tenant_id = :tenantId GROUP BY platform ORDER BY spend DESC`,
                { replacements: { tenantId }, type: QueryTypes.SELECT }
            ),
            this.getABTests(tenantId),
            this.getBudgetAlerts(tenantId),
            this.getCreativePerformance(tenantId),
        ]);
        return { overview: totalSpend || {}, byPlatform, abTests, budgetAlerts, creativePerformance };
    }
}


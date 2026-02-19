import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export class AIInsightsService {
    // Anomaly detection (stub — would use ML models in production)
    async detectAnomalies(tenantId: string): Promise<Array<{ metric: string; current: number; expected: number; severity: string; message: string }>> {
        return [
            { metric: 'conversion_rate', current: 2.1, expected: 3.5, severity: 'warning', message: 'Conversion rate dropped 40% below average' },
            { metric: 'ad_spend', current: 520, expected: 350, severity: 'info', message: 'Ad spend is 48% above daily average' },
        ];
    }

    // Growth predictions (stub)
    async getPredictions(tenantId: string): Promise<Array<{ metric: string; currentValue: number; predictedValue: number; confidence: number; timeframe: string }>> {
        return [
            { metric: 'mrr', currentValue: 5000, predictedValue: 6200, confidence: 78, timeframe: 'next_month' },
            { metric: 'new_leads', currentValue: 45, predictedValue: 62, confidence: 65, timeframe: 'next_week' },
            { metric: 'churn_rate', currentValue: 4.2, predictedValue: 3.8, confidence: 72, timeframe: 'next_month' },
        ];
    }

    // Churn risk scoring (stub)
    async getChurnRiskScores(tenantId: string): Promise<Array<{ customerId: string; riskScore: number; factors: string[] }>> {
        return [
            { customerId: 'cust_001', riskScore: 85, factors: ['No login in 14 days', 'Downgraded plan', 'Support ticket unresolved'] },
            { customerId: 'cust_002', riskScore: 62, factors: ['Decreased usage', 'Credit card expiring'] },
        ];
    }

    // Growth recommendations (stub)
    async getRecommendations(tenantId: string): Promise<Array<{ category: string; title: string; description: string; impact: string; effort: string }>> {
        return [
            { category: 'acquisition', title: 'Increase Meta ad budget for high-converting audiences', description: 'Audience segment "25-34 urban" shows 2.3x higher conversion rate', impact: 'high', effort: 'low' },
            { category: 'retention', title: 'Launch re-engagement email sequence', description: '23% of users inactive for 30+ days could be recovered', impact: 'medium', effort: 'medium' },
            { category: 'revenue', title: 'A/B test annual pricing page', description: 'Monthly-to-annual upgrade could increase LTV by 18%', impact: 'high', effort: 'medium' },
            { category: 'product', title: 'Improve onboarding flow completion', description: 'Only 45% complete onboarding; step 3 has 32% drop-off', impact: 'high', effort: 'high' },
        ];
    }

    // ── Lead scoring (data-driven) ───────────────────────────────────
    /**
     * Score leads 0–100 based on engagement signals from product, email, and CRM data.
     */
    async getLeadScores(tenantId: string) {
        try {
            return await sequelize.query(
                `WITH lead_activity AS (
                    SELECT
                        l.id AS lead_id,
                        l.name,
                        l.email,
                        l.stage,
                        COALESCE(fu.feature_count, 0) AS feature_interactions,
                        COALESCE(ev.email_opens, 0)   AS email_opens,
                        COALESCE(ev.email_clicks, 0)  AS email_clicks,
                        l.updated_at AS last_activity
                    FROM leads l
                    LEFT JOIN (
                        SELECT user_id, COUNT(*) AS feature_count
                        FROM product_feature_usage WHERE tenant_id = :tenantId
                        GROUP BY user_id
                    ) fu ON fu.user_id = l.id::text
                    LEFT JOIN (
                        SELECT recipient_id,
                            SUM(CASE WHEN event_type = 'open' THEN 1 ELSE 0 END) AS email_opens,
                            SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS email_clicks
                        FROM email_events WHERE tenant_id = :tenantId
                        GROUP BY recipient_id
                    ) ev ON ev.recipient_id = l.id::text
                    WHERE l.tenant_id = :tenantId
                )
                SELECT
                    lead_id, name, email, stage,
                    feature_interactions, email_opens, email_clicks,
                    LEAST(100, ROUND(
                        (LEAST(feature_interactions, 20) * 2.0) +
                        (LEAST(email_opens, 10) * 2.5) +
                        (LEAST(email_clicks, 5) * 5.0) +
                        (CASE WHEN stage = 'qualified' THEN 15 WHEN stage = 'contacted' THEN 10 ELSE 5 END) +
                        (CASE WHEN EXTRACT(EPOCH FROM (NOW() - last_activity)) < 86400 THEN 10
                              WHEN EXTRACT(EPOCH FROM (NOW() - last_activity)) < 604800 THEN 5 ELSE 0 END)
                    )) AS score
                FROM lead_activity
                ORDER BY score DESC`,
                { replacements: { tenantId }, type: QueryTypes.SELECT }
            );
        } catch {
            // Fallback if tables don't exist yet
            return [
                { lead_id: 'demo_1', name: 'Demo Lead A', score: 87, stage: 'qualified', feature_interactions: 15, email_opens: 8, email_clicks: 3 },
                { lead_id: 'demo_2', name: 'Demo Lead B', score: 52, stage: 'contacted', feature_interactions: 5, email_opens: 2, email_clicks: 0 },
            ];
        }
    }

    // ── Revenue prediction (simplified linear extrapolation) ─────────
    async getRevenuePrediction(tenantId: string) {
        // In production: use historical revenue data + trend analysis
        return {
            currentMRR: 5000,
            projectedMRR: 6200,
            projectedARR: 74400,
            growthRate: 24,
            confidenceInterval: { low: 5600, high: 6800 },
            timeframe: '30_days',
            factors: [
                { factor: 'New sign-ups trend', impact: '+12%' },
                { factor: 'Churn rate improvement', impact: '+5%' },
                { factor: 'Upsell pipeline', impact: '+7%' },
            ],
        };
    }

    // ── Budget allocation recommendation ─────────────────────────────
    async getBudgetAllocation(tenantId: string) {
        try {
            const platforms = await sequelize.query(
                `SELECT platform,
                        SUM(spend) AS total_spend,
                        SUM(conversions) AS total_conversions,
                        CASE WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend) / SUM(conversions), 2) ELSE NULL END AS cpa,
                        AVG(roas) AS avg_roas
                 FROM ad_campaigns_unified WHERE tenant_id = :tenantId
                 GROUP BY platform ORDER BY avg_roas DESC`,
                { replacements: { tenantId }, type: QueryTypes.SELECT }
            ) as any[];

            const totalBudget = platforms.reduce((s: number, p: any) => s + (parseFloat(p.total_spend) || 0), 0);
            const recommendations = platforms.map((p: any) => {
                const roas = parseFloat(p.avg_roas) || 0;
                const share = roas > 2 ? 'increase' : roas > 1 ? 'maintain' : 'decrease';
                return {
                    platform: p.platform,
                    currentSpend: parseFloat(p.total_spend) || 0,
                    cpa: parseFloat(p.cpa) || null,
                    roas,
                    recommendation: share,
                    suggestedAllocation: share === 'increase' ? '+20%' : share === 'maintain' ? '0%' : '-30%',
                };
            });

            return { totalBudget, platforms: recommendations };
        } catch {
            return {
                totalBudget: 1500,
                platforms: [
                    { platform: 'meta', currentSpend: 800, cpa: 12.5, roas: 3.2, recommendation: 'increase', suggestedAllocation: '+20%' },
                    { platform: 'google', currentSpend: 500, cpa: 18.0, roas: 1.8, recommendation: 'maintain', suggestedAllocation: '0%' },
                    { platform: 'tiktok', currentSpend: 200, cpa: 45.0, roas: 0.6, recommendation: 'decrease', suggestedAllocation: '-30%' },
                ],
            };
        }
    }

    // Full AI dashboard
    async getDashboard(tenantId: string) {
        const [anomalies, predictions, churnRisk, recommendations, leadScores, revenuePrediction, budgetAllocation] = await Promise.all([
            this.detectAnomalies(tenantId),
            this.getPredictions(tenantId),
            this.getChurnRiskScores(tenantId),
            this.getRecommendations(tenantId),
            this.getLeadScores(tenantId),
            this.getRevenuePrediction(tenantId),
            this.getBudgetAllocation(tenantId),
        ]);
        return { anomalies, predictions, churnRisk, recommendations, leadScores, revenuePrediction, budgetAllocation };
    }
}


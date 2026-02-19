import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export class AlertService {
    // Alert rules CRUD
    async createRule(tenantId: string, data: any) {
        const [rule] = await sequelize.query(
            `INSERT INTO alert_rules (tenant_id, name, metric, condition, threshold, channel, recipients, cooldown_minutes)
             VALUES (:tenantId, :name, :metric, :condition, :threshold, :channel, :recipients, :cooldown) RETURNING *`,
            { replacements: { tenantId, name: data.name, metric: data.metric, condition: data.condition, threshold: data.threshold, channel: data.channel || 'email', recipients: JSON.stringify(data.recipients || []), cooldown: data.cooldownMinutes || 60 }, type: QueryTypes.SELECT }
        );
        return rule;
    }

    async getRules(tenantId: string) {
        return sequelize.query(`SELECT * FROM alert_rules WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    async updateRule(tenantId: string, ruleId: string, data: any) {
        await sequelize.query(
            `UPDATE alert_rules SET name = COALESCE(:name, name), threshold = COALESCE(:threshold, threshold),
             is_active = COALESCE(:isActive, is_active), updated_at = NOW() WHERE id = :ruleId AND tenant_id = :tenantId`,
            { replacements: { tenantId, ruleId, name: data.name || null, threshold: data.threshold ?? null, isActive: data.isActive ?? null }, type: QueryTypes.UPDATE }
        );
        return { success: true };
    }

    async deleteRule(tenantId: string, ruleId: string) {
        await sequelize.query(`DELETE FROM alert_rules WHERE id = :ruleId AND tenant_id = :tenantId`, { replacements: { tenantId, ruleId }, type: QueryTypes.DELETE });
        return { success: true };
    }

    // Alert history
    async getHistory(tenantId: string, limit = 50) {
        return sequelize.query(
            `SELECT ah.*, ar.name as rule_name FROM alert_history ah LEFT JOIN alert_rules ar ON ah.rule_id = ar.id
             WHERE ah.tenant_id = :tenantId ORDER BY ah.created_at DESC LIMIT :limit`,
            { replacements: { tenantId, limit }, type: QueryTypes.SELECT }
        );
    }

    // Scheduled reports
    async createReport(tenantId: string, data: any) {
        const [report] = await sequelize.query(
            `INSERT INTO scheduled_reports (tenant_id, name, report_type, schedule, recipients, config)
             VALUES (:tenantId, :name, :reportType, :schedule, :recipients, :config) RETURNING *`,
            { replacements: { tenantId, name: data.name, reportType: data.reportType, schedule: data.schedule, recipients: JSON.stringify(data.recipients || []), config: JSON.stringify(data.config || {}) }, type: QueryTypes.SELECT }
        );
        return report;
    }

    async getReports(tenantId: string) {
        return sequelize.query(`SELECT * FROM scheduled_reports WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    // Custom dashboards
    async createDashboard(tenantId: string, data: any) {
        const [dashboard] = await sequelize.query(
            `INSERT INTO custom_dashboards (tenant_id, name, description, layout, created_by)
             VALUES (:tenantId, :name, :description, :layout, :createdBy) RETURNING *`,
            { replacements: { tenantId, name: data.name, description: data.description || '', layout: JSON.stringify(data.layout || []), createdBy: data.createdBy || null }, type: QueryTypes.SELECT }
        );
        return dashboard;
    }

    async getDashboards(tenantId: string) {
        return sequelize.query(`SELECT * FROM custom_dashboards WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    // ── System health check ──────────────────────────────────────────
    async getSystemHealth() {
        const checks: Record<string, any> = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString(),
            services: {} as Record<string, string>,
        };

        // Database check
        try {
            await sequelize.query('SELECT 1');
            checks.services.database = 'healthy';
        } catch {
            checks.services.database = 'unhealthy';
        }

        // Redis check
        try {
            const redis = (await import('../../../infrastructure/redis/index.js')).getRedisClient();
            await redis.ping();
            checks.services.redis = 'healthy';
        } catch {
            checks.services.redis = 'unhealthy';
        }

        checks.status = Object.values(checks.services).every((s) => s === 'healthy') ? 'healthy' : 'degraded';
        return checks;
    }

    // ── KPI alert evaluation ─────────────────────────────────────────
    /**
     * Evaluate active alert rules against current KPI values.
     * Returns which rules would currently trigger.
     */
    async evaluateAlertRules(tenantId: string) {
        const rules = await this.getRules(tenantId) as any[];
        const activeRules = rules.filter((r: any) => r.is_active !== false);

        // In production these would query real metric sources
        const mockMetrics: Record<string, number> = {
            conversion_rate: 2.1,
            daily_spend: 520,
            mrr: 5000,
            churn_rate: 4.2,
            response_time: 1200,
        };

        const triggered = activeRules
            .map((rule: any) => {
                const current = mockMetrics[rule.metric];
                if (current === undefined) return null;
                const threshold = parseFloat(rule.threshold);
                let shouldFire = false;
                if (rule.condition === 'above' && current > threshold) shouldFire = true;
                if (rule.condition === 'below' && current < threshold) shouldFire = true;
                if (rule.condition === 'equals' && current === threshold) shouldFire = true;
                return shouldFire ? { ruleId: rule.id, ruleName: rule.name, metric: rule.metric, condition: rule.condition, threshold, currentValue: current, channel: rule.channel } : null;
            })
            .filter(Boolean);

        // Log triggered alerts to history
        for (const alert of triggered) {
            if (!alert) continue;
            await sequelize.query(
                `INSERT INTO alert_history (tenant_id, rule_id, metric_value, message, channel)
                 VALUES (:tenantId, :ruleId, :value, :message, :channel)`,
                { replacements: { tenantId, ruleId: alert.ruleId, value: alert.currentValue, message: `${alert.ruleName}: ${alert.metric} is ${alert.currentValue} (threshold: ${alert.threshold})`, channel: alert.channel }, type: QueryTypes.INSERT }
            );
        }

        return { evaluatedRules: activeRules.length, triggeredAlerts: triggered };
    }
}


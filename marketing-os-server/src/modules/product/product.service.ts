import { sequelize } from '../../config/database.js';
import { QueryTypes } from 'sequelize';

export class ProductAnalyticsService {
    // Feature usage tracking
    async trackFeatureUsage(tenantId: string, data: { userId: string; featureName: string; action?: string; sessionId?: string; durationSeconds?: number }) {
        const [result] = await sequelize.query(
            `INSERT INTO product_feature_usage (tenant_id, user_id, feature_name, action, session_id, duration_seconds)
             VALUES (:tenantId, :userId, :featureName, :action, :sessionId, :duration) RETURNING *`,
            { replacements: { tenantId, userId: data.userId, featureName: data.featureName, action: data.action || 'used', sessionId: data.sessionId || null, duration: data.durationSeconds || 0 }, type: QueryTypes.SELECT }
        );
        return result;
    }

    // Feature adoption metrics
    async getFeatureAdoption(tenantId: string, start: Date, end: Date) {
        return sequelize.query(
            `SELECT feature_name, COUNT(DISTINCT user_id) as unique_users, COUNT(*) as total_usage,
                    AVG(duration_seconds) as avg_duration
             FROM product_feature_usage WHERE tenant_id = :tenantId AND created_at BETWEEN :start AND :end
             GROUP BY feature_name ORDER BY unique_users DESC`,
            { replacements: { tenantId, start, end }, type: QueryTypes.SELECT }
        );
    }

    // Session analytics
    async getSessionStats(tenantId: string, start: Date, end: Date) {
        const [stats] = await sequelize.query(
            `SELECT COUNT(*) as total_sessions, COUNT(DISTINCT user_id) as unique_users,
                    AVG(duration_seconds) as avg_duration, AVG(pages_viewed) as avg_pages
             FROM product_sessions WHERE tenant_id = :tenantId AND session_start BETWEEN :start AND :end`,
            { replacements: { tenantId, start, end }, type: QueryTypes.SELECT }
        ) as any[];
        return stats || {};
    }

    // Retention cohorts
    async getCohorts(tenantId: string) {
        return sequelize.query(`SELECT * FROM product_cohorts WHERE tenant_id = :tenantId ORDER BY created_at DESC`, { replacements: { tenantId }, type: QueryTypes.SELECT });
    }

    // ── Engagement Score ──────────────────────────────────────────────
    /**
     * Compute an engagement score (0–100) for each user in the date range.
     * Weights: feature_diversity 30%, total_usage 25%, avg_duration 20%, recency 25%.
     */
    async getEngagementScores(tenantId: string, start: Date, end: Date) {
        return sequelize.query(
            `WITH user_stats AS (
                SELECT
                    user_id,
                    COUNT(DISTINCT feature_name) AS feature_diversity,
                    COUNT(*)                     AS total_usage,
                    COALESCE(AVG(duration_seconds), 0) AS avg_dur,
                    MAX(created_at)              AS last_active
                FROM product_feature_usage
                WHERE tenant_id = :tenantId AND created_at BETWEEN :start AND :end
                GROUP BY user_id
            ),
            maxes AS (
                SELECT
                    MAX(feature_diversity) AS max_fd,
                    MAX(total_usage)       AS max_tu,
                    MAX(avg_dur)           AS max_dur
                FROM user_stats
            )
            SELECT
                us.user_id,
                us.feature_diversity,
                us.total_usage,
                ROUND(us.avg_dur::numeric, 1) AS avg_duration,
                us.last_active,
                ROUND(
                    (CASE WHEN m.max_fd  > 0 THEN (us.feature_diversity::numeric / m.max_fd)  * 30 ELSE 0 END) +
                    (CASE WHEN m.max_tu  > 0 THEN (us.total_usage::numeric       / m.max_tu)  * 25 ELSE 0 END) +
                    (CASE WHEN m.max_dur > 0 THEN (us.avg_dur                    / m.max_dur) * 20 ELSE 0 END) +
                    (CASE WHEN EXTRACT(EPOCH FROM (NOW() - us.last_active)) < 86400 THEN 25
                          WHEN EXTRACT(EPOCH FROM (NOW() - us.last_active)) < 604800 THEN 15
                          ELSE 5 END)
                , 1) AS engagement_score
            FROM user_stats us CROSS JOIN maxes m
            ORDER BY engagement_score DESC`,
            { replacements: { tenantId, start, end }, type: QueryTypes.SELECT }
        );
    }

    // ── Session ingestion ────────────────────────────────────────────
    async startSession(tenantId: string, data: { userId: string; userAgent?: string; referrer?: string }) {
        const [session] = await sequelize.query(
            `INSERT INTO product_sessions (tenant_id, user_id, session_start, user_agent, referrer, pages_viewed, duration_seconds)
             VALUES (:tenantId, :userId, NOW(), :ua, :ref, 0, 0) RETURNING *`,
            { replacements: { tenantId, userId: data.userId, ua: data.userAgent || '', ref: data.referrer || '' }, type: QueryTypes.SELECT }
        );
        return session;
    }

    async endSession(tenantId: string, sessionId: string, pagesViewed: number) {
        await sequelize.query(
            `UPDATE product_sessions
             SET duration_seconds = EXTRACT(EPOCH FROM (NOW() - session_start))::int,
                 pages_viewed = :pages
             WHERE id = :sid AND tenant_id = :tenantId`,
            { replacements: { tenantId, sid: sessionId, pages: pagesViewed }, type: QueryTypes.UPDATE }
        );
    }

    // ── Retention cohort builder (weekly) ────────────────────────────
    async buildWeeklyRetentionCohorts(tenantId: string, weeksBack: number = 8) {
        return sequelize.query(
            `WITH first_seen AS (
                SELECT user_id, DATE_TRUNC('week', MIN(created_at)) AS cohort_week
                FROM product_feature_usage WHERE tenant_id = :tenantId
                GROUP BY user_id
            ),
            activity AS (
                SELECT user_id, DATE_TRUNC('week', created_at) AS active_week
                FROM product_feature_usage WHERE tenant_id = :tenantId
                GROUP BY user_id, DATE_TRUNC('week', created_at)
            )
            SELECT
                fs.cohort_week,
                (EXTRACT(EPOCH FROM (a.active_week - fs.cohort_week)) / 604800)::int AS week_offset,
                COUNT(DISTINCT a.user_id) AS retained_users,
                (SELECT COUNT(DISTINCT user_id) FROM first_seen WHERE cohort_week = fs.cohort_week) AS cohort_size
            FROM first_seen fs
            JOIN activity a ON a.user_id = fs.user_id
            WHERE fs.cohort_week >= NOW() - INTERVAL '1 week' * :weeks
            GROUP BY fs.cohort_week, week_offset
            ORDER BY fs.cohort_week, week_offset`,
            { replacements: { tenantId, weeks: weeksBack }, type: QueryTypes.SELECT }
        );
    }

    // Dashboard
    async getDashboard(tenantId: string, start: Date, end: Date) {
        const [featureAdoption, sessionStats, cohorts, engagementScores] = await Promise.all([
            this.getFeatureAdoption(tenantId, start, end),
            this.getSessionStats(tenantId, start, end),
            this.getCohorts(tenantId),
            this.getEngagementScores(tenantId, start, end),
        ]);
        return { featureAdoption, sessionStats, cohorts, engagementScores };
    }
}

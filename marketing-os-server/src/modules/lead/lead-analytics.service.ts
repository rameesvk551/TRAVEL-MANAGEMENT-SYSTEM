/**
 * Lead Analytics Service — Conversion funnel, agent performance, source analytics, trends.
 */

import { Op, literal, fn, col } from 'sequelize';
import { Lead, LeadActivity, LeadPipelineStage } from './lead.model.js';
import type {
    ConversionFunnel, AgentPerformance, SourceAnalytics, LeadTrend,
} from './lead.types.js';

export class LeadAnalyticsService {

    // ============================
    // CONVERSION FUNNEL
    // ============================

    async getConversionFunnel(tenantId: string, dateRange?: { start?: Date; end?: Date }): Promise<ConversionFunnel> {
        const where: any = { tenant_id: tenantId };
        if (dateRange?.start) where.created_at = { ...where.created_at, [Op.gte]: dateRange.start };
        if (dateRange?.end) where.created_at = { ...where.created_at, [Op.lte]: dateRange.end };

        const statusOrder = ['new', 'contacted', 'qualified', 'interested', 'negotiating', 'converted', 'lost'];
        const stages: ConversionFunnel['stages'] = [];

        const total = await Lead.count({ where });

        for (const status of statusOrder) {
            const count = await Lead.count({ where: { ...where, status } });
            stages.push({
                stage: status,
                count,
                conversion_rate: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0,
                avg_time_in_stage_hours: 0, // Simplified — full impl would track stage transition timestamps
            });
        }

        return { stages };
    }

    // ============================
    // AGENT PERFORMANCE
    // ============================

    async getAgentPerformance(tenantId: string, dateRange?: { start?: Date; end?: Date }): Promise<AgentPerformance> {
        const where: any = { tenant_id: tenantId };
        if (dateRange?.start) where.created_at = { ...where.created_at, [Op.gte]: dateRange.start };
        if (dateRange?.end) where.created_at = { ...where.created_at, [Op.lte]: dateRange.end };

        // Get all leads grouped by assigned agent
        const agentLeads = await Lead.findAll({
            where: { ...where, assigned_to: { [Op.ne]: null } },
            attributes: [
                'assigned_to',
                [fn('COUNT', col('id')), 'total'],
                [fn('SUM', literal("CASE WHEN status = 'converted' THEN 1 ELSE 0 END")), 'converted'],
            ],
            group: ['assigned_to'],
            raw: true,
        }) as any[];

        const agents: AgentPerformance['agents'] = [];

        for (const row of agentLeads) {
            const agentId = row.assigned_to;
            const totalLeads = parseInt(row.total) || 0;
            const convertedLeads = parseInt(row.converted) || 0;

            // Count activities by this agent
            const activityCount = await LeadActivity.count({
                where: { tenant_id: tenantId, performed_by: agentId },
            });

            agents.push({
                agent_id: agentId,
                leads_assigned: totalLeads,
                leads_converted: convertedLeads,
                conversion_rate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 100) / 100 : 0,
                avg_response_time_hours: 0, // Would require first-response tracking
                total_activities: activityCount,
            });
        }

        return { agents };
    }

    // ============================
    // SOURCE ANALYTICS
    // ============================

    async getSourceAnalytics(tenantId: string, dateRange?: { start?: Date; end?: Date }): Promise<SourceAnalytics> {
        const where: any = { tenant_id: tenantId };
        if (dateRange?.start) where.created_at = { ...where.created_at, [Op.gte]: dateRange.start };
        if (dateRange?.end) where.created_at = { ...where.created_at, [Op.lte]: dateRange.end };

        const sourceData = await Lead.findAll({
            where,
            attributes: [
                'source',
                [fn('COUNT', col('id')), 'count'],
                [fn('AVG', col('score')), 'avg_score'],
                [fn('SUM', col('total_spent')), 'total_revenue'],
                [fn('SUM', literal("CASE WHEN status = 'converted' THEN 1 ELSE 0 END")), 'converted'],
            ],
            group: ['source'],
            raw: true,
        }) as any[];

        const sources: SourceAnalytics['sources'] = sourceData.map(row => {
            const count = parseInt(row.count) || 0;
            const converted = parseInt(row.converted) || 0;
            return {
                source: row.source,
                lead_count: count,
                conversion_rate: count > 0 ? Math.round((converted / count) * 100 * 100) / 100 : 0,
                avg_score: Math.round(parseFloat(row.avg_score) || 0),
                total_revenue: parseFloat(row.total_revenue) || 0,
            };
        });

        return { sources };
    }

    // ============================
    // LEAD TREND
    // ============================

    async getLeadTrend(
        tenantId: string,
        dateRange?: { start?: Date; end?: Date },
        groupBy: 'day' | 'week' | 'month' = 'day'
    ): Promise<LeadTrend> {
        const start = dateRange?.start || new Date(Date.now() - 30 * 86400000);
        const end = dateRange?.end || new Date();

        let dateTrunc: string;
        switch (groupBy) {
            case 'week': dateTrunc = 'week'; break;
            case 'month': dateTrunc = 'month'; break;
            default: dateTrunc = 'day';
        }

        const results = await Lead.findAll({
            where: {
                tenant_id: tenantId,
                created_at: { [Op.between]: [start, end] },
            },
            attributes: [
                [fn('DATE_TRUNC', dateTrunc, col('created_at')), 'period'],
                [fn('COUNT', col('id')), 'total'],
                [fn('SUM', literal("CASE WHEN status = 'converted' THEN 1 ELSE 0 END")), 'converted'],
                [fn('SUM', literal("CASE WHEN status = 'lost' THEN 1 ELSE 0 END")), 'lost'],
            ],
            group: [literal(`DATE_TRUNC('${dateTrunc}', created_at)`)] as any,
            order: [[literal(`DATE_TRUNC('${dateTrunc}', created_at)`), 'ASC']],
            raw: true,
        }) as any[];

        return {
            data: results.map(row => ({
                period: row.period,
                new_leads: parseInt(row.total) || 0,
                converted: parseInt(row.converted) || 0,
                lost: parseInt(row.lost) || 0,
            })),
        };
    }

    // ============================
    // CAMPAIGN ROI (UTM)
    // ============================

    async getCampaignROI(tenantId: string): Promise<Array<{
        campaign: string; leads: number; converted: number; revenue: number; conversion_rate: number;
    }>> {
        const results = await Lead.findAll({
            where: { tenant_id: tenantId, utm_campaign: { [Op.ne]: null as any } },
            attributes: [
                'utm_campaign',
                [fn('COUNT', col('id')), 'leads'],
                [fn('SUM', literal("CASE WHEN status = 'converted' THEN 1 ELSE 0 END")), 'converted'],
                [fn('SUM', col('total_spent')), 'revenue'],
            ],
            group: ['utm_campaign'],
            raw: true,
        }) as any[];

        return results.map(row => {
            const leads = parseInt(row.leads) || 0;
            const converted = parseInt(row.converted) || 0;
            return {
                campaign: row.utm_campaign,
                leads,
                converted,
                revenue: parseFloat(row.revenue) || 0,
                conversion_rate: leads > 0 ? Math.round((converted / leads) * 100 * 100) / 100 : 0,
            };
        });
    }
}

import { IResourceRepository } from '../../domain/interfaces/IResourceRepository.js';
import { IBookingRepository } from '../../domain/interfaces/IBookingRepository.js';
import { ILeadRepository } from '../../domain/interfaces/ILeadRepository.js';
import { query } from '../../infrastructure/database/index.js';

export interface DashboardStats {
    totalResources: number;
    activeBookings: number;
    openLeads: number;
    revenueMTD: number;
    recentBookings: any[];
    pipelineStats: Record<string, number>;
    revenueOverTime: { name: string; amount: number }[];
    leadsBySource: { name: string; count: number }[];
    bookingsByResource: { name: string; count: number }[];
}

export class DashboardService {
    constructor(
        private resourceRepository: IResourceRepository,
        private bookingRepository: IBookingRepository,
        private leadRepository: ILeadRepository
    ) { }

    async getStats(tenantId: string): Promise<DashboardStats> {
        // 1. Get Core Counts
        const [resourceCount, bookingCount] = await Promise.all([
            this.resourceRepository.count(tenantId, { isActive: true }),
            this.bookingRepository.count(tenantId, { status: 'confirmed' }),
        ]);

        // 2. Calculate Revenue MTD (Month to Date)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const revenueResult = await query<{ sum: string }>(
            `SELECT SUM(total_amount) as sum FROM bookings 
             WHERE tenant_id = $1 AND status != 'cancelled' AND created_at >= $2`,
            [tenantId, startOfMonth]
        );

        // 3. Lead Pipeline Stats
        const openLeadsResult = await query<{ count: string }>(
            `SELECT COUNT(*) as count FROM leads 
             WHERE tenant_id = $1 AND stage_id NOT IN ('won', 'lost')`,
            [tenantId]
        );

        const pipelineStatsResult = await query<{ stage_id: string; count: string }>(
            `SELECT stage_id, COUNT(*) as count FROM leads 
             WHERE tenant_id = $1 
             GROUP BY stage_id`,
            [tenantId]
        );

        const pipelineStats: Record<string, number> = {};
        pipelineStatsResult.rows.forEach(row => {
            if (row.stage_id) pipelineStats[row.stage_id] = parseInt(row.count, 10);
        });

        // 4. Revenue Over Time (Last 6 months)
        const revenueOverTimeResult = await query<{ name: string; amount: string }>(
            `SELECT 
                TO_CHAR(created_at, 'Mon') as name,
                SUM(total_amount) as amount
             FROM bookings
             WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
             GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
             ORDER BY DATE_TRUNC('month', created_at) ASC`,
            [tenantId]
        );

        // 5. Leads by Source
        const leadsBySourceResult = await query<{ name: string; count: string }>(
            `SELECT source as name, COUNT(*) as count
             FROM leads
             WHERE tenant_id = $1
             GROUP BY source`,
            [tenantId]
        );

        // 6. Bookings by Resource Type
        const bookingsByResourceResult = await query<{ name: string; count: string }>(
            `SELECT r.type as name, COUNT(b.id) as count
             FROM bookings b
             JOIN resources r ON b.resource_id = r.id
             WHERE b.tenant_id = $1
             GROUP BY r.type`,
            [tenantId]
        );

        // 7. Get Recent Bookings
        const recentBookingsResult = await query<any>(
            `SELECT b.*, r.name as resource_name 
             FROM bookings b
             LEFT JOIN resources r ON b.resource_id = r.id
             WHERE b.tenant_id = $1 
             ORDER BY b.created_at DESC 
             LIMIT 5`,
            [tenantId]
        );

        return {
            totalResources: resourceCount,
            activeBookings: bookingCount,
            openLeads: parseInt(openLeadsResult.rows[0].count, 10),
            revenueMTD: parseFloat(revenueResult.rows[0].sum || '0'),
            recentBookings: recentBookingsResult.rows,
            pipelineStats,
            revenueOverTime: revenueOverTimeResult.rows.map(r => ({ name: r.name, amount: parseFloat(r.amount) })),
            leadsBySource: leadsBySourceResult.rows.map(r => ({ name: r.name, count: parseInt(r.count, 10) })),
            bookingsByResource: bookingsByResourceResult.rows.map(r => ({ name: r.name, count: parseInt(r.count, 10) }))
        };
    }
}

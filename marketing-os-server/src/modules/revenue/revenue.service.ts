import { Op, fn, col, literal } from 'sequelize';
import { SubscriptionModel } from '../../../infrastructure/revenue/models/SubscriptionModel.js';
import { TransactionModel } from '../../../infrastructure/revenue/models/TransactionModel.js';
import { RevenueSnapshotModel } from '../../../infrastructure/revenue/models/RevenueSnapshotModel.js';

export class RevenueService {
    // MRR = sum of monthly-equivalent amounts of all active subscriptions
    async getMRR(tenantId: string): Promise<number> {
        const subs = await SubscriptionModel.findAll({
            where: { tenantId, status: 'active' },
            raw: true,
        });
        return subs.reduce((total, s: any) => {
            let monthly = parseFloat(s.amount) || 0;
            if (s.billing_interval === 'yearly') monthly /= 12;
            if (s.billing_interval === 'quarterly') monthly /= 3;
            return total + monthly;
        }, 0);
    }

    // ARR = MRR * 12
    async getARR(tenantId: string): Promise<number> {
        const mrr = await this.getMRR(tenantId);
        return mrr * 12;
    }

    // ARPU = MRR / total active customers
    async getARPU(tenantId: string): Promise<number> {
        const mrr = await this.getMRR(tenantId);
        const count = await SubscriptionModel.count({ where: { tenantId, status: 'active' } });
        return count > 0 ? mrr / count : 0;
    }

    // LTV = ARPU * avg customer lifespan (estimate 24 months)
    async getLTV(tenantId: string): Promise<number> {
        const arpu = await this.getARPU(tenantId);
        return arpu * 24; // avg 24-month lifespan
    }

    // Churn rate
    async getChurnRate(tenantId: string, start: Date, end: Date): Promise<number> {
        const churned = await SubscriptionModel.count({
            where: {
                tenantId,
                status: 'cancelled',
                cancelledAt: { [Op.between]: [start, end] } as any,
            },
        });
        const total = await SubscriptionModel.count({
            where: {
                tenantId,
                createdAt: { [Op.lte]: end } as any,
            },
        });
        return total > 0 ? (churned / total) * 100 : 0;
    }

    // Trial to paid conversion
    async getTrialConversion(tenantId: string, start: Date, end: Date): Promise<{ converted: number; total: number; rate: number }> {
        const trialed = await SubscriptionModel.count({
            where: {
                tenantId,
                trialStart: { [Op.between]: [start, end] } as any,
            },
        });
        const converted = await SubscriptionModel.count({
            where: {
                tenantId,
                trialStart: { [Op.between]: [start, end] } as any,
                status: { [Op.in]: ['active', 'cancelled'] } as any,
                trialEnd: { [Op.ne]: null } as any,
            },
        });
        return { converted, total: trialed, rate: trialed > 0 ? (converted / trialed) * 100 : 0 };
    }

    // Revenue by channel
    async getRevenueByChannel(tenantId: string, start: Date, end: Date): Promise<Array<{ channel: string; total: number; count: number }>> {
        const results = await TransactionModel.findAll({
            attributes: [
                'channel',
                [fn('SUM', col('amount')), 'total'],
                [fn('COUNT', col('id')), 'count'],
            ],
            where: {
                tenantId,
                type: 'payment',
                status: 'completed',
                createdAt: { [Op.between]: [start, end] } as any,
            },
            group: ['channel'],
            order: [[literal('total'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            channel: r.channel || 'unknown',
            total: parseFloat(r.total) || 0,
            count: parseInt(r.count, 10),
        }));
    }

    // Revenue trend (monthly)
    async getRevenueTrend(tenantId: string, start: Date, end: Date): Promise<Array<{ date: string; revenue: number; refunds: number; net: number }>> {
        const snapshots = await RevenueSnapshotModel.findAll({
            where: {
                tenantId,
                snapshotDate: { [Op.between]: [start, end] } as any,
            },
            order: [['snapshotDate', 'ASC']],
            raw: true,
        });
        return snapshots.map((s: any) => ({
            date: s.snapshot_date,
            revenue: parseFloat(s.total_revenue) || 0,
            refunds: parseFloat(s.total_refunds) || 0,
            net: parseFloat(s.net_revenue) || 0,
        }));
    }

    // Refund monitoring
    async getRefundStats(tenantId: string, start: Date, end: Date): Promise<{ totalRefunds: number; refundCount: number; refundRate: number }> {
        const refundResult = await TransactionModel.findAll({
            attributes: [
                [fn('COUNT', col('id')), 'count'],
                [fn('SUM', col('amount')), 'total'],
            ],
            where: {
                tenantId,
                type: 'refund',
                createdAt: { [Op.between]: [start, end] } as any,
            },
            raw: true,
        });
        const paymentCount = await TransactionModel.count({
            where: {
                tenantId,
                type: 'payment',
                createdAt: { [Op.between]: [start, end] } as any,
            },
        });
        const refunds = (refundResult as any)[0];
        const refundCount = parseInt(refunds?.count || '0', 10);
        const totalRefunds = parseFloat(refunds?.total || '0');
        return {
            totalRefunds,
            refundCount,
            refundRate: paymentCount > 0 ? (refundCount / paymentCount) * 100 : 0,
        };
    }

    // Payment failure monitoring
    async getPaymentFailures(tenantId: string, start: Date, end: Date): Promise<{ failedCount: number; failedAmount: number; failureRate: number }> {
        const [failedResult, totalCount] = await Promise.all([
            TransactionModel.findAll({
                attributes: [
                    [fn('COUNT', col('id')), 'count'],
                    [fn('SUM', col('amount')), 'total'],
                ],
                where: {
                    tenantId,
                    type: 'payment',
                    status: 'failed',
                    createdAt: { [Op.between]: [start, end] } as any,
                },
                raw: true,
            }),
            TransactionModel.count({
                where: {
                    tenantId,
                    type: 'payment',
                    createdAt: { [Op.between]: [start, end] } as any,
                },
            }),
        ]);
        const failed = (failedResult as any)[0];
        const failedCount = parseInt(failed?.count || '0', 10);
        return {
            failedCount,
            failedAmount: parseFloat(failed?.total || '0'),
            failureRate: totalCount > 0 ? (failedCount / totalCount) * 100 : 0,
        };
    }

    // Revenue forecasting (12-month projection)
    async getRevenueForecast(tenantId: string, months: number = 12): Promise<Array<{ month: number; projectedMRR: number; projectedARR: number; confidence: number }>> {
        const currentMRR = await this.getMRR(tenantId);
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000);

        // Get historical churn for trend calculation
        const churnRate = await this.getChurnRate(tenantId, threeMonthsAgo, now);
        const monthlyChurnDecimal = churnRate / 100;

        // Estimate growth from recent new subscriptions
        const newSubsRecent = await SubscriptionModel.count({
            where: {
                tenantId,
                createdAt: { [Op.gte]: threeMonthsAgo } as any,
            },
        });
        const monthlyNewSubs = newSubsRecent / 3;
        const avgSubValue = currentMRR / (await SubscriptionModel.count({ where: { tenantId, status: 'active' } }) || 1);
        const monthlyGrowthRate = currentMRR > 0 ? (monthlyNewSubs * avgSubValue) / currentMRR : 0.05;

        const forecast = [];
        let projectedMRR = currentMRR;

        for (let m = 1; m <= months; m++) {
            projectedMRR = projectedMRR * (1 - monthlyChurnDecimal) + (projectedMRR * monthlyGrowthRate);
            const confidence = Math.max(40, 95 - (m * 4)); // Decreasing confidence
            forecast.push({
                month: m,
                projectedMRR: Math.round(projectedMRR * 100) / 100,
                projectedARR: Math.round(projectedMRR * 12 * 100) / 100,
                confidence,
            });
        }
        return forecast;
    }

    // Profit margin analytics
    async getProfitMargin(tenantId: string, start: Date, end: Date): Promise<{
        totalRevenue: number;
        totalCosts: number;
        grossProfit: number;
        grossMargin: number;
        adSpend: number;
        operatingMargin: number;
    }> {
        // Total revenue from completed payments
        const revResult = await TransactionModel.findAll({
            attributes: [[fn('SUM', col('amount')), 'total']],
            where: {
                tenantId,
                type: 'payment',
                status: 'completed',
                createdAt: { [Op.between]: [start, end] } as any,
            },
            raw: true,
        });
        const totalRevenue = parseFloat((revResult as any)[0]?.total || '0');

        // COGS / platform costs estimate (30% of revenue as default)
        const totalCosts = totalRevenue * 0.30;

        // Ad spend from revenue table
        const refundResult = await TransactionModel.findAll({
            attributes: [[fn('SUM', col('amount')), 'total']],
            where: {
                tenantId,
                type: 'refund',
                createdAt: { [Op.between]: [start, end] } as any,
            },
            raw: true,
        });
        const totalRefunds = parseFloat((refundResult as any)[0]?.total || '0');

        // Try to get ad spend from the ad_campaigns_unified table
        let adSpend = 0;
        try {
            const { QueryTypes: QT } = await import('sequelize');
            const { sequelize } = await import('../../config/database.js');
            const [spendResult] = await sequelize.query(
                `SELECT COALESCE(SUM(spend), 0) AS total FROM ad_campaigns_unified WHERE tenant_id = :tenantId`,
                { replacements: { tenantId }, type: QT.SELECT }
            ) as any[];
            adSpend = parseFloat(spendResult?.total || '0');
        } catch { /* table might not exist */ }

        const grossProfit = totalRevenue - totalCosts - totalRefunds;
        const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const operatingProfit = grossProfit - adSpend;
        const operatingMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalCosts: Math.round(totalCosts * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            grossMargin: Math.round(grossMargin * 100) / 100,
            adSpend: Math.round(adSpend * 100) / 100,
            operatingMargin: Math.round(operatingMargin * 100) / 100,
        };
    }

    // Full dashboard
    async getDashboard(tenantId: string, start: Date, end: Date) {
        const [mrr, arr, arpu, ltv, churnRate, trialConversion, revenueByChannel, refunds, failures, forecast, profitMargin] = await Promise.all([
            this.getMRR(tenantId),
            this.getARR(tenantId),
            this.getARPU(tenantId),
            this.getLTV(tenantId),
            this.getChurnRate(tenantId, start, end),
            this.getTrialConversion(tenantId, start, end),
            this.getRevenueByChannel(tenantId, start, end),
            this.getRefundStats(tenantId, start, end),
            this.getPaymentFailures(tenantId, start, end),
            this.getRevenueForecast(tenantId),
            this.getProfitMargin(tenantId, start, end),
        ]);

        const activeSubs = await SubscriptionModel.count({ where: { tenantId, status: 'active' } });
        const totalCustomers = await SubscriptionModel.count({
            distinct: true,
            col: 'customerId',
            where: { tenantId },
        });

        return {
            mrr: Math.round(mrr * 100) / 100,
            arr: Math.round(arr * 100) / 100,
            arpu: Math.round(arpu * 100) / 100,
            ltv: Math.round(ltv * 100) / 100,
            ltvCacRatio: 0, // requires CAC from growth module
            churnRate: Math.round(churnRate * 100) / 100,
            activeSubscriptions: activeSubs,
            totalCustomers,
            trialConversion,
            revenueByChannel,
            refunds,
            paymentFailures: failures,
            forecast,
            profitMargin,
        };
    }
}


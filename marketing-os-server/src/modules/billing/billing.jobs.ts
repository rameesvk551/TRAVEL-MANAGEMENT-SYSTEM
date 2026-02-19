import cron, { ScheduledTask } from 'node-cron';
import { BillingService } from './billing.service.js';

interface BillingJobsOptions {
    enabled: boolean;
    monthlyUsageCron: string;
    reconciliationEnabled: boolean;
    reconciliationCron: string;
}

export class BillingJobs {
    private usageTask: ScheduledTask | null = null;
    private reconciliationTask: ScheduledTask | null = null;

    constructor(
        private readonly billingService: BillingService,
        private readonly options: BillingJobsOptions,
    ) {}

    start() {
        if (!this.options.enabled) {
            console.log('[billing] Monthly usage billing cron is disabled.');
        } else {
            if (!cron.validate(this.options.monthlyUsageCron)) {
                throw new Error(`Invalid billing cron schedule: ${this.options.monthlyUsageCron}`);
            }

            this.usageTask = cron.schedule(
                this.options.monthlyUsageCron,
                async () => {
                    try {
                        const result = await this.billingService.runMonthlyUsageBilling(new Date());
                        console.log('[billing] Monthly usage billing job completed:', {
                            cycleStart: result.cycleStart,
                            cycleEnd: result.cycleEnd,
                            scanned: result.scanned,
                            generated: result.generated,
                            failedTenants: result.failedTenants.length,
                        });
                    } catch (error) {
                        console.error('[billing] Monthly usage billing job failed:', error);
                    }
                },
                { timezone: 'UTC' },
            );

            console.log(`[billing] Monthly usage billing cron started with schedule "${this.options.monthlyUsageCron}" (UTC).`);
        }

        if (!this.options.reconciliationEnabled) {
            console.log('[billing] Razorpay reconciliation cron is disabled.');
            return;
        }

        if (!cron.validate(this.options.reconciliationCron)) {
            throw new Error(`Invalid billing reconciliation cron schedule: ${this.options.reconciliationCron}`);
        }

        this.reconciliationTask = cron.schedule(
            this.options.reconciliationCron,
            async () => {
                try {
                    const result = await this.billingService.runRazorpayReconciliation();
                    console.log('[billing] Razorpay reconciliation job completed:', {
                        since: result.since,
                        scannedSubscriptions: result.scannedSubscriptions,
                        updatedSubscriptions: result.updatedSubscriptions,
                        scannedInvoices: result.scannedInvoices,
                        paidInvoices: result.paidInvoices,
                        failures: result.failures.length,
                    });
                } catch (error) {
                    console.error('[billing] Razorpay reconciliation job failed:', error);
                }
            },
            { timezone: 'UTC' },
        );

        console.log(
            `[billing] Razorpay reconciliation cron started with schedule "${this.options.reconciliationCron}" (UTC).`,
        );
    }

    stop() {
        if (this.usageTask) {
            this.usageTask.stop();
            this.usageTask = null;
            console.log('[billing] Monthly usage billing cron stopped.');
        }

        if (this.reconciliationTask) {
            this.reconciliationTask.stop();
            this.reconciliationTask = null;
            console.log('[billing] Razorpay reconciliation cron stopped.');
        }
    }
}

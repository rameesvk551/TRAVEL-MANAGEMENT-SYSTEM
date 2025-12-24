import { query, getClient } from '../../../infrastructure/database/connection.js';
import { 
    FiscalPeriod, 
    FiscalYear,
    FiscalPeriodStatus,
    FiscalPeriodProps,
    FiscalYearProps 
} from '../../../domain/entities/accounting/FiscalPeriod.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * Fiscal Period Service
 * 
 * Manages:
 * - Fiscal year creation
 * - Monthly period management
 * - Period open/close workflow
 * - Year-end closing
 * - Period validation
 */
export class FiscalPeriodService {

    // ==================== FISCAL YEARS ====================

    /**
     * Create a fiscal year with monthly periods
     */
    async createFiscalYear(
        tenantId: string,
        yearNumber: number,
        startDate: Date,
        endDate: Date,
        name?: string
    ): Promise<FiscalYear> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Create fiscal year
            const fiscalYear = FiscalYear.create({
                tenantId,
                year: yearNumber,
                name: name || `FY ${yearNumber}`,
                startDate,
                endDate,
                isActive: true,
                isClosed: false,
            });

            await client.query(`
                INSERT INTO public.fiscal_years (
                    id, tenant_id, year, name, start_date, end_date,
                    is_active, is_closed, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                fiscalYear.id,
                fiscalYear.tenantId,
                fiscalYear.year,
                fiscalYear.name,
                fiscalYear.startDate,
                fiscalYear.endDate,
                fiscalYear.isActive,
                fiscalYear.isClosed,
                fiscalYear.createdAt,
                fiscalYear.updatedAt,
            ]);

            // Create 12 monthly periods
            let periodStart = new Date(startDate);
            for (let period = 1; period <= 12; period++) {
                const periodEnd = new Date(periodStart);
                periodEnd.setMonth(periodEnd.getMonth() + 1);
                periodEnd.setDate(periodEnd.getDate() - 1);

                // Ensure last period ends on fiscal year end
                if (period === 12) {
                    periodEnd.setTime(endDate.getTime());
                }

                const fiscalPeriod = FiscalPeriod.create({
                    tenantId,
                    fiscalYearId: fiscalYear.id,
                    period,
                    name: this.getPeriodName(periodStart),
                    startDate: new Date(periodStart),
                    endDate: new Date(periodEnd),
                    status: period === 1 ? FiscalPeriodStatus.OPEN : FiscalPeriodStatus.OPEN, // All periods start OPEN
                });

                await client.query(`
                    INSERT INTO public.fiscal_periods (
                        id, tenant_id, fiscal_year_id, period, name, start_date, end_date,
                        status, closed_by, closed_at, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    fiscalPeriod.id,
                    fiscalPeriod.tenantId,
                    fiscalPeriod.fiscalYearId,
                    fiscalPeriod.period,
                    fiscalPeriod.name,
                    fiscalPeriod.startDate,
                    fiscalPeriod.endDate,
                    fiscalPeriod.status,
                    null,
                    null,
                    fiscalPeriod.createdAt,
                    fiscalPeriod.updatedAt,
                ]);

                // Move to next month
                periodStart.setMonth(periodStart.getMonth() + 1);
            }

            await client.query('COMMIT');

            return fiscalYear;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get fiscal year by ID
     */
    async getFiscalYearById(tenantId: string, id: string): Promise<FiscalYear | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_years
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, id]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalYear(result.rows[0]);
    }

    /**
     * Get fiscal year by year number
     */
    async getFiscalYearByNumber(tenantId: string, year: number): Promise<FiscalYear | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_years
            WHERE tenant_id = $1 AND year = $2
        `, [tenantId, year]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalYear(result.rows[0]);
    }

    /**
     * Get all fiscal years
     */
    async getAllFiscalYears(tenantId: string): Promise<FiscalYear[]> {
        const result = await query(`
            SELECT * FROM public.fiscal_years
            WHERE tenant_id = $1
            ORDER BY year DESC
        `, [tenantId]);

        return result.rows.map(row => this.mapToFiscalYear(row));
    }

    /**
     * Get current active fiscal year
     */
    async getCurrentFiscalYear(tenantId: string): Promise<FiscalYear | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_years
            WHERE tenant_id = $1 AND is_active = true AND is_closed = false
            ORDER BY year DESC
            LIMIT 1
        `, [tenantId]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalYear(result.rows[0]);
    }

    /**
     * Get fiscal year containing a date
     */
    async getFiscalYearForDate(tenantId: string, date: Date): Promise<FiscalYear | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_years
            WHERE tenant_id = $1 AND start_date <= $2 AND end_date >= $2
        `, [tenantId, date]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalYear(result.rows[0]);
    }

    // ==================== FISCAL PERIODS ====================

    /**
     * Get period by ID
     */
    async getPeriodById(tenantId: string, id: string): Promise<FiscalPeriod | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_periods
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, id]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalPeriod(result.rows[0]);
    }

    /**
     * Get periods for a fiscal year
     */
    async getPeriodsForYear(tenantId: string, fiscalYearId: string): Promise<FiscalPeriod[]> {
        const result = await query(`
            SELECT * FROM public.fiscal_periods
            WHERE tenant_id = $1 AND fiscal_year_id = $2
            ORDER BY period
        `, [tenantId, fiscalYearId]);

        return result.rows.map(row => this.mapToFiscalPeriod(row));
    }

    /**
     * Get period for a date
     */
    async getPeriodForDate(tenantId: string, date: Date): Promise<FiscalPeriod | null> {
        const result = await query(`
            SELECT * FROM public.fiscal_periods
            WHERE tenant_id = $1 AND start_date <= $2 AND end_date >= $2
        `, [tenantId, date]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalPeriod(result.rows[0]);
    }

    /**
     * Get current open period
     */
    async getCurrentOpenPeriod(tenantId: string): Promise<FiscalPeriod | null> {
        const now = new Date();
        const result = await query(`
            SELECT fp.* FROM public.fiscal_periods fp
            JOIN public.fiscal_years fy ON fp.fiscal_year_id = fy.id
            WHERE fp.tenant_id = $1 
            AND fp.status IN ('OPEN', 'SOFT_CLOSE')
            AND fp.start_date <= $2 AND fp.end_date >= $2
            AND fy.is_active = true
        `, [tenantId, now]);

        if (result.rows.length === 0) return null;
        return this.mapToFiscalPeriod(result.rows[0]);
    }

    /**
     * Get all open periods
     */
    async getOpenPeriods(tenantId: string): Promise<FiscalPeriod[]> {
        const result = await query(`
            SELECT fp.* FROM public.fiscal_periods fp
            JOIN public.fiscal_years fy ON fp.fiscal_year_id = fy.id
            WHERE fp.tenant_id = $1 
            AND fp.status IN ('OPEN', 'SOFT_CLOSE')
            AND fy.is_active = true
            ORDER BY fp.start_date
        `, [tenantId]);

        return result.rows.map(row => this.mapToFiscalPeriod(row));
    }

    // ==================== PERIOD LIFECYCLE ====================

    /**
     * Check if a date is in an open period
     */
    async isDateInOpenPeriod(tenantId: string, date: Date): Promise<boolean> {
        const period = await this.getPeriodForDate(tenantId, date);
        if (!period) return false;
        return period.status === FiscalPeriodStatus.OPEN || period.status === FiscalPeriodStatus.SOFT_CLOSE;
    }

    /**
     * Validate that a transaction date is allowed
     */
    async validateTransactionDate(tenantId: string, date: Date): Promise<{ isValid: boolean; message?: string }> {
        const period = await this.getPeriodForDate(tenantId, date);

        if (!period) {
            return { isValid: false, message: 'No fiscal period exists for this date' };
        }

        switch (period.status) {
            case FiscalPeriodStatus.OPEN:
                return { isValid: true };
            case FiscalPeriodStatus.SOFT_CLOSE:
                return { isValid: true, message: 'Period is soft-closed. Approval may be required.' };
            case FiscalPeriodStatus.HARD_CLOSE:
                return { isValid: false, message: 'Period is closed. No transactions allowed.' };
            case FiscalPeriodStatus.ARCHIVED:
                return { isValid: false, message: 'Period is archived. No transactions allowed.' };
            default:
                return { isValid: false, message: 'Unknown period status' };
        }
    }

    /**
     * Soft close a period
     */
    async softClosePeriod(tenantId: string, periodId: string, userId: string): Promise<FiscalPeriod> {
        const period = await this.getPeriodById(tenantId, periodId);
        if (!period) throw new Error('Period not found');

        if (period.status !== FiscalPeriodStatus.OPEN) {
            throw new Error(`Cannot soft close period with status: ${period.status}`);
        }

        await query(`
            UPDATE public.fiscal_periods
            SET status = $3, soft_closed_by = $4, soft_closed_at = NOW(), updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, periodId, FiscalPeriodStatus.SOFT_CLOSE, userId]);

        // Log the action
        await this.logPeriodAction(tenantId, periodId, 'SOFT_CLOSE', userId);

        return (await this.getPeriodById(tenantId, periodId))!;
    }

    /**
     * Hard close a period
     */
    async hardClosePeriod(tenantId: string, periodId: string, userId: string): Promise<FiscalPeriod> {
        const period = await this.getPeriodById(tenantId, periodId);
        if (!period) throw new Error('Period not found');

        if (period.status !== FiscalPeriodStatus.SOFT_CLOSE) {
            throw new Error(`Period must be soft-closed before hard closing. Current status: ${period.status}`);
        }

        // Check for unposted journals
        const unpostedResult = await query(`
            SELECT COUNT(*) FROM public.journal_entries
            WHERE tenant_id = $1 
            AND entry_date >= $2 AND entry_date <= $3
            AND status != 'POSTED'
        `, [tenantId, period.startDate, period.endDate]);

        if (parseInt(unpostedResult.rows[0].count) > 0) {
            throw new Error('Cannot hard close period with unposted journal entries');
        }

        await query(`
            UPDATE public.fiscal_periods
            SET status = $3, closed_by = $4, closed_at = NOW(), updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, periodId, FiscalPeriodStatus.HARD_CLOSE, userId]);

        // Log the action
        await this.logPeriodAction(tenantId, periodId, 'HARD_CLOSE', userId);

        return (await this.getPeriodById(tenantId, periodId))!;
    }

    /**
     * Reopen a soft-closed period
     */
    async reopenPeriod(tenantId: string, periodId: string, userId: string, reason: string): Promise<FiscalPeriod> {
        const period = await this.getPeriodById(tenantId, periodId);
        if (!period) throw new Error('Period not found');

        if (period.status !== FiscalPeriodStatus.SOFT_CLOSE) {
            throw new Error(`Can only reopen soft-closed periods. Current status: ${period.status}`);
        }

        await query(`
            UPDATE public.fiscal_periods
            SET status = $3, soft_closed_by = NULL, soft_closed_at = NULL, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, periodId, FiscalPeriodStatus.OPEN]);

        // Log the action with reason
        await this.logPeriodAction(tenantId, periodId, 'REOPEN', userId, reason);

        return (await this.getPeriodById(tenantId, periodId))!;
    }

    /**
     * Archive a period
     */
    async archivePeriod(tenantId: string, periodId: string, userId: string): Promise<FiscalPeriod> {
        const period = await this.getPeriodById(tenantId, periodId);
        if (!period) throw new Error('Period not found');

        if (period.status !== FiscalPeriodStatus.HARD_CLOSE) {
            throw new Error(`Period must be hard-closed before archiving. Current status: ${period.status}`);
        }

        await query(`
            UPDATE public.fiscal_periods
            SET status = $3, archived_by = $4, archived_at = NOW(), updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, periodId, FiscalPeriodStatus.ARCHIVED, userId]);

        // Log the action
        await this.logPeriodAction(tenantId, periodId, 'ARCHIVE', userId);

        return (await this.getPeriodById(tenantId, periodId))!;
    }

    // ==================== YEAR-END CLOSING ====================

    /**
     * Close a fiscal year
     */
    async closeFiscalYear(
        tenantId: string,
        fiscalYearId: string,
        userId: string,
        retainedEarningsAccountId: string
    ): Promise<void> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            const fiscalYear = await this.getFiscalYearById(tenantId, fiscalYearId);
            if (!fiscalYear) throw new Error('Fiscal year not found');

            // Check all periods are hard-closed
            const openPeriods = await client.query(`
                SELECT COUNT(*) FROM public.fiscal_periods
                WHERE tenant_id = $1 AND fiscal_year_id = $2 AND status != 'HARD_CLOSE'
            `, [tenantId, fiscalYearId]);

            if (parseInt(openPeriods.rows[0].count) > 0) {
                throw new Error('All periods must be hard-closed before closing the fiscal year');
            }

            // Calculate net income (Revenue - Expenses)
            const netIncomeResult = await client.query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN a.account_type = 'INCOME' THEN le.credit_amount - le.debit_amount ELSE 0 END), 0) -
                    COALESCE(SUM(CASE WHEN a.account_type = 'EXPENSE' THEN le.debit_amount - le.credit_amount ELSE 0 END), 0) as net_income
                FROM public.ledger_entries le
                JOIN public.accounts a ON le.account_id = a.id
                JOIN public.fiscal_periods fp ON le.entry_date >= fp.start_date AND le.entry_date <= fp.end_date
                WHERE le.tenant_id = $1 AND fp.fiscal_year_id = $2
            `, [tenantId, fiscalYearId]);

            const netIncome = parseFloat(netIncomeResult.rows[0].net_income);

            // Create closing journal entry
            const closingJournalId = generateId();
            const now = new Date();

            await client.query(`
                INSERT INTO public.journal_entries (
                    id, tenant_id, entry_number, entry_date, fiscal_year, fiscal_period,
                    source_module, description, status, is_closing_entry, posted_at, posted_by,
                    created_by, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 12, 'MANUAL', 'Year-End Closing Entry - Transfer to Retained Earnings',
                    'POSTED', true, NOW(), $6, $6, NOW(), NOW()
                )
            `, [
                closingJournalId,
                tenantId,
                `CLOSE-${fiscalYear.year}`,
                fiscalYear.endDate,
                fiscalYear.year,
                userId,
            ]);

            // Get all income and expense accounts with balances
            const accountBalances = await client.query(`
                SELECT 
                    a.id,
                    a.account_type,
                    COALESCE(SUM(le.debit_amount), 0) as total_debit,
                    COALESCE(SUM(le.credit_amount), 0) as total_credit
                FROM public.accounts a
                LEFT JOIN public.ledger_entries le ON le.account_id = a.id
                LEFT JOIN public.fiscal_periods fp ON le.entry_date >= fp.start_date AND le.entry_date <= fp.end_date
                WHERE a.tenant_id = $1 AND fp.fiscal_year_id = $2
                AND a.account_type IN ('INCOME', 'EXPENSE')
                GROUP BY a.id, a.account_type
                HAVING COALESCE(SUM(le.debit_amount), 0) != 0 OR COALESCE(SUM(le.credit_amount), 0) != 0
            `, [tenantId, fiscalYearId]);

            // Create journal lines to close income/expense accounts
            let lineNumber = 1;
            for (const acc of accountBalances.rows) {
                const debit = parseFloat(acc.total_debit);
                const credit = parseFloat(acc.total_credit);
                
                // Reverse the balance
                const closeDebit = acc.account_type === 'INCOME' ? credit - debit : 0;
                const closeCredit = acc.account_type === 'EXPENSE' ? debit - credit : 0;

                if (closeDebit > 0 || closeCredit > 0) {
                    await client.query(`
                        INSERT INTO public.journal_lines (
                            id, journal_entry_id, line_number, account_id, description,
                            debit_amount, credit_amount, created_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    `, [
                        generateId(),
                        closingJournalId,
                        lineNumber++,
                        acc.id,
                        'Year-end closing',
                        closeDebit,
                        closeCredit,
                    ]);
                }
            }

            // Create entry for retained earnings
            if (netIncome !== 0) {
                await client.query(`
                    INSERT INTO public.journal_lines (
                        id, journal_entry_id, line_number, account_id, description,
                        debit_amount, credit_amount, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                `, [
                    generateId(),
                    closingJournalId,
                    lineNumber,
                    retainedEarningsAccountId,
                    `Net Income for FY ${fiscalYear.year}`,
                    netIncome < 0 ? Math.abs(netIncome) : 0,
                    netIncome > 0 ? netIncome : 0,
                ]);
            }

            // Post ledger entries for the closing journal
            // (This would normally be done by JournalEntryService, but we're in a transaction)
            
            // Update fiscal year as closed
            await client.query(`
                UPDATE public.fiscal_years
                SET is_closed = true, closed_by = $3, closed_at = NOW(), updated_at = NOW()
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, fiscalYearId, userId]);

            // Archive all periods
            await client.query(`
                UPDATE public.fiscal_periods
                SET status = 'ARCHIVED', archived_by = $3, archived_at = NOW(), updated_at = NOW()
                WHERE tenant_id = $1 AND fiscal_year_id = $2
            `, [tenantId, fiscalYearId, userId]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get period status summary
     */
    async getPeriodStatusSummary(tenantId: string): Promise<{
        totalPeriods: number;
        openPeriods: number;
        softClosedPeriods: number;
        hardClosedPeriods: number;
        archivedPeriods: number;
        currentPeriod?: { year: number; period: number; name: string };
    }> {
        const statusResult = await query(`
            SELECT status, COUNT(*) as count
            FROM public.fiscal_periods
            WHERE tenant_id = $1
            GROUP BY status
        `, [tenantId]);

        const counts = {
            OPEN: 0,
            SOFT_CLOSE: 0,
            HARD_CLOSE: 0,
            ARCHIVED: 0,
        };

        for (const row of statusResult.rows) {
            counts[row.status as keyof typeof counts] = parseInt(row.count);
        }

        const totalPeriods = Object.values(counts).reduce((a, b) => a + b, 0);

        // Get current period
        const currentPeriod = await this.getCurrentOpenPeriod(tenantId);
        let currentPeriodInfo: { year: number; period: number; name: string } | undefined;

        if (currentPeriod) {
            const yearResult = await query(`
                SELECT year FROM public.fiscal_years WHERE id = $1
            `, [currentPeriod.fiscalYearId]);

            if (yearResult.rows.length > 0) {
                currentPeriodInfo = {
                    year: yearResult.rows[0].year,
                    period: currentPeriod.period,
                    name: currentPeriod.name,
                };
            }
        }

        return {
            totalPeriods,
            openPeriods: counts.OPEN,
            softClosedPeriods: counts.SOFT_CLOSE,
            hardClosedPeriods: counts.HARD_CLOSE,
            archivedPeriods: counts.ARCHIVED,
            currentPeriod: currentPeriodInfo,
        };
    }

    // ==================== HELPERS ====================

    private getPeriodName(date: Date): string {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    private async logPeriodAction(
        tenantId: string,
        periodId: string,
        action: string,
        userId: string,
        notes?: string
    ): Promise<void> {
        await query(`
            INSERT INTO public.audit_log (
                id, tenant_id, entity_type, entity_id, action, performed_by, performed_at, details
            ) VALUES ($1, $2, 'FISCAL_PERIOD', $3, $4, $5, NOW(), $6)
        `, [generateId(), tenantId, periodId, action, userId, notes ? JSON.stringify({ notes }) : null]);
    }

    private mapToFiscalYear(row: any): FiscalYear {
        return FiscalYear.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            year: row.year,
            name: row.name,
            startDate: row.start_date,
            endDate: row.end_date,
            isActive: row.is_active,
            isClosed: row.is_closed,
            closedBy: row.closed_by,
            closedAt: row.closed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    private mapToFiscalPeriod(row: any): FiscalPeriod {
        return FiscalPeriod.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            fiscalYearId: row.fiscal_year_id,
            period: row.period,
            name: row.name,
            startDate: row.start_date,
            endDate: row.end_date,
            status: row.status as FiscalPeriodStatus,
            closedBy: row.closed_by,
            closedAt: row.closed_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}

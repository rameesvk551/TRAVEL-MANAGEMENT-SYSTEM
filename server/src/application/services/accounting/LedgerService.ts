import { query } from '../../../infrastructure/database/connection.js';
import { 
    LedgerEntry, 
    AccountBalance, 
    TrialBalanceLine,
    SubLedgerBalance 
} from '../../../domain/entities/accounting/LedgerEntry.js';
import { 
    TripLedgerResult,
    InterBranchBalance 
} from '../../../domain/interfaces/accounting/ILedgerRepository.js';

/**
 * Ledger Service
 * 
 * Provides access to the general ledger with:
 * - Account ledger views
 * - Trial balance generation
 * - Sub-ledger views (customer, vendor, employee)
 * - Trip-level profitability
 * - Branch and consolidated views
 */
export class LedgerService {

    /**
     * Get account ledger entries
     */
    async getAccountLedger(
        tenantId: string,
        accountId: string,
        options: {
            branchId?: string;
            fromDate?: Date;
            toDate?: Date;
            page?: number;
            pageSize?: number;
        } = {}
    ): Promise<{
        entries: LedgerEntry[];
        openingBalance: number;
        totalDebit: number;
        totalCredit: number;
        closingBalance: number;
        total: number;
    }> {
        const params: any[] = [tenantId, accountId];
        let whereClause = `WHERE le.tenant_id = $1 AND le.account_id = $2`;

        if (options.branchId) {
            params.push(options.branchId);
            whereClause += ` AND le.branch_id = $${params.length}`;
        }

        if (options.fromDate) {
            params.push(options.fromDate);
            whereClause += ` AND le.entry_date >= $${params.length}`;
        }

        if (options.toDate) {
            params.push(options.toDate);
            whereClause += ` AND le.entry_date <= $${params.length}`;
        }

        // Get opening balance
        let openingBalance = 0;
        if (options.fromDate) {
            const openingResult = await query(`
                SELECT COALESCE(SUM(debit_amount - credit_amount), 0) as opening_balance
                FROM public.ledger_entries
                WHERE tenant_id = $1 AND account_id = $2
                ${options.branchId ? 'AND branch_id = $3' : ''}
                AND entry_date < ${options.branchId ? '$4' : '$3'}
            `, options.branchId 
                ? [tenantId, accountId, options.branchId, options.fromDate]
                : [tenantId, accountId, options.fromDate]);
            openingBalance = parseFloat(openingResult.rows[0].opening_balance);
        }

        // Get totals
        const totalsResult = await query(`
            SELECT 
                COALESCE(SUM(debit_amount), 0) as total_debit,
                COALESCE(SUM(credit_amount), 0) as total_credit,
                COUNT(*) as total_count
            FROM public.ledger_entries le
            ${whereClause}
        `, params);

        const totalDebit = parseFloat(totalsResult.rows[0].total_debit);
        const totalCredit = parseFloat(totalsResult.rows[0].total_credit);
        const total = parseInt(totalsResult.rows[0].total_count);
        const closingBalance = openingBalance + totalDebit - totalCredit;

        // Get entries with pagination
        const page = options.page || 1;
        const pageSize = options.pageSize || 50;
        params.push(pageSize, (page - 1) * pageSize);

        const entriesResult = await query(`
            SELECT le.*
            FROM public.ledger_entries le
            ${whereClause}
            ORDER BY le.entry_date, le.created_at
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `, params);

        const entries = entriesResult.rows.map(row => this.mapToLedgerEntry(row));

        return {
            entries,
            openingBalance,
            totalDebit,
            totalCredit,
            closingBalance,
            total,
        };
    }

    /**
     * Get trial balance
     */
    async getTrialBalance(
        tenantId: string,
        asOfDate: Date,
        options: {
            branchId?: string;
            includeZeroBalances?: boolean;
            level?: number;
        } = {}
    ): Promise<{
        lines: TrialBalanceLine[];
        totalDebit: number;
        totalCredit: number;
        isBalanced: boolean;
    }> {
        let sql = `
            SELECT 
                a.id as account_id,
                a.code as account_code,
                a.name as account_name,
                a.account_type,
                a.level,
                a.is_header,
                a.normal_balance,
                COALESCE(SUM(le.debit_amount), 0) as total_debit,
                COALESCE(SUM(le.credit_amount), 0) as total_credit
            FROM public.accounts a
            LEFT JOIN public.ledger_entries le ON a.id = le.account_id
                AND le.tenant_id = a.tenant_id
                AND le.entry_date <= $2
                ${options.branchId ? 'AND le.branch_id = $3' : ''}
            WHERE a.tenant_id = $1
                AND a.status != 'INACTIVE'
                ${options.level ? `AND a.level <= ${options.level}` : ''}
            GROUP BY a.id, a.code, a.name, a.account_type, a.level, a.is_header, a.normal_balance
            ORDER BY a.code
        `;

        const params: any[] = [tenantId, asOfDate];
        if (options.branchId) {
            params.push(options.branchId);
        }

        const result = await query(sql, params);

        const lines: TrialBalanceLine[] = [];
        let totalDebit = 0;
        let totalCredit = 0;

        for (const row of result.rows) {
            const debitTotal = parseFloat(row.total_debit);
            const creditTotal = parseFloat(row.total_credit);
            const netBalance = debitTotal - creditTotal;

            // Skip zero balances unless requested
            if (!options.includeZeroBalances && netBalance === 0) {
                continue;
            }

            // Determine debit/credit balance based on account type
            let debitBalance = 0;
            let creditBalance = 0;

            if (row.normal_balance === 'DEBIT') {
                if (netBalance >= 0) {
                    debitBalance = netBalance;
                } else {
                    creditBalance = Math.abs(netBalance);
                }
            } else {
                if (netBalance <= 0) {
                    creditBalance = Math.abs(netBalance);
                } else {
                    debitBalance = netBalance;
                }
            }

            totalDebit += debitBalance;
            totalCredit += creditBalance;

            lines.push({
                accountId: row.account_id,
                accountCode: row.account_code,
                accountName: row.account_name,
                accountType: row.account_type,
                level: row.level,
                debitBalance,
                creditBalance,
                isHeader: row.is_header,
            });
        }

        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

        return { lines, totalDebit, totalCredit, isBalanced };
    }

    /**
     * Get account balance as of a date
     */
    async getAccountBalance(
        tenantId: string,
        accountId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<AccountBalance> {
        const params: any[] = [tenantId, accountId, asOfDate];
        let branchClause = '';
        
        if (branchId) {
            params.push(branchId);
            branchClause = `AND le.branch_id = $4`;
        }

        const result = await query(`
            SELECT 
                a.id as account_id,
                a.code as account_code,
                a.name as account_name,
                COALESCE(SUM(le.debit_amount), 0) as total_debit,
                COALESCE(SUM(le.credit_amount), 0) as total_credit
            FROM public.accounts a
            LEFT JOIN public.ledger_entries le ON a.id = le.account_id
                AND le.tenant_id = a.tenant_id
                AND le.entry_date <= $3
                ${branchClause}
            WHERE a.tenant_id = $1 AND a.id = $2
            GROUP BY a.id, a.code, a.name
        `, params);

        if (result.rows.length === 0) {
            throw new Error('Account not found');
        }

        const row = result.rows[0];
        const totalDebit = parseFloat(row.total_debit);
        const totalCredit = parseFloat(row.total_credit);

        return {
            accountId: row.account_id,
            accountCode: row.account_code,
            accountName: row.account_name,
            branchId,
            fiscalYear: asOfDate.getFullYear(),
            openingBalance: 0, // Would need fiscal year start to calculate
            totalDebit,
            totalCredit,
            netMovement: totalDebit - totalCredit,
            closingBalance: totalDebit - totalCredit,
            currency: 'INR',
            asOfDate,
        };
    }

    /**
     * Get customer ledger (Accounts Receivable sub-ledger)
     */
    async getCustomerLedger(
        tenantId: string,
        customerId: string,
        options: {
            fromDate?: Date;
            toDate?: Date;
            branchId?: string;
        } = {}
    ): Promise<SubLedgerBalance & { entries: LedgerEntry[] }> {
        const params: any[] = [tenantId, customerId];
        let whereClause = `WHERE le.tenant_id = $1 AND le.customer_id = $2`;

        if (options.branchId) {
            params.push(options.branchId);
            whereClause += ` AND le.branch_id = $${params.length}`;
        }

        if (options.fromDate) {
            params.push(options.fromDate);
            whereClause += ` AND le.entry_date >= $${params.length}`;
        }

        if (options.toDate) {
            params.push(options.toDate);
            whereClause += ` AND le.entry_date <= $${params.length}`;
        }

        const result = await query(`
            SELECT le.*
            FROM public.ledger_entries le
            ${whereClause}
            ORDER BY le.entry_date, le.created_at
        `, params);

        const entries = result.rows.map(row => this.mapToLedgerEntry(row));

        let totalDebit = 0;
        let totalCredit = 0;
        entries.forEach(e => {
            totalDebit += e.debitAmount;
            totalCredit += e.creditAmount;
        });

        // Get customer name from first entry
        const customerName = entries.length > 0 
            ? entries[0].description.split(' - ')[1] || 'Customer'
            : 'Customer';

        return {
            entityType: 'CUSTOMER',
            entityId: customerId,
            entityName: customerName,
            branchId: options.branchId,
            openingBalance: 0,
            totalDebit,
            totalCredit,
            closingBalance: totalDebit - totalCredit,
            currency: 'INR',
            asOfDate: options.toDate || new Date(),
            entries,
        };
    }

    /**
     * Get vendor ledger (Accounts Payable sub-ledger)
     */
    async getVendorLedger(
        tenantId: string,
        vendorId: string,
        options: {
            fromDate?: Date;
            toDate?: Date;
            branchId?: string;
        } = {}
    ): Promise<SubLedgerBalance & { entries: LedgerEntry[] }> {
        const params: any[] = [tenantId, vendorId];
        let whereClause = `WHERE le.tenant_id = $1 AND le.vendor_id = $2`;

        if (options.branchId) {
            params.push(options.branchId);
            whereClause += ` AND le.branch_id = $${params.length}`;
        }

        if (options.fromDate) {
            params.push(options.fromDate);
            whereClause += ` AND le.entry_date >= $${params.length}`;
        }

        if (options.toDate) {
            params.push(options.toDate);
            whereClause += ` AND le.entry_date <= $${params.length}`;
        }

        const result = await query(`
            SELECT le.*
            FROM public.ledger_entries le
            ${whereClause}
            ORDER BY le.entry_date, le.created_at
        `, params);

        const entries = result.rows.map(row => this.mapToLedgerEntry(row));

        let totalDebit = 0;
        let totalCredit = 0;
        entries.forEach(e => {
            totalDebit += e.debitAmount;
            totalCredit += e.creditAmount;
        });

        return {
            entityType: 'VENDOR',
            entityId: vendorId,
            entityName: 'Vendor',
            branchId: options.branchId,
            openingBalance: 0,
            totalDebit,
            totalCredit,
            closingBalance: totalCredit - totalDebit, // Payables are credit-normal
            currency: 'INR',
            asOfDate: options.toDate || new Date(),
            entries,
        };
    }

    /**
     * Get trip-level profitability
     */
    async getTripProfitability(
        tenantId: string,
        tripId: string
    ): Promise<TripLedgerResult> {
        // Get all ledger entries for this trip
        const result = await query(`
            SELECT 
                le.*,
                a.account_type,
                a.sub_type,
                a.code as account_code_full
            FROM public.ledger_entries le
            JOIN public.accounts a ON le.account_id = a.id
            WHERE le.tenant_id = $1 AND le.trip_id = $2
            ORDER BY le.entry_date
        `, [tenantId, tripId]);

        const entries = result.rows.map(row => this.mapToLedgerEntry(row));

        // Calculate revenue breakdown
        let seatRevenue = 0;
        let addonRevenue = 0;
        let rentalRevenue = 0;

        // Calculate cost breakdown
        let vendorCosts = 0;
        let guideCosts = 0;
        let transportCosts = 0;
        let foodCosts = 0;
        let permitCosts = 0;
        let gearDepreciation = 0;
        let otaCommission = 0;

        for (const row of result.rows) {
            const amount = parseFloat(row.credit_amount) - parseFloat(row.debit_amount);
            const code = row.account_code_full;

            if (row.account_type === 'REVENUE') {
                if (code.startsWith('411')) seatRevenue += amount;
                else if (code.startsWith('412')) addonRevenue += amount;
                else if (code.startsWith('413')) rentalRevenue += amount;
            } else if (row.account_type === 'EXPENSE') {
                const expAmount = parseFloat(row.debit_amount) - parseFloat(row.credit_amount);
                if (code.startsWith('511')) vendorCosts += expAmount;
                else if (code.startsWith('512')) transportCosts += expAmount;
                else if (code.startsWith('514')) foodCosts += expAmount;
                else if (code.startsWith('515')) permitCosts += expAmount;
                else if (code.startsWith('516')) guideCosts += expAmount;
                else if (code.startsWith('520')) otaCommission += expAmount;
                else if (code.startsWith('561')) gearDepreciation += expAmount;
            }
        }

        const totalRevenue = seatRevenue + addonRevenue + rentalRevenue;
        const totalCosts = vendorCosts + guideCosts + transportCosts + foodCosts + 
                          permitCosts + gearDepreciation + otaCommission;
        const grossProfit = totalRevenue - totalCosts;

        // Get seat count from bookings
        const bookingResult = await query(`
            SELECT COALESCE(SUM(guest_count), 0) as seat_count
            FROM public.bookings
            WHERE tenant_id = $1 AND resource_id = $2
            AND status NOT IN ('cancelled', 'no_show')
        `, [tenantId, tripId]);

        const seatCount = parseInt(bookingResult.rows[0].seat_count) || 1;

        return {
            tripId,
            tripName: 'Trip', // Would need to join with trips table
            branchId: entries.length > 0 ? entries[0].branchId : '',
            entries,
            totalRevenue,
            seatRevenue,
            addonRevenue,
            rentalRevenue,
            totalCosts,
            vendorCosts,
            guideCosts,
            transportCosts,
            foodCosts,
            permitCosts,
            gearDepreciation,
            otaCommission,
            grossProfit,
            grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
            netProfit: grossProfit,
            netMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
            revenuePerSeat: totalRevenue / seatCount,
            costPerSeat: totalCosts / seatCount,
            profitPerSeat: grossProfit / seatCount,
            seatCount,
        };
    }

    /**
     * Get inter-branch balances for consolidation
     */
    async getInterBranchBalances(
        tenantId: string,
        asOfDate: Date
    ): Promise<InterBranchBalance[]> {
        const result = await query(`
            SELECT 
                ibt.from_branch_id,
                fb.name as from_branch_name,
                ibt.to_branch_id,
                tb.name as to_branch_name,
                SUM(CASE WHEN ibt.status = 'COMPLETED' THEN ibt.amount ELSE 0 END) as amount
            FROM public.inter_branch_transactions ibt
            JOIN public.branches fb ON ibt.from_branch_id = fb.id
            JOIN public.branches tb ON ibt.to_branch_id = tb.id
            WHERE ibt.tenant_id = $1
            AND ibt.transaction_date <= $2
            GROUP BY ibt.from_branch_id, fb.name, ibt.to_branch_id, tb.name
        `, [tenantId, asOfDate]);

        return result.rows.map(row => ({
            fromBranchId: row.from_branch_id,
            fromBranchName: row.from_branch_name,
            toBranchId: row.to_branch_id,
            toBranchName: row.to_branch_name,
            receivableAmount: parseFloat(row.amount),
            payableAmount: parseFloat(row.amount),
            netAmount: 0, // Net is zero for consolidation elimination
        }));
    }

    /**
     * Get all customer balances (for AR aging)
     */
    async getCustomerBalances(
        tenantId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<SubLedgerBalance[]> {
        const params: any[] = [tenantId, asOfDate];
        let branchClause = '';

        if (branchId) {
            params.push(branchId);
            branchClause = `AND le.branch_id = $3`;
        }

        const result = await query(`
            SELECT 
                le.customer_id,
                COALESCE(c.name, 'Unknown Customer') as customer_name,
                SUM(le.debit_amount) as total_debit,
                SUM(le.credit_amount) as total_credit
            FROM public.ledger_entries le
            LEFT JOIN public.contacts c ON le.customer_id = c.id
            WHERE le.tenant_id = $1
            AND le.customer_id IS NOT NULL
            AND le.entry_date <= $2
            ${branchClause}
            GROUP BY le.customer_id, c.name
            HAVING SUM(le.debit_amount) - SUM(le.credit_amount) != 0
        `, params);

        return result.rows.map(row => ({
            entityType: 'CUSTOMER' as const,
            entityId: row.customer_id,
            entityName: row.customer_name,
            branchId,
            openingBalance: 0,
            totalDebit: parseFloat(row.total_debit),
            totalCredit: parseFloat(row.total_credit),
            closingBalance: parseFloat(row.total_debit) - parseFloat(row.total_credit),
            currency: 'INR',
            asOfDate,
        }));
    }

    /**
     * Get all vendor balances (for AP aging)
     */
    async getVendorBalances(
        tenantId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<SubLedgerBalance[]> {
        const params: any[] = [tenantId, asOfDate];
        let branchClause = '';

        if (branchId) {
            params.push(branchId);
            branchClause = `AND le.branch_id = $3`;
        }

        const result = await query(`
            SELECT 
                le.vendor_id,
                COALESCE(v.name, 'Unknown Vendor') as vendor_name,
                SUM(le.debit_amount) as total_debit,
                SUM(le.credit_amount) as total_credit
            FROM public.ledger_entries le
            LEFT JOIN public.vendors v ON le.vendor_id = v.id
            WHERE le.tenant_id = $1
            AND le.vendor_id IS NOT NULL
            AND le.entry_date <= $2
            ${branchClause}
            GROUP BY le.vendor_id, v.name
            HAVING SUM(le.credit_amount) - SUM(le.debit_amount) != 0
        `, params);

        return result.rows.map(row => ({
            entityType: 'VENDOR' as const,
            entityId: row.vendor_id,
            entityName: row.vendor_name,
            branchId,
            openingBalance: 0,
            totalDebit: parseFloat(row.total_debit),
            totalCredit: parseFloat(row.total_credit),
            closingBalance: parseFloat(row.total_credit) - parseFloat(row.total_debit),
            currency: 'INR',
            asOfDate,
        }));
    }

    /**
     * Map database row to LedgerEntry entity
     */
    private mapToLedgerEntry(row: any): LedgerEntry {
        return LedgerEntry.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            branchId: row.branch_id,
            accountId: row.account_id,
            accountCode: row.account_code,
            accountName: row.account_name,
            journalEntryId: row.journal_entry_id,
            journalLineId: row.journal_line_id,
            entryNumber: row.entry_number,
            entryDate: row.entry_date,
            postingDate: row.posting_date,
            description: row.description,
            debitAmount: parseFloat(row.debit_amount),
            creditAmount: parseFloat(row.credit_amount),
            runningBalance: parseFloat(row.running_balance),
            currency: row.currency,
            exchangeRate: parseFloat(row.exchange_rate),
            baseCurrencyDebit: parseFloat(row.base_currency_debit),
            baseCurrencyCredit: parseFloat(row.base_currency_credit),
            customerId: row.customer_id,
            vendorId: row.vendor_id,
            employeeId: row.employee_id,
            tripId: row.trip_id,
            bookingId: row.booking_id,
            costCenterId: row.cost_center_id,
            sourceModule: row.source_module,
            sourceRecordId: row.source_record_id,
            fiscalYear: row.fiscal_year,
            fiscalPeriod: row.fiscal_period,
            entryType: row.entry_type,
            createdAt: row.created_at,
            createdBy: row.created_by,
        });
    }
}

import { query, getClient } from '../../../infrastructure/database/connection.js';
import { 
    JournalEntry, 
    JournalLine, 
    JournalEntryProps,
    JournalLineProps 
} from '../../../domain/entities/accounting/JournalEntry.js';
import { LedgerEntry, LedgerEntryProps } from '../../../domain/entities/accounting/LedgerEntry.js';
import { ChartOfAccountsService } from './ChartOfAccountsService.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * Journal Entry Service
 * 
 * Manages journal entries with:
 * - Creation and validation
 * - Posting to the general ledger
 * - Reversal entries
 * - Entry number generation
 */
export class JournalEntryService {
    private coaService: ChartOfAccountsService;

    constructor() {
        this.coaService = new ChartOfAccountsService();
    }

    /**
     * Create a journal entry (draft)
     */
    async createJournalEntry(props: JournalEntryProps): Promise<JournalEntry> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Create the journal entry
            const entry = JournalEntry.create(props);

            // Validate balance
            if (!entry.isBalanced()) {
                throw new Error(`Journal entry is not balanced. Debits: ${entry.totalDebit}, Credits: ${entry.totalCredit}`);
            }

            // Check if period is open
            const periodCheck = await client.query(`
                SELECT status FROM public.fiscal_periods
                WHERE tenant_id = $1 
                AND fiscal_year = $2 
                AND period_number = $3
                AND (branch_id IS NULL OR branch_id = $4)
                ORDER BY branch_id NULLS LAST
                LIMIT 1
            `, [props.tenantId, entry.fiscalYear, entry.fiscalPeriod, props.branchId]);

            if (periodCheck.rows.length > 0 && periodCheck.rows[0].status === 'LOCKED') {
                throw new Error('Cannot post to a locked period');
            }

            // Insert journal entry header
            await client.query(`
                INSERT INTO public.journal_entries (
                    id, tenant_id, branch_id, entry_number, entry_date, posting_date,
                    entry_type, status, description, source_module, source_record_id,
                    source_record_type, total_debit, total_credit, currency, exchange_rate,
                    fiscal_year, fiscal_period, is_reversed, reverses_entry_id,
                    requires_approval, notes, attachments, created_by, created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                )
            `, [
                entry.id,
                entry.tenantId,
                entry.branchId,
                entry.entryNumber,
                entry.entryDate,
                entry.postingDate,
                entry.entryType,
                entry.status,
                entry.description,
                entry.sourceModule,
                entry.sourceRecordId,
                entry.sourceRecordType,
                entry.totalDebit,
                entry.totalCredit,
                entry.currency,
                entry.exchangeRate,
                entry.fiscalYear,
                entry.fiscalPeriod,
                entry.isReversed,
                entry.reversesEntryId,
                entry.requiresApproval,
                entry.notes,
                entry.attachments,
                entry.createdBy,
                entry.createdAt,
                entry.updatedAt,
            ]);

            // Insert journal lines
            for (const line of entry.lines) {
                // Get account details
                const account = await this.coaService.getAccountById(props.tenantId, line.accountId);
                if (!account) {
                    throw new Error(`Account not found: ${line.accountId}`);
                }

                if (account.isHeader) {
                    throw new Error(`Cannot post to header account: ${account.code}`);
                }

                await client.query(`
                    INSERT INTO public.journal_lines (
                        id, journal_entry_id, account_id, account_code, account_name,
                        debit_amount, credit_amount, currency, exchange_rate, base_currency_amount,
                        branch_id, cost_center_id, trip_id, booking_id, vendor_id, customer_id,
                        employee_id, tax_code, tax_amount, description, line_number
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                        $17, $18, $19, $20, $21
                    )
                `, [
                    line.id,
                    entry.id,
                    line.accountId,
                    account.code,
                    account.name,
                    line.debitAmount,
                    line.creditAmount,
                    line.currency,
                    line.exchangeRate,
                    line.baseCurrencyAmount,
                    line.branchId || props.branchId,
                    line.costCenterId,
                    line.tripId,
                    line.bookingId,
                    line.vendorId,
                    line.customerId,
                    line.employeeId,
                    line.taxCode,
                    line.taxAmount,
                    line.description,
                    line.lineNumber,
                ]);
            }

            await client.query('COMMIT');
            return entry;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Post a journal entry to the general ledger
     */
    async postJournalEntry(
        tenantId: string, 
        journalEntryId: string,
        userId: string
    ): Promise<JournalEntry> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Get the journal entry
            const entryResult = await client.query(`
                SELECT * FROM public.journal_entries
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, journalEntryId]);

            if (entryResult.rows.length === 0) {
                throw new Error('Journal entry not found');
            }

            const entryRow = entryResult.rows[0];

            if (entryRow.status !== 'DRAFT') {
                throw new Error(`Cannot post entry with status: ${entryRow.status}`);
            }

            // Generate entry number
            const entryNumber = await this.generateEntryNumber(
                client, 
                tenantId, 
                entryRow.branch_id, 
                entryRow.fiscal_year
            );

            // Get journal lines
            const linesResult = await client.query(`
                SELECT * FROM public.journal_lines
                WHERE journal_entry_id = $1
                ORDER BY line_number
            `, [journalEntryId]);

            // Calculate running balances and create ledger entries
            for (const line of linesResult.rows) {
                // Get current running balance for this account
                const balanceResult = await client.query(`
                    SELECT COALESCE(
                        (SELECT running_balance FROM public.ledger_entries
                         WHERE tenant_id = $1 AND account_id = $2
                         ORDER BY created_at DESC, id DESC
                         LIMIT 1),
                        0
                    ) as running_balance
                `, [tenantId, line.account_id]);

                const previousBalance = parseFloat(balanceResult.rows[0].running_balance);
                const netAmount = parseFloat(line.debit_amount) - parseFloat(line.credit_amount);
                const newBalance = previousBalance + netAmount;

                // Create ledger entry
                const ledgerEntry: LedgerEntryProps = {
                    tenantId,
                    branchId: entryRow.branch_id,
                    accountId: line.account_id,
                    accountCode: line.account_code,
                    accountName: line.account_name,
                    journalEntryId: journalEntryId,
                    journalLineId: line.id,
                    entryNumber,
                    entryDate: entryRow.entry_date,
                    postingDate: new Date(),
                    description: line.description || entryRow.description,
                    debitAmount: parseFloat(line.debit_amount),
                    creditAmount: parseFloat(line.credit_amount),
                    runningBalance: newBalance,
                    currency: line.currency,
                    exchangeRate: parseFloat(line.exchange_rate),
                    baseCurrencyDebit: parseFloat(line.debit_amount),
                    baseCurrencyCredit: parseFloat(line.credit_amount),
                    customerId: line.customer_id,
                    vendorId: line.vendor_id,
                    employeeId: line.employee_id,
                    tripId: line.trip_id,
                    bookingId: line.booking_id,
                    costCenterId: line.cost_center_id,
                    sourceModule: entryRow.source_module,
                    sourceRecordId: entryRow.source_record_id,
                    fiscalYear: entryRow.fiscal_year,
                    fiscalPeriod: entryRow.fiscal_period,
                    createdBy: userId,
                };

                await client.query(`
                    INSERT INTO public.ledger_entries (
                        id, tenant_id, branch_id, account_id, account_code, account_name,
                        journal_entry_id, journal_line_id, entry_number, entry_date, posting_date,
                        description, debit_amount, credit_amount, running_balance, currency,
                        exchange_rate, base_currency_debit, base_currency_credit, customer_id,
                        vendor_id, employee_id, trip_id, booking_id, cost_center_id,
                        source_module, source_record_id, fiscal_year, fiscal_period, created_by
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
                    )
                `, [
                    generateId(),
                    ledgerEntry.tenantId,
                    ledgerEntry.branchId,
                    ledgerEntry.accountId,
                    ledgerEntry.accountCode,
                    ledgerEntry.accountName,
                    ledgerEntry.journalEntryId,
                    ledgerEntry.journalLineId,
                    ledgerEntry.entryNumber,
                    ledgerEntry.entryDate,
                    ledgerEntry.postingDate,
                    ledgerEntry.description,
                    ledgerEntry.debitAmount,
                    ledgerEntry.creditAmount,
                    ledgerEntry.runningBalance,
                    ledgerEntry.currency,
                    ledgerEntry.exchangeRate,
                    ledgerEntry.baseCurrencyDebit,
                    ledgerEntry.baseCurrencyCredit,
                    ledgerEntry.customerId,
                    ledgerEntry.vendorId,
                    ledgerEntry.employeeId,
                    ledgerEntry.tripId,
                    ledgerEntry.bookingId,
                    ledgerEntry.costCenterId,
                    ledgerEntry.sourceModule,
                    ledgerEntry.sourceRecordId,
                    ledgerEntry.fiscalYear,
                    ledgerEntry.fiscalPeriod,
                    ledgerEntry.createdBy,
                ]);

                // Lock the account if this is its first posting
                await this.coaService.lockAccount(tenantId, line.account_id, userId);
            }

            // Update journal entry status
            await client.query(`
                UPDATE public.journal_entries
                SET status = 'POSTED', 
                    entry_number = $3, 
                    posting_date = NOW(),
                    updated_at = NOW()
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, journalEntryId, entryNumber]);

            // Log audit trail
            await this.logAudit(client, tenantId, entryRow.branch_id, 'JOURNAL_ENTRY', journalEntryId, 'POSTED', userId);

            await client.query('COMMIT');

            // Return updated entry
            return this.getJournalEntryById(tenantId, journalEntryId) as Promise<JournalEntry>;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Reverse a posted journal entry
     */
    async reverseJournalEntry(
        tenantId: string,
        journalEntryId: string,
        userId: string,
        reason: string
    ): Promise<{ original: JournalEntry; reversal: JournalEntry }> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Get original entry
            const original = await this.getJournalEntryById(tenantId, journalEntryId);
            if (!original) {
                throw new Error('Journal entry not found');
            }

            if (original.status !== 'POSTED') {
                throw new Error('Only posted entries can be reversed');
            }

            if (original.isReversed) {
                throw new Error('Entry is already reversed');
            }

            // Create reversal entry
            const reversalEntry = original.createReversalEntry(userId);
            
            // Update props with reason
            const reversalProps = reversalEntry.toProps();
            reversalProps.notes = reason;

            // Create the reversal journal entry
            const createdReversal = await this.createJournalEntry(reversalProps);

            // Post the reversal
            const postedReversal = await this.postJournalEntry(tenantId, createdReversal.id, userId);

            // Mark original as reversed
            await client.query(`
                UPDATE public.journal_entries
                SET is_reversed = true,
                    reversed_by_entry_id = $3,
                    status = 'REVERSED',
                    updated_at = NOW()
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, journalEntryId, postedReversal.id]);

            // Log audit
            await this.logAudit(client, tenantId, original.branchId, 'JOURNAL_ENTRY', journalEntryId, 'REVERSED', userId, {
                reversal_entry_id: postedReversal.id,
                reason,
            });

            await client.query('COMMIT');

            const updatedOriginal = await this.getJournalEntryById(tenantId, journalEntryId);
            return { original: updatedOriginal!, reversal: postedReversal };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get journal entry by ID
     */
    async getJournalEntryById(tenantId: string, id: string): Promise<JournalEntry | null> {
        const entryResult = await query(`
            SELECT * FROM public.journal_entries
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, id]);

        if (entryResult.rows.length === 0) return null;

        const linesResult = await query(`
            SELECT * FROM public.journal_lines
            WHERE journal_entry_id = $1
            ORDER BY line_number
        `, [id]);

        const entryRow = entryResult.rows[0];
        const lines = linesResult.rows.map(row => new JournalLine({
            id: row.id,
            journalEntryId: row.journal_entry_id,
            accountId: row.account_id,
            accountCode: row.account_code,
            accountName: row.account_name,
            description: row.description,
            debitAmount: parseFloat(row.debit_amount),
            creditAmount: parseFloat(row.credit_amount),
            currency: row.currency,
            exchangeRate: parseFloat(row.exchange_rate),
            baseCurrencyAmount: row.base_currency_amount ? parseFloat(row.base_currency_amount) : undefined,
            branchId: row.branch_id,
            costCenterId: row.cost_center_id,
            tripId: row.trip_id,
            bookingId: row.booking_id,
            vendorId: row.vendor_id,
            customerId: row.customer_id,
            employeeId: row.employee_id,
            taxCode: row.tax_code,
            taxAmount: row.tax_amount ? parseFloat(row.tax_amount) : 0,
            lineNumber: row.line_number,
        }));

        return JournalEntry.fromPersistence({
            id: entryRow.id,
            tenantId: entryRow.tenant_id,
            branchId: entryRow.branch_id,
            entryNumber: entryRow.entry_number,
            entryDate: entryRow.entry_date,
            postingDate: entryRow.posting_date,
            entryType: entryRow.entry_type,
            status: entryRow.status,
            description: entryRow.description,
            sourceModule: entryRow.source_module,
            sourceRecordId: entryRow.source_record_id,
            sourceRecordType: entryRow.source_record_type,
            totalDebit: parseFloat(entryRow.total_debit),
            totalCredit: parseFloat(entryRow.total_credit),
            currency: entryRow.currency,
            exchangeRate: parseFloat(entryRow.exchange_rate),
            fiscalYear: entryRow.fiscal_year,
            fiscalPeriod: entryRow.fiscal_period,
            isReversed: entryRow.is_reversed,
            reversedByEntryId: entryRow.reversed_by_entry_id,
            reversesEntryId: entryRow.reverses_entry_id,
            requiresApproval: entryRow.requires_approval,
            approvedBy: entryRow.approved_by,
            approvedAt: entryRow.approved_at,
            createdBy: entryRow.created_by,
            createdAt: entryRow.created_at,
            updatedAt: entryRow.updated_at,
            notes: entryRow.notes,
            attachments: entryRow.attachments,
            lines: [], // Will be populated below
        }, lines);
    }

    /**
     * Get journal entries by source record
     */
    async getJournalEntriesBySource(
        tenantId: string,
        sourceModule: string,
        sourceRecordId: string
    ): Promise<JournalEntry[]> {
        const result = await query(`
            SELECT id FROM public.journal_entries
            WHERE tenant_id = $1 AND source_module = $2 AND source_record_id = $3
            ORDER BY entry_date DESC, created_at DESC
        `, [tenantId, sourceModule, sourceRecordId]);

        const entries: JournalEntry[] = [];
        for (const row of result.rows) {
            const entry = await this.getJournalEntryById(tenantId, row.id);
            if (entry) entries.push(entry);
        }

        return entries;
    }

    /**
     * Search journal entries
     */
    async searchJournalEntries(
        tenantId: string,
        options: {
            branchId?: string;
            status?: string;
            sourceModule?: string;
            fromDate?: Date;
            toDate?: Date;
            fiscalYear?: number;
            fiscalPeriod?: number;
            searchTerm?: string;
            page?: number;
            pageSize?: number;
        }
    ): Promise<{ entries: JournalEntry[]; total: number }> {
        let sql = `
            SELECT je.*, COUNT(*) OVER() as total_count
            FROM public.journal_entries je
            WHERE je.tenant_id = $1
        `;
        const params: any[] = [tenantId];

        if (options.branchId) {
            params.push(options.branchId);
            sql += ` AND je.branch_id = $${params.length}`;
        }

        if (options.status) {
            params.push(options.status);
            sql += ` AND je.status = $${params.length}`;
        }

        if (options.sourceModule) {
            params.push(options.sourceModule);
            sql += ` AND je.source_module = $${params.length}`;
        }

        if (options.fromDate) {
            params.push(options.fromDate);
            sql += ` AND je.entry_date >= $${params.length}`;
        }

        if (options.toDate) {
            params.push(options.toDate);
            sql += ` AND je.entry_date <= $${params.length}`;
        }

        if (options.fiscalYear) {
            params.push(options.fiscalYear);
            sql += ` AND je.fiscal_year = $${params.length}`;
        }

        if (options.fiscalPeriod) {
            params.push(options.fiscalPeriod);
            sql += ` AND je.fiscal_period = $${params.length}`;
        }

        if (options.searchTerm) {
            params.push(`%${options.searchTerm}%`);
            sql += ` AND (je.description ILIKE $${params.length} OR je.entry_number ILIKE $${params.length})`;
        }

        sql += ` ORDER BY je.entry_date DESC, je.created_at DESC`;

        const page = options.page || 1;
        const pageSize = options.pageSize || 50;
        params.push(pageSize, (page - 1) * pageSize);
        sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

        const result = await query(sql, params);

        const entries: JournalEntry[] = [];
        for (const row of result.rows) {
            const entry = await this.getJournalEntryById(tenantId, row.id);
            if (entry) entries.push(entry);
        }

        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

        return { entries, total };
    }

    /**
     * Generate entry number
     */
    private async generateEntryNumber(
        client: any,
        tenantId: string,
        branchId: string,
        fiscalYear: number
    ): Promise<string> {
        const result = await client.query(`
            SELECT get_next_accounting_sequence($1, $2, 'JOURNAL', 'JV', $3) as entry_number
        `, [tenantId, branchId, fiscalYear]);

        return result.rows[0].entry_number;
    }

    /**
     * Log audit entry
     */
    private async logAudit(
        client: any,
        tenantId: string,
        branchId: string,
        entityType: string,
        entityId: string,
        action: string,
        actorId: string,
        newValues?: Record<string, any>
    ): Promise<void> {
        await client.query(`
            INSERT INTO public.accounting_audit_log (
                tenant_id, branch_id, entity_type, entity_id, action,
                actor_type, actor_id, new_values, created_at
            ) VALUES ($1, $2, $3, $4, $5, 'USER', $6, $7, NOW())
        `, [tenantId, branchId, entityType, entityId, action, actorId, newValues ? JSON.stringify(newValues) : null]);
    }
}

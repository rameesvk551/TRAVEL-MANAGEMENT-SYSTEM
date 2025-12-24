import { query, getClient } from '../../../infrastructure/database/connection.js';
import { 
    BankAccount, 
    BankTransaction,
    BankAccountProps,
    BankTransactionProps 
} from '../../../domain/entities/accounting/FiscalPeriod.js';
import { generateId } from '../../../shared/utils/index.js';

/**
 * Bank account transaction status
 */
export type TransactionStatus = 'PENDING' | 'CLEARED' | 'RECONCILED' | 'VOID';

/**
 * Reconciliation status
 */
export interface ReconciliationSummary {
    accountId: string;
    accountName: string;
    asOfDate: Date;
    statementBalance: number;
    bookBalance: number;
    unreconciledDeposits: number;
    unreconciledWithdrawals: number;
    adjustedBalance: number;
    difference: number;
    isReconciled: boolean;
    reconciledItems: number;
    unreconciledItems: number;
}

/**
 * Bank statement import format
 */
export interface BankStatementRow {
    transactionDate: Date;
    valueDate?: Date;
    description: string;
    reference?: string;
    debitAmount?: number;
    creditAmount?: number;
    balance?: number;
    chequeNumber?: string;
}

/**
 * Matching result
 */
export interface MatchResult {
    bankTransactionId: string;
    ledgerTransactionId?: string;
    matchType: 'EXACT' | 'PARTIAL' | 'SUGGESTED' | 'UNMATCHED';
    confidence: number;
    matchedAmount: number;
    differenceAmount: number;
}

/**
 * Bank Reconciliation Service
 * 
 * Features:
 * - Bank account management
 * - Transaction tracking
 * - Statement import
 * - Auto-matching
 * - Reconciliation workflow
 * - Cash position reporting
 */
export class BankReconciliationService {

    // ==================== BANK ACCOUNTS ====================

    /**
     * Create a bank account
     */
    async createBankAccount(props: BankAccountProps): Promise<BankAccount> {
        const bankAccount = BankAccount.create(props);

        const result = await query(`
            INSERT INTO public.bank_accounts (
                id, tenant_id, branch_id, account_id, account_name, bank_name,
                account_number, routing_number, swift_code, currency, account_type,
                opening_balance, opening_balance_date, current_balance, last_reconciled_date,
                last_reconciled_balance, is_active, is_primary, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING *
        `, [
            bankAccount.id,
            bankAccount.tenantId,
            bankAccount.branchId,
            bankAccount.accountId,
            bankAccount.accountName,
            bankAccount.bankName,
            bankAccount.accountNumber,
            bankAccount.routingNumber,
            bankAccount.swiftCode,
            bankAccount.currency,
            bankAccount.accountType,
            bankAccount.openingBalance,
            bankAccount.openingBalanceDate,
            bankAccount.currentBalance,
            bankAccount.lastReconciledDate,
            bankAccount.lastReconciledBalance,
            bankAccount.isActive,
            bankAccount.isPrimary,
            bankAccount.createdAt,
            bankAccount.updatedAt,
        ]);

        return this.mapToBankAccount(result.rows[0]);
    }

    /**
     * Get bank account by ID
     */
    async getBankAccountById(tenantId: string, id: string): Promise<BankAccount | null> {
        const result = await query(`
            SELECT * FROM public.bank_accounts
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, id]);

        if (result.rows.length === 0) return null;
        return this.mapToBankAccount(result.rows[0]);
    }

    /**
     * Get all bank accounts for a branch
     */
    async getBankAccountsByBranch(tenantId: string, branchId: string): Promise<BankAccount[]> {
        const result = await query(`
            SELECT * FROM public.bank_accounts
            WHERE tenant_id = $1 AND branch_id = $2 AND is_active = true
            ORDER BY is_primary DESC, account_name
        `, [tenantId, branchId]);

        return result.rows.map(row => this.mapToBankAccount(row));
    }

    /**
     * Get all bank accounts
     */
    async getAllBankAccounts(tenantId: string): Promise<BankAccount[]> {
        const result = await query(`
            SELECT ba.*, b.name as branch_name
            FROM public.bank_accounts ba
            LEFT JOIN public.branches b ON ba.branch_id = b.id
            WHERE ba.tenant_id = $1 AND ba.is_active = true
            ORDER BY b.name, ba.is_primary DESC, ba.account_name
        `, [tenantId]);

        return result.rows.map(row => this.mapToBankAccount(row));
    }

    /**
     * Update bank account balance
     */
    async updateBalance(
        tenantId: string,
        bankAccountId: string,
        newBalance: number
    ): Promise<void> {
        await query(`
            UPDATE public.bank_accounts
            SET current_balance = $3, updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, bankAccountId, newBalance]);
    }

    // ==================== TRANSACTIONS ====================

    /**
     * Create a bank transaction
     */
    async createTransaction(props: BankTransactionProps): Promise<BankTransaction> {
        const transaction = BankTransaction.create(props);

        const result = await query(`
            INSERT INTO public.bank_transactions (
                id, tenant_id, branch_id, bank_account_id, transaction_date, value_date,
                transaction_type, description, reference_number, cheque_number, amount,
                running_balance, journal_entry_id, is_reconciled, reconciled_date,
                reconciled_by, statement_line_id, notes, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            )
            RETURNING *
        `, [
            transaction.id,
            transaction.tenantId,
            transaction.branchId,
            transaction.bankAccountId,
            transaction.transactionDate,
            transaction.valueDate,
            transaction.transactionType,
            transaction.description,
            transaction.referenceNumber,
            transaction.chequeNumber,
            transaction.amount,
            transaction.runningBalance,
            transaction.journalEntryId,
            transaction.isReconciled,
            transaction.reconciledDate,
            transaction.reconciledBy,
            transaction.statementLineId,
            transaction.notes,
            transaction.createdAt,
            transaction.updatedAt,
        ]);

        // Update bank account balance
        await this.updateBankAccountBalance(tenantId, props.bankAccountId);

        return this.mapToBankTransaction(result.rows[0]);
    }

    /**
     * Get transactions for a bank account
     */
    async getTransactions(
        tenantId: string,
        bankAccountId: string,
        filters: {
            startDate?: Date;
            endDate?: Date;
            isReconciled?: boolean;
            transactionType?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<{ transactions: BankTransaction[]; total: number }> {
        let sql = `
            SELECT * FROM public.bank_transactions
            WHERE tenant_id = $1 AND bank_account_id = $2
        `;
        let countSql = `
            SELECT COUNT(*) FROM public.bank_transactions
            WHERE tenant_id = $1 AND bank_account_id = $2
        `;
        const params: any[] = [tenantId, bankAccountId];
        let paramIndex = 3;

        if (filters.startDate) {
            sql += ` AND transaction_date >= $${paramIndex}`;
            countSql += ` AND transaction_date >= $${paramIndex}`;
            params.push(filters.startDate);
            paramIndex++;
        }

        if (filters.endDate) {
            sql += ` AND transaction_date <= $${paramIndex}`;
            countSql += ` AND transaction_date <= $${paramIndex}`;
            params.push(filters.endDate);
            paramIndex++;
        }

        if (filters.isReconciled !== undefined) {
            sql += ` AND is_reconciled = $${paramIndex}`;
            countSql += ` AND is_reconciled = $${paramIndex}`;
            params.push(filters.isReconciled);
            paramIndex++;
        }

        if (filters.transactionType) {
            sql += ` AND transaction_type = $${paramIndex}`;
            countSql += ` AND transaction_type = $${paramIndex}`;
            params.push(filters.transactionType);
            paramIndex++;
        }

        sql += ` ORDER BY transaction_date DESC, created_at DESC`;

        if (filters.limit) {
            sql += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }

        if (filters.offset) {
            sql += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
        }

        const [transResult, countResult] = await Promise.all([
            query(sql, params),
            query(countSql, params.slice(0, paramIndex - (filters.limit ? 1 : 0) - (filters.offset ? 1 : 0))),
        ]);

        return {
            transactions: transResult.rows.map(row => this.mapToBankTransaction(row)),
            total: parseInt(countResult.rows[0].count),
        };
    }

    /**
     * Get unreconciled transactions
     */
    async getUnreconciledTransactions(
        tenantId: string,
        bankAccountId: string
    ): Promise<BankTransaction[]> {
        const result = await query(`
            SELECT * FROM public.bank_transactions
            WHERE tenant_id = $1 AND bank_account_id = $2 AND is_reconciled = false
            ORDER BY transaction_date
        `, [tenantId, bankAccountId]);

        return result.rows.map(row => this.mapToBankTransaction(row));
    }

    // ==================== RECONCILIATION ====================

    /**
     * Start a reconciliation session
     */
    async startReconciliation(
        tenantId: string,
        bankAccountId: string,
        statementDate: Date,
        statementBalance: number,
        userId: string
    ): Promise<string> {
        const id = generateId();

        await query(`
            INSERT INTO public.bank_reconciliations (
                id, tenant_id, bank_account_id, statement_date, statement_balance,
                book_balance, status, started_by, started_at
            ) VALUES ($1, $2, $3, $4, $5, 
                (SELECT current_balance FROM public.bank_accounts WHERE id = $3),
                'IN_PROGRESS', $6, NOW()
            )
        `, [id, tenantId, bankAccountId, statementDate, statementBalance, userId]);

        return id;
    }

    /**
     * Mark transactions as reconciled
     */
    async reconcileTransactions(
        tenantId: string,
        transactionIds: string[],
        reconciliationId: string,
        userId: string
    ): Promise<void> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Mark transactions as reconciled
            await client.query(`
                UPDATE public.bank_transactions
                SET is_reconciled = true,
                    reconciled_date = NOW(),
                    reconciled_by = $3,
                    reconciliation_id = $4,
                    updated_at = NOW()
                WHERE tenant_id = $1 AND id = ANY($2)
            `, [tenantId, transactionIds, userId, reconciliationId]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Unreconcile transactions
     */
    async unreconcileTransactions(
        tenantId: string,
        transactionIds: string[]
    ): Promise<void> {
        await query(`
            UPDATE public.bank_transactions
            SET is_reconciled = false,
                reconciled_date = NULL,
                reconciled_by = NULL,
                reconciliation_id = NULL,
                updated_at = NOW()
            WHERE tenant_id = $1 AND id = ANY($2)
        `, [tenantId, transactionIds]);
    }

    /**
     * Complete reconciliation
     */
    async completeReconciliation(
        tenantId: string,
        reconciliationId: string,
        userId: string
    ): Promise<void> {
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // Get reconciliation details
            const recResult = await client.query(`
                SELECT * FROM public.bank_reconciliations
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, reconciliationId]);

            if (recResult.rows.length === 0) {
                throw new Error('Reconciliation not found');
            }

            const rec = recResult.rows[0];

            // Calculate reconciled balance
            const balanceResult = await client.query(`
                SELECT COALESCE(SUM(amount), 0) as reconciled_total
                FROM public.bank_transactions
                WHERE tenant_id = $1 AND reconciliation_id = $2
            `, [tenantId, reconciliationId]);

            const reconciledTotal = parseFloat(balanceResult.rows[0].reconciled_total);

            // Update reconciliation status
            await client.query(`
                UPDATE public.bank_reconciliations
                SET status = 'COMPLETED',
                    reconciled_balance = $3,
                    completed_by = $4,
                    completed_at = NOW()
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, reconciliationId, reconciledTotal, userId]);

            // Update bank account's last reconciled info
            await client.query(`
                UPDATE public.bank_accounts
                SET last_reconciled_date = $3,
                    last_reconciled_balance = $4,
                    updated_at = NOW()
                WHERE tenant_id = $1 AND id = $2
            `, [tenantId, rec.bank_account_id, rec.statement_date, rec.statement_balance]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get reconciliation summary
     */
    async getReconciliationSummary(
        tenantId: string,
        bankAccountId: string,
        asOfDate: Date
    ): Promise<ReconciliationSummary> {
        // Get bank account details
        const accountResult = await query(`
            SELECT * FROM public.bank_accounts
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, bankAccountId]);

        if (accountResult.rows.length === 0) {
            throw new Error('Bank account not found');
        }

        const account = accountResult.rows[0];

        // Get book balance (sum of all transactions)
        const balanceResult = await query(`
            SELECT 
                COALESCE(SUM(CASE WHEN is_reconciled = true THEN amount ELSE 0 END), 0) as reconciled_balance,
                COALESCE(SUM(CASE WHEN is_reconciled = false AND amount > 0 THEN amount ELSE 0 END), 0) as unreconciled_deposits,
                COALESCE(SUM(CASE WHEN is_reconciled = false AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as unreconciled_withdrawals,
                COUNT(CASE WHEN is_reconciled = true THEN 1 END) as reconciled_count,
                COUNT(CASE WHEN is_reconciled = false THEN 1 END) as unreconciled_count
            FROM public.bank_transactions
            WHERE tenant_id = $1 AND bank_account_id = $2 AND transaction_date <= $3
        `, [tenantId, bankAccountId, asOfDate]);

        const balance = balanceResult.rows[0];
        const bookBalance = parseFloat(account.opening_balance) + parseFloat(account.current_balance || 0);
        const unreconciledDeposits = parseFloat(balance.unreconciled_deposits);
        const unreconciledWithdrawals = parseFloat(balance.unreconciled_withdrawals);
        const statementBalance = parseFloat(account.last_reconciled_balance || 0);

        const adjustedBalance = statementBalance + unreconciledDeposits - unreconciledWithdrawals;
        const difference = bookBalance - adjustedBalance;

        return {
            accountId: bankAccountId,
            accountName: account.account_name,
            asOfDate,
            statementBalance,
            bookBalance,
            unreconciledDeposits,
            unreconciledWithdrawals,
            adjustedBalance,
            difference: Math.round(difference * 100) / 100,
            isReconciled: Math.abs(difference) < 0.01,
            reconciledItems: parseInt(balance.reconciled_count),
            unreconciledItems: parseInt(balance.unreconciled_count),
        };
    }

    // ==================== STATEMENT IMPORT ====================

    /**
     * Import bank statement rows
     */
    async importStatement(
        tenantId: string,
        branchId: string,
        bankAccountId: string,
        rows: BankStatementRow[]
    ): Promise<{ imported: number; duplicates: number; errors: string[] }> {
        let imported = 0;
        let duplicates = 0;
        const errors: string[] = [];

        const client = await getClient();

        try {
            await client.query('BEGIN');

            for (const row of rows) {
                const amount = (row.creditAmount || 0) - (row.debitAmount || 0);
                const transactionType = amount >= 0 ? 'DEPOSIT' : 'WITHDRAWAL';

                // Check for duplicates
                const dupCheck = await client.query(`
                    SELECT id FROM public.bank_transactions
                    WHERE tenant_id = $1 AND bank_account_id = $2
                    AND transaction_date = $3 AND amount = $4
                    AND (reference_number = $5 OR ($5 IS NULL AND reference_number IS NULL))
                `, [tenantId, bankAccountId, row.transactionDate, amount, row.reference]);

                if (dupCheck.rows.length > 0) {
                    duplicates++;
                    continue;
                }

                try {
                    await this.createTransaction({
                        tenantId,
                        branchId,
                        bankAccountId,
                        transactionDate: row.transactionDate,
                        valueDate: row.valueDate,
                        transactionType,
                        description: row.description,
                        referenceNumber: row.reference,
                        chequeNumber: row.chequeNumber,
                        amount,
                    });
                    imported++;
                } catch (e) {
                    errors.push(`Row ${row.description}: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return { imported, duplicates, errors };
    }

    // ==================== AUTO MATCHING ====================

    /**
     * Auto-match bank transactions with ledger entries
     */
    async autoMatchTransactions(
        tenantId: string,
        bankAccountId: string
    ): Promise<MatchResult[]> {
        // Get unreconciled bank transactions
        const unreconciled = await this.getUnreconciledTransactions(tenantId, bankAccountId);

        // Get bank account's GL account
        const account = await this.getBankAccountById(tenantId, bankAccountId);
        if (!account) throw new Error('Bank account not found');

        // Get unreconciled ledger entries for this account
        const ledgerResult = await query(`
            SELECT le.*, je.reference_number as journal_ref, je.description as journal_desc
            FROM public.ledger_entries le
            JOIN public.journal_entries je ON le.journal_entry_id = je.id
            WHERE le.tenant_id = $1 AND le.account_id = $2
            AND NOT EXISTS (
                SELECT 1 FROM public.bank_transactions bt
                WHERE bt.journal_entry_id = je.id AND bt.is_reconciled = true
            )
            ORDER BY le.entry_date
        `, [tenantId, account.accountId]);

        const results: MatchResult[] = [];

        for (const bankTrans of unreconciled) {
            let bestMatch: MatchResult = {
                bankTransactionId: bankTrans.id,
                matchType: 'UNMATCHED',
                confidence: 0,
                matchedAmount: 0,
                differenceAmount: bankTrans.amount,
            };

            for (const ledgerEntry of ledgerResult.rows) {
                const ledgerAmount = parseFloat(ledgerEntry.debit_amount) - parseFloat(ledgerEntry.credit_amount);
                
                // Exact amount match
                if (Math.abs(bankTrans.amount - ledgerAmount) < 0.01) {
                    const dateDiff = Math.abs(
                        new Date(bankTrans.transactionDate).getTime() - 
                        new Date(ledgerEntry.entry_date).getTime()
                    ) / (1000 * 60 * 60 * 24);

                    let confidence = 100 - (dateDiff * 5); // Reduce confidence by 5% per day difference

                    // Check reference match
                    if (bankTrans.referenceNumber && ledgerEntry.journal_ref) {
                        if (bankTrans.referenceNumber.includes(ledgerEntry.journal_ref) ||
                            ledgerEntry.journal_ref.includes(bankTrans.referenceNumber)) {
                            confidence = Math.min(100, confidence + 20);
                        }
                    }

                    if (confidence > bestMatch.confidence) {
                        bestMatch = {
                            bankTransactionId: bankTrans.id,
                            ledgerTransactionId: ledgerEntry.id,
                            matchType: confidence >= 95 ? 'EXACT' : 'SUGGESTED',
                            confidence: Math.max(0, Math.min(100, confidence)),
                            matchedAmount: bankTrans.amount,
                            differenceAmount: 0,
                        };
                    }
                }
            }

            results.push(bestMatch);
        }

        return results;
    }

    // ==================== CASH POSITION ====================

    /**
     * Get total cash position across all bank accounts
     */
    async getCashPosition(
        tenantId: string,
        branchId?: string
    ): Promise<{
        totalBalance: number;
        accountBreakdown: Array<{
            accountId: string;
            accountName: string;
            bankName: string;
            balance: number;
            currency: string;
            branchId: string;
            branchName?: string;
        }>;
    }> {
        let sql = `
            SELECT ba.*, b.name as branch_name
            FROM public.bank_accounts ba
            LEFT JOIN public.branches b ON ba.branch_id = b.id
            WHERE ba.tenant_id = $1 AND ba.is_active = true
        `;
        const params: any[] = [tenantId];

        if (branchId) {
            params.push(branchId);
            sql += ` AND ba.branch_id = $2`;
        }

        sql += ` ORDER BY ba.branch_id, ba.account_name`;

        const result = await query(sql, params);

        const accountBreakdown = result.rows.map(row => ({
            accountId: row.id,
            accountName: row.account_name,
            bankName: row.bank_name,
            balance: parseFloat(row.current_balance || 0),
            currency: row.currency,
            branchId: row.branch_id,
            branchName: row.branch_name,
        }));

        const totalBalance = accountBreakdown.reduce((sum, acc) => sum + acc.balance, 0);

        return { totalBalance, accountBreakdown };
    }

    /**
     * Get cash flow for a period
     */
    async getCashFlow(
        tenantId: string,
        startDate: Date,
        endDate: Date,
        branchId?: string
    ): Promise<{
        openingBalance: number;
        totalInflows: number;
        totalOutflows: number;
        netFlow: number;
        closingBalance: number;
        inflowsByType: Record<string, number>;
        outflowsByType: Record<string, number>;
    }> {
        let baseClause = `ba.tenant_id = $1`;
        const params: any[] = [tenantId, startDate, endDate];

        if (branchId) {
            params.push(branchId);
            baseClause += ` AND ba.branch_id = $4`;
        }

        // Get opening balance
        const openingResult = await query(`
            SELECT COALESCE(SUM(ba.opening_balance), 0) as opening_balance
            FROM public.bank_accounts ba
            WHERE ${baseClause} AND ba.is_active = true
        `, branchId ? params.slice(0, 1).concat(params[3]) : [tenantId]);

        let openingBalance = parseFloat(openingResult.rows[0].opening_balance);

        // Add transactions before start date
        const priorResult = await query(`
            SELECT COALESCE(SUM(bt.amount), 0) as prior_sum
            FROM public.bank_transactions bt
            JOIN public.bank_accounts ba ON bt.bank_account_id = ba.id
            WHERE ${baseClause} AND bt.transaction_date < $2
        `, branchId ? [tenantId, startDate, branchId] : [tenantId, startDate]);

        openingBalance += parseFloat(priorResult.rows[0].prior_sum);

        // Get flows during period
        const flowResult = await query(`
            SELECT 
                bt.transaction_type,
                COALESCE(SUM(CASE WHEN bt.amount > 0 THEN bt.amount ELSE 0 END), 0) as inflows,
                COALESCE(SUM(CASE WHEN bt.amount < 0 THEN ABS(bt.amount) ELSE 0 END), 0) as outflows
            FROM public.bank_transactions bt
            JOIN public.bank_accounts ba ON bt.bank_account_id = ba.id
            WHERE ${baseClause}
            AND bt.transaction_date >= $2 AND bt.transaction_date <= $3
            GROUP BY bt.transaction_type
        `, params);

        let totalInflows = 0;
        let totalOutflows = 0;
        const inflowsByType: Record<string, number> = {};
        const outflowsByType: Record<string, number> = {};

        for (const row of flowResult.rows) {
            const inflow = parseFloat(row.inflows);
            const outflow = parseFloat(row.outflows);
            totalInflows += inflow;
            totalOutflows += outflow;
            if (inflow > 0) inflowsByType[row.transaction_type] = inflow;
            if (outflow > 0) outflowsByType[row.transaction_type] = outflow;
        }

        const netFlow = totalInflows - totalOutflows;
        const closingBalance = openingBalance + netFlow;

        return {
            openingBalance,
            totalInflows,
            totalOutflows,
            netFlow,
            closingBalance,
            inflowsByType,
            outflowsByType,
        };
    }

    // ==================== HELPERS ====================

    private async updateBankAccountBalance(tenantId: string, bankAccountId: string): Promise<void> {
        await query(`
            UPDATE public.bank_accounts
            SET current_balance = (
                SELECT COALESCE(SUM(amount), 0) + opening_balance
                FROM public.bank_transactions
                WHERE bank_account_id = $2
            ),
            updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, bankAccountId]);
    }

    private mapToBankAccount(row: any): BankAccount {
        return BankAccount.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            branchId: row.branch_id,
            accountId: row.account_id,
            accountName: row.account_name,
            bankName: row.bank_name,
            accountNumber: row.account_number,
            routingNumber: row.routing_number,
            swiftCode: row.swift_code,
            currency: row.currency,
            accountType: row.account_type,
            openingBalance: parseFloat(row.opening_balance || 0),
            openingBalanceDate: row.opening_balance_date,
            currentBalance: parseFloat(row.current_balance || 0),
            lastReconciledDate: row.last_reconciled_date,
            lastReconciledBalance: row.last_reconciled_balance ? parseFloat(row.last_reconciled_balance) : undefined,
            isActive: row.is_active,
            isPrimary: row.is_primary,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }

    private mapToBankTransaction(row: any): BankTransaction {
        return BankTransaction.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            branchId: row.branch_id,
            bankAccountId: row.bank_account_id,
            transactionDate: row.transaction_date,
            valueDate: row.value_date,
            transactionType: row.transaction_type,
            description: row.description,
            referenceNumber: row.reference_number,
            chequeNumber: row.cheque_number,
            amount: parseFloat(row.amount),
            runningBalance: row.running_balance ? parseFloat(row.running_balance) : undefined,
            journalEntryId: row.journal_entry_id,
            isReconciled: row.is_reconciled,
            reconciledDate: row.reconciled_date,
            reconciledBy: row.reconciled_by,
            statementLineId: row.statement_line_id,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}

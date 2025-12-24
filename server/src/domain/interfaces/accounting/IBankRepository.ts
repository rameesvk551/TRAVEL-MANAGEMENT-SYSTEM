import { BankAccount, BankTransaction } from '../../entities/accounting/FiscalPeriod.js';

/**
 * Bank Repository Interface - Bank Accounts and Reconciliation
 */
export interface IBankRepository {
    // ==================== Bank Accounts ====================
    
    /**
     * Create a bank account
     */
    createBankAccount(account: BankAccount): Promise<BankAccount>;

    /**
     * Update a bank account
     */
    updateBankAccount(account: BankAccount): Promise<BankAccount>;

    /**
     * Find bank account by ID
     */
    findBankAccountById(tenantId: string, id: string): Promise<BankAccount | null>;

    /**
     * Get all bank accounts for a tenant
     */
    getBankAccounts(
        tenantId: string,
        branchId?: string,
        includeInactive?: boolean
    ): Promise<BankAccount[]>;

    /**
     * Get primary bank account for a branch
     */
    getPrimaryBankAccount(
        tenantId: string,
        branchId?: string
    ): Promise<BankAccount | null>;

    /**
     * Update bank account balance
     */
    updateBalance(
        tenantId: string,
        bankAccountId: string,
        newBalance: number
    ): Promise<void>;

    // ==================== Bank Transactions ====================

    /**
     * Import bank transactions
     */
    importTransactions(transactions: BankTransaction[]): Promise<BankTransaction[]>;

    /**
     * Create a single bank transaction
     */
    createTransaction(transaction: BankTransaction): Promise<BankTransaction>;

    /**
     * Get bank transactions
     */
    getTransactions(
        tenantId: string,
        bankAccountId: string,
        options: BankTransactionQueryOptions
    ): Promise<BankTransactionQueryResult>;

    /**
     * Get unreconciled transactions
     */
    getUnreconciledTransactions(
        tenantId: string,
        bankAccountId: string,
        fromDate?: Date,
        toDate?: Date
    ): Promise<BankTransaction[]>;

    /**
     * Reconcile a transaction
     */
    reconcileTransaction(
        tenantId: string,
        transactionId: string,
        ledgerEntryId: string,
        journalEntryId: string,
        userId: string
    ): Promise<BankTransaction>;

    /**
     * Bulk reconcile transactions
     */
    bulkReconcile(
        tenantId: string,
        reconciliations: ReconciliationMatch[]
    ): Promise<BankTransaction[]>;

    /**
     * Undo reconciliation
     */
    undoReconciliation(
        tenantId: string,
        transactionId: string
    ): Promise<BankTransaction>;

    /**
     * Get reconciliation summary
     */
    getReconciliationSummary(
        tenantId: string,
        bankAccountId: string,
        asOfDate: Date
    ): Promise<ReconciliationSummary>;

    /**
     * Find matching ledger entries for a bank transaction
     */
    findMatchingLedgerEntries(
        tenantId: string,
        bankAccountId: string,
        transactionId: string
    ): Promise<PotentialMatch[]>;
}

/**
 * Bank transaction query options
 */
export interface BankTransactionQueryOptions {
    fromDate?: Date;
    toDate?: Date;
    isReconciled?: boolean;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    page?: number;
    pageSize?: number;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Bank transaction query result
 */
export interface BankTransactionQueryResult {
    transactions: BankTransaction[];
    total: number;
    page: number;
    pageSize: number;
    totalDebit: number;
    totalCredit: number;
}

/**
 * Reconciliation match
 */
export interface ReconciliationMatch {
    bankTransactionId: string;
    ledgerEntryId: string;
    journalEntryId: string;
}

/**
 * Reconciliation summary
 */
export interface ReconciliationSummary {
    bankAccountId: string;
    bankAccountName: string;
    asOfDate: Date;
    
    // Book balance (per ledger)
    ledgerBalance: number;
    
    // Bank balance (per statement)
    bankBalance: number;
    
    // Reconciliation items
    unreconciledDeposits: number;      // In ledger, not in bank
    unreconciledWithdrawals: number;   // In ledger, not in bank
    outstandingDeposits: number;       // In bank, not in ledger
    outstandingWithdrawals: number;    // In bank, not in ledger
    
    // Reconciled balance
    adjustedBankBalance: number;
    difference: number;
    isReconciled: boolean;
    
    // Transaction counts
    totalBankTransactions: number;
    reconciledTransactions: number;
    unreconciledTransactions: number;
    
    lastReconciledDate?: Date;
}

/**
 * Potential match for auto-reconciliation
 */
export interface PotentialMatch {
    ledgerEntryId: string;
    journalEntryId: string;
    entryDate: Date;
    description: string;
    amount: number;
    matchScore: number;  // 0-100 confidence score
    matchReasons: string[];
}

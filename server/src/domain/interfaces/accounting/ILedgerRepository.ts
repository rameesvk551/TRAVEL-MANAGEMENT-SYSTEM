import { 
    LedgerEntry, 
    AccountBalance, 
    TrialBalanceLine, 
    SubLedgerBalance 
} from '../../entities/accounting/LedgerEntry.js';

/**
 * Ledger Repository Interface - General Ledger Operations
 */
export interface ILedgerRepository {
    /**
     * Post entries to the ledger (from a journal entry)
     * This is called when a journal entry is posted
     */
    postEntries(entries: LedgerEntry[]): Promise<LedgerEntry[]>;

    /**
     * Get ledger entries for an account
     */
    getAccountLedger(
        tenantId: string,
        accountId: string,
        options: LedgerQueryOptions
    ): Promise<LedgerQueryResult>;

    /**
     * Get ledger entries for a branch
     */
    getBranchLedger(
        tenantId: string,
        branchId: string,
        options: LedgerQueryOptions
    ): Promise<LedgerQueryResult>;

    /**
     * Get account balance as of a date
     */
    getAccountBalance(
        tenantId: string,
        accountId: string,
        asOfDate: Date,
        branchId?: string
    ): Promise<AccountBalance>;

    /**
     * Get multiple account balances
     */
    getAccountBalances(
        tenantId: string,
        accountIds: string[],
        asOfDate: Date,
        branchId?: string
    ): Promise<AccountBalance[]>;

    /**
     * Get trial balance
     */
    getTrialBalance(
        tenantId: string,
        asOfDate: Date,
        options?: TrialBalanceOptions
    ): Promise<TrialBalanceResult>;

    /**
     * Get customer sub-ledger
     */
    getCustomerLedger(
        tenantId: string,
        customerId: string,
        options: LedgerQueryOptions
    ): Promise<SubLedgerQueryResult>;

    /**
     * Get vendor sub-ledger
     */
    getVendorLedger(
        tenantId: string,
        vendorId: string,
        options: LedgerQueryOptions
    ): Promise<SubLedgerQueryResult>;

    /**
     * Get employee sub-ledger
     */
    getEmployeeLedger(
        tenantId: string,
        employeeId: string,
        options: LedgerQueryOptions
    ): Promise<SubLedgerQueryResult>;

    /**
     * Get trip-level ledger (for trip profitability)
     */
    getTripLedger(
        tenantId: string,
        tripId: string
    ): Promise<TripLedgerResult>;

    /**
     * Get all customer balances (receivables aging)
     */
    getCustomerBalances(
        tenantId: string,
        asOfDate: Date,
        branchId?: string,
        includeZeroBalances?: boolean
    ): Promise<SubLedgerBalance[]>;

    /**
     * Get all vendor balances (payables aging)
     */
    getVendorBalances(
        tenantId: string,
        asOfDate: Date,
        branchId?: string,
        includeZeroBalances?: boolean
    ): Promise<SubLedgerBalance[]>;

    /**
     * Get opening balance for a period
     */
    getOpeningBalance(
        tenantId: string,
        accountId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<number>;

    /**
     * Get period movements (debit/credit totals)
     */
    getPeriodMovements(
        tenantId: string,
        accountId: string,
        fiscalYear: number,
        fiscalPeriod: number,
        branchId?: string
    ): Promise<{ debit: number; credit: number }>;

    /**
     * Get inter-branch balances for consolidation
     */
    getInterBranchBalances(
        tenantId: string,
        asOfDate: Date
    ): Promise<InterBranchBalance[]>;
}

/**
 * Query options for ledger retrieval
 */
export interface LedgerQueryOptions {
    branchId?: string;
    fromDate?: Date;
    toDate?: Date;
    fiscalYear?: number;
    fiscalPeriod?: number;
    page?: number;
    pageSize?: number;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Ledger query result
 */
export interface LedgerQueryResult {
    entries: LedgerEntry[];
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    total: number;
    page: number;
    pageSize: number;
}

/**
 * Trial balance options
 */
export interface TrialBalanceOptions {
    branchId?: string;
    includeZeroBalances?: boolean;
    groupByType?: boolean;
    level?: number;  // Show accounts up to this level
}

/**
 * Trial balance result
 */
export interface TrialBalanceResult {
    lines: TrialBalanceLine[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    asOfDate: Date;
    branchId?: string;
}

/**
 * Sub-ledger query result
 */
export interface SubLedgerQueryResult {
    entries: LedgerEntry[];
    entityType: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
    entityId: string;
    entityName: string;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    total: number;
    page: number;
    pageSize: number;
}

/**
 * Trip ledger result for profitability
 */
export interface TripLedgerResult {
    tripId: string;
    tripName: string;
    branchId: string;
    entries: LedgerEntry[];
    
    // Revenue breakdown
    totalRevenue: number;
    seatRevenue: number;
    addonRevenue: number;
    rentalRevenue: number;
    
    // Cost breakdown
    totalCosts: number;
    vendorCosts: number;
    guideCosts: number;
    transportCosts: number;
    foodCosts: number;
    permitCosts: number;
    gearDepreciation: number;
    otaCommission: number;
    
    // Profitability
    grossProfit: number;
    grossMargin: number;  // Percentage
    netProfit: number;
    netMargin: number;    // Percentage
    
    // Per-seat metrics
    revenuePerSeat: number;
    costPerSeat: number;
    profitPerSeat: number;
    seatCount: number;
}

/**
 * Inter-branch balance for consolidation
 */
export interface InterBranchBalance {
    fromBranchId: string;
    fromBranchName: string;
    toBranchId: string;
    toBranchName: string;
    receivableAmount: number;
    payableAmount: number;
    netAmount: number;
}

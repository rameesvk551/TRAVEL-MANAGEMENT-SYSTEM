/**
 * Accounting Module Types
 * 
 * TypeScript interfaces for the Financial Accounting Engine
 */

// ==================== ENUMS ====================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export type JournalEntryType = 'STANDARD' | 'REVERSING' | 'RECURRING' | 'ADJUSTING' | 'OPENING' | 'CLOSING' | 'INTER_BRANCH';
export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'PENDING_APPROVAL';
export type FiscalPeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'CLOSED' | 'LOCKED';
export type TaxType = 'GST' | 'VAT' | 'SALES_TAX' | 'SERVICE_TAX' | 'TDS' | 'WITHHOLDING' | 'CUSTOM';

// ==================== CHART OF ACCOUNTS ====================

export interface Account {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    accountType: AccountType;
    subType?: string;
    normalBalance: NormalBalance;
    parentAccountId?: string;
    level: number;
    isHeader: boolean;
    isBankAccount: boolean;
    isTaxAccount: boolean;
    isSystemAccount: boolean;
    allowBranchPosting: boolean;
    currency: string;
    taxRate?: number;
    costCenterId?: string;
    status: AccountStatus;
    createdAt: string;
    updatedAt: string;
    // UI computed
    children?: Account[];
    balance?: number;
}

export interface AccountTreeNode extends Account {
    children: AccountTreeNode[];
    expanded?: boolean;
}

// ==================== JOURNAL ENTRIES ====================

export interface JournalEntry {
    id: string;
    tenantId: string;
    branchId: string;
    branchName?: string;
    entryNumber: string;
    entryDate: string;
    postingDate?: string;
    entryType: JournalEntryType;
    status: JournalEntryStatus;
    description: string;
    sourceModule: string;
    sourceRecordId?: string;
    sourceRecordType?: string;
    totalDebit: number;
    totalCredit: number;
    currency: string;
    exchangeRate: number;
    fiscalYear: number;
    fiscalPeriod: number;
    isReversed: boolean;
    reversedByEntryId?: string;
    reversesEntryId?: string;
    requiresApproval: boolean;
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
    createdBy: string;
    createdAt: string;
    lines?: JournalLine[];
}

export interface JournalLine {
    id: string;
    journalEntryId: string;
    accountId: string;
    accountCode?: string;
    accountName?: string;
    debitAmount: number;
    creditAmount: number;
    currency: string;
    exchangeRate: number;
    branchId?: string;
    costCenterId?: string;
    tripId?: string;
    bookingId?: string;
    vendorId?: string;
    customerId?: string;
    taxCode?: string;
    taxAmount?: number;
    description?: string;
    lineNumber: number;
}

// ==================== LEDGER ====================

export interface LedgerEntry {
    id: string;
    tenantId: string;
    branchId: string;
    branchName?: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    journalEntryId: string;
    journalLineId: string;
    entryNumber: string;
    entryDate: string;
    postingDate: string;
    description: string;
    debitAmount: number;
    creditAmount: number;
    runningBalance: number;
    currency: string;
    sourceModule: string;
    fiscalYear: number;
    fiscalPeriod: number;
    customerId?: string;
    vendorId?: string;
    tripId?: string;
    bookingId?: string;
    createdAt: string;
}

export interface AccountBalance {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    openingBalance: number;
    debitTotal: number;
    creditTotal: number;
    closingBalance: number;
    fiscalYear: number;
    fiscalPeriod: number;
}

// ==================== FISCAL PERIODS ====================

export interface FiscalYear {
    id: string;
    tenantId: string;
    year: number;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    isClosed: boolean;
    isLocked: boolean;
    closedAt?: string;
    closedBy?: string;
}

export interface FiscalPeriod {
    id: string;
    tenantId: string;
    branchId?: string;
    fiscalYear: number;
    periodNumber: number;
    periodName: string;
    startDate: string;
    endDate: string;
    status: FiscalPeriodStatus;
    adjustmentsAllowed: boolean;
    closedAt?: string;
}

// ==================== TAX ====================

export interface TaxCode {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    description?: string;
    taxType: TaxType;
    taxCategory: string;
    rate: number;
    calculationMethod: 'EXCLUSIVE' | 'INCLUSIVE';
    inputTaxAccountId?: string;
    outputTaxAccountId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive: boolean;
    isReverseCharge: boolean;
    isCompound: boolean;
}

// ==================== BANK ACCOUNTS ====================

export interface BankAccount {
    id: string;
    tenantId: string;
    branchId: string;
    branchName?: string;
    accountId: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    ifscCode?: string;
    currency: string;
    openingBalance: number;
    currentBalance: number;
    isActive: boolean;
    isPrimary: boolean;
}

export interface BankTransaction {
    id: string;
    tenantId: string;
    bankAccountId: string;
    transactionDate: string;
    valueDate: string;
    description: string;
    reference?: string;
    debitAmount: number;
    creditAmount: number;
    runningBalance?: number;
    isReconciled: boolean;
    reconciledAt?: string;
    journalEntryId?: string;
}

// ==================== REPORTS ====================

export interface TrialBalanceRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    level: number;
    isHeader: boolean;
    openingDebit: number;
    openingCredit: number;
    periodDebit: number;
    periodCredit: number;
    closingDebit: number;
    closingCredit: number;
}

export interface TrialBalanceReport {
    asOfDate: string;
    fiscalYear: number;
    fiscalPeriod?: number;
    branchId?: string;
    branchName?: string;
    rows: TrialBalanceRow[];
    totals: {
        openingDebit: number;
        openingCredit: number;
        periodDebit: number;
        periodCredit: number;
        closingDebit: number;
        closingCredit: number;
    };
    isBalanced: boolean;
}

export interface ProfitLossReport {
    periodFrom: string;
    periodTo: string;
    branchId?: string;
    branchName?: string;
    revenue: {
        accounts: { code: string; name: string; amount: number }[];
        total: number;
    };
    costOfSales: {
        accounts: { code: string; name: string; amount: number }[];
        total: number;
    };
    grossProfit: number;
    operatingExpenses: {
        accounts: { code: string; name: string; amount: number }[];
        total: number;
    };
    operatingProfit: number;
    otherIncome: number;
    otherExpenses: number;
    netProfit: number;
    profitMargin: number;
}

export interface BalanceSheetReport {
    asOfDate: string;
    branchId?: string;
    branchName?: string;
    assets: {
        current: { code: string; name: string; amount: number }[];
        fixed: { code: string; name: string; amount: number }[];
        total: number;
    };
    liabilities: {
        current: { code: string; name: string; amount: number }[];
        longTerm: { code: string; name: string; amount: number }[];
        total: number;
    };
    equity: {
        items: { code: string; name: string; amount: number }[];
        retainedEarnings: number;
        total: number;
    };
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
}

// ==================== DASHBOARD KPIs ====================

export interface AccountingDashboardKPIs {
    revenue: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
    };
    expenses: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
    };
    netProfit: {
        current: number;
        previous: number;
        change: number;
        changePercent: number;
    };
    cashBalance: number;
    receivables: number;
    payables: number;
    pendingJournals: number;
    unreconciledTransactions: number;
}

export interface RevenueByBranch {
    branchId: string;
    branchName: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface MonthlyTrend {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

// ==================== API PARAMS ====================

export interface AccountsQueryParams {
    accountType?: AccountType;
    status?: AccountStatus;
    isHeader?: boolean;
    parentAccountId?: string;
    search?: string;
}

export interface JournalEntriesQueryParams {
    branchId?: string;
    status?: JournalEntryStatus;
    sourceModule?: string;
    fiscalYear?: number;
    fiscalPeriod?: number;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface LedgerQueryParams {
    accountId: string;
    branchId?: string;
    fiscalYear?: number;
    fiscalPeriod?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

export interface ReportQueryParams {
    branchId?: string;
    fiscalYear?: number;
    fiscalPeriod?: number;
    dateFrom?: string;
    dateTo?: string;
    asOfDate?: string;
}

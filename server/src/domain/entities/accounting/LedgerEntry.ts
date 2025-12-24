import { generateId } from '../../../shared/utils/index.js';

/**
 * Ledger Entry represents a single posting to the general ledger.
 * This is IMMUTABLE - once created, it can never be modified.
 * Corrections are made via contra entries only.
 */

export type LedgerEntryType = 'POSTED' | 'OPENING' | 'CLOSING';

/**
 * Ledger Entry Properties
 */
export interface LedgerEntryProps {
    id?: string;
    tenantId: string;
    branchId: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    journalEntryId: string;
    journalLineId: string;
    entryNumber: string;
    
    // Transaction details
    entryDate: Date;
    postingDate: Date;
    description: string;
    
    // Amounts (only one should be non-zero)
    debitAmount: number;
    creditAmount: number;
    
    // Running balance (calculated at posting time)
    runningBalance: number;
    
    // Multi-currency
    currency: string;
    exchangeRate: number;
    baseCurrencyDebit: number;
    baseCurrencyCredit: number;
    
    // Dimensions for sub-ledgers
    customerId?: string;
    vendorId?: string;
    employeeId?: string;
    tripId?: string;
    bookingId?: string;
    costCenterId?: string;
    
    // Source tracking
    sourceModule: string;
    sourceRecordId?: string;
    
    // Fiscal period
    fiscalYear: number;
    fiscalPeriod: number;
    
    // Entry type
    entryType?: LedgerEntryType;
    
    // Timestamp (immutable)
    createdAt?: Date;
    createdBy: string;
}

/**
 * Ledger Entry Entity - Immutable record in the General Ledger
 * 
 * Design Principles:
 * - IMMUTABLE: Cannot be edited after creation
 * - ATOMIC: Each entry represents a single account posting
 * - BALANCED: Part of a balanced journal entry
 * - TRACEABLE: Full audit trail to source
 */
export class LedgerEntry {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string;
    public readonly accountId: string;
    public readonly accountCode: string;
    public readonly accountName: string;
    public readonly journalEntryId: string;
    public readonly journalLineId: string;
    public readonly entryNumber: string;
    public readonly entryDate: Date;
    public readonly postingDate: Date;
    public readonly description: string;
    public readonly debitAmount: number;
    public readonly creditAmount: number;
    public readonly runningBalance: number;
    public readonly currency: string;
    public readonly exchangeRate: number;
    public readonly baseCurrencyDebit: number;
    public readonly baseCurrencyCredit: number;
    public readonly customerId: string | null;
    public readonly vendorId: string | null;
    public readonly employeeId: string | null;
    public readonly tripId: string | null;
    public readonly bookingId: string | null;
    public readonly costCenterId: string | null;
    public readonly sourceModule: string;
    public readonly sourceRecordId: string | null;
    public readonly fiscalYear: number;
    public readonly fiscalPeriod: number;
    public readonly entryType: LedgerEntryType;
    public readonly createdAt: Date;
    public readonly createdBy: string;

    private constructor(props: LedgerEntryProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId;
        this.accountId = props.accountId;
        this.accountCode = props.accountCode;
        this.accountName = props.accountName;
        this.journalEntryId = props.journalEntryId;
        this.journalLineId = props.journalLineId;
        this.entryNumber = props.entryNumber;
        this.entryDate = props.entryDate;
        this.postingDate = props.postingDate;
        this.description = props.description;
        this.debitAmount = props.debitAmount;
        this.creditAmount = props.creditAmount;
        this.runningBalance = props.runningBalance;
        this.currency = props.currency;
        this.exchangeRate = props.exchangeRate;
        this.baseCurrencyDebit = props.baseCurrencyDebit;
        this.baseCurrencyCredit = props.baseCurrencyCredit;
        this.customerId = props.customerId ?? null;
        this.vendorId = props.vendorId ?? null;
        this.employeeId = props.employeeId ?? null;
        this.tripId = props.tripId ?? null;
        this.bookingId = props.bookingId ?? null;
        this.costCenterId = props.costCenterId ?? null;
        this.sourceModule = props.sourceModule;
        this.sourceRecordId = props.sourceRecordId ?? null;
        this.fiscalYear = props.fiscalYear;
        this.fiscalPeriod = props.fiscalPeriod;
        this.entryType = props.entryType ?? 'POSTED';
        this.createdAt = props.createdAt ?? new Date();
        this.createdBy = props.createdBy;
    }

    static create(props: LedgerEntryProps): LedgerEntry {
        return new LedgerEntry({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: LedgerEntryProps & { id: string }): LedgerEntry {
        return new LedgerEntry(data);
    }

    /**
     * Get the net amount (debit - credit)
     */
    getNetAmount(): number {
        return this.debitAmount - this.creditAmount;
    }

    /**
     * Check if this is a debit entry
     */
    isDebit(): boolean {
        return this.debitAmount > 0;
    }

    /**
     * Check if this is a credit entry
     */
    isCredit(): boolean {
        return this.creditAmount > 0;
    }
}

/**
 * Account Balance - Summary view of an account's balance
 */
export interface AccountBalance {
    accountId: string;
    accountCode: string;
    accountName: string;
    branchId?: string;
    branchName?: string;
    fiscalYear: number;
    fiscalPeriod?: number;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    netMovement: number;
    closingBalance: number;
    currency: string;
    asOfDate: Date;
}

/**
 * Trial Balance Line
 */
export interface TrialBalanceLine {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    level: number;
    debitBalance: number;
    creditBalance: number;
    isHeader: boolean;
}

/**
 * Sub-Ledger Balance (Customer/Vendor/Employee)
 */
export interface SubLedgerBalance {
    entityType: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE' | 'TRIP';
    entityId: string;
    entityName: string;
    branchId?: string;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    currency: string;
    asOfDate: Date;
    agingBuckets?: {
        current: number;
        days30: number;
        days60: number;
        days90: number;
        over90: number;
    };
}

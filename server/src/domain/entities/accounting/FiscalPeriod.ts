import { generateId } from '../../../shared/utils/index.js';

/**
 * Fiscal Period represents a financial accounting period (typically a month)
 */

export type FiscalPeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'CLOSED' | 'LOCKED';

export interface FiscalPeriodProps {
    id?: string;
    tenantId: string;
    branchId?: string;           // null = company-wide period
    fiscalYear: number;
    periodNumber: number;        // 1-12 for monthly, 1-4 for quarterly
    periodName: string;          // e.g., "January 2024", "Q1 2024"
    startDate: Date;
    endDate: Date;
    status: FiscalPeriodStatus;
    
    // Balances at period close
    openingBalancesPosted?: boolean;
    closingBalancesPosted?: boolean;
    retainedEarningsPosted?: boolean;
    
    // Close tracking
    closedAt?: Date;
    closedBy?: string;
    lockedAt?: Date;
    lockedBy?: string;
    
    // Adjustments
    adjustmentsAllowed?: boolean;
    adjustmentDeadline?: Date;
    
    // Audit
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Fiscal Period Entity
 */
export class FiscalPeriod {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string | null;
    public readonly fiscalYear: number;
    public readonly periodNumber: number;
    public readonly periodName: string;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly status: FiscalPeriodStatus;
    public readonly openingBalancesPosted: boolean;
    public readonly closingBalancesPosted: boolean;
    public readonly retainedEarningsPosted: boolean;
    public readonly closedAt: Date | null;
    public readonly closedBy: string | null;
    public readonly lockedAt: Date | null;
    public readonly lockedBy: string | null;
    public readonly adjustmentsAllowed: boolean;
    public readonly adjustmentDeadline: Date | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: FiscalPeriodProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId ?? null;
        this.fiscalYear = props.fiscalYear;
        this.periodNumber = props.periodNumber;
        this.periodName = props.periodName;
        this.startDate = props.startDate;
        this.endDate = props.endDate;
        this.status = props.status;
        this.openingBalancesPosted = props.openingBalancesPosted ?? false;
        this.closingBalancesPosted = props.closingBalancesPosted ?? false;
        this.retainedEarningsPosted = props.retainedEarningsPosted ?? false;
        this.closedAt = props.closedAt ?? null;
        this.closedBy = props.closedBy ?? null;
        this.lockedAt = props.lockedAt ?? null;
        this.lockedBy = props.lockedBy ?? null;
        this.adjustmentsAllowed = props.adjustmentsAllowed ?? true;
        this.adjustmentDeadline = props.adjustmentDeadline ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: FiscalPeriodProps): FiscalPeriod {
        return new FiscalPeriod({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: FiscalPeriodProps & { id: string }): FiscalPeriod {
        return new FiscalPeriod(data);
    }

    /**
     * Check if posting is allowed in this period
     */
    canPost(): boolean {
        return this.status === 'OPEN' || 
               (this.status === 'SOFT_CLOSED' && this.adjustmentsAllowed);
    }

    /**
     * Check if period is fully closed
     */
    isClosed(): boolean {
        return this.status === 'CLOSED' || this.status === 'LOCKED';
    }

    /**
     * Soft close the period (allow adjustments)
     */
    softClose(userId: string): FiscalPeriod {
        if (this.status !== 'OPEN') {
            throw new Error('Only open periods can be soft-closed');
        }
        return FiscalPeriod.create({
            ...this.toProps(),
            status: 'SOFT_CLOSED',
            adjustmentsAllowed: true,
            updatedAt: new Date(),
        });
    }

    /**
     * Fully close the period
     */
    close(userId: string): FiscalPeriod {
        if (this.status === 'LOCKED') {
            throw new Error('Locked periods cannot be modified');
        }
        return FiscalPeriod.create({
            ...this.toProps(),
            status: 'CLOSED',
            closedAt: new Date(),
            closedBy: userId,
            adjustmentsAllowed: false,
            updatedAt: new Date(),
        });
    }

    /**
     * Lock the period permanently
     */
    lock(userId: string): FiscalPeriod {
        if (this.status !== 'CLOSED') {
            throw new Error('Only closed periods can be locked');
        }
        return FiscalPeriod.create({
            ...this.toProps(),
            status: 'LOCKED',
            lockedAt: new Date(),
            lockedBy: userId,
            updatedAt: new Date(),
        });
    }

    /**
     * Reopen a soft-closed period
     */
    reopen(): FiscalPeriod {
        if (this.status !== 'SOFT_CLOSED') {
            throw new Error('Only soft-closed periods can be reopened');
        }
        return FiscalPeriod.create({
            ...this.toProps(),
            status: 'OPEN',
            updatedAt: new Date(),
        });
    }

    toProps(): FiscalPeriodProps & { id: string } {
        return {
            id: this.id,
            tenantId: this.tenantId,
            branchId: this.branchId ?? undefined,
            fiscalYear: this.fiscalYear,
            periodNumber: this.periodNumber,
            periodName: this.periodName,
            startDate: this.startDate,
            endDate: this.endDate,
            status: this.status,
            openingBalancesPosted: this.openingBalancesPosted,
            closingBalancesPosted: this.closingBalancesPosted,
            retainedEarningsPosted: this.retainedEarningsPosted,
            closedAt: this.closedAt ?? undefined,
            closedBy: this.closedBy ?? undefined,
            lockedAt: this.lockedAt ?? undefined,
            lockedBy: this.lockedBy ?? undefined,
            adjustmentsAllowed: this.adjustmentsAllowed,
            adjustmentDeadline: this.adjustmentDeadline ?? undefined,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

/**
 * Fiscal Year represents a complete financial year
 */
export interface FiscalYearProps {
    id?: string;
    tenantId: string;
    year: number;
    name: string;               // e.g., "FY 2024-25"
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    isClosed: boolean;
    isLocked: boolean;
    closedAt?: Date;
    closedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class FiscalYear {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly year: number;
    public readonly name: string;
    public readonly startDate: Date;
    public readonly endDate: Date;
    public readonly isCurrent: boolean;
    public readonly isClosed: boolean;
    public readonly isLocked: boolean;
    public readonly closedAt: Date | null;
    public readonly closedBy: string | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: FiscalYearProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.year = props.year;
        this.name = props.name;
        this.startDate = props.startDate;
        this.endDate = props.endDate;
        this.isCurrent = props.isCurrent;
        this.isClosed = props.isClosed;
        this.isLocked = props.isLocked;
        this.closedAt = props.closedAt ?? null;
        this.closedBy = props.closedBy ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: FiscalYearProps): FiscalYear {
        return new FiscalYear({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: FiscalYearProps & { id: string }): FiscalYear {
        return new FiscalYear(data);
    }

    /**
     * Generate all 12 monthly periods for this fiscal year
     */
    generatePeriods(): FiscalPeriodProps[] {
        const periods: FiscalPeriodProps[] = [];
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        let currentDate = new Date(this.startDate);
        let periodNumber = 1;

        while (currentDate < this.endDate && periodNumber <= 12) {
            const periodStart = new Date(currentDate);
            const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            
            // Adjust end date if it's beyond fiscal year end
            const effectiveEndDate = periodEnd > this.endDate ? this.endDate : periodEnd;

            periods.push({
                tenantId: this.tenantId,
                fiscalYear: this.year,
                periodNumber,
                periodName: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
                startDate: periodStart,
                endDate: effectiveEndDate,
                status: 'OPEN',
            });

            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            periodNumber++;
        }

        return periods;
    }
}

/**
 * Bank Account entity for bank reconciliation
 */
export interface BankAccountProps {
    id?: string;
    tenantId: string;
    branchId?: string;
    accountId: string;           // Link to COA account
    bankName: string;
    accountNumber: string;
    accountType: 'CURRENT' | 'SAVINGS' | 'CASH_CREDIT' | 'OVERDRAFT' | 'PAYMENT_GATEWAY';
    ifscCode?: string;
    swiftCode?: string;
    currency: string;
    openingBalance: number;
    currentBalance?: number;
    isActive: boolean;
    isPrimary: boolean;
    lastReconciledDate?: Date;
    lastReconciledBalance?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export class BankAccount {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string | null;
    public readonly accountId: string;
    public readonly bankName: string;
    public readonly accountNumber: string;
    public readonly accountType: 'CURRENT' | 'SAVINGS' | 'CASH_CREDIT' | 'OVERDRAFT' | 'PAYMENT_GATEWAY';
    public readonly ifscCode: string | null;
    public readonly swiftCode: string | null;
    public readonly currency: string;
    public readonly openingBalance: number;
    public readonly currentBalance: number;
    public readonly isActive: boolean;
    public readonly isPrimary: boolean;
    public readonly lastReconciledDate: Date | null;
    public readonly lastReconciledBalance: number | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: BankAccountProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId ?? null;
        this.accountId = props.accountId;
        this.bankName = props.bankName;
        this.accountNumber = props.accountNumber;
        this.accountType = props.accountType;
        this.ifscCode = props.ifscCode ?? null;
        this.swiftCode = props.swiftCode ?? null;
        this.currency = props.currency;
        this.openingBalance = props.openingBalance;
        this.currentBalance = props.currentBalance ?? props.openingBalance;
        this.isActive = props.isActive;
        this.isPrimary = props.isPrimary;
        this.lastReconciledDate = props.lastReconciledDate ?? null;
        this.lastReconciledBalance = props.lastReconciledBalance ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: BankAccountProps): BankAccount {
        return new BankAccount({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: BankAccountProps & { id: string }): BankAccount {
        return new BankAccount(data);
    }
}

/**
 * Bank Transaction for reconciliation
 */
export interface BankTransactionProps {
    id?: string;
    tenantId: string;
    bankAccountId: string;
    transactionDate: Date;
    valueDate?: Date;
    description: string;
    reference?: string;
    debitAmount: number;
    creditAmount: number;
    balance?: number;
    
    // Reconciliation
    isReconciled: boolean;
    reconciledAt?: Date;
    reconciledBy?: string;
    matchedLedgerEntryId?: string;
    matchedJournalEntryId?: string;
    
    // Source
    importedFrom?: string;       // Bank statement import reference
    importedAt?: Date;
    
    createdAt?: Date;
    updatedAt?: Date;
}

export class BankTransaction {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly bankAccountId: string;
    public readonly transactionDate: Date;
    public readonly valueDate: Date;
    public readonly description: string;
    public readonly reference: string | null;
    public readonly debitAmount: number;
    public readonly creditAmount: number;
    public readonly balance: number | null;
    public readonly isReconciled: boolean;
    public readonly reconciledAt: Date | null;
    public readonly reconciledBy: string | null;
    public readonly matchedLedgerEntryId: string | null;
    public readonly matchedJournalEntryId: string | null;
    public readonly importedFrom: string | null;
    public readonly importedAt: Date | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: BankTransactionProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.bankAccountId = props.bankAccountId;
        this.transactionDate = props.transactionDate;
        this.valueDate = props.valueDate ?? props.transactionDate;
        this.description = props.description;
        this.reference = props.reference ?? null;
        this.debitAmount = props.debitAmount;
        this.creditAmount = props.creditAmount;
        this.balance = props.balance ?? null;
        this.isReconciled = props.isReconciled;
        this.reconciledAt = props.reconciledAt ?? null;
        this.reconciledBy = props.reconciledBy ?? null;
        this.matchedLedgerEntryId = props.matchedLedgerEntryId ?? null;
        this.matchedJournalEntryId = props.matchedJournalEntryId ?? null;
        this.importedFrom = props.importedFrom ?? null;
        this.importedAt = props.importedAt ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: BankTransactionProps): BankTransaction {
        return new BankTransaction({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: BankTransactionProps & { id: string }): BankTransaction {
        return new BankTransaction(data);
    }

    /**
     * Mark as reconciled
     */
    reconcile(userId: string, ledgerEntryId: string, journalEntryId: string): BankTransaction {
        return BankTransaction.create({
            ...this,
            isReconciled: true,
            reconciledAt: new Date(),
            reconciledBy: userId,
            matchedLedgerEntryId: ledgerEntryId,
            matchedJournalEntryId: journalEntryId,
            updatedAt: new Date(),
        });
    }
}

/**
 * Cost Center for expense tracking and allocation
 */
export interface CostCenterProps {
    id?: string;
    tenantId: string;
    branchId?: string;
    code: string;
    name: string;
    description?: string;
    parentCostCenterId?: string;
    level: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class CostCenter {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string | null;
    public readonly code: string;
    public readonly name: string;
    public readonly description: string | null;
    public readonly parentCostCenterId: string | null;
    public readonly level: number;
    public readonly isActive: boolean;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: CostCenterProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId ?? null;
        this.code = props.code;
        this.name = props.name;
        this.description = props.description ?? null;
        this.parentCostCenterId = props.parentCostCenterId ?? null;
        this.level = props.level;
        this.isActive = props.isActive;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: CostCenterProps): CostCenter {
        return new CostCenter({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: CostCenterProps & { id: string }): CostCenter {
        return new CostCenter(data);
    }
}

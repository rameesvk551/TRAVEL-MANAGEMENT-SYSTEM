import { generateId } from '../../../shared/utils/index.js';

/**
 * Journal Entry Status
 */
export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'REVERSED' | 'PENDING_APPROVAL';

/**
 * Source modules that can generate journal entries
 */
export type SourceModule =
    | 'BOOKING'
    | 'PAYMENT'
    | 'REFUND'
    | 'VENDOR'
    | 'PAYROLL'
    | 'EXPENSE'
    | 'INVENTORY'
    | 'GEAR'
    | 'DEPRECIATION'
    | 'TAX'
    | 'BANK'
    | 'INTER_BRANCH'
    | 'ADJUSTMENT'
    | 'OPENING_BALANCE'
    | 'CLOSING'
    | 'MANUAL';

/**
 * Journal Entry Type for categorization
 */
export type JournalEntryType =
    | 'STANDARD'           // Normal business transactions
    | 'REVERSING'          // Correction entries
    | 'RECURRING'          // Recurring entries (depreciation, etc.)
    | 'ADJUSTING'          // Period-end adjustments
    | 'OPENING'            // Opening balance entries
    | 'CLOSING'            // Period closing entries
    | 'INTER_BRANCH';      // Inter-branch transfers

/**
 * Individual line item in a journal entry
 */
export interface JournalLineProps {
    id?: string;
    journalEntryId?: string;
    accountId: string;
    accountCode?: string;      // Denormalized for reporting
    accountName?: string;      // Denormalized for reporting
    description?: string;
    debitAmount: number;
    creditAmount: number;
    currency?: string;
    exchangeRate?: number;     // For multi-currency
    baseCurrencyAmount?: number;
    
    // Dimensions for reporting
    branchId?: string;
    costCenterId?: string;
    tripId?: string;           // For trip-level profitability
    bookingId?: string;
    vendorId?: string;
    customerId?: string;
    employeeId?: string;
    
    // Tax
    taxCode?: string;
    taxAmount?: number;
    
    lineNumber: number;
}

/**
 * Journal Line Entity
 */
export class JournalLine {
    public readonly id: string;
    public readonly journalEntryId: string;
    public readonly accountId: string;
    public readonly accountCode: string | null;
    public readonly accountName: string | null;
    public readonly description: string | null;
    public readonly debitAmount: number;
    public readonly creditAmount: number;
    public readonly currency: string;
    public readonly exchangeRate: number;
    public readonly baseCurrencyAmount: number;
    public readonly branchId: string | null;
    public readonly costCenterId: string | null;
    public readonly tripId: string | null;
    public readonly bookingId: string | null;
    public readonly vendorId: string | null;
    public readonly customerId: string | null;
    public readonly employeeId: string | null;
    public readonly taxCode: string | null;
    public readonly taxAmount: number;
    public readonly lineNumber: number;

    constructor(props: JournalLineProps & { id: string; journalEntryId: string }) {
        this.id = props.id;
        this.journalEntryId = props.journalEntryId;
        this.accountId = props.accountId;
        this.accountCode = props.accountCode ?? null;
        this.accountName = props.accountName ?? null;
        this.description = props.description ?? null;
        this.debitAmount = props.debitAmount;
        this.creditAmount = props.creditAmount;
        this.currency = props.currency ?? 'INR';
        this.exchangeRate = props.exchangeRate ?? 1;
        this.baseCurrencyAmount = props.baseCurrencyAmount ?? (props.debitAmount - props.creditAmount);
        this.branchId = props.branchId ?? null;
        this.costCenterId = props.costCenterId ?? null;
        this.tripId = props.tripId ?? null;
        this.bookingId = props.bookingId ?? null;
        this.vendorId = props.vendorId ?? null;
        this.customerId = props.customerId ?? null;
        this.employeeId = props.employeeId ?? null;
        this.taxCode = props.taxCode ?? null;
        this.taxAmount = props.taxAmount ?? 0;
        this.lineNumber = props.lineNumber;
    }

    /**
     * Get the net amount (debit - credit)
     */
    getNetAmount(): number {
        return this.debitAmount - this.creditAmount;
    }

    /**
     * Check if this is a debit line
     */
    isDebit(): boolean {
        return this.debitAmount > 0;
    }

    /**
     * Check if this is a credit line
     */
    isCredit(): boolean {
        return this.creditAmount > 0;
    }
}

/**
 * Journal Entry Properties
 */
export interface JournalEntryProps {
    id?: string;
    tenantId: string;
    branchId: string;              // REQUIRED: Every journal must have a branch
    entryNumber?: string;          // Auto-generated sequence
    entryDate: Date;
    postingDate?: Date;
    entryType?: JournalEntryType;
    status?: JournalEntryStatus;
    description: string;
    
    // Source tracking (audit trail)
    sourceModule: SourceModule;
    sourceRecordId?: string;       // e.g., booking_id, payment_id
    sourceRecordType?: string;     // e.g., 'booking', 'payment'
    
    // Lines
    lines: JournalLineProps[];
    
    // Totals
    totalDebit?: number;
    totalCredit?: number;
    
    // Multi-currency
    currency?: string;
    exchangeRate?: number;
    
    // Fiscal Period
    fiscalYear?: number;
    fiscalPeriod?: number;         // 1-12 for months
    
    // Reversal tracking
    isReversed?: boolean;
    reversedByEntryId?: string;
    reversesEntryId?: string;      // If this entry reverses another
    
    // Approval workflow
    requiresApproval?: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    
    // Audit
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Notes & attachments
    notes?: string;
    attachments?: string[];
}

/**
 * Journal Entry Entity - The core of the double-entry system
 * 
 * Design Principles:
 * - IMMUTABLE: Once posted, entries cannot be modified
 * - BALANCED: Total debits MUST equal total credits
 * - BRANCH-AWARE: Every entry belongs to exactly one branch
 * - AUDITABLE: Full source tracking for every entry
 */
export class JournalEntry {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly branchId: string;
    public readonly entryNumber: string | null;
    public readonly entryDate: Date;
    public readonly postingDate: Date;
    public readonly entryType: JournalEntryType;
    public readonly status: JournalEntryStatus;
    public readonly description: string;
    public readonly sourceModule: SourceModule;
    public readonly sourceRecordId: string | null;
    public readonly sourceRecordType: string | null;
    public readonly lines: JournalLine[];
    public readonly totalDebit: number;
    public readonly totalCredit: number;
    public readonly currency: string;
    public readonly exchangeRate: number;
    public readonly fiscalYear: number;
    public readonly fiscalPeriod: number;
    public readonly isReversed: boolean;
    public readonly reversedByEntryId: string | null;
    public readonly reversesEntryId: string | null;
    public readonly requiresApproval: boolean;
    public readonly approvedBy: string | null;
    public readonly approvedAt: Date | null;
    public readonly createdBy: string;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;
    public readonly notes: string | null;
    public readonly attachments: string[];

    private constructor(props: JournalEntryProps & { id: string; lines: JournalLine[] }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.branchId = props.branchId;
        this.entryNumber = props.entryNumber ?? null;
        this.entryDate = props.entryDate;
        this.postingDate = props.postingDate ?? props.entryDate;
        this.entryType = props.entryType ?? 'STANDARD';
        this.status = props.status ?? 'DRAFT';
        this.description = props.description;
        this.sourceModule = props.sourceModule;
        this.sourceRecordId = props.sourceRecordId ?? null;
        this.sourceRecordType = props.sourceRecordType ?? null;
        this.lines = props.lines;
        this.totalDebit = props.totalDebit ?? this.calculateTotalDebit();
        this.totalCredit = props.totalCredit ?? this.calculateTotalCredit();
        this.currency = props.currency ?? 'INR';
        this.exchangeRate = props.exchangeRate ?? 1;
        this.fiscalYear = props.fiscalYear ?? new Date().getFullYear();
        this.fiscalPeriod = props.fiscalPeriod ?? (new Date().getMonth() + 1);
        this.isReversed = props.isReversed ?? false;
        this.reversedByEntryId = props.reversedByEntryId ?? null;
        this.reversesEntryId = props.reversesEntryId ?? null;
        this.requiresApproval = props.requiresApproval ?? false;
        this.approvedBy = props.approvedBy ?? null;
        this.approvedAt = props.approvedAt ?? null;
        this.createdBy = props.createdBy;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
        this.notes = props.notes ?? null;
        this.attachments = props.attachments ?? [];
    }

    /**
     * Create a new journal entry
     */
    static create(props: JournalEntryProps): JournalEntry {
        const id = props.id ?? generateId();
        
        // Create lines with proper IDs
        const lines = props.lines.map((line, index) => new JournalLine({
            id: line.id ?? generateId(),
            journalEntryId: id,
            ...line,
            lineNumber: line.lineNumber ?? index + 1,
        }));

        const entry = new JournalEntry({
            id,
            ...props,
            lines,
        });

        // Validate balance
        if (!entry.isBalanced()) {
            throw new Error(`Journal entry is not balanced. Debits: ${entry.totalDebit}, Credits: ${entry.totalCredit}`);
        }

        return entry;
    }

    /**
     * Restore from persistence
     */
    static fromPersistence(props: JournalEntryProps & { id: string }, lines: JournalLine[]): JournalEntry {
        return new JournalEntry({
            ...props,
            lines,
        });
    }

    /**
     * Calculate total debits
     */
    private calculateTotalDebit(): number {
        return this.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    }

    /**
     * Calculate total credits
     */
    private calculateTotalCredit(): number {
        return this.lines.reduce((sum, line) => sum + line.creditAmount, 0);
    }

    /**
     * Check if the entry is balanced (debits = credits)
     */
    isBalanced(): boolean {
        // Use rounding to handle floating-point precision issues
        const roundedDebit = Math.round(this.totalDebit * 100);
        const roundedCredit = Math.round(this.totalCredit * 100);
        return roundedDebit === roundedCredit;
    }

    /**
     * Check if entry can be posted
     */
    canPost(): boolean {
        return this.status === 'DRAFT' && 
               this.isBalanced() && 
               this.lines.length >= 2 &&
               (!this.requiresApproval || this.approvedBy !== null);
    }

    /**
     * Post the journal entry (make it permanent)
     */
    post(entryNumber: string): JournalEntry {
        if (!this.canPost()) {
            throw new Error('Journal entry cannot be posted');
        }

        return new JournalEntry({
            ...this.toProps(),
            entryNumber,
            status: 'POSTED',
            postingDate: new Date(),
            updatedAt: new Date(),
            lines: this.lines,
        });
    }

    /**
     * Create a reversing entry
     */
    createReversalEntry(reversedBy: string): JournalEntry {
        if (this.status !== 'POSTED') {
            throw new Error('Only posted entries can be reversed');
        }

        if (this.isReversed) {
            throw new Error('Entry is already reversed');
        }

        // Swap debits and credits
        const reversedLines: JournalLineProps[] = this.lines.map(line => ({
            accountId: line.accountId,
            accountCode: line.accountCode ?? undefined,
            accountName: line.accountName ?? undefined,
            description: `Reversal: ${line.description ?? ''}`,
            debitAmount: line.creditAmount,
            creditAmount: line.debitAmount,
            currency: line.currency,
            exchangeRate: line.exchangeRate,
            branchId: line.branchId ?? undefined,
            costCenterId: line.costCenterId ?? undefined,
            tripId: line.tripId ?? undefined,
            bookingId: line.bookingId ?? undefined,
            vendorId: line.vendorId ?? undefined,
            customerId: line.customerId ?? undefined,
            employeeId: line.employeeId ?? undefined,
            taxCode: line.taxCode ?? undefined,
            taxAmount: line.taxAmount,
            lineNumber: line.lineNumber,
        }));

        return JournalEntry.create({
            tenantId: this.tenantId,
            branchId: this.branchId,
            entryDate: new Date(),
            entryType: 'REVERSING',
            description: `Reversal of ${this.entryNumber}: ${this.description}`,
            sourceModule: this.sourceModule,
            sourceRecordId: this.sourceRecordId ?? undefined,
            sourceRecordType: this.sourceRecordType ?? undefined,
            reversesEntryId: this.id,
            createdBy: reversedBy,
            lines: reversedLines,
        });
    }

    /**
     * Mark as reversed
     */
    markAsReversed(reversalEntryId: string): JournalEntry {
        return new JournalEntry({
            ...this.toProps(),
            status: 'REVERSED',
            isReversed: true,
            reversedByEntryId: reversalEntryId,
            updatedAt: new Date(),
            lines: this.lines,
        });
    }

    /**
     * Approve the entry
     */
    approve(approvedBy: string): JournalEntry {
        if (this.status !== 'PENDING_APPROVAL') {
            throw new Error('Only pending entries can be approved');
        }

        return new JournalEntry({
            ...this.toProps(),
            status: 'DRAFT',
            approvedBy,
            approvedAt: new Date(),
            updatedAt: new Date(),
            lines: this.lines,
        });
    }

    /**
     * Get lines for a specific account
     */
    getLinesForAccount(accountId: string): JournalLine[] {
        return this.lines.filter(line => line.accountId === accountId);
    }

    /**
     * Get debit lines only
     */
    getDebitLines(): JournalLine[] {
        return this.lines.filter(line => line.isDebit());
    }

    /**
     * Get credit lines only
     */
    getCreditLines(): JournalLine[] {
        return this.lines.filter(line => line.isCredit());
    }

    /**
     * Convert to props for persistence/cloning
     */
    toProps(): JournalEntryProps & { id: string } {
        return {
            id: this.id,
            tenantId: this.tenantId,
            branchId: this.branchId,
            entryNumber: this.entryNumber ?? undefined,
            entryDate: this.entryDate,
            postingDate: this.postingDate,
            entryType: this.entryType,
            status: this.status,
            description: this.description,
            sourceModule: this.sourceModule,
            sourceRecordId: this.sourceRecordId ?? undefined,
            sourceRecordType: this.sourceRecordType ?? undefined,
            lines: this.lines.map(line => ({
                id: line.id,
                journalEntryId: line.journalEntryId,
                accountId: line.accountId,
                accountCode: line.accountCode ?? undefined,
                accountName: line.accountName ?? undefined,
                description: line.description ?? undefined,
                debitAmount: line.debitAmount,
                creditAmount: line.creditAmount,
                currency: line.currency,
                exchangeRate: line.exchangeRate,
                baseCurrencyAmount: line.baseCurrencyAmount,
                branchId: line.branchId ?? undefined,
                costCenterId: line.costCenterId ?? undefined,
                tripId: line.tripId ?? undefined,
                bookingId: line.bookingId ?? undefined,
                vendorId: line.vendorId ?? undefined,
                customerId: line.customerId ?? undefined,
                employeeId: line.employeeId ?? undefined,
                taxCode: line.taxCode ?? undefined,
                taxAmount: line.taxAmount,
                lineNumber: line.lineNumber,
            })),
            totalDebit: this.totalDebit,
            totalCredit: this.totalCredit,
            currency: this.currency,
            exchangeRate: this.exchangeRate,
            fiscalYear: this.fiscalYear,
            fiscalPeriod: this.fiscalPeriod,
            isReversed: this.isReversed,
            reversedByEntryId: this.reversedByEntryId ?? undefined,
            reversesEntryId: this.reversesEntryId ?? undefined,
            requiresApproval: this.requiresApproval,
            approvedBy: this.approvedBy ?? undefined,
            approvedAt: this.approvedAt ?? undefined,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            notes: this.notes ?? undefined,
            attachments: this.attachments,
        };
    }
}

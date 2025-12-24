import { JournalEntry, JournalLine } from '../../entities/accounting/JournalEntry.js';

/**
 * Journal Entry Repository Interface
 */
export interface IJournalEntryRepository {
    /**
     * Create a new journal entry with lines
     */
    create(entry: JournalEntry): Promise<JournalEntry>;

    /**
     * Find journal entry by ID
     */
    findById(tenantId: string, id: string): Promise<JournalEntry | null>;

    /**
     * Find journal entry by entry number
     */
    findByEntryNumber(tenantId: string, entryNumber: string): Promise<JournalEntry | null>;

    /**
     * Find journal entries by source record
     */
    findBySourceRecord(
        tenantId: string, 
        sourceModule: string, 
        sourceRecordId: string
    ): Promise<JournalEntry[]>;

    /**
     * Find journal entries with filters
     */
    findAll(tenantId: string, options: JournalSearchOptions): Promise<JournalSearchResult>;

    /**
     * Post a journal entry (change status from DRAFT to POSTED)
     */
    post(tenantId: string, id: string, entryNumber: string): Promise<JournalEntry>;

    /**
     * Reverse a journal entry
     */
    reverse(
        tenantId: string, 
        id: string, 
        reversalEntry: JournalEntry
    ): Promise<{ original: JournalEntry; reversal: JournalEntry }>;

    /**
     * Get next entry number for a branch
     */
    getNextEntryNumber(tenantId: string, branchId: string, prefix?: string): Promise<string>;

    /**
     * Find entries pending approval
     */
    findPendingApproval(tenantId: string, branchId?: string): Promise<JournalEntry[]>;

    /**
     * Approve a journal entry
     */
    approve(tenantId: string, id: string, approvedBy: string): Promise<JournalEntry>;

    /**
     * Get journal entries for a fiscal period
     */
    findByFiscalPeriod(
        tenantId: string, 
        fiscalYear: number, 
        fiscalPeriod: number,
        branchId?: string
    ): Promise<JournalEntry[]>;

    /**
     * Get draft entries for a period (for period close validation)
     */
    countDraftEntries(
        tenantId: string,
        beforeDate: Date,
        branchId?: string
    ): Promise<number>;

    /**
     * Delete a draft journal entry
     */
    delete(tenantId: string, id: string): Promise<void>;
}

/**
 * Search options for journal entries
 */
export interface JournalSearchOptions {
    branchId?: string;
    status?: string;
    entryType?: string;
    sourceModule?: string;
    fromDate?: Date;
    toDate?: Date;
    fiscalYear?: number;
    fiscalPeriod?: number;
    accountId?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    createdBy?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated search result
 */
export interface JournalSearchResult {
    entries: JournalEntry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

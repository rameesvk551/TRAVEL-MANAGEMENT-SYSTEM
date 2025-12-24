import { Account, AccountProps } from '../../entities/accounting/Account.js';

/**
 * Account Repository Interface - Chart of Accounts
 */
export interface IAccountRepository {
    /**
     * Create a new account
     */
    create(account: Account): Promise<Account>;

    /**
     * Update an account (only if not locked)
     */
    update(account: Account): Promise<Account>;

    /**
     * Find account by ID
     */
    findById(tenantId: string, id: string): Promise<Account | null>;

    /**
     * Find account by code
     */
    findByCode(tenantId: string, code: string): Promise<Account | null>;

    /**
     * Find all accounts for a tenant
     */
    findAll(tenantId: string, options?: {
        accountType?: string;
        status?: string;
        isHeader?: boolean;
        parentAccountId?: string;
        includeInactive?: boolean;
    }): Promise<Account[]>;

    /**
     * Get hierarchical chart of accounts
     */
    getHierarchy(tenantId: string): Promise<AccountHierarchy[]>;

    /**
     * Find children of a parent account
     */
    findChildren(tenantId: string, parentAccountId: string): Promise<Account[]>;

    /**
     * Check if account has postings (for locking)
     */
    hasPostings(tenantId: string, accountId: string): Promise<boolean>;

    /**
     * Lock account after first posting
     */
    lockAccount(tenantId: string, accountId: string, userId: string): Promise<void>;

    /**
     * Get next available account code for a type
     */
    getNextCode(tenantId: string, prefix: string): Promise<string>;

    /**
     * Bulk create accounts (for COA initialization)
     */
    bulkCreate(accounts: Account[]): Promise<Account[]>;

    /**
     * Delete account (only if no postings and not system account)
     */
    delete(tenantId: string, id: string): Promise<void>;
}

/**
 * Hierarchical account structure for tree display
 */
export interface AccountHierarchy {
    account: Account;
    children: AccountHierarchy[];
    totalBalance?: number;
}

/**
 * Account with balance information
 */
export interface AccountWithBalance extends Account {
    openingBalance: number;
    debitTotal: number;
    creditTotal: number;
    closingBalance: number;
}

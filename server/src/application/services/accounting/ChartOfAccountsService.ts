import { query, getClient } from '../../../infrastructure/database/connection.js';
import { 
    Account, 
    AccountProps, 
    TRAVEL_COA_TEMPLATE,
    AccountType,
    NormalBalance 
} from '../../../domain/entities/accounting/Account.js';
import { 
    IAccountRepository, 
    AccountHierarchy 
} from '../../../domain/interfaces/accounting/IAccountRepository.js';

/**
 * Chart of Accounts Service
 * 
 * Manages the hierarchical chart of accounts with:
 * - Account creation and management
 * - COA initialization with travel-specific accounts
 * - Account locking after first posting
 * - Hierarchical structure management
 */
export class ChartOfAccountsService {
    
    /**
     * Initialize the standard Chart of Accounts for a tenant
     */
    async initializeCOA(tenantId: string, createdBy: string): Promise<Account[]> {
        const client = await getClient();
        const accounts: Account[] = [];

        try {
            await client.query('BEGIN');

            // Create accounts from template
            for (const [key, template] of Object.entries(TRAVEL_COA_TEMPLATE)) {
                const normalBalance: NormalBalance = 
                    template.type === 'ASSET' || template.type === 'EXPENSE' ? 'DEBIT' : 'CREDIT';

                const account = Account.create({
                    tenantId,
                    code: template.code,
                    name: template.name,
                    accountType: template.type,
                    subType: template.subType,
                    normalBalance,
                    level: template.code.length === 4 ? 1 : template.code.length === 5 ? 2 : 3,
                    isHeader: template.code.endsWith('00') || template.code.endsWith('000'),
                    isBankAccount: template.subType === 'BANK' || template.subType === 'CASH',
                    isSystemAccount: true,
                    isTaxAccount: template.subType === 'TAX_PAYABLE',
                    allowBranchPosting: true,
                    createdBy,
                });

                const result = await client.query(`
                    INSERT INTO public.accounts (
                        id, tenant_id, code, name, description, account_type, sub_type,
                        normal_balance, level, is_header, is_bank_account, is_system_account,
                        is_tax_account, allow_branch_posting, status, created_by, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    ON CONFLICT (tenant_id, code) DO NOTHING
                    RETURNING *
                `, [
                    account.id,
                    account.tenantId,
                    account.code,
                    account.name,
                    account.description,
                    account.accountType,
                    account.subType,
                    account.normalBalance,
                    account.level,
                    account.isHeader,
                    account.isBankAccount,
                    account.isSystemAccount,
                    account.isTaxAccount,
                    account.allowBranchPosting,
                    account.status,
                    account.createdBy,
                    account.createdAt,
                    account.updatedAt,
                ]);

                if (result.rows[0]) {
                    accounts.push(this.mapToAccount(result.rows[0]));
                }
            }

            // Set parent-child relationships
            await this.setAccountHierarchy(client, tenantId);

            await client.query('COMMIT');
            return accounts;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Set parent-child relationships based on account codes
     */
    private async setAccountHierarchy(client: any, tenantId: string): Promise<void> {
        // Update parent references based on code patterns
        await client.query(`
            UPDATE public.accounts a
            SET parent_account_id = (
                SELECT p.id FROM public.accounts p
                WHERE p.tenant_id = a.tenant_id
                AND p.code = CASE 
                    WHEN LENGTH(a.code) = 4 THEN LEFT(a.code, 1) || '000'
                    WHEN LENGTH(a.code) = 5 THEN LEFT(a.code, 2) || '00'
                    ELSE NULL
                END
            )
            WHERE a.tenant_id = $1
            AND LENGTH(a.code) >= 4
        `, [tenantId]);
    }

    /**
     * Create a new account
     */
    async createAccount(props: AccountProps): Promise<Account> {
        const account = Account.create(props);

        const result = await query(`
            INSERT INTO public.accounts (
                id, tenant_id, code, name, description, account_type, sub_type,
                normal_balance, parent_account_id, level, is_header, is_bank_account,
                is_system_account, is_tax_account, allow_branch_posting, currency,
                tax_rate, cost_center_id, status, created_by, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *
        `, [
            account.id,
            account.tenantId,
            account.code,
            account.name,
            account.description,
            account.accountType,
            account.subType,
            account.normalBalance,
            account.parentAccountId,
            account.level,
            account.isHeader,
            account.isBankAccount,
            account.isSystemAccount,
            account.isTaxAccount,
            account.allowBranchPosting,
            account.currency,
            account.taxRate,
            account.costCenterId,
            account.status,
            account.createdBy,
            account.createdAt,
            account.updatedAt,
        ]);

        return this.mapToAccount(result.rows[0]);
    }

    /**
     * Get account by ID
     */
    async getAccountById(tenantId: string, accountId: string): Promise<Account | null> {
        const result = await query(`
            SELECT * FROM public.accounts
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, accountId]);

        if (result.rows.length === 0) return null;
        return this.mapToAccount(result.rows[0]);
    }

    /**
     * Get account by code
     */
    async getAccountByCode(tenantId: string, code: string): Promise<Account | null> {
        const result = await query(`
            SELECT * FROM public.accounts
            WHERE tenant_id = $1 AND code = $2
        `, [tenantId, code]);

        if (result.rows.length === 0) return null;
        return this.mapToAccount(result.rows[0]);
    }

    /**
     * Get account ID by code (for journal rules)
     */
    async getAccountIdByCode(tenantId: string, code: string): Promise<string> {
        const result = await query(`
            SELECT id FROM public.accounts
            WHERE tenant_id = $1 AND code = $2
        `, [tenantId, code]);

        if (result.rows.length === 0) {
            throw new Error(`Account not found for code: ${code}`);
        }
        return result.rows[0].id;
    }

    /**
     * Get all accounts for a tenant
     */
    async getAllAccounts(
        tenantId: string, 
        options?: {
            accountType?: AccountType;
            status?: string;
            isHeader?: boolean;
            includeInactive?: boolean;
        }
    ): Promise<Account[]> {
        let sql = `SELECT * FROM public.accounts WHERE tenant_id = $1`;
        const params: any[] = [tenantId];

        if (options?.accountType) {
            params.push(options.accountType);
            sql += ` AND account_type = $${params.length}`;
        }

        if (options?.status) {
            params.push(options.status);
            sql += ` AND status = $${params.length}`;
        }

        if (options?.isHeader !== undefined) {
            params.push(options.isHeader);
            sql += ` AND is_header = $${params.length}`;
        }

        if (!options?.includeInactive) {
            sql += ` AND status != 'INACTIVE'`;
        }

        sql += ` ORDER BY code`;

        const result = await query(sql, params);
        return result.rows.map(row => this.mapToAccount(row));
    }

    /**
     * Get hierarchical COA
     */
    async getAccountHierarchy(tenantId: string): Promise<AccountHierarchy[]> {
        const accounts = await this.getAllAccounts(tenantId);
        return this.buildHierarchy(accounts);
    }

    /**
     * Build hierarchical structure from flat list
     */
    private buildHierarchy(accounts: Account[]): AccountHierarchy[] {
        const accountMap = new Map<string, AccountHierarchy>();
        const roots: AccountHierarchy[] = [];

        // First pass: create hierarchy nodes
        for (const account of accounts) {
            accountMap.set(account.id, { account, children: [] });
        }

        // Second pass: link children to parents
        for (const account of accounts) {
            const node = accountMap.get(account.id)!;
            if (account.parentAccountId) {
                const parent = accountMap.get(account.parentAccountId);
                if (parent) {
                    parent.children.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        }

        return roots;
    }

    /**
     * Lock an account after first posting
     */
    async lockAccount(tenantId: string, accountId: string, userId: string): Promise<void> {
        await query(`
            UPDATE public.accounts
            SET locked_at = NOW(), locked_by = $3, status = 'LOCKED', updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2 AND locked_at IS NULL
        `, [tenantId, accountId, userId]);
    }

    /**
     * Check if account has postings
     */
    async hasPostings(tenantId: string, accountId: string): Promise<boolean> {
        const result = await query(`
            SELECT EXISTS(
                SELECT 1 FROM public.ledger_entries
                WHERE tenant_id = $1 AND account_id = $2
                LIMIT 1
            ) as has_postings
        `, [tenantId, accountId]);

        return result.rows[0].has_postings;
    }

    /**
     * Deactivate an account
     */
    async deactivateAccount(tenantId: string, accountId: string): Promise<void> {
        // Check if system account
        const account = await this.getAccountById(tenantId, accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        if (account.isSystemAccount) {
            throw new Error('Cannot deactivate system account');
        }

        // Check for postings
        const hasPostings = await this.hasPostings(tenantId, accountId);
        if (hasPostings) {
            throw new Error('Cannot deactivate account with existing postings');
        }

        await query(`
            UPDATE public.accounts
            SET status = 'INACTIVE', updated_at = NOW()
            WHERE tenant_id = $1 AND id = $2
        `, [tenantId, accountId]);
    }

    /**
     * Get postable accounts (not headers, active)
     */
    async getPostableAccounts(tenantId: string, accountType?: AccountType): Promise<Account[]> {
        return this.getAllAccounts(tenantId, {
            accountType,
            isHeader: false,
            status: 'ACTIVE',
        });
    }

    /**
     * Map database row to Account entity
     */
    private mapToAccount(row: any): Account {
        return Account.fromPersistence({
            id: row.id,
            tenantId: row.tenant_id,
            code: row.code,
            name: row.name,
            description: row.description,
            accountType: row.account_type,
            subType: row.sub_type,
            normalBalance: row.normal_balance,
            parentAccountId: row.parent_account_id,
            level: row.level,
            isHeader: row.is_header,
            isBankAccount: row.is_bank_account,
            isSystemAccount: row.is_system_account,
            isTaxAccount: row.is_tax_account,
            currency: row.currency,
            taxRate: row.tax_rate ? parseFloat(row.tax_rate) : undefined,
            status: row.status,
            allowBranchPosting: row.allow_branch_posting,
            costCenterId: row.cost_center_id,
            lockedAt: row.locked_at,
            lockedBy: row.locked_by,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}

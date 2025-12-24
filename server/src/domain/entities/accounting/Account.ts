import { generateId } from '../../../shared/utils/index.js';

/**
 * Account Types following standard accounting classification
 * Assets = Liabilities + Equity
 * Net Income = Revenue - Expenses (flows to Retained Earnings)
 */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

/**
 * Account Sub-Types for detailed classification
 */
export type AccountSubType =
    // Assets
    | 'CURRENT_ASSET'
    | 'FIXED_ASSET'
    | 'BANK'
    | 'CASH'
    | 'ACCOUNTS_RECEIVABLE'
    | 'INVENTORY'
    | 'PREPAID_EXPENSE'
    | 'OTHER_ASSET'
    // Liabilities
    | 'CURRENT_LIABILITY'
    | 'LONG_TERM_LIABILITY'
    | 'ACCOUNTS_PAYABLE'
    | 'TAX_PAYABLE'
    | 'UNEARNED_REVENUE'
    | 'ACCRUED_EXPENSE'
    | 'OTHER_LIABILITY'
    // Equity
    | 'OWNERS_EQUITY'
    | 'RETAINED_EARNINGS'
    | 'SHARE_CAPITAL'
    | 'RESERVES'
    | 'DRAWINGS'
    // Revenue
    | 'OPERATING_REVENUE'
    | 'OTHER_INCOME'
    | 'INTEREST_INCOME'
    // Expenses
    | 'COST_OF_GOODS_SOLD'
    | 'OPERATING_EXPENSE'
    | 'PAYROLL_EXPENSE'
    | 'TAX_EXPENSE'
    | 'DEPRECIATION'
    | 'OTHER_EXPENSE';

/**
 * Account Status for lifecycle management
 */
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

/**
 * Normal balance direction for double-entry accounting
 */
export type NormalBalance = 'DEBIT' | 'CREDIT';

/**
 * Account Properties
 */
export interface AccountProps {
    id?: string;
    tenantId: string;
    code: string;              // Unique account code (e.g., "1100", "2100")
    name: string;
    description?: string;
    accountType: AccountType;
    subType?: AccountSubType;
    normalBalance: NormalBalance;
    parentAccountId?: string;   // For hierarchical COA
    level: number;              // Hierarchy level (1 = top level)
    isHeader: boolean;          // Header accounts cannot have postings
    isBankAccount: boolean;
    isSystemAccount: boolean;   // System accounts cannot be deleted
    isTaxAccount: boolean;
    currency?: string;
    taxRate?: number;           // For tax-related accounts
    status?: AccountStatus;
    
    // Branch & Cost Center
    allowBranchPosting: boolean;  // Can be posted with branch context
    costCenterId?: string;
    
    // Audit
    lockedAt?: Date;            // Once posted, account is locked
    lockedBy?: string;
    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Account Entity - Represents a single account in the Chart of Accounts
 * 
 * Design Principles:
 * - Immutable after first posting (lockedAt)
 * - Hierarchical structure with parent-child relationships
 * - Branch-aware for multi-branch operations
 * - Supports cost center allocation
 */
export class Account {
    public readonly id: string;
    public readonly tenantId: string;
    public readonly code: string;
    public readonly name: string;
    public readonly description: string | null;
    public readonly accountType: AccountType;
    public readonly subType: AccountSubType | null;
    public readonly normalBalance: NormalBalance;
    public readonly parentAccountId: string | null;
    public readonly level: number;
    public readonly isHeader: boolean;
    public readonly isBankAccount: boolean;
    public readonly isSystemAccount: boolean;
    public readonly isTaxAccount: boolean;
    public readonly currency: string;
    public readonly taxRate: number | null;
    public readonly status: AccountStatus;
    public readonly allowBranchPosting: boolean;
    public readonly costCenterId: string | null;
    public readonly lockedAt: Date | null;
    public readonly lockedBy: string | null;
    public readonly createdBy: string | null;
    public readonly createdAt: Date;
    public readonly updatedAt: Date;

    private constructor(props: AccountProps & { id: string }) {
        this.id = props.id;
        this.tenantId = props.tenantId;
        this.code = props.code;
        this.name = props.name;
        this.description = props.description ?? null;
        this.accountType = props.accountType;
        this.subType = props.subType ?? null;
        this.normalBalance = props.normalBalance;
        this.parentAccountId = props.parentAccountId ?? null;
        this.level = props.level;
        this.isHeader = props.isHeader;
        this.isBankAccount = props.isBankAccount;
        this.isSystemAccount = props.isSystemAccount;
        this.isTaxAccount = props.isTaxAccount;
        this.currency = props.currency ?? 'INR';
        this.taxRate = props.taxRate ?? null;
        this.status = props.status ?? 'ACTIVE';
        this.allowBranchPosting = props.allowBranchPosting;
        this.costCenterId = props.costCenterId ?? null;
        this.lockedAt = props.lockedAt ?? null;
        this.lockedBy = props.lockedBy ?? null;
        this.createdBy = props.createdBy ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
    }

    static create(props: AccountProps): Account {
        return new Account({
            id: props.id ?? generateId(),
            ...props,
        });
    }

    static fromPersistence(data: AccountProps & { id: string }): Account {
        return new Account(data);
    }

    /**
     * Determines if this account can accept postings
     */
    canPost(): boolean {
        return !this.isHeader && this.status === 'ACTIVE';
    }

    /**
     * Determines if this account is locked (has postings)
     */
    isLocked(): boolean {
        return this.lockedAt !== null;
    }

    /**
     * Returns the sign for debit entries (+1 for debit-normal, -1 for credit-normal)
     */
    getDebitSign(): number {
        return this.normalBalance === 'DEBIT' ? 1 : -1;
    }

    /**
     * Returns the sign for credit entries (+1 for credit-normal, -1 for debit-normal)
     */
    getCreditSign(): number {
        return this.normalBalance === 'CREDIT' ? 1 : -1;
    }

    /**
     * Returns whether debits increase or decrease this account
     */
    debitsIncrease(): boolean {
        return this.normalBalance === 'DEBIT';
    }

    /**
     * Lock the account after first posting
     */
    lock(userId: string): Account {
        return Account.create({
            ...this.toProps(),
            lockedAt: new Date(),
            lockedBy: userId,
            updatedAt: new Date(),
        });
    }

    /**
     * Deactivate the account
     */
    deactivate(): Account {
        if (this.isSystemAccount) {
            throw new Error('Cannot deactivate system account');
        }
        return Account.create({
            ...this.toProps(),
            status: 'INACTIVE',
            updatedAt: new Date(),
        });
    }

    /**
     * Convert to plain props for persistence
     */
    toProps(): AccountProps & { id: string } {
        return {
            id: this.id,
            tenantId: this.tenantId,
            code: this.code,
            name: this.name,
            description: this.description ?? undefined,
            accountType: this.accountType,
            subType: this.subType ?? undefined,
            normalBalance: this.normalBalance,
            parentAccountId: this.parentAccountId ?? undefined,
            level: this.level,
            isHeader: this.isHeader,
            isBankAccount: this.isBankAccount,
            isSystemAccount: this.isSystemAccount,
            isTaxAccount: this.isTaxAccount,
            currency: this.currency,
            taxRate: this.taxRate ?? undefined,
            status: this.status,
            allowBranchPosting: this.allowBranchPosting,
            costCenterId: this.costCenterId ?? undefined,
            lockedAt: this.lockedAt ?? undefined,
            lockedBy: this.lockedBy ?? undefined,
            createdBy: this.createdBy ?? undefined,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

/**
 * Standard Chart of Accounts template for Travel Management
 * These are the mandatory accounts for a travel business
 */
export const TRAVEL_COA_TEMPLATE = {
    // ASSETS (1xxx)
    ASSETS: { code: '1000', name: 'Assets', type: 'ASSET' as AccountType, subType: 'CURRENT_ASSET' as AccountSubType },
    
    // Current Assets (11xx)
    CURRENT_ASSETS: { code: '1100', name: 'Current Assets', type: 'ASSET' as AccountType, subType: 'CURRENT_ASSET' as AccountSubType },
    CASH: { code: '1110', name: 'Cash on Hand', type: 'ASSET' as AccountType, subType: 'CASH' as AccountSubType },
    PETTY_CASH: { code: '1111', name: 'Petty Cash', type: 'ASSET' as AccountType, subType: 'CASH' as AccountSubType },
    BANK_ACCOUNTS: { code: '1120', name: 'Bank Accounts', type: 'ASSET' as AccountType, subType: 'BANK' as AccountSubType },
    
    // Receivables (12xx)
    ACCOUNTS_RECEIVABLE: { code: '1200', name: 'Accounts Receivable', type: 'ASSET' as AccountType, subType: 'ACCOUNTS_RECEIVABLE' as AccountSubType },
    CUSTOMER_ADVANCES: { code: '1210', name: 'Customer Advances Receivable', type: 'ASSET' as AccountType, subType: 'ACCOUNTS_RECEIVABLE' as AccountSubType },
    OTA_RECEIVABLE: { code: '1220', name: 'OTA Receivables', type: 'ASSET' as AccountType, subType: 'ACCOUNTS_RECEIVABLE' as AccountSubType },
    INTER_BRANCH_RECEIVABLE: { code: '1250', name: 'Inter-Branch Receivable', type: 'ASSET' as AccountType, subType: 'ACCOUNTS_RECEIVABLE' as AccountSubType },
    
    // Other Current Assets (13xx)
    PREPAID_EXPENSES: { code: '1300', name: 'Prepaid Expenses', type: 'ASSET' as AccountType, subType: 'PREPAID_EXPENSE' as AccountSubType },
    VENDOR_ADVANCES: { code: '1310', name: 'Vendor Advances', type: 'ASSET' as AccountType, subType: 'PREPAID_EXPENSE' as AccountSubType },
    GUIDE_ADVANCES: { code: '1320', name: 'Guide Advances', type: 'ASSET' as AccountType, subType: 'PREPAID_EXPENSE' as AccountSubType },
    
    // Fixed Assets (15xx)
    FIXED_ASSETS: { code: '1500', name: 'Fixed Assets', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    GEAR_EQUIPMENT: { code: '1510', name: 'Gear & Equipment', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    VEHICLES: { code: '1520', name: 'Vehicles', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    OFFICE_EQUIPMENT: { code: '1530', name: 'Office Equipment', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    ACCUMULATED_DEPRECIATION: { code: '1590', name: 'Accumulated Depreciation', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    GEAR_DEPRECIATION: { code: '1591', name: 'Gear Accumulated Depreciation', type: 'ASSET' as AccountType, subType: 'FIXED_ASSET' as AccountSubType },
    
    // LIABILITIES (2xxx)
    LIABILITIES: { code: '2000', name: 'Liabilities', type: 'LIABILITY' as AccountType, subType: 'CURRENT_LIABILITY' as AccountSubType },
    
    // Current Liabilities (21xx)
    CURRENT_LIABILITIES: { code: '2100', name: 'Current Liabilities', type: 'LIABILITY' as AccountType, subType: 'CURRENT_LIABILITY' as AccountSubType },
    ACCOUNTS_PAYABLE: { code: '2110', name: 'Accounts Payable', type: 'LIABILITY' as AccountType, subType: 'ACCOUNTS_PAYABLE' as AccountSubType },
    VENDOR_PAYABLES: { code: '2120', name: 'Vendor Payables', type: 'LIABILITY' as AccountType, subType: 'ACCOUNTS_PAYABLE' as AccountSubType },
    GUIDE_PAYABLES: { code: '2130', name: 'Guide Payables', type: 'LIABILITY' as AccountType, subType: 'ACCOUNTS_PAYABLE' as AccountSubType },
    INTER_BRANCH_PAYABLE: { code: '2150', name: 'Inter-Branch Payable', type: 'LIABILITY' as AccountType, subType: 'ACCOUNTS_PAYABLE' as AccountSubType },
    
    // Unearned Revenue (22xx)
    UNEARNED_REVENUE: { code: '2200', name: 'Unearned Revenue', type: 'LIABILITY' as AccountType, subType: 'UNEARNED_REVENUE' as AccountSubType },
    CUSTOMER_ADVANCES_LIABILITY: { code: '2210', name: 'Customer Advances (Liability)', type: 'LIABILITY' as AccountType, subType: 'UNEARNED_REVENUE' as AccountSubType },
    REFUND_LIABILITY: { code: '2220', name: 'Refund Liability', type: 'LIABILITY' as AccountType, subType: 'UNEARNED_REVENUE' as AccountSubType },
    
    // Accrued Expenses (23xx)
    ACCRUED_EXPENSES: { code: '2300', name: 'Accrued Expenses', type: 'LIABILITY' as AccountType, subType: 'ACCRUED_EXPENSE' as AccountSubType },
    PAYROLL_PAYABLE: { code: '2310', name: 'Payroll Payable', type: 'LIABILITY' as AccountType, subType: 'ACCRUED_EXPENSE' as AccountSubType },
    EMPLOYEE_REIMBURSEMENTS: { code: '2320', name: 'Employee Reimbursements Payable', type: 'LIABILITY' as AccountType, subType: 'ACCRUED_EXPENSE' as AccountSubType },
    
    // Tax Liabilities (24xx)
    TAX_LIABILITIES: { code: '2400', name: 'Tax Liabilities', type: 'LIABILITY' as AccountType, subType: 'TAX_PAYABLE' as AccountSubType },
    GST_OUTPUT: { code: '2410', name: 'GST Output (Payable)', type: 'LIABILITY' as AccountType, subType: 'TAX_PAYABLE' as AccountSubType },
    GST_INPUT: { code: '2411', name: 'GST Input (Receivable)', type: 'ASSET' as AccountType, subType: 'CURRENT_ASSET' as AccountSubType },
    TDS_PAYABLE: { code: '2420', name: 'TDS Payable', type: 'LIABILITY' as AccountType, subType: 'TAX_PAYABLE' as AccountSubType },
    VAT_PAYABLE: { code: '2430', name: 'VAT Payable', type: 'LIABILITY' as AccountType, subType: 'TAX_PAYABLE' as AccountSubType },
    INCOME_TAX_PAYABLE: { code: '2440', name: 'Income Tax Payable', type: 'LIABILITY' as AccountType, subType: 'TAX_PAYABLE' as AccountSubType },
    
    // EQUITY (3xxx)
    EQUITY: { code: '3000', name: 'Equity', type: 'EQUITY' as AccountType, subType: 'OWNERS_EQUITY' as AccountSubType },
    SHARE_CAPITAL: { code: '3100', name: 'Share Capital', type: 'EQUITY' as AccountType, subType: 'SHARE_CAPITAL' as AccountSubType },
    RETAINED_EARNINGS: { code: '3200', name: 'Retained Earnings', type: 'EQUITY' as AccountType, subType: 'RETAINED_EARNINGS' as AccountSubType },
    CURRENT_YEAR_EARNINGS: { code: '3300', name: 'Current Year Earnings', type: 'EQUITY' as AccountType, subType: 'RETAINED_EARNINGS' as AccountSubType },
    OWNER_DRAWINGS: { code: '3400', name: 'Owner Drawings', type: 'EQUITY' as AccountType, subType: 'DRAWINGS' as AccountSubType },
    
    // REVENUE (4xxx)
    REVENUE: { code: '4000', name: 'Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    
    // Trip Revenue (41xx)
    TRIP_REVENUE: { code: '4100', name: 'Trip Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    SEAT_SALES: { code: '4110', name: 'Seat Sales Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    ADDON_REVENUE: { code: '4120', name: 'Add-on Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    RENTAL_REVENUE: { code: '4130', name: 'Rental Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    
    // Booking Revenue (42xx)
    BOOKING_REVENUE: { code: '4200', name: 'Booking Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    CANCELLATION_FEES: { code: '4210', name: 'Cancellation Fee Revenue', type: 'REVENUE' as AccountType, subType: 'OPERATING_REVENUE' as AccountSubType },
    
    // Other Income (49xx)
    OTHER_INCOME: { code: '4900', name: 'Other Income', type: 'REVENUE' as AccountType, subType: 'OTHER_INCOME' as AccountSubType },
    INTEREST_INCOME: { code: '4910', name: 'Interest Income', type: 'REVENUE' as AccountType, subType: 'INTEREST_INCOME' as AccountSubType },
    
    // EXPENSES (5xxx)
    EXPENSES: { code: '5000', name: 'Expenses', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    
    // Cost of Services (51xx)
    COST_OF_SERVICES: { code: '5100', name: 'Cost of Services', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    VENDOR_SERVICES: { code: '5110', name: 'Vendor Services', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    TRANSPORT_COSTS: { code: '5120', name: 'Transport Costs', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    ACCOMMODATION_COSTS: { code: '5130', name: 'Accommodation Costs', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    FOOD_COSTS: { code: '5140', name: 'Food & Catering Costs', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    PERMIT_FEES: { code: '5150', name: 'Permits & Entry Fees', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    GUIDE_WAGES: { code: '5160', name: 'Guide Wages', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    
    // Commissions (52xx)
    OTA_COMMISSION: { code: '5200', name: 'OTA Commission Expense', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    AGENT_COMMISSION: { code: '5210', name: 'Agent Commission Expense', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    PAYMENT_GATEWAY_FEES: { code: '5220', name: 'Payment Gateway Fees', type: 'EXPENSE' as AccountType, subType: 'COST_OF_GOODS_SOLD' as AccountSubType },
    
    // Refunds (53xx)
    REFUND_EXPENSE: { code: '5300', name: 'Refund Expense', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    CANCELLATION_REFUNDS: { code: '5310', name: 'Cancellation Refunds', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    
    // Operating Expenses (54xx)
    OPERATING_EXPENSES: { code: '5400', name: 'Operating Expenses', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    RENT_EXPENSE: { code: '5410', name: 'Rent Expense', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    UTILITIES: { code: '5420', name: 'Utilities', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    OFFICE_SUPPLIES: { code: '5430', name: 'Office Supplies', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    MARKETING: { code: '5440', name: 'Marketing & Advertising', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    INSURANCE: { code: '5450', name: 'Insurance Expense', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    TRAVEL_EXPENSE: { code: '5460', name: 'Travel & Entertainment', type: 'EXPENSE' as AccountType, subType: 'OPERATING_EXPENSE' as AccountSubType },
    
    // Payroll (55xx)
    PAYROLL_EXPENSES: { code: '5500', name: 'Payroll Expenses', type: 'EXPENSE' as AccountType, subType: 'PAYROLL_EXPENSE' as AccountSubType },
    SALARIES: { code: '5510', name: 'Salaries & Wages', type: 'EXPENSE' as AccountType, subType: 'PAYROLL_EXPENSE' as AccountSubType },
    EMPLOYEE_BENEFITS: { code: '5520', name: 'Employee Benefits', type: 'EXPENSE' as AccountType, subType: 'PAYROLL_EXPENSE' as AccountSubType },
    PF_CONTRIBUTIONS: { code: '5530', name: 'PF Contributions', type: 'EXPENSE' as AccountType, subType: 'PAYROLL_EXPENSE' as AccountSubType },
    ESI_CONTRIBUTIONS: { code: '5540', name: 'ESI Contributions', type: 'EXPENSE' as AccountType, subType: 'PAYROLL_EXPENSE' as AccountSubType },
    
    // Depreciation (56xx)
    DEPRECIATION_EXPENSE: { code: '5600', name: 'Depreciation Expense', type: 'EXPENSE' as AccountType, subType: 'DEPRECIATION' as AccountSubType },
    GEAR_DEPRECIATION_EXP: { code: '5610', name: 'Gear Depreciation Expense', type: 'EXPENSE' as AccountType, subType: 'DEPRECIATION' as AccountSubType },
    VEHICLE_DEPRECIATION: { code: '5620', name: 'Vehicle Depreciation Expense', type: 'EXPENSE' as AccountType, subType: 'DEPRECIATION' as AccountSubType },
    EQUIPMENT_DEPRECIATION: { code: '5630', name: 'Equipment Depreciation Expense', type: 'EXPENSE' as AccountType, subType: 'DEPRECIATION' as AccountSubType },
    
    // Gear Write-offs (57xx)
    GEAR_WRITEOFF: { code: '5700', name: 'Gear Write-off/Damage', type: 'EXPENSE' as AccountType, subType: 'OTHER_EXPENSE' as AccountSubType },
    
    // Bank Charges (58xx)
    BANK_CHARGES: { code: '5800', name: 'Bank Charges', type: 'EXPENSE' as AccountType, subType: 'OTHER_EXPENSE' as AccountSubType },
    
    // Tax Expenses (59xx)
    TAX_EXPENSES: { code: '5900', name: 'Tax Expenses', type: 'EXPENSE' as AccountType, subType: 'TAX_EXPENSE' as AccountSubType },
};

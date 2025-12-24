/**
 * Accounting Domain Entities - Index
 * 
 * This module exports all accounting-related domain entities.
 * The accounting domain is designed as a bounded context separate from operations.
 */

// Chart of Accounts
export { Account, TRAVEL_COA_TEMPLATE } from './Account.js';
export type { 
    AccountType, 
    AccountSubType, 
    AccountStatus, 
    NormalBalance, 
    AccountProps 
} from './Account.js';

// Journal Entries
export { JournalEntry, JournalLine } from './JournalEntry.js';
export type { 
    JournalEntryStatus, 
    SourceModule, 
    JournalEntryType, 
    JournalLineProps, 
    JournalEntryProps 
} from './JournalEntry.js';

// Ledger
export { LedgerEntry } from './LedgerEntry.js';
export type { 
    LedgerEntryType, 
    LedgerEntryProps, 
    AccountBalance, 
    TrialBalanceLine, 
    SubLedgerBalance 
} from './LedgerEntry.js';

// Fiscal Periods & Banking
export { 
    FiscalPeriod, 
    FiscalYear, 
    BankAccount, 
    BankTransaction, 
    CostCenter 
} from './FiscalPeriod.js';
export type { 
    FiscalPeriodStatus, 
    FiscalPeriodProps, 
    FiscalYearProps, 
    BankAccountProps, 
    BankTransactionProps, 
    CostCenterProps 
} from './FiscalPeriod.js';

// Tax Configuration
export { 
    TaxCode, 
    TaxRegistration, 
    TaxTransaction, 
    STANDARD_GST_CODES, 
    determineGSTType 
} from './TaxConfig.js';
export type { 
    TaxType, 
    TaxCalculationMethod, 
    TaxCategory, 
    PlaceOfSupply, 
    TaxCodeProps, 
    TaxRegistrationProps, 
    TaxTransactionProps 
} from './TaxConfig.js';

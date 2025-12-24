/**
 * Accounting Services - Barrel Export
 * 
 * This module provides a complete financial accounting engine for the Travel ERP:
 * 
 * Core Services:
 * - ChartOfAccountsService: Manage chart of accounts with travel-specific templates
 * - JournalEntryService: Create, validate, post, and reverse journal entries
 * - LedgerService: Query ledger entries, balances, and trial balance
 * 
 * Period Management:
 * - FiscalPeriodService: Fiscal years, periods, open/close workflow
 * 
 * Tax Engine:
 * - TaxEngineService: GST/VAT/TDS calculation and tracking
 * 
 * Banking:
 * - BankReconciliationService: Bank accounts, transactions, reconciliation
 * 
 * Reporting:
 * - FinancialReportingService: P&L, Balance Sheet, Cash Flow, Trip Profitability
 * 
 * Event Handling:
 * - AccountingEventHandlers: Connect ops events to automated journals
 */

// Core Services
export { ChartOfAccountsService } from './ChartOfAccountsService.js';
export { JournalEntryService } from './JournalEntryService.js';
export { LedgerService } from './LedgerService.js';

// Period Management
export { FiscalPeriodService } from './FiscalPeriodService.js';

// Tax Engine
export { TaxEngineService } from './TaxEngineService.js';

// Banking
export { BankReconciliationService } from './BankReconciliationService.js';

// Financial Reporting
export { 
    FinancialReportingService,
    type ProfitAndLossStatement,
    type BalanceSheetStatement,
    type CashFlowStatement,
    type TripProfitabilityReport,
    type StatementLineItem,
} from './FinancialReportingService.js';

// Event Handlers
export {
    AccountingEventHandlers,
    type BookingCreatedEvent,
    type PaymentReceivedEvent,
    type RefundIssuedEvent,
    type VendorAssignedEvent,
    type VendorPaymentEvent,
    type ExpenseRecordedEvent,
    type PayrollProcessedEvent,
    type InterBranchTransferEvent,
} from './AccountingEventHandlers.js';

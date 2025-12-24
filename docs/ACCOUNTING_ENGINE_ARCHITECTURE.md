# Financial Accounting Engine Architecture

## Overview

The Financial Accounting Engine is a comprehensive, enterprise-grade accounting module built into the Travel Management System ERP. It provides a complete double-entry accounting system with automated journal generation, tax compliance, and financial reporting.

## Design Principles

### 1. Double-Entry Accounting
Every transaction affects at least two accounts - debits must equal credits. This fundamental principle is enforced at multiple levels:
- Journal entry validation before saving
- Database constraints on journal lines
- Ledger posting verification

### 2. Accrual-Based Accounting
Revenue is recognized when earned (booking created), not when cash is received. Expenses are recognized when incurred (vendor assigned), not when paid.

### 3. Immutable Ledger
Once posted, ledger entries cannot be modified. Corrections are made through:
- Reversal entries (full journal reversal)
- Adjusting entries (new correcting journal)
- This ensures complete audit trail

### 4. Event-Driven Journal Generation
Operational events automatically trigger accounting entries:
- Booking Created → Revenue + Receivable
- Payment Received → Cash + Receivable reduction
- Vendor Assigned → Cost + Payable
- Payment to Vendor → Payable reduction + Cash

### 5. Multi-Branch Architecture
- Each branch maintains its own books
- Inter-branch transactions create matching entries
- Consolidated reporting available at company level
- Branch-level P&L and Balance Sheet

### 6. Trip-Level Profitability
- Each booking/trip is a cost center
- Revenue and direct costs tracked per trip
- Gross margin calculated at trip level
- Profitability reports by trip, branch, period

## Module Structure

```
server/src/
├── domain/
│   ├── entities/
│   │   └── accounting/
│   │       ├── Account.ts          # Chart of Accounts
│   │       ├── JournalEntry.ts     # Journal entries & lines
│   │       ├── LedgerEntry.ts      # Posted ledger entries
│   │       ├── FiscalPeriod.ts     # Periods, years, bank accounts
│   │       ├── TaxConfig.ts        # Tax codes & transactions
│   │       ├── JournalRuleEngine.ts # Automated journal rules
│   │       └── index.ts
│   └── interfaces/
│       └── accounting/
│           ├── IAccountRepository.ts
│           ├── IJournalEntryRepository.ts
│           ├── ILedgerRepository.ts
│           ├── IFiscalPeriodRepository.ts
│           ├── ITaxRepository.ts
│           ├── IBankRepository.ts
│           └── index.ts
├── application/
│   └── services/
│       └── accounting/
│           ├── ChartOfAccountsService.ts
│           ├── JournalEntryService.ts
│           ├── LedgerService.ts
│           ├── FiscalPeriodService.ts
│           ├── TaxEngineService.ts
│           ├── BankReconciliationService.ts
│           ├── FinancialReportingService.ts
│           ├── AccountingEventHandlers.ts
│           └── index.ts
├── infrastructure/
│   └── database/
│       └── migrations/
│           └── 013_accounting_engine.sql
└── presentation/
    └── routes/
        └── accountingRoutes.ts
```

## Chart of Accounts

### Account Structure
```
1xxx - ASSETS
├── 11xx - Current Assets
│   ├── 1101 - Cash
│   ├── 1102 - Bank Accounts
│   └── 12xx - Receivables
├── 14xx - Tax Assets
│   └── 1401 - GST Input Credit
└── 15xx - Fixed Assets

2xxx - LIABILITIES
├── 21xx - Payables
│   └── 2101 - Vendor Payables
├── 22xx - Tax Liabilities
│   ├── 2201 - GST Output
│   └── 2202 - TDS Payable
├── 23xx - Salary Payables
└── 25xx - Inter-Branch

3xxx - EQUITY
├── 3101 - Capital
└── 3201 - Retained Earnings

4xxx - INCOME
├── 41xx - Service Revenue
│   ├── 4101 - Package Revenue
│   ├── 4102 - Flight Commission
│   ├── 4103 - Hotel Commission
│   └── 4104 - Visa Service
└── 43xx - Discounts (Contra)

5xxx - COST OF SALES
├── 51xx - Vendor Costs
│   ├── 5101 - Airline Costs
│   ├── 5102 - Hotel Costs
│   ├── 5103 - Transport Costs
│   └── 5104 - Activity Costs

6xxx - OPERATING EXPENSES
├── 61xx - Salaries
├── 62xx - Rent & Utilities
├── 63xx - Marketing
├── 64xx - Travel & Entertainment
└── 65xx - Technology

7xxx - OTHER EXPENSES
├── 71xx - Finance Costs
└── 72xx - Depreciation
```

## Journal Entry Workflow

### 1. Automatic Generation (Event-Driven)
```
BookingCreated Event
    ↓
AccountingEventHandlers.handleBookingCreated()
    ↓
JournalRuleEngine.generateJournal()
    ↓
JournalEntryService.createJournalEntry()
    ↓
JournalEntryService.postJournal()
    ↓
Ledger Entries Created
```

### 2. Journal Entry States
- **DRAFT**: Created but not validated
- **PENDING**: Validated, awaiting approval
- **POSTED**: Posted to ledger (immutable)
- **VOID**: Voided (with reversal entry)

### 3. Posting Process
```sql
-- Atomic transaction
BEGIN
  UPDATE journal_entries SET status = 'POSTED'
  INSERT INTO ledger_entries (for each journal line)
  UPDATE account balances (optional denormalization)
COMMIT
```

## Tax Engine

### GST Handling (India)
- CGST + SGST for intra-state transactions
- IGST for inter-state transactions
- Automatic place of supply determination
- Input tax credit tracking
- GST return data aggregation

### TDS Handling
- Section 194C (Contractors) - 1%/2%
- Section 194J (Professional Services) - 10%
- Section 194H (Commission) - 5%
- TDS tracking per vendor
- TDS return data (26Q preparation)

## Financial Statements

### 1. Profit & Loss Statement
- Revenue section (by category)
- Cost of Sales (vendor costs)
- Gross Profit & Margin
- Operating Expenses (by category)
- Operating Profit & Margin
- Other Income/Expenses
- Net Profit & Margin
- Period comparison support

### 2. Balance Sheet
- Current Assets
- Non-Current Assets
- Current Liabilities
- Non-Current Liabilities
- Equity (including current year profit)
- Balance validation (A = L + E)

### 3. Cash Flow Statement
- Operating Activities (indirect method)
- Net income adjustments
- Working capital changes
- Investing Activities
- Financing Activities
- Net cash change

### 4. Trip Profitability
- Revenue per trip
- Direct vendor costs
- Gross margin per trip
- Comparison across trips
- Branch-wise aggregation

## Fiscal Period Management

### Period States
1. **OPEN**: Normal transactions allowed
2. **SOFT_CLOSE**: Transactions require approval
3. **HARD_CLOSE**: No transactions allowed
4. **ARCHIVED**: Historical, read-only

### Year-End Closing
1. All periods must be HARD_CLOSED
2. Calculate net income (Revenue - Expenses)
3. Create closing journal entry
4. Zero out income/expense accounts
5. Transfer to Retained Earnings
6. Archive all periods

## Bank Reconciliation

### Features
- Bank account management
- Transaction import
- Auto-matching algorithm
- Manual matching
- Reconciliation sessions
- Cash position reporting

### Matching Algorithm
1. Exact amount match
2. Date proximity scoring
3. Reference number matching
4. Confidence scoring (0-100%)

## API Endpoints

### Chart of Accounts
```
POST   /api/accounting/chart-of-accounts/initialize
GET    /api/accounting/chart-of-accounts
GET    /api/accounting/chart-of-accounts/hierarchy
GET    /api/accounting/chart-of-accounts/:id
POST   /api/accounting/chart-of-accounts
PUT    /api/accounting/chart-of-accounts/:id
```

### Journal Entries
```
POST   /api/accounting/journal-entries
GET    /api/accounting/journal-entries
GET    /api/accounting/journal-entries/:id
POST   /api/accounting/journal-entries/:id/post
POST   /api/accounting/journal-entries/:id/reverse
```

### Ledger & Trial Balance
```
GET    /api/accounting/ledger/:accountId
GET    /api/accounting/ledger/:accountId/balance
GET    /api/accounting/trial-balance
```

### Fiscal Periods
```
POST   /api/accounting/fiscal-years
GET    /api/accounting/fiscal-years
GET    /api/accounting/fiscal-years/:id/periods
POST   /api/accounting/fiscal-periods/:id/soft-close
POST   /api/accounting/fiscal-periods/:id/hard-close
POST   /api/accounting/fiscal-years/:id/close
```

### Tax
```
POST   /api/accounting/tax/initialize-gst
GET    /api/accounting/tax/codes
GET    /api/accounting/tax/gst-summary
GET    /api/accounting/tax/tds-summary
```

### Bank & Reconciliation
```
GET    /api/accounting/bank-accounts
POST   /api/accounting/bank-accounts
GET    /api/accounting/bank-accounts/:id/transactions
GET    /api/accounting/cash-position
POST   /api/accounting/bank-accounts/:id/reconciliation/start
POST   /api/accounting/reconciliation/:id/reconcile
POST   /api/accounting/reconciliation/:id/complete
```

### Financial Reports
```
GET    /api/accounting/reports/profit-loss
GET    /api/accounting/reports/balance-sheet
GET    /api/accounting/reports/cash-flow
GET    /api/accounting/reports/trip-profitability/:tripId
GET    /api/accounting/reports/trip-profitability
GET    /api/accounting/reports/branch-comparison
```

### Dashboard
```
GET    /api/accounting/dashboard
```

## Integration Points

### Operations → Accounting
```typescript
// When a booking is created
await eventHandlers.handleBookingCreated({
    bookingId: booking.id,
    tenantId: booking.tenantId,
    branchId: booking.branchId,
    totalAmount: booking.totalAmount,
    taxAmount: booking.taxes,
    customerId: booking.customerId,
    // ... other fields
});
```

### Recommended Integration Pattern
```typescript
// In BookingService
async createBooking(dto: CreateBookingDto): Promise<Booking> {
    const booking = await this.bookingRepository.create(dto);
    
    // Emit event for accounting
    await this.eventEmitter.emit('booking.created', {
        bookingId: booking.id,
        tenantId: booking.tenantId,
        // ... map to accounting event
    });
    
    return booking;
}

// In accounting event subscriber
@OnEvent('booking.created')
async handleBookingCreated(event: BookingCreatedEvent) {
    await this.eventHandlers.handleBookingCreated(event);
}
```

## External Integration

### Export to Tally
The system can export:
- Journal vouchers (XML format)
- Party masters
- Ledger masters

### Export to Zoho Books / QuickBooks
API integration possible for:
- Chart of accounts sync
- Journal entry push
- Invoice sync

### Note
With this accounting engine, external tools become **optional**. The system provides:
- Complete double-entry books
- All statutory reports
- Audit-ready ledgers
- Tax compliance data

## Security & Audit

### Access Control
- Role-based access to accounting functions
- Separate permissions for posting, reversal
- Period close requires elevated permissions

### Audit Trail
- All journal entries immutable after posting
- Reversal creates new compensating entry
- User, timestamp, IP logged for all changes
- Complete audit log table

### Data Integrity
- Foreign key constraints
- Check constraints on amounts
- Trigger-based validation
- Transaction-level atomicity

## Performance Considerations

### Indexes
- Composite indexes on (tenant_id, entry_date)
- Indexes on account_id, journal_entry_id
- Partial indexes for active records

### Query Optimization
- Materialized balances (optional)
- Period-based partitioning (future)
- Summary tables for dashboards

### Caching
- Chart of accounts (rarely changes)
- Account mappings
- Current fiscal period

## Future Enhancements

1. **Multi-Currency Support**
   - Currency per account
   - Forex gain/loss calculation
   - Revaluation journals

2. **Budget Module**
   - Budget entry by account
   - Variance reporting
   - Budget vs Actual

3. **Fixed Asset Management**
   - Asset register
   - Depreciation schedules
   - Disposal tracking

4. **Advanced Analytics**
   - Trend analysis
   - Predictive cash flow
   - Anomaly detection

5. **Document Management**
   - Invoice attachment
   - Receipt scanning
   - Document linking to journals

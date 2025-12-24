import { JournalEntryService } from './JournalEntryService.js';
import { JournalRuleEngine, JournalRuleContext, SourceModule } from '../../../domain/entities/accounting/JournalRuleEngine.js';
import { TaxEngineService } from './TaxEngineService.js';
import { ChartOfAccountsService } from './ChartOfAccountsService.js';
import { query } from '../../../infrastructure/database/connection.js';

/**
 * Booking Created Event
 */
export interface BookingCreatedEvent {
    bookingId: string;
    tenantId: string;
    branchId: string;
    bookingReference: string;
    customerId: string;
    customerName: string;
    totalAmount: number;
    taxAmount: number;
    discountAmount: number;
    advanceAmount: number;
    travelStartDate: Date;
    travelEndDate: Date;
    createdBy: string;
    createdAt: Date;
}

/**
 * Payment Received Event
 */
export interface PaymentReceivedEvent {
    paymentId: string;
    tenantId: string;
    branchId: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE';
    referenceNumber?: string;
    bankAccountId?: string;
    receivedBy: string;
    receivedAt: Date;
}

/**
 * Refund Issued Event
 */
export interface RefundIssuedEvent {
    refundId: string;
    tenantId: string;
    branchId: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    amount: number;
    reason: string;
    refundMethod: 'CASH' | 'BANK_TRANSFER' | 'ORIGINAL_PAYMENT_METHOD';
    bankAccountId?: string;
    processedBy: string;
    processedAt: Date;
}

/**
 * Vendor Assigned Event
 */
export interface VendorAssignedEvent {
    assignmentId: string;
    tenantId: string;
    branchId: string;
    bookingId: string;
    vendorId: string;
    vendorName: string;
    serviceType: string;
    amount: number;
    taxAmount: number;
    tdsAmount: number;
    dueDate: Date;
    assignedBy: string;
    assignedAt: Date;
}

/**
 * Vendor Payment Event
 */
export interface VendorPaymentEvent {
    paymentId: string;
    tenantId: string;
    branchId: string;
    vendorId: string;
    vendorName: string;
    payableIds: string[];
    totalAmount: number;
    tdsDeducted: number;
    netAmount: number;
    paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH';
    bankAccountId?: string;
    referenceNumber?: string;
    paidBy: string;
    paidAt: Date;
}

/**
 * Expense Recorded Event
 */
export interface ExpenseRecordedEvent {
    expenseId: string;
    tenantId: string;
    branchId: string;
    expenseCategory: string;
    expenseAccountCode: string;
    amount: number;
    taxAmount: number;
    vendorId?: string;
    vendorName?: string;
    description: string;
    expenseDate: Date;
    paymentMethod?: 'CASH' | 'BANK' | 'CREDIT';
    bankAccountId?: string;
    recordedBy: string;
}

/**
 * Payroll Processed Event
 */
export interface PayrollProcessedEvent {
    payrollId: string;
    tenantId: string;
    branchId: string;
    periodStart: Date;
    periodEnd: Date;
    employees: Array<{
        employeeId: string;
        employeeName: string;
        grossSalary: number;
        deductions: {
            pf: number;
            esi: number;
            tds: number;
            other: number;
        };
        netSalary: number;
    }>;
    totals: {
        grossSalary: number;
        pfEmployee: number;
        pfEmployer: number;
        esiEmployee: number;
        esiEmployer: number;
        tds: number;
        netSalary: number;
    };
    processedBy: string;
    processedAt: Date;
}

/**
 * Inter-Branch Transfer Event
 */
export interface InterBranchTransferEvent {
    transferId: string;
    tenantId: string;
    fromBranchId: string;
    toBranchId: string;
    amount: number;
    reason: string;
    transferDate: Date;
    initiatedBy: string;
}

/**
 * Accounting Event Handlers
 * 
 * Connects operational events to automated journal generation.
 * This is the bridge between operations and accounting.
 */
export class AccountingEventHandlers {
    private journalService: JournalEntryService;
    private ruleEngine: JournalRuleEngine;
    private taxService: TaxEngineService;
    private coaService: ChartOfAccountsService;

    constructor() {
        this.journalService = new JournalEntryService();
        this.ruleEngine = new JournalRuleEngine();
        this.taxService = new TaxEngineService();
        this.coaService = new ChartOfAccountsService();
    }

    // ==================== BOOKING EVENTS ====================

    /**
     * Handle booking created - recognizes revenue and receivables
     */
    async handleBookingCreated(event: BookingCreatedEvent): Promise<string> {
        // Get account mappings
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.BOOKING,
            sourceRecordId: event.bookingId,
            transactionDate: event.createdAt,
            amount: event.totalAmount,
            taxAmount: event.taxAmount,
            discountAmount: event.discountAmount,
            partyId: event.customerId,
            partyName: event.customerName,
            referenceNumber: event.bookingReference,
            userId: event.createdBy,
            costCenterId: event.bookingId, // Trip-level tracking
            accountMappings: accounts,
        };

        const journalData = this.ruleEngine.generateJournal(context);

        // Create and post the journal
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.createdBy);

        // Record tax transaction
        if (event.taxAmount > 0) {
            await this.taxService.recordTaxTransaction({
                tenantId: event.tenantId,
                branchId: event.branchId,
                taxCodeId: accounts.gstOutputAccountId!,
                taxCode: 'GST18',
                taxRate: 18,
                taxType: 'GST',
                taxCategory: 'STANDARD',
                sourceModule: 'BOOKING',
                sourceRecordId: event.bookingId,
                journalEntryId: journal.id,
                transactionDate: event.createdAt,
                placeOfSupply: 'INTRA_STATE', // Would be determined by customer location
                taxableAmount: event.totalAmount - event.taxAmount,
                taxAmount: event.taxAmount,
                totalAmount: event.totalAmount,
                partyType: 'CUSTOMER',
                partyId: event.customerId,
                partyName: event.customerName,
                isInputTax: false,
                isReverseCharge: false,
                isCredited: false,
            });
        }

        return journal.id;
    }

    /**
     * Handle payment received from customer
     */
    async handlePaymentReceived(event: PaymentReceivedEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        // Determine cash/bank account based on payment method
        let cashBankAccountId: string;
        switch (event.paymentMethod) {
            case 'CASH':
                cashBankAccountId = accounts.cashAccountId!;
                break;
            case 'BANK_TRANSFER':
            case 'CARD':
            case 'UPI':
            case 'CHEQUE':
                cashBankAccountId = event.bankAccountId || accounts.bankAccountId!;
                break;
            default:
                cashBankAccountId = accounts.bankAccountId!;
        }

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.PAYMENT,
            sourceRecordId: event.paymentId,
            transactionDate: event.receivedAt,
            amount: event.amount,
            partyId: event.customerId,
            partyName: event.customerName,
            referenceNumber: event.referenceNumber,
            userId: event.receivedBy,
            costCenterId: event.bookingId,
            accountMappings: {
                ...accounts,
                cashAccountId: cashBankAccountId,
            },
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.receivedBy);

        return journal.id;
    }

    /**
     * Handle refund issued to customer
     */
    async handleRefundIssued(event: RefundIssuedEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        let cashBankAccountId: string;
        switch (event.refundMethod) {
            case 'CASH':
                cashBankAccountId = accounts.cashAccountId!;
                break;
            default:
                cashBankAccountId = event.bankAccountId || accounts.bankAccountId!;
        }

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.REFUND,
            sourceRecordId: event.refundId,
            transactionDate: event.processedAt,
            amount: event.amount,
            partyId: event.customerId,
            partyName: event.customerName,
            notes: event.reason,
            userId: event.processedBy,
            costCenterId: event.bookingId,
            accountMappings: {
                ...accounts,
                cashAccountId: cashBankAccountId,
            },
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.processedBy);

        return journal.id;
    }

    // ==================== VENDOR EVENTS ====================

    /**
     * Handle vendor assigned to booking
     */
    async handleVendorAssigned(event: VendorAssignedEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.VENDOR_ASSIGNMENT,
            sourceRecordId: event.assignmentId,
            transactionDate: event.assignedAt,
            amount: event.amount,
            taxAmount: event.taxAmount,
            tdsAmount: event.tdsAmount,
            partyId: event.vendorId,
            partyName: event.vendorName,
            userId: event.assignedBy,
            costCenterId: event.bookingId,
            accountMappings: accounts,
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.assignedBy);

        // Record input GST
        if (event.taxAmount > 0) {
            await this.taxService.recordTaxTransaction({
                tenantId: event.tenantId,
                branchId: event.branchId,
                taxCodeId: accounts.gstInputAccountId!,
                taxCode: 'GST18',
                taxRate: 18,
                taxType: 'GST',
                taxCategory: 'STANDARD',
                sourceModule: 'VENDOR_ASSIGNMENT',
                sourceRecordId: event.assignmentId,
                journalEntryId: journal.id,
                transactionDate: event.assignedAt,
                placeOfSupply: 'INTRA_STATE',
                taxableAmount: event.amount - event.taxAmount,
                taxAmount: event.taxAmount,
                totalAmount: event.amount,
                partyType: 'VENDOR',
                partyId: event.vendorId,
                partyName: event.vendorName,
                isInputTax: true,
                isReverseCharge: false,
                isCredited: false,
            });
        }

        // Record TDS if applicable
        if (event.tdsAmount > 0) {
            await this.taxService.recordTaxTransaction({
                tenantId: event.tenantId,
                branchId: event.branchId,
                taxCodeId: accounts.tdsPayableAccountId!,
                taxCode: 'TDS194C2',
                taxRate: 2,
                taxType: 'TDS',
                taxCategory: 'TDS_194C',
                sourceModule: 'VENDOR_ASSIGNMENT',
                sourceRecordId: event.assignmentId,
                journalEntryId: journal.id,
                transactionDate: event.assignedAt,
                taxableAmount: event.amount - event.taxAmount,
                taxAmount: event.tdsAmount,
                totalAmount: event.amount,
                partyType: 'VENDOR',
                partyId: event.vendorId,
                partyName: event.vendorName,
                isInputTax: false,
                isReverseCharge: false,
                isCredited: false,
            });
        }

        return journal.id;
    }

    /**
     * Handle vendor payment
     */
    async handleVendorPayment(event: VendorPaymentEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        const cashBankAccountId = event.bankAccountId || accounts.bankAccountId!;

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.VENDOR_SETTLEMENT,
            sourceRecordId: event.paymentId,
            transactionDate: event.paidAt,
            amount: event.totalAmount,
            tdsAmount: event.tdsDeducted,
            partyId: event.vendorId,
            partyName: event.vendorName,
            referenceNumber: event.referenceNumber,
            userId: event.paidBy,
            accountMappings: {
                ...accounts,
                bankAccountId: cashBankAccountId,
            },
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.paidBy);

        return journal.id;
    }

    // ==================== EXPENSE EVENTS ====================

    /**
     * Handle expense recorded
     */
    async handleExpenseRecorded(event: ExpenseRecordedEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        // Get the expense account by code
        const expenseAccount = await this.coaService.getAccountByCode(
            event.tenantId,
            event.expenseAccountCode
        );

        if (!expenseAccount) {
            throw new Error(`Expense account not found: ${event.expenseAccountCode}`);
        }

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.EXPENSE,
            sourceRecordId: event.expenseId,
            transactionDate: event.expenseDate,
            amount: event.amount,
            taxAmount: event.taxAmount,
            partyId: event.vendorId,
            partyName: event.vendorName,
            notes: event.description,
            userId: event.recordedBy,
            accountMappings: {
                ...accounts,
                expenseAccountId: expenseAccount.id,
            },
            metadata: {
                expenseCategory: event.expenseCategory,
                paymentMethod: event.paymentMethod,
            },
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.recordedBy);

        return journal.id;
    }

    // ==================== PAYROLL EVENTS ====================

    /**
     * Handle payroll processed
     */
    async handlePayrollProcessed(event: PayrollProcessedEvent): Promise<string> {
        const accounts = await this.getAccountMappings(event.tenantId, event.branchId);

        const context: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.branchId,
            sourceModule: SourceModule.PAYROLL,
            sourceRecordId: event.payrollId,
            transactionDate: event.processedAt,
            amount: event.totals.grossSalary,
            userId: event.processedBy,
            accountMappings: accounts,
            metadata: {
                periodStart: event.periodStart,
                periodEnd: event.periodEnd,
                pfEmployee: event.totals.pfEmployee,
                pfEmployer: event.totals.pfEmployer,
                esiEmployee: event.totals.esiEmployee,
                esiEmployer: event.totals.esiEmployer,
                tds: event.totals.tds,
                netSalary: event.totals.netSalary,
            },
        };

        const journalData = this.ruleEngine.generateJournal(context);
        const journal = await this.journalService.createJournalEntry(journalData);
        await this.journalService.postJournal(event.tenantId, journal.id, event.processedBy);

        return journal.id;
    }

    // ==================== INTER-BRANCH EVENTS ====================

    /**
     * Handle inter-branch transfer
     */
    async handleInterBranchTransfer(event: InterBranchTransferEvent): Promise<{ fromJournalId: string; toJournalId: string }> {
        const fromAccounts = await this.getAccountMappings(event.tenantId, event.fromBranchId);
        const toAccounts = await this.getAccountMappings(event.tenantId, event.toBranchId);

        // Create journal in source branch
        const fromContext: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.fromBranchId,
            sourceModule: SourceModule.INTER_BRANCH,
            sourceRecordId: event.transferId,
            transactionDate: event.transferDate,
            amount: event.amount,
            notes: event.reason,
            userId: event.initiatedBy,
            accountMappings: fromAccounts,
            metadata: {
                direction: 'OUT',
                counterpartyBranchId: event.toBranchId,
            },
        };

        const fromJournalData = this.ruleEngine.generateJournal(fromContext);
        const fromJournal = await this.journalService.createJournalEntry(fromJournalData);
        await this.journalService.postJournal(event.tenantId, fromJournal.id, event.initiatedBy);

        // Create journal in destination branch
        const toContext: JournalRuleContext = {
            tenantId: event.tenantId,
            branchId: event.toBranchId,
            sourceModule: SourceModule.INTER_BRANCH,
            sourceRecordId: event.transferId,
            transactionDate: event.transferDate,
            amount: event.amount,
            notes: event.reason,
            userId: event.initiatedBy,
            accountMappings: toAccounts,
            metadata: {
                direction: 'IN',
                counterpartyBranchId: event.fromBranchId,
            },
        };

        const toJournalData = this.ruleEngine.generateJournal(toContext);
        const toJournal = await this.journalService.createJournalEntry(toJournalData);
        await this.journalService.postJournal(event.tenantId, toJournal.id, event.initiatedBy);

        // Record inter-branch transaction
        await query(`
            INSERT INTO public.inter_branch_transactions (
                id, tenant_id, from_branch_id, to_branch_id, amount,
                from_journal_id, to_journal_id, transaction_type, description,
                status, initiated_by, initiated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'FUND_TRANSFER', $8, 'COMPLETED', $9, $10)
        `, [
            event.transferId,
            event.tenantId,
            event.fromBranchId,
            event.toBranchId,
            event.amount,
            fromJournal.id,
            toJournal.id,
            event.reason,
            event.initiatedBy,
            event.transferDate,
        ]);

        return { fromJournalId: fromJournal.id, toJournalId: toJournal.id };
    }

    // ==================== HELPERS ====================

    /**
     * Get standard account mappings for a branch
     */
    private async getAccountMappings(tenantId: string, branchId: string): Promise<Record<string, string>> {
        const accountCodes = [
            { code: '1101', key: 'cashAccountId' },
            { code: '1102', key: 'bankAccountId' },
            { code: '1201', key: 'receivablesAccountId' },
            { code: '1210', key: 'advanceReceivableAccountId' },
            { code: '1301', key: 'prepaidAccountId' },
            { code: '1401', key: 'gstInputAccountId' },
            { code: '2101', key: 'vendorPayableAccountId' },
            { code: '2201', key: 'gstOutputAccountId' },
            { code: '2202', key: 'tdsPayableAccountId' },
            { code: '2301', key: 'salaryPayableAccountId' },
            { code: '2302', key: 'pfPayableAccountId' },
            { code: '2303', key: 'esiPayableAccountId' },
            { code: '2501', key: 'interBranchAccountId' },
            { code: '4101', key: 'packageRevenueAccountId' },
            { code: '4301', key: 'discountAccountId' },
            { code: '5101', key: 'vendorCostAccountId' },
            { code: '6101', key: 'salaryExpenseAccountId' },
        ];

        const mappings: Record<string, string> = {};

        for (const { code, key } of accountCodes) {
            const account = await this.coaService.getAccountByCode(tenantId, code);
            if (account) {
                mappings[key] = account.id;
            }
        }

        return mappings;
    }
}

import { generateId } from '../../../shared/utils/index.js';
import { JournalEntry, JournalLineProps, SourceModule } from '../../entities/accounting/JournalEntry.js';
import { TRAVEL_COA_TEMPLATE } from '../../entities/accounting/Account.js';

/**
 * Journal Rule Engine - The heart of the accounting automation
 * 
 * This engine defines the rules for automatic journal entry generation
 * based on business events. Every financial event MUST produce a journal entry.
 * 
 * Principles:
 * - Event-driven: Journals are created in response to business events
 * - Branch-aware: Every journal belongs to exactly one branch
 * - Immutable: Once posted, journals cannot be changed
 * - Complete: No financial activity without a journal entry
 */

/**
 * Business Event Types that trigger journal entries
 */
export type BusinessEvent =
    // Booking lifecycle
    | 'BOOKING_CREATED'
    | 'BOOKING_CONFIRMED'
    | 'BOOKING_CANCELLED'
    
    // Payment events
    | 'ADVANCE_RECEIVED'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_REFUNDED'
    | 'PAYMENT_GATEWAY_FEE'
    
    // Trip lifecycle
    | 'TRIP_STARTED'
    | 'TRIP_COMPLETED'
    
    // Revenue recognition
    | 'REVENUE_RECOGNIZED'
    | 'CANCELLATION_FEE_APPLIED'
    
    // Vendor events
    | 'VENDOR_SERVICE_RECEIVED'
    | 'VENDOR_ADVANCE_PAID'
    | 'VENDOR_PAYMENT_MADE'
    
    // Payroll events
    | 'PAYROLL_PROCESSED'
    | 'SALARY_PAID'
    | 'EXPENSE_APPROVED'
    | 'EXPENSE_REIMBURSED'
    
    // Gear/Inventory
    | 'GEAR_PURCHASED'
    | 'GEAR_DEPRECIATED'
    | 'GEAR_WRITTEN_OFF'
    | 'GEAR_RENTED'
    
    // OTA
    | 'OTA_COMMISSION_DEDUCTED'
    
    // Inter-branch
    | 'INTER_BRANCH_TRANSFER'
    
    // Period close
    | 'PERIOD_CLOSE'
    | 'YEAR_END_CLOSE'
    
    // Manual
    | 'MANUAL_ADJUSTMENT';

/**
 * Event payload base
 */
export interface EventPayloadBase {
    tenantId: string;
    branchId: string;
    userId: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}

/**
 * Booking event payload
 */
export interface BookingEventPayload extends EventPayloadBase {
    bookingId: string;
    customerId: string;
    customerName: string;
    tripId?: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    source: 'DIRECT' | 'OTA';
    otaName?: string;
    otaCommissionRate?: number;
}

/**
 * Payment event payload
 */
export interface PaymentEventPayload extends EventPayloadBase {
    paymentId: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
    bankAccountId?: string;
    isAdvance: boolean;
    gatewayFee?: number;
}

/**
 * Refund event payload
 */
export interface RefundEventPayload extends EventPayloadBase {
    refundId: string;
    bookingId: string;
    customerId: string;
    customerName: string;
    refundAmount: number;
    cancellationFee?: number;
    reason: string;
}

/**
 * Vendor event payload
 */
export interface VendorEventPayload extends EventPayloadBase {
    vendorId: string;
    vendorName: string;
    tripId?: string;
    assignmentId?: string;
    serviceType: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    tdsAmount?: number;
}

/**
 * Payroll event payload
 */
export interface PayrollEventPayload extends EventPayloadBase {
    payrollId: string;
    employeeId: string;
    employeeName: string;
    grossSalary: number;
    deductions: {
        pf: number;
        esi: number;
        tax: number;
        other: number;
    };
    netSalary: number;
    employerContributions: {
        pf: number;
        esi: number;
    };
}

/**
 * Expense event payload
 */
export interface ExpenseEventPayload extends EventPayloadBase {
    expenseId: string;
    employeeId: string;
    employeeName: string;
    tripId?: string;
    category: string;
    amount: number;
    taxAmount: number;
    accountCode: string;
}

/**
 * Gear event payload
 */
export interface GearEventPayload extends EventPayloadBase {
    gearId: string;
    gearName: string;
    tripId?: string;
    amount: number;
    depreciationAmount?: number;
    rentalAmount?: number;
}

/**
 * Inter-branch transfer payload
 */
export interface InterBranchTransferPayload extends EventPayloadBase {
    fromBranchId: string;
    toBranchId: string;
    amount: number;
    description: string;
    transferType: 'FUND' | 'EXPENSE_ALLOCATION' | 'REVENUE_SHARE';
}

/**
 * Journal Rule - Defines how to create journal entries for an event
 */
export interface JournalRule {
    eventType: BusinessEvent;
    description: string;
    createJournalEntry: (payload: EventPayloadBase, accountResolver: AccountResolver) => Promise<JournalEntry>;
}

/**
 * Account Resolver - Resolves account codes to account IDs
 */
export interface AccountResolver {
    getAccountId(tenantId: string, accountCode: string): Promise<string>;
    getAccountByCode(tenantId: string, code: string): Promise<{ id: string; code: string; name: string } | null>;
    getBankAccountId(tenantId: string, bankAccountId: string): Promise<string>;
}

/**
 * Journal Rule Engine Implementation
 */
export class JournalRuleEngine {
    private rules: Map<BusinessEvent, JournalRule> = new Map();

    constructor() {
        this.initializeRules();
    }

    /**
     * Initialize all journal rules
     */
    private initializeRules(): void {
        // ==================== BOOKING EVENTS ====================

        this.registerRule({
            eventType: 'BOOKING_CREATED',
            description: 'Booking created - record as unearned revenue',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as BookingEventPayload;
                
                // Debit: Accounts Receivable
                // Credit: Unearned Revenue (Customer Advances)
                // Credit: GST Output (if applicable)
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.ACCOUNTS_RECEIVABLE.code),
                        description: `Booking receivable - ${payload.customerName}`,
                        debitAmount: payload.totalAmount,
                        creditAmount: 0,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        tripId: payload.tripId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CUSTOMER_ADVANCES_LIABILITY.code),
                        description: `Unearned revenue - Booking`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        tripId: payload.tripId,
                        lineNumber: 2,
                    },
                ];

                // Add tax line if applicable
                if (payload.taxAmount > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GST_OUTPUT.code),
                        description: `GST on booking`,
                        debitAmount: 0,
                        creditAmount: payload.taxAmount,
                        bookingId: payload.bookingId,
                        lineNumber: 3,
                    });
                }

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Booking created: ${payload.bookingId}`,
                    sourceModule: 'BOOKING',
                    sourceRecordId: payload.bookingId,
                    sourceRecordType: 'booking',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'ADVANCE_RECEIVED',
            description: 'Customer advance payment received',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as PaymentEventPayload;
                
                // Debit: Bank/Cash
                // Credit: Accounts Receivable
                
                const bankAccountLedgerId = payload.bankAccountId 
                    ? await resolver.getBankAccountId(payload.tenantId, payload.bankAccountId)
                    : await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CASH.code);

                const lines: JournalLineProps[] = [
                    {
                        accountId: bankAccountLedgerId,
                        description: `Advance received - ${payload.customerName}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.ACCOUNTS_RECEIVABLE.code),
                        description: `Advance payment applied`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 2,
                    },
                ];

                // Handle gateway fee if applicable
                if (payload.gatewayFee && payload.gatewayFee > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.PAYMENT_GATEWAY_FEES.code),
                        description: `Payment gateway fee`,
                        debitAmount: payload.gatewayFee,
                        creditAmount: 0,
                        bookingId: payload.bookingId,
                        lineNumber: 3,
                    });
                    // Adjust bank receipt for net amount
                    lines[0].debitAmount = payload.amount - payload.gatewayFee;
                }

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Advance received: ${payload.paymentId}`,
                    sourceModule: 'PAYMENT',
                    sourceRecordId: payload.paymentId,
                    sourceRecordType: 'payment',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'PAYMENT_RECEIVED',
            description: 'Customer payment received (balance)',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as PaymentEventPayload;
                
                // Same as advance but tracked differently
                const bankAccountLedgerId = payload.bankAccountId 
                    ? await resolver.getBankAccountId(payload.tenantId, payload.bankAccountId)
                    : await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CASH.code);

                const lines: JournalLineProps[] = [
                    {
                        accountId: bankAccountLedgerId,
                        description: `Payment received - ${payload.customerName}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.ACCOUNTS_RECEIVABLE.code),
                        description: `Payment applied to booking`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Payment received: ${payload.paymentId}`,
                    sourceModule: 'PAYMENT',
                    sourceRecordId: payload.paymentId,
                    sourceRecordType: 'payment',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== REVENUE RECOGNITION ====================

        this.registerRule({
            eventType: 'TRIP_COMPLETED',
            description: 'Trip completed - recognize revenue',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as BookingEventPayload;
                
                // Debit: Unearned Revenue (Customer Advances)
                // Credit: Trip Revenue
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CUSTOMER_ADVANCES_LIABILITY.code),
                        description: `Revenue recognized - trip completed`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        bookingId: payload.bookingId,
                        tripId: payload.tripId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.TRIP_REVENUE.code),
                        description: `Trip revenue - ${payload.tripId}`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        bookingId: payload.bookingId,
                        tripId: payload.tripId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Revenue recognized: Trip ${payload.tripId}`,
                    sourceModule: 'BOOKING',
                    sourceRecordId: payload.tripId!,
                    sourceRecordType: 'trip',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== CANCELLATION & REFUNDS ====================

        this.registerRule({
            eventType: 'BOOKING_CANCELLED',
            description: 'Booking cancelled - create refund liability',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as RefundEventPayload;
                
                // Debit: Unearned Revenue
                // Credit: Refund Liability (for refund amount)
                // Credit: Cancellation Fee Revenue (for fee)
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CUSTOMER_ADVANCES_LIABILITY.code),
                        description: `Cancellation - unearned revenue reversed`,
                        debitAmount: payload.refundAmount + (payload.cancellationFee ?? 0),
                        creditAmount: 0,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.REFUND_LIABILITY.code),
                        description: `Refund liability - ${payload.customerName}`,
                        debitAmount: 0,
                        creditAmount: payload.refundAmount,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 2,
                    },
                ];

                if (payload.cancellationFee && payload.cancellationFee > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.CANCELLATION_FEES.code),
                        description: `Cancellation fee revenue`,
                        debitAmount: 0,
                        creditAmount: payload.cancellationFee,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 3,
                    });
                }

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Booking cancelled: ${payload.bookingId}`,
                    sourceModule: 'REFUND',
                    sourceRecordId: payload.bookingId,
                    sourceRecordType: 'booking',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'PAYMENT_REFUNDED',
            description: 'Refund processed to customer',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as RefundEventPayload;
                
                // Debit: Refund Liability
                // Credit: Bank/Cash
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.REFUND_LIABILITY.code),
                        description: `Refund processed - ${payload.customerName}`,
                        debitAmount: payload.refundAmount,
                        creditAmount: 0,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.BANK_ACCOUNTS.code),
                        description: `Refund payment`,
                        debitAmount: 0,
                        creditAmount: payload.refundAmount,
                        customerId: payload.customerId,
                        bookingId: payload.bookingId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Refund processed: ${payload.refundId}`,
                    sourceModule: 'REFUND',
                    sourceRecordId: payload.refundId,
                    sourceRecordType: 'refund',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== VENDOR EVENTS ====================

        this.registerRule({
            eventType: 'VENDOR_SERVICE_RECEIVED',
            description: 'Vendor service received - create payable',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as VendorEventPayload;
                
                // Debit: Cost of Services (Vendor Services)
                // Debit: GST Input (if applicable)
                // Credit: Vendor Payables
                // Credit: TDS Payable (if applicable)
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.VENDOR_SERVICES.code),
                        description: `${payload.serviceType} - ${payload.vendorName}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        vendorId: payload.vendorId,
                        tripId: payload.tripId,
                        lineNumber: 1,
                    },
                ];

                if (payload.taxAmount > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GST_INPUT.code),
                        description: `GST on vendor service`,
                        debitAmount: payload.taxAmount,
                        creditAmount: 0,
                        vendorId: payload.vendorId,
                        lineNumber: 2,
                    });
                }

                const netPayable = payload.totalAmount - (payload.tdsAmount ?? 0);
                
                lines.push({
                    accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.VENDOR_PAYABLES.code),
                    description: `Payable to ${payload.vendorName}`,
                    debitAmount: 0,
                    creditAmount: netPayable,
                    vendorId: payload.vendorId,
                    tripId: payload.tripId,
                    lineNumber: lines.length + 1,
                });

                if (payload.tdsAmount && payload.tdsAmount > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.TDS_PAYABLE.code),
                        description: `TDS on ${payload.vendorName}`,
                        debitAmount: 0,
                        creditAmount: payload.tdsAmount,
                        vendorId: payload.vendorId,
                        lineNumber: lines.length + 1,
                    });
                }

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Vendor service: ${payload.vendorName} - ${payload.serviceType}`,
                    sourceModule: 'VENDOR',
                    sourceRecordId: payload.assignmentId!,
                    sourceRecordType: 'vendor_assignment',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'VENDOR_PAYMENT_MADE',
            description: 'Payment made to vendor',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as VendorEventPayload;
                
                // Debit: Vendor Payables
                // Credit: Bank
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.VENDOR_PAYABLES.code),
                        description: `Payment to ${payload.vendorName}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        vendorId: payload.vendorId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.BANK_ACCOUNTS.code),
                        description: `Vendor payment`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        vendorId: payload.vendorId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Vendor payment: ${payload.vendorName}`,
                    sourceModule: 'VENDOR',
                    sourceRecordId: payload.assignmentId!,
                    sourceRecordType: 'vendor_settlement',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== PAYROLL EVENTS ====================

        this.registerRule({
            eventType: 'PAYROLL_PROCESSED',
            description: 'Monthly payroll processed - create liabilities',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as PayrollEventPayload;
                
                // Debit: Salaries & Wages
                // Debit: PF Contribution (Employer)
                // Debit: ESI Contribution (Employer)
                // Credit: Payroll Payable (Net Salary)
                // Credit: PF Payable (Employee + Employer)
                // Credit: ESI Payable (Employee + Employer)
                // Credit: TDS Payable (if any)
                
                const totalPFContribution = payload.deductions.pf + payload.employerContributions.pf;
                const totalESIContribution = payload.deductions.esi + payload.employerContributions.esi;
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.SALARIES.code),
                        description: `Salary - ${payload.employeeName}`,
                        debitAmount: payload.grossSalary,
                        creditAmount: 0,
                        employeeId: payload.employeeId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.PF_CONTRIBUTIONS.code),
                        description: `Employer PF contribution`,
                        debitAmount: payload.employerContributions.pf,
                        creditAmount: 0,
                        employeeId: payload.employeeId,
                        lineNumber: 2,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.ESI_CONTRIBUTIONS.code),
                        description: `Employer ESI contribution`,
                        debitAmount: payload.employerContributions.esi,
                        creditAmount: 0,
                        employeeId: payload.employeeId,
                        lineNumber: 3,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.PAYROLL_PAYABLE.code),
                        description: `Net salary payable - ${payload.employeeName}`,
                        debitAmount: 0,
                        creditAmount: payload.netSalary,
                        employeeId: payload.employeeId,
                        lineNumber: 4,
                    },
                ];

                // Add statutory payables
                if (totalPFContribution > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, '2330'), // PF Payable
                        description: `PF payable (Employee + Employer)`,
                        debitAmount: 0,
                        creditAmount: totalPFContribution,
                        lineNumber: lines.length + 1,
                    });
                }

                if (totalESIContribution > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, '2340'), // ESI Payable
                        description: `ESI payable (Employee + Employer)`,
                        debitAmount: 0,
                        creditAmount: totalESIContribution,
                        lineNumber: lines.length + 1,
                    });
                }

                if (payload.deductions.tax > 0) {
                    lines.push({
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.TDS_PAYABLE.code),
                        description: `TDS on salary`,
                        debitAmount: 0,
                        creditAmount: payload.deductions.tax,
                        employeeId: payload.employeeId,
                        lineNumber: lines.length + 1,
                    });
                }

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Payroll processed: ${payload.employeeName}`,
                    sourceModule: 'PAYROLL',
                    sourceRecordId: payload.payrollId,
                    sourceRecordType: 'payroll',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'SALARY_PAID',
            description: 'Salary paid to employee',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as PayrollEventPayload;
                
                // Debit: Payroll Payable
                // Credit: Bank
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.PAYROLL_PAYABLE.code),
                        description: `Salary paid - ${payload.employeeName}`,
                        debitAmount: payload.netSalary,
                        creditAmount: 0,
                        employeeId: payload.employeeId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.BANK_ACCOUNTS.code),
                        description: `Salary payment`,
                        debitAmount: 0,
                        creditAmount: payload.netSalary,
                        employeeId: payload.employeeId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Salary paid: ${payload.employeeName}`,
                    sourceModule: 'PAYROLL',
                    sourceRecordId: payload.payrollId,
                    sourceRecordType: 'salary_payment',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== GEAR EVENTS ====================

        this.registerRule({
            eventType: 'GEAR_DEPRECIATED',
            description: 'Monthly gear depreciation',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as GearEventPayload;
                
                // Debit: Gear Depreciation Expense
                // Credit: Accumulated Depreciation - Gear
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GEAR_DEPRECIATION_EXP.code),
                        description: `Depreciation - ${payload.gearName}`,
                        debitAmount: payload.depreciationAmount!,
                        creditAmount: 0,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GEAR_DEPRECIATION.code),
                        description: `Accumulated depreciation - ${payload.gearName}`,
                        debitAmount: 0,
                        creditAmount: payload.depreciationAmount!,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    entryType: 'RECURRING',
                    description: `Gear depreciation: ${payload.gearName}`,
                    sourceModule: 'DEPRECIATION',
                    sourceRecordId: payload.gearId,
                    sourceRecordType: 'gear',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        this.registerRule({
            eventType: 'GEAR_WRITTEN_OFF',
            description: 'Gear damaged or written off',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as GearEventPayload;
                
                // Debit: Gear Write-off Expense
                // Credit: Gear Asset
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GEAR_WRITEOFF.code),
                        description: `Write-off - ${payload.gearName}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        tripId: payload.tripId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.GEAR_EQUIPMENT.code),
                        description: `Asset removed - ${payload.gearName}`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `Gear write-off: ${payload.gearName}`,
                    sourceModule: 'GEAR',
                    sourceRecordId: payload.gearId,
                    sourceRecordType: 'gear_writeoff',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== OTA EVENTS ====================

        this.registerRule({
            eventType: 'OTA_COMMISSION_DEDUCTED',
            description: 'OTA commission deducted from settlement',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as BookingEventPayload;
                
                const commissionAmount = payload.amount * (payload.otaCommissionRate ?? 0) / 100;
                
                // Debit: OTA Commission Expense
                // Credit: OTA Receivable (reduces what we receive)
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.OTA_COMMISSION.code),
                        description: `OTA Commission - ${payload.otaName}`,
                        debitAmount: commissionAmount,
                        creditAmount: 0,
                        bookingId: payload.bookingId,
                        tripId: payload.tripId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.OTA_RECEIVABLE.code),
                        description: `Commission deducted by ${payload.otaName}`,
                        debitAmount: 0,
                        creditAmount: commissionAmount,
                        bookingId: payload.bookingId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.branchId,
                    entryDate: payload.timestamp ?? new Date(),
                    description: `OTA commission: ${payload.otaName} - ${payload.bookingId}`,
                    sourceModule: 'BOOKING',
                    sourceRecordId: payload.bookingId,
                    sourceRecordType: 'ota_commission',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });

        // ==================== INTER-BRANCH EVENTS ====================

        this.registerRule({
            eventType: 'INTER_BRANCH_TRANSFER',
            description: 'Inter-branch fund transfer',
            createJournalEntry: async (basePayload, resolver) => {
                const payload = basePayload as InterBranchTransferPayload;
                
                // FROM branch entry:
                // Debit: Inter-Branch Receivable
                // Credit: Bank
                
                // Note: The TO branch will have a corresponding entry
                // Debit: Bank
                // Credit: Inter-Branch Payable
                
                const lines: JournalLineProps[] = [
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.INTER_BRANCH_RECEIVABLE.code),
                        description: `Transfer to branch ${payload.toBranchId}`,
                        debitAmount: payload.amount,
                        creditAmount: 0,
                        branchId: payload.fromBranchId,
                        lineNumber: 1,
                    },
                    {
                        accountId: await resolver.getAccountId(payload.tenantId, TRAVEL_COA_TEMPLATE.BANK_ACCOUNTS.code),
                        description: `Inter-branch transfer out`,
                        debitAmount: 0,
                        creditAmount: payload.amount,
                        branchId: payload.fromBranchId,
                        lineNumber: 2,
                    },
                ];

                return JournalEntry.create({
                    tenantId: payload.tenantId,
                    branchId: payload.fromBranchId,
                    entryDate: payload.timestamp ?? new Date(),
                    entryType: 'INTER_BRANCH',
                    description: payload.description,
                    sourceModule: 'INTER_BRANCH',
                    sourceRecordId: generateId(),
                    sourceRecordType: 'inter_branch_transfer',
                    createdBy: payload.userId,
                    lines,
                });
            },
        });
    }

    /**
     * Register a new journal rule
     */
    registerRule(rule: JournalRule): void {
        this.rules.set(rule.eventType, rule);
    }

    /**
     * Get rule for an event type
     */
    getRule(eventType: BusinessEvent): JournalRule | undefined {
        return this.rules.get(eventType);
    }

    /**
     * Process a business event and create a journal entry
     */
    async processEvent(
        eventType: BusinessEvent,
        payload: EventPayloadBase,
        accountResolver: AccountResolver
    ): Promise<JournalEntry> {
        const rule = this.rules.get(eventType);
        if (!rule) {
            throw new Error(`No journal rule defined for event: ${eventType}`);
        }

        return rule.createJournalEntry(payload, accountResolver);
    }

    /**
     * Get all registered event types
     */
    getRegisteredEvents(): BusinessEvent[] {
        return Array.from(this.rules.keys());
    }
}

// Singleton instance
let ruleEngineInstance: JournalRuleEngine | null = null;

export function getJournalRuleEngine(): JournalRuleEngine {
    if (!ruleEngineInstance) {
        ruleEngineInstance = new JournalRuleEngine();
    }
    return ruleEngineInstance;
}

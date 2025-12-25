import { Router, Request, Response, NextFunction } from 'express';
import { ChartOfAccountsService } from '../../application/services/accounting/ChartOfAccountsService.js';
import { JournalEntryService } from '../../application/services/accounting/JournalEntryService.js';
import { LedgerService } from '../../application/services/accounting/LedgerService.js';
import { FiscalPeriodService } from '../../application/services/accounting/FiscalPeriodService.js';
import { TaxEngineService } from '../../application/services/accounting/TaxEngineService.js';
import { BankReconciliationService } from '../../application/services/accounting/BankReconciliationService.js';
import { FinancialReportingService } from '../../application/services/accounting/FinancialReportingService.js';
import { AccountingEventHandlers } from '../../application/services/accounting/AccountingEventHandlers.js';

const router = Router();

// Service instances
const coaService = new ChartOfAccountsService();
const journalService = new JournalEntryService();
const ledgerService = new LedgerService();
const fiscalService = new FiscalPeriodService();
const taxService = new TaxEngineService();
const bankService = new BankReconciliationService();
const reportingService = new FinancialReportingService();
const eventHandlers = new AccountingEventHandlers();

// Helper to extract tenant from request
const getTenantId = (req: Request): string => {
    return (req as any).user?.tenantId || req.headers['x-tenant-id'] as string;
};

const getBranchId = (req: Request): string | undefined => {
    return req.headers['x-branch-id'] as string;
};

const getUserId = (req: Request): string => {
    return (req as any).user?.id || 'system';
};

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// ==================== CHART OF ACCOUNTS ====================

/**
 * Initialize chart of accounts from template
 * POST /api/accounting/chart-of-accounts/initialize
 */
router.post('/chart-of-accounts/initialize', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const accounts = await coaService.initializeFromTemplate(tenantId);
    res.status(201).json({
        success: true,
        message: `Initialized ${accounts.length} accounts from template`,
        data: { count: accounts.length },
    });
}));

/**
 * Get all accounts
 * GET /api/accounting/chart-of-accounts
 */
router.get('/chart-of-accounts', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { type, active } = req.query;
    
    const accounts = await coaService.getAllAccounts(
        tenantId,
        type as string,
        active === 'true'
    );
    
    res.json({ success: true, data: accounts });
}));

/**
 * Get account hierarchy
 * GET /api/accounting/chart-of-accounts/hierarchy
 */
router.get('/chart-of-accounts/hierarchy', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const hierarchy = await coaService.getAccountHierarchy(tenantId);
    res.json({ success: true, data: hierarchy });
}));

/**
 * Get single account
 * GET /api/accounting/chart-of-accounts/:id
 */
router.get('/chart-of-accounts/:id', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const account = await coaService.getAccountById(tenantId, req.params.id);
    
    if (!account) {
        return res.status(404).json({ success: false, message: 'Account not found' });
    }
    
    res.json({ success: true, data: account });
}));

/**
 * Create account
 * POST /api/accounting/chart-of-accounts
 */
router.post('/chart-of-accounts', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const account = await coaService.createAccount({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: account });
}));

/**
 * Update account
 * PUT /api/accounting/chart-of-accounts/:id
 */
router.put('/chart-of-accounts/:id', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const account = await coaService.updateAccount(tenantId, req.params.id, req.body);
    res.json({ success: true, data: account });
}));

// ==================== JOURNAL ENTRIES ====================

/**
 * Create journal entry
 * POST /api/accounting/journal-entries
 */
router.post('/journal-entries', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const userId = getUserId(req);
    
    const journal = await journalService.createJournalEntry({
        ...req.body,
        tenantId,
        branchId: branchId || req.body.branchId,
        createdBy: userId,
    });
    
    res.status(201).json({ success: true, data: journal });
}));

/**
 * Get journal entries
 * GET /api/accounting/journal-entries
 */
router.get('/journal-entries', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { startDate, endDate, status, sourceModule, page, limit } = req.query;
    
    const result = await journalService.getJournalEntries(tenantId, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status as string,
        sourceModule: sourceModule as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
    });
    
    res.json({ success: true, ...result });
}));

/**
 * Get single journal entry
 * GET /api/accounting/journal-entries/:id
 */
router.get('/journal-entries/:id', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const journal = await journalService.getJournalById(tenantId, req.params.id);
    
    if (!journal) {
        return res.status(404).json({ success: false, message: 'Journal entry not found' });
    }
    
    res.json({ success: true, data: journal });
}));

/**
 * Post journal entry
 * POST /api/accounting/journal-entries/:id/post
 */
router.post('/journal-entries/:id/post', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    
    const journal = await journalService.postJournal(tenantId, req.params.id, userId);
    res.json({ success: true, data: journal });
}));

/**
 * Reverse journal entry
 * POST /api/accounting/journal-entries/:id/reverse
 */
router.post('/journal-entries/:id/reverse', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { reason } = req.body;
    
    const reversalJournal = await journalService.reverseJournal(
        tenantId,
        req.params.id,
        userId,
        reason
    );
    
    res.json({ success: true, data: reversalJournal });
}));

// ==================== LEDGER ====================

/**
 * Get account ledger
 * GET /api/accounting/ledger/:accountId
 */
router.get('/ledger/:accountId', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { startDate, endDate, page, limit } = req.query;
    
    const result = await ledgerService.getAccountLedger(
        tenantId,
        req.params.accountId,
        {
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
        }
    );
    
    res.json({ success: true, ...result });
}));

/**
 * Get account balance
 * GET /api/accounting/ledger/:accountId/balance
 */
router.get('/ledger/:accountId/balance', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { asOfDate } = req.query;
    
    const balance = await ledgerService.getAccountBalance(
        tenantId,
        req.params.accountId,
        asOfDate ? new Date(asOfDate as string) : new Date(),
        branchId
    );
    
    res.json({ success: true, data: balance });
}));

/**
 * Get trial balance
 * GET /api/accounting/trial-balance
 */
router.get('/trial-balance', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { asOfDate } = req.query;
    
    const trialBalance = await ledgerService.getTrialBalance(
        tenantId,
        asOfDate ? new Date(asOfDate as string) : new Date(),
        branchId
    );
    
    res.json({ success: true, data: trialBalance });
}));

// ==================== FISCAL PERIODS ====================

/**
 * Create fiscal year
 * POST /api/accounting/fiscal-years
 */
router.post('/fiscal-years', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { year, startDate, endDate, name } = req.body;
    
    const fiscalYear = await fiscalService.createFiscalYear(
        tenantId,
        year,
        new Date(startDate),
        new Date(endDate),
        name
    );
    
    res.status(201).json({ success: true, data: fiscalYear });
}));

/**
 * Get fiscal years
 * GET /api/accounting/fiscal-years
 */
router.get('/fiscal-years', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const fiscalYears = await fiscalService.getAllFiscalYears(tenantId);
    res.json({ success: true, data: fiscalYears });
}));

/**
 * Get fiscal periods for a year
 * GET /api/accounting/fiscal-years/:id/periods
 */
router.get('/fiscal-years/:id/periods', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const periods = await fiscalService.getPeriodsForYear(tenantId, req.params.id);
    res.json({ success: true, data: periods });
}));

/**
 * Soft close period
 * POST /api/accounting/fiscal-periods/:id/soft-close
 */
router.post('/fiscal-periods/:id/soft-close', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    
    const period = await fiscalService.softClosePeriod(tenantId, req.params.id, userId);
    res.json({ success: true, data: period });
}));

/**
 * Hard close period
 * POST /api/accounting/fiscal-periods/:id/hard-close
 */
router.post('/fiscal-periods/:id/hard-close', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    
    const period = await fiscalService.hardClosePeriod(tenantId, req.params.id, userId);
    res.json({ success: true, data: period });
}));

/**
 * Close fiscal year
 * POST /api/accounting/fiscal-years/:id/close
 */
router.post('/fiscal-years/:id/close', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { retainedEarningsAccountId } = req.body;
    
    await fiscalService.closeFiscalYear(tenantId, req.params.id, userId, retainedEarningsAccountId);
    res.json({ success: true, message: 'Fiscal year closed successfully' });
}));

// ==================== TAX ====================

/**
 * Initialize GST codes
 * POST /api/accounting/tax/initialize-gst
 */
router.post('/tax/initialize-gst', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { inputAccountId, outputAccountId } = req.body;
    
    const codes = await taxService.initializeGSTCodes(tenantId, inputAccountId, outputAccountId);
    res.status(201).json({ success: true, data: codes });
}));

/**
 * Get tax codes
 * GET /api/accounting/tax/codes
 */
router.get('/tax/codes', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { taxType } = req.query;
    
    const codes = await taxService.getActiveTaxCodes(tenantId, taxType as string);
    res.json({ success: true, data: codes });
}));

/**
 * Get GST summary
 * GET /api/accounting/tax/gst-summary
 */
router.get('/tax/gst-summary', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { fiscalYear, fiscalPeriod } = req.query;
    
    const summary = await taxService.getGSTSummary(
        tenantId,
        parseInt(fiscalYear as string),
        parseInt(fiscalPeriod as string),
        branchId
    );
    
    res.json({ success: true, data: summary });
}));

/**
 * Get TDS summary
 * GET /api/accounting/tax/tds-summary
 */
router.get('/tax/tds-summary', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { fiscalYear, fiscalPeriod } = req.query;
    
    const summary = await taxService.getTDSSummary(
        tenantId,
        parseInt(fiscalYear as string),
        parseInt(fiscalPeriod as string),
        branchId
    );
    
    res.json({ success: true, data: summary });
}));

// ==================== BANK RECONCILIATION ====================

/**
 * Get bank accounts
 * GET /api/accounting/bank-accounts
 */
router.get('/bank-accounts', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const accounts = await bankService.getAllBankAccounts(tenantId);
    res.json({ success: true, data: accounts });
}));

/**
 * Create bank account
 * POST /api/accounting/bank-accounts
 */
router.post('/bank-accounts', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    
    const account = await bankService.createBankAccount({
        ...req.body,
        tenantId,
        branchId: branchId || req.body.branchId,
    });
    
    res.status(201).json({ success: true, data: account });
}));

/**
 * Get bank transactions
 * GET /api/accounting/bank-accounts/:id/transactions
 */
router.get('/bank-accounts/:id/transactions', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { startDate, endDate, isReconciled, page, limit } = req.query;
    
    const result = await bankService.getTransactions(tenantId, req.params.id, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        isReconciled: isReconciled ? isReconciled === 'true' : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: page && limit ? (parseInt(page as string) - 1) * parseInt(limit as string) : undefined,
    });
    
    res.json({ success: true, ...result });
}));

/**
 * Get cash position
 * GET /api/accounting/cash-position
 */
router.get('/cash-position', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    
    const position = await bankService.getCashPosition(tenantId, branchId);
    res.json({ success: true, data: position });
}));

/**
 * Start reconciliation
 * POST /api/accounting/bank-accounts/:id/reconciliation/start
 */
router.post('/bank-accounts/:id/reconciliation/start', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { statementDate, statementBalance } = req.body;
    
    const reconciliationId = await bankService.startReconciliation(
        tenantId,
        req.params.id,
        new Date(statementDate),
        statementBalance,
        userId
    );
    
    res.json({ success: true, data: { reconciliationId } });
}));

/**
 * Reconcile transactions
 * POST /api/accounting/reconciliation/:id/reconcile
 */
router.post('/reconciliation/:id/reconcile', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    const { transactionIds } = req.body;
    
    await bankService.reconcileTransactions(tenantId, transactionIds, req.params.id, userId);
    res.json({ success: true, message: 'Transactions reconciled' });
}));

/**
 * Complete reconciliation
 * POST /api/accounting/reconciliation/:id/complete
 */
router.post('/reconciliation/:id/complete', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const userId = getUserId(req);
    
    await bankService.completeReconciliation(tenantId, req.params.id, userId);
    res.json({ success: true, message: 'Reconciliation completed' });
}));

// ==================== FINANCIAL REPORTS ====================

/**
 * Generate Profit & Loss Statement
 * GET /api/accounting/reports/profit-loss
 */
router.get('/reports/profit-loss', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { startDate, endDate, tripId, includeComparison, consolidate } = req.query;
    
    const statement = await reportingService.generateProfitAndLoss(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        {
            branchId,
            tripId: tripId as string,
            includeComparison: includeComparison === 'true',
            consolidate: consolidate === 'true',
        }
    );
    
    res.json({ success: true, data: statement });
}));

/**
 * Generate Balance Sheet
 * GET /api/accounting/reports/balance-sheet
 */
router.get('/reports/balance-sheet', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { asOfDate, consolidate } = req.query;
    
    const statement = await reportingService.generateBalanceSheet(
        tenantId,
        asOfDate ? new Date(asOfDate as string) : new Date(),
        {
            branchId,
            consolidate: consolidate === 'true',
        }
    );
    
    res.json({ success: true, data: statement });
}));

/**
 * Generate Cash Flow Statement
 * GET /api/accounting/reports/cash-flow
 */
router.get('/reports/cash-flow', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { startDate, endDate } = req.query;
    
    const statement = await reportingService.generateCashFlow(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        { branchId }
    );
    
    res.json({ success: true, data: statement });
}));

/**
 * Get trip profitability
 * GET /api/accounting/reports/trip-profitability/:tripId
 */
router.get('/reports/trip-profitability/:tripId', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    
    const report = await reportingService.getTripProfitability(tenantId, req.params.tripId);
    
    if (!report) {
        return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    res.json({ success: true, data: report });
}));

/**
 * Get trip profitability report
 * GET /api/accounting/reports/trip-profitability
 */
router.get('/reports/trip-profitability', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    const { startDate, endDate } = req.query;
    
    const report = await reportingService.getTripProfitabilityReport(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        branchId
    );
    
    res.json({ success: true, data: report });
}));

/**
 * Get branch comparison
 * GET /api/accounting/reports/branch-comparison
 */
router.get('/reports/branch-comparison', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const { startDate, endDate } = req.query;
    
    const report = await reportingService.getBranchComparison(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string)
    );
    
    res.json({ success: true, data: report });
}));

// ==================== DASHBOARD ====================

/**
 * Get accounting dashboard summary
 * GET /api/accounting/dashboard
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
    const tenantId = getTenantId(req);
    const branchId = getBranchId(req);
    
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);
    
    // Get multiple data points in parallel
    const [
        mtdPnL,
        ytdPnL,
        cashPosition,
        trialBalance,
        periodStatus,
    ] = await Promise.all([
        reportingService.generateProfitAndLoss(tenantId, monthStart, today, { branchId }),
        reportingService.generateProfitAndLoss(tenantId, yearStart, today, { branchId }),
        bankService.getCashPosition(tenantId, branchId),
        ledgerService.getTrialBalance(tenantId, today, branchId),
        fiscalService.getPeriodStatusSummary(tenantId),
    ]);
    
    res.json({
        success: true,
        data: {
            monthToDate: {
                revenue: mtdPnL.revenue.total,
                expenses: mtdPnL.costOfSales.total + mtdPnL.operatingExpenses.total,
                netProfit: mtdPnL.netProfit,
                margin: mtdPnL.netMargin,
            },
            yearToDate: {
                revenue: ytdPnL.revenue.total,
                expenses: ytdPnL.costOfSales.total + ytdPnL.operatingExpenses.total,
                netProfit: ytdPnL.netProfit,
                margin: ytdPnL.netMargin,
            },
            cashPosition: {
                totalCash: cashPosition.totalBalance,
                accountCount: cashPosition.accountBreakdown.length,
            },
            trialBalance: {
                totalDebits: trialBalance.totals.totalDebit,
                totalCredits: trialBalance.totals.totalCredit,
                isBalanced: trialBalance.totals.isBalanced,
            },
            fiscalPeriod: periodStatus,
        },
    });
}));

export default router;

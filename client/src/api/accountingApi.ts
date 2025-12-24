/**
 * Accounting API Client
 * 
 * API calls for the Financial Accounting Engine
 */

import { apiClient } from './client';
import type {
    Account,
    JournalEntry,
    LedgerEntry,
    FiscalYear,
    FiscalPeriod,
    TaxCode,
    BankAccount,
    BankTransaction,
    TrialBalanceReport,
    ProfitLossReport,
    BalanceSheetReport,
    AccountingDashboardKPIs,
    RevenueByBranch,
    MonthlyTrend,
    AccountsQueryParams,
    JournalEntriesQueryParams,
    LedgerQueryParams,
    ReportQueryParams,
} from '@/types/accounting.types';

const BASE_URL = '/accounting';

// ==================== CHART OF ACCOUNTS ====================

export const accountsApi = {
    getAll: async (params?: AccountsQueryParams): Promise<Account[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/accounts`, { params });
        return data.data || data;
    },

    getTree: async (): Promise<Account[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/accounts/tree`);
        return data.data || data;
    },

    getById: async (id: string): Promise<Account> => {
        const { data } = await apiClient.get(`${BASE_URL}/accounts/${id}`);
        return data.data || data;
    },

    getByCode: async (code: string): Promise<Account> => {
        const { data } = await apiClient.get(`${BASE_URL}/accounts/code/${code}`);
        return data.data || data;
    },

    create: async (account: Partial<Account>): Promise<Account> => {
        const { data } = await apiClient.post(`${BASE_URL}/accounts`, account);
        return data.data || data;
    },

    update: async (id: string, account: Partial<Account>): Promise<Account> => {
        const { data } = await apiClient.put(`${BASE_URL}/accounts/${id}`, account);
        return data.data || data;
    },

    getBalance: async (id: string, asOfDate?: string): Promise<{ balance: number; debitTotal: number; creditTotal: number }> => {
        const { data } = await apiClient.get(`${BASE_URL}/accounts/${id}/balance`, { params: { asOfDate } });
        return data.data || data;
    },
};

// ==================== JOURNAL ENTRIES ====================

export const journalEntriesApi = {
    getAll: async (params?: JournalEntriesQueryParams): Promise<{ data: JournalEntry[]; total: number; page: number; limit: number }> => {
        const { data } = await apiClient.get(`${BASE_URL}/journal-entries`, { params });
        return data;
    },

    getById: async (id: string): Promise<JournalEntry> => {
        const { data } = await apiClient.get(`${BASE_URL}/journal-entries/${id}`);
        return data.data || data;
    },

    getByNumber: async (entryNumber: string): Promise<JournalEntry> => {
        const { data } = await apiClient.get(`${BASE_URL}/journal-entries/number/${entryNumber}`);
        return data.data || data;
    },

    create: async (entry: Partial<JournalEntry>): Promise<JournalEntry> => {
        const { data } = await apiClient.post(`${BASE_URL}/journal-entries`, entry);
        return data.data || data;
    },

    post: async (id: string): Promise<JournalEntry> => {
        const { data } = await apiClient.post(`${BASE_URL}/journal-entries/${id}/post`);
        return data.data || data;
    },

    reverse: async (id: string, reason: string): Promise<JournalEntry> => {
        const { data } = await apiClient.post(`${BASE_URL}/journal-entries/${id}/reverse`, { reason });
        return data.data || data;
    },

    approve: async (id: string): Promise<JournalEntry> => {
        const { data } = await apiClient.post(`${BASE_URL}/journal-entries/${id}/approve`);
        return data.data || data;
    },
};

// ==================== GENERAL LEDGER ====================

export const ledgerApi = {
    getEntries: async (params: LedgerQueryParams): Promise<{ data: LedgerEntry[]; total: number }> => {
        const { data } = await apiClient.get(`${BASE_URL}/ledger`, { params });
        return data;
    },

    getAccountLedger: async (accountId: string, params?: Omit<LedgerQueryParams, 'accountId'>): Promise<LedgerEntry[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/ledger/account/${accountId}`, { params });
        return data.data || data;
    },

    getTrialBalance: async (params?: ReportQueryParams): Promise<TrialBalanceReport> => {
        const { data } = await apiClient.get(`${BASE_URL}/reports/trial-balance`, { params });
        return data.data || data;
    },
};

// ==================== FISCAL PERIODS ====================

export const fiscalApi = {
    getYears: async (): Promise<FiscalYear[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/fiscal-years`);
        return data.data || data;
    },

    getCurrentYear: async (): Promise<FiscalYear> => {
        const { data } = await apiClient.get(`${BASE_URL}/fiscal-years/current`);
        return data.data || data;
    },

    getPeriods: async (fiscalYear: number): Promise<FiscalPeriod[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/fiscal-periods`, { params: { fiscalYear } });
        return data.data || data;
    },

    getCurrentPeriod: async (): Promise<FiscalPeriod> => {
        const { data } = await apiClient.get(`${BASE_URL}/fiscal-periods/current`);
        return data.data || data;
    },

    closePeriod: async (id: string): Promise<FiscalPeriod> => {
        const { data } = await apiClient.post(`${BASE_URL}/fiscal-periods/${id}/close`);
        return data.data || data;
    },
};

// ==================== TAX CODES ====================

export const taxApi = {
    getCodes: async (): Promise<TaxCode[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/tax-codes`);
        return data.data || data;
    },

    getCodeById: async (id: string): Promise<TaxCode> => {
        const { data } = await apiClient.get(`${BASE_URL}/tax-codes/${id}`);
        return data.data || data;
    },

    createCode: async (taxCode: Partial<TaxCode>): Promise<TaxCode> => {
        const { data } = await apiClient.post(`${BASE_URL}/tax-codes`, taxCode);
        return data.data || data;
    },
};

// ==================== BANK ACCOUNTS ====================

export const bankApi = {
    getAccounts: async (branchId?: string): Promise<BankAccount[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/bank-accounts`, { params: { branchId } });
        return data.data || data;
    },

    getAccountById: async (id: string): Promise<BankAccount> => {
        const { data } = await apiClient.get(`${BASE_URL}/bank-accounts/${id}`);
        return data.data || data;
    },

    getTransactions: async (bankAccountId: string, params?: { dateFrom?: string; dateTo?: string; isReconciled?: boolean }): Promise<BankTransaction[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/bank-accounts/${bankAccountId}/transactions`, { params });
        return data.data || data;
    },

    reconcile: async (transactionIds: string[], journalEntryId?: string): Promise<void> => {
        await apiClient.post(`${BASE_URL}/bank-reconciliation/reconcile`, { transactionIds, journalEntryId });
    },
};

// ==================== FINANCIAL REPORTS ====================

export const reportsApi = {
    getTrialBalance: async (params?: ReportQueryParams): Promise<TrialBalanceReport> => {
        const { data } = await apiClient.get(`${BASE_URL}/reports/trial-balance`, { params });
        return data.data || data;
    },

    getProfitLoss: async (params?: ReportQueryParams): Promise<ProfitLossReport> => {
        const { data } = await apiClient.get(`${BASE_URL}/reports/profit-loss`, { params });
        return data.data || data;
    },

    getBalanceSheet: async (params?: ReportQueryParams): Promise<BalanceSheetReport> => {
        const { data } = await apiClient.get(`${BASE_URL}/reports/balance-sheet`, { params });
        return data.data || data;
    },

    getCashFlow: async (params?: ReportQueryParams): Promise<any> => {
        const { data } = await apiClient.get(`${BASE_URL}/reports/cash-flow`, { params });
        return data.data || data;
    },
};

// ==================== DASHBOARD ====================

export const dashboardApi = {
    getKPIs: async (params?: { branchId?: string; fiscalYear?: number }): Promise<AccountingDashboardKPIs> => {
        const { data } = await apiClient.get(`${BASE_URL}/dashboard/kpis`, { params });
        return data.data || data;
    },

    getRevenueByBranch: async (params?: ReportQueryParams): Promise<RevenueByBranch[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/dashboard/revenue-by-branch`, { params });
        return data.data || data;
    },

    getMonthlyTrends: async (params?: { fiscalYear?: number; branchId?: string }): Promise<MonthlyTrend[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/dashboard/monthly-trends`, { params });
        return data.data || data;
    },

    getRecentJournals: async (limit?: number): Promise<JournalEntry[]> => {
        const { data } = await apiClient.get(`${BASE_URL}/dashboard/recent-journals`, { params: { limit } });
        return data.data || data;
    },
};

// Export all APIs
export const accountingApi = {
    accounts: accountsApi,
    journalEntries: journalEntriesApi,
    ledger: ledgerApi,
    fiscal: fiscalApi,
    tax: taxApi,
    bank: bankApi,
    reports: reportsApi,
    dashboard: dashboardApi,
};

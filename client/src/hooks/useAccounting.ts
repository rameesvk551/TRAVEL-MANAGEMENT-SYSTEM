/**
 * Accounting React Query Hooks
 * 
 * Custom hooks for data fetching and mutations in the Accounting module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingApi } from '@/api/accountingApi';
import type {
    Account,
    JournalEntry,
    AccountsQueryParams,
    JournalEntriesQueryParams,
    LedgerQueryParams,
    ReportQueryParams,
} from '@/types/accounting.types';

// Query keys
export const accountingKeys = {
    all: ['accounting'] as const,
    accounts: () => [...accountingKeys.all, 'accounts'] as const,
    accountsList: (params?: AccountsQueryParams) => [...accountingKeys.accounts(), 'list', params] as const,
    accountsTree: () => [...accountingKeys.accounts(), 'tree'] as const,
    account: (id: string) => [...accountingKeys.accounts(), id] as const,
    accountBalance: (id: string) => [...accountingKeys.accounts(), id, 'balance'] as const,
    journals: () => [...accountingKeys.all, 'journals'] as const,
    journalsList: (params?: JournalEntriesQueryParams) => [...accountingKeys.journals(), 'list', params] as const,
    journal: (id: string) => [...accountingKeys.journals(), id] as const,
    ledger: () => [...accountingKeys.all, 'ledger'] as const,
    ledgerEntries: (params: LedgerQueryParams) => [...accountingKeys.ledger(), 'entries', params] as const,
    trialBalance: (params?: ReportQueryParams) => [...accountingKeys.all, 'trial-balance', params] as const,
    fiscalYears: () => [...accountingKeys.all, 'fiscal-years'] as const,
    fiscalPeriods: (year: number) => [...accountingKeys.all, 'fiscal-periods', year] as const,
    taxCodes: () => [...accountingKeys.all, 'tax-codes'] as const,
    bankAccounts: (branchId?: string) => [...accountingKeys.all, 'bank-accounts', branchId] as const,
    bankTransactions: (bankAccountId: string) => [...accountingKeys.all, 'bank-transactions', bankAccountId] as const,
    reports: () => [...accountingKeys.all, 'reports'] as const,
    profitLoss: (params?: ReportQueryParams) => [...accountingKeys.reports(), 'profit-loss', params] as const,
    balanceSheet: (params?: ReportQueryParams) => [...accountingKeys.reports(), 'balance-sheet', params] as const,
    dashboard: () => [...accountingKeys.all, 'dashboard'] as const,
    dashboardKPIs: (params?: { branchId?: string; fiscalYear?: number }) => [...accountingKeys.dashboard(), 'kpis', params] as const,
    revenueByBranch: (params?: ReportQueryParams) => [...accountingKeys.dashboard(), 'revenue-by-branch', params] as const,
    monthlyTrends: (params?: { fiscalYear?: number; branchId?: string }) => [...accountingKeys.dashboard(), 'monthly-trends', params] as const,
    recentJournals: (limit?: number) => [...accountingKeys.dashboard(), 'recent-journals', limit] as const,
};

// ==================== ACCOUNTS HOOKS ====================

export function useAccounts(params?: AccountsQueryParams) {
    return useQuery({
        queryKey: accountingKeys.accountsList(params),
        queryFn: () => accountingApi.accounts.getAll(params),
    });
}

export function useAccountsTree() {
    return useQuery({
        queryKey: accountingKeys.accountsTree(),
        queryFn: () => accountingApi.accounts.getTree(),
    });
}

export function useAccount(id: string) {
    return useQuery({
        queryKey: accountingKeys.account(id),
        queryFn: () => accountingApi.accounts.getById(id),
        enabled: !!id,
    });
}

export function useAccountBalance(id: string, asOfDate?: string) {
    return useQuery({
        queryKey: accountingKeys.accountBalance(id),
        queryFn: () => accountingApi.accounts.getBalance(id, asOfDate),
        enabled: !!id,
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (account: Partial<Account>) => accountingApi.accounts.create(account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...account }: Partial<Account> & { id: string }) => 
            accountingApi.accounts.update(id, account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.accounts() });
        },
    });
}

// ==================== JOURNAL ENTRIES HOOKS ====================

export function useJournalEntries(params?: JournalEntriesQueryParams) {
    return useQuery({
        queryKey: accountingKeys.journalsList(params),
        queryFn: () => accountingApi.journalEntries.getAll(params),
    });
}

export function useJournalEntry(id: string) {
    return useQuery({
        queryKey: accountingKeys.journal(id),
        queryFn: () => accountingApi.journalEntries.getById(id),
        enabled: !!id,
    });
}

export function useCreateJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (entry: Partial<JournalEntry>) => accountingApi.journalEntries.create(entry),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
            queryClient.invalidateQueries({ queryKey: accountingKeys.dashboard() });
        },
    });
}

export function usePostJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.journalEntries.post(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
            queryClient.invalidateQueries({ queryKey: accountingKeys.ledger() });
            queryClient.invalidateQueries({ queryKey: accountingKeys.dashboard() });
        },
    });
}

export function useReverseJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => 
            accountingApi.journalEntries.reverse(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
            queryClient.invalidateQueries({ queryKey: accountingKeys.ledger() });
        },
    });
}

export function useApproveJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => accountingApi.journalEntries.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accountingKeys.journals() });
        },
    });
}

// ==================== LEDGER HOOKS ====================

export function useLedgerEntries(params: LedgerQueryParams) {
    return useQuery({
        queryKey: accountingKeys.ledgerEntries(params),
        queryFn: () => accountingApi.ledger.getEntries(params),
        enabled: !!params.accountId,
    });
}

export function useTrialBalance(params?: ReportQueryParams) {
    return useQuery({
        queryKey: accountingKeys.trialBalance(params),
        queryFn: () => accountingApi.reports.getTrialBalance(params),
    });
}

// ==================== FISCAL PERIOD HOOKS ====================

export function useFiscalYears() {
    return useQuery({
        queryKey: accountingKeys.fiscalYears(),
        queryFn: () => accountingApi.fiscal.getYears(),
    });
}

export function useFiscalPeriods(fiscalYear: number) {
    return useQuery({
        queryKey: accountingKeys.fiscalPeriods(fiscalYear),
        queryFn: () => accountingApi.fiscal.getPeriods(fiscalYear),
        enabled: !!fiscalYear,
    });
}

export function useCurrentFiscalPeriod() {
    return useQuery({
        queryKey: [...accountingKeys.all, 'current-period'],
        queryFn: () => accountingApi.fiscal.getCurrentPeriod(),
    });
}

// ==================== TAX CODE HOOKS ====================

export function useTaxCodes() {
    return useQuery({
        queryKey: accountingKeys.taxCodes(),
        queryFn: () => accountingApi.tax.getCodes(),
    });
}

// ==================== BANK ACCOUNT HOOKS ====================

export function useBankAccounts(branchId?: string) {
    return useQuery({
        queryKey: accountingKeys.bankAccounts(branchId),
        queryFn: () => accountingApi.bank.getAccounts(branchId),
    });
}

export function useBankTransactions(bankAccountId: string, params?: { dateFrom?: string; dateTo?: string; isReconciled?: boolean }) {
    return useQuery({
        queryKey: accountingKeys.bankTransactions(bankAccountId),
        queryFn: () => accountingApi.bank.getTransactions(bankAccountId, params),
        enabled: !!bankAccountId,
    });
}

// ==================== REPORT HOOKS ====================

export function useProfitLossReport(params?: ReportQueryParams) {
    return useQuery({
        queryKey: accountingKeys.profitLoss(params),
        queryFn: () => accountingApi.reports.getProfitLoss(params),
    });
}

// Alias for components
export const useProfitLoss = useProfitLossReport;

export function useBalanceSheetReport(params?: ReportQueryParams) {
    return useQuery({
        queryKey: accountingKeys.balanceSheet(params),
        queryFn: () => accountingApi.reports.getBalanceSheet(params),
    });
}

// Alias for components
export const useBalanceSheet = useBalanceSheetReport;

// ==================== DASHBOARD HOOKS ====================

export function useAccountingDashboardKPIs(params?: { branchId?: string; fiscalYear?: number }) {
    return useQuery({
        queryKey: accountingKeys.dashboardKPIs(params),
        queryFn: () => accountingApi.dashboard.getKPIs(params),
    });
}

export function useRevenueByBranch(params?: ReportQueryParams) {
    return useQuery({
        queryKey: accountingKeys.revenueByBranch(params),
        queryFn: () => accountingApi.dashboard.getRevenueByBranch(params),
    });
}

export function useMonthlyTrends(params?: { fiscalYear?: number; branchId?: string }) {
    return useQuery({
        queryKey: accountingKeys.monthlyTrends(params),
        queryFn: () => accountingApi.dashboard.getMonthlyTrends(params),
    });
}

export function useRecentJournals(limit?: number) {
    return useQuery({
        queryKey: accountingKeys.recentJournals(limit),
        queryFn: () => accountingApi.dashboard.getRecentJournals(limit),
    });
}

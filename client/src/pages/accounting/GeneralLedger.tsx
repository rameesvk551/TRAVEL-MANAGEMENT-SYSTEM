/**
 * General Ledger Page
 * 
 * Account-wise ledger view with:
 * - Account selector with search
 * - Date range filters
 * - Running balance display
 * - Export functionality
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
    ChevronRight,
    ChevronLeft,
    Search,
    Download,
    RefreshCw,
    Calendar,
    BookOpen,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Landmark,
    AlertCircle,
    ArrowDownUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { cn } from '@/utils';
import { useAccounts, useLedgerEntries } from '@/hooks/useAccounting';
import type { Account, AccountType } from '@/types/accounting.types';

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return sign + new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(absAmount);
};

// Account type icons
const accountTypeIcons: Record<AccountType, React.ElementType> = {
    ASSET: Wallet,
    LIABILITY: CreditCard,
    EQUITY: Landmark,
    REVENUE: TrendingUp,
    EXPENSE: TrendingDown,
};

const accountTypeColors: Record<AccountType, string> = {
    ASSET: 'text-blue-600 bg-blue-50',
    LIABILITY: 'text-orange-600 bg-orange-50',
    EQUITY: 'text-purple-600 bg-purple-50',
    REVENUE: 'text-emerald-600 bg-emerald-50',
    EXPENSE: 'text-red-600 bg-red-50',
};

interface AccountSelectorProps {
    accounts: Account[];
    selectedAccountId: string;
    onSelect: (accountId: string) => void;
    isLoading: boolean;
}

const AccountSelector = ({ accounts, selectedAccountId, onSelect, isLoading }: AccountSelectorProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredAccounts = useMemo(() => {
        if (!searchTerm) return accounts.filter(a => !a.isHeader);
        const term = searchTerm.toLowerCase();
        return accounts.filter(a => 
            !a.isHeader && (
                a.code.toLowerCase().includes(term) ||
                a.name.toLowerCase().includes(term)
            )
        );
    }, [accounts, searchTerm]);

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full p-3 border rounded-lg text-left transition-colors",
                    "hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                    isOpen && "border-primary ring-2 ring-primary/20"
                )}
            >
                {selectedAccount ? (
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            accountTypeColors[selectedAccount.accountType]
                        )}>
                            {(() => {
                                const Icon = accountTypeIcons[selectedAccount.accountType];
                                return <Icon className="h-4 w-4" />;
                            })()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                    {selectedAccount.code}
                                </span>
                            </div>
                            <span className="font-medium">{selectedAccount.name}</span>
                        </div>
                        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span>Select an account to view ledger...</span>
                        <ArrowDownUp className="h-4 w-4" />
                    </div>
                )}
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg overflow-hidden">
                        <div className="p-2 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search accounts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-64 overflow-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : filteredAccounts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No accounts found
                                </div>
                            ) : (
                                filteredAccounts.map(account => {
                                    const Icon = accountTypeIcons[account.accountType];
                                    return (
                                        <button
                                            key={account.id}
                                            onClick={() => {
                                                onSelect(account.id);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }}
                                            className={cn(
                                                "w-full p-3 flex items-center gap-3 text-left transition-colors",
                                                "hover:bg-muted/50",
                                                selectedAccountId === account.id && "bg-primary/5"
                                            )}
                                        >
                                            <div className={cn(
                                                "p-1.5 rounded",
                                                accountTypeColors[account.accountType]
                                            )}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {account.code}
                                                    </span>
                                                    <Badge variant="secondary" className="text-xs px-1">
                                                        {account.accountType}
                                                    </Badge>
                                                </div>
                                                <span className="text-sm">{account.name}</span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default function GeneralLedger() {
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    const [page, setPage] = useState(1);
    const limit = 50;

    // Fetch accounts for selector
    const { data: accountsData, isLoading: accountsLoading } = useAccounts({
        status: 'ACTIVE',
    });
    const accounts = accountsData || [];

    // Fetch ledger entries
    const { data: ledgerData, isLoading: ledgerLoading, error, refetch } = useLedgerEntries({
        accountId: selectedAccountId,
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
        page,
        limit,
    });

    const entries = ledgerData?.data || [];
    const total = ledgerData?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    // Calculate opening balance and running balance
    const ledgerWithBalance = useMemo(() => {
        let runningBalance = 0; // Would ideally come from API as opening balance
        
        return entries.map(entry => {
            const change = entry.debitAmount - entry.creditAmount;
            if (selectedAccount?.normalBalance === 'DEBIT') {
                runningBalance += change;
            } else {
                runningBalance -= change;
            }
            return {
                ...entry,
                runningBalance,
            };
        });
    }, [entries, selectedAccount]);

    // Summary calculations
    const summary = useMemo(() => {
        const totalDebit = entries.reduce((sum, e) => sum + e.debitAmount, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.creditAmount, 0);
        const closingBalance = ledgerWithBalance.length > 0 
            ? ledgerWithBalance[ledgerWithBalance.length - 1].runningBalance 
            : 0;

        return { totalDebit, totalCredit, closingBalance };
    }, [entries, ledgerWithBalance]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg text-muted-foreground">Failed to load ledger entries</p>
                <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link to="/accounting" className="hover:text-foreground transition-colors">
                            Accounting
                        </Link>
                        <ChevronRight className="h-4 w-4" />
                        <span className="text-foreground">General Ledger</span>
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        General Ledger
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View account-wise transaction history with running balances
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={!selectedAccountId}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" disabled={!selectedAccountId}>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Account Selector */}
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Select Account
                            </label>
                            <AccountSelector
                                accounts={accounts}
                                selectedAccountId={selectedAccountId}
                                onSelect={setSelectedAccountId}
                                isLoading={accountsLoading}
                            />
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                From Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                To Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Summary */}
            {selectedAccount && (
                <div className="grid grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                accountTypeColors[selectedAccount.accountType]
                            )}>
                                {(() => {
                                    const Icon = accountTypeIcons[selectedAccount.accountType];
                                    return <Icon className="h-5 w-5" />;
                                })()}
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Account Type</p>
                                <p className="font-medium">{selectedAccount.accountType}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Total Debits</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalDebit)}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Total Credits</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalCredit)}</p>
                    </Card>
                    <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Closing Balance</p>
                        <p className={cn(
                            "text-xl font-bold",
                            summary.closingBalance >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                            {formatCurrency(summary.closingBalance)}
                        </p>
                    </Card>
                </div>
            )}

            {/* Ledger Table */}
            <Card>
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            {selectedAccount 
                                ? `Ledger: ${selectedAccount.code} - ${selectedAccount.name}`
                                : 'Select an account to view ledger'
                            }
                        </CardTitle>
                        {entries.length > 0 && (
                            <Badge variant="secondary">
                                {total} transactions
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {!selectedAccountId ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/30" />
                            <p>Select an account from above to view its ledger</p>
                        </div>
                    ) : ledgerLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <BookOpen className="h-12 w-12 mb-4 text-muted-foreground/30" />
                            <p>No transactions found for the selected period</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Date
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Entry #
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Description
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Debit
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Credit
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Balance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Opening Balance Row */}
                                        <tr className="bg-muted/30 border-b">
                                            <td colSpan={5} className="py-3 px-4 font-medium">
                                                Opening Balance
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-medium">
                                                {formatCurrency(0)}
                                            </td>
                                        </tr>

                                        {ledgerWithBalance.map((entry, idx) => (
                                            <tr 
                                                key={entry.id || idx} 
                                                className="border-b hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm">
                                                    {format(parseISO(entry.entryDate), 'dd MMM yyyy')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Link 
                                                        to={`/accounting/journal-entries?id=${entry.journalEntryId}`}
                                                        className="font-mono text-sm text-primary hover:underline"
                                                    >
                                                        {entry.entryNumber}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <p className="line-clamp-1">{entry.description || '—'}</p>
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-sm">
                                                    {entry.debitAmount > 0 ? (
                                                        <span className="text-blue-600">{formatCurrency(entry.debitAmount)}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-sm">
                                                    {entry.creditAmount > 0 ? (
                                                        <span className="text-green-600">{formatCurrency(entry.creditAmount)}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className={cn(
                                                    "py-3 px-4 text-right font-mono text-sm font-medium",
                                                    entry.runningBalance >= 0 ? "text-foreground" : "text-red-600"
                                                )}>
                                                    {formatCurrency(entry.runningBalance)}
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Closing Balance Row */}
                                        <tr className="bg-muted/30">
                                            <td colSpan={3} className="py-3 px-4 font-medium">
                                                Closing Balance
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-medium text-blue-600">
                                                {formatCurrency(summary.totalDebit)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-medium text-green-600">
                                                {formatCurrency(summary.totalCredit)}
                                            </td>
                                            <td className={cn(
                                                "py-3 px-4 text-right font-mono font-bold",
                                                summary.closingBalance >= 0 ? "text-emerald-600" : "text-red-600"
                                            )}>
                                                {formatCurrency(summary.closingBalance)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground px-2">
                                            Page {page} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

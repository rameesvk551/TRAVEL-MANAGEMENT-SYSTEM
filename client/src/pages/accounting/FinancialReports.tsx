/**
 * Financial Reports Page
 * 
 * Comprehensive financial reports including:
 * - Trial Balance
 * - Profit & Loss Statement
 * - Balance Sheet
 * - Cash Flow Statement
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import {
    ChevronRight,
    Download,
    RefreshCw,
    Calendar,
    FileText,
    BarChart3,
    PieChart,
    Scale,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Landmark,
    AlertCircle,
    Printer,
    Building2,
    CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { cn } from '@/utils';
import { 
    useTrialBalance, 
    useProfitLoss, 
    useBalanceSheet,
} from '@/hooks/useAccounting';
import { useBranches } from '@/hooks/useBranches';
import type { AccountType } from '@/types/accounting.types';

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    return sign + new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(absAmount);
};

// Format compact numbers
const formatCompact = (amount: number): string => {
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (absAmount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return formatCurrency(amount);
};

// Account type colors
const typeColors: Record<AccountType, { bg: string; text: string }> = {
    ASSET: { bg: 'bg-blue-50', text: 'text-blue-700' },
    LIABILITY: { bg: 'bg-orange-50', text: 'text-orange-700' },
    EQUITY: { bg: 'bg-purple-50', text: 'text-purple-700' },
    REVENUE: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    EXPENSE: { bg: 'bg-red-50', text: 'text-red-700' },
};

// ==================== TRIAL BALANCE TAB ====================

interface TrialBalanceTabProps {
    asOfDate: string;
    branchId?: string;
}

const TrialBalanceTab = ({ asOfDate, branchId }: TrialBalanceTabProps) => {
    const { data, isLoading, error, refetch } = useTrialBalance({
        asOfDate,
        branchId: branchId || undefined,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">Failed to load trial balance</p>
                <Button onClick={() => refetch()} size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                </Button>
            </div>
        );
    }

    const trialBalance = data;
    const totals = trialBalance?.totals || { closingDebit: 0, closingCredit: 0 };
    const rows = trialBalance?.rows || [];

    return (
        <div className="space-y-4">
            {/* Balance Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                    {trialBalance?.isBalanced ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Trial Balance is BALANCED</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Trial Balance is OUT OF BALANCE</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                    <div>
                        <span className="text-muted-foreground">Total Debit: </span>
                        <span className="font-mono font-medium text-blue-600">
                            {formatCurrency(totals.closingDebit)}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Total Credit: </span>
                        <span className="font-mono font-medium text-green-600">
                            {formatCurrency(totals.closingCredit)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Trial Balance Table */}
            <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                Account Code
                            </th>
                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                Account Name
                            </th>
                            <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                Type
                            </th>
                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                Debit (₹)
                            </th>
                                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                Credit (₹)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((account, idx: number) => (
                            <tr key={account.accountId || idx} className="border-b hover:bg-muted/30">
                                <td className="py-2 px-4 font-mono text-sm">
                                    {account.accountCode}
                                </td>
                                <td className="py-2 px-4 text-sm">
                                    {account.accountName}
                                </td>
                                <td className="py-2 px-4 text-center">
                                    <Badge className={cn(
                                        "text-xs",
                                        typeColors[account.accountType as AccountType]?.bg,
                                        typeColors[account.accountType as AccountType]?.text
                                    )}>
                                        {account.accountType}
                                    </Badge>
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-sm">
                                    {account.closingDebit > 0 ? formatCurrency(account.closingDebit) : '—'}
                                </td>
                                <td className="py-2 px-4 text-right font-mono text-sm">
                                    {account.closingCredit > 0 ? formatCurrency(account.closingCredit) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-muted/50 font-medium">
                            <td colSpan={3} className="py-3 px-4 text-right">
                                Total
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-blue-600">
                                {formatCurrency(totals.closingDebit)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-green-600">
                                {formatCurrency(totals.closingCredit)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};// ==================== PROFIT & LOSS TAB ====================

interface ProfitLossTabProps {
    startDate: string;
    endDate: string;
    branchId?: string;
}

const ProfitLossTab = ({ startDate, endDate, branchId }: ProfitLossTabProps) => {
    const { data, isLoading, error, refetch } = useProfitLoss({
        dateFrom: startDate,
        dateTo: endDate,
        branchId: branchId || undefined,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">Failed to load profit & loss statement</p>
                <Button onClick={() => refetch()} size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                </Button>
            </div>
        );
    }

    const pl = data;
    const revenueTotal = pl?.revenue?.total || 0;
    const expensesTotal = (pl?.operatingExpenses?.total || 0) + (pl?.costOfSales?.total || 0);
    const netProfit = pl?.netProfit || 0;
    const profitMargin = pl?.profitMargin || 0;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                        <div>
                            <p className="text-sm text-emerald-700">Total Revenue</p>
                            <p className="text-xl font-bold text-emerald-700">
                                {formatCompact(revenueTotal)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-red-50 border-red-200">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="h-8 w-8 text-red-600" />
                        <div>
                            <p className="text-sm text-red-700">Total Expenses</p>
                            <p className="text-xl font-bold text-red-700">
                                {formatCompact(expensesTotal)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className={cn(
                    "p-4",
                    netProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
                )}>
                    <div className="flex items-center gap-3">
                        <Scale className={cn(
                            "h-8 w-8",
                            netProfit >= 0 ? "text-blue-600" : "text-orange-600"
                        )} />
                        <div>
                            <p className={cn(
                                "text-sm",
                                netProfit >= 0 ? "text-blue-700" : "text-orange-700"
                            )}>
                                {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                            </p>
                            <p className={cn(
                                "text-xl font-bold",
                                netProfit >= 0 ? "text-blue-700" : "text-orange-700"
                            )}>
                                {formatCompact(Math.abs(netProfit))}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-3">
                        <PieChart className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-purple-700">Profit Margin</p>
                            <p className="text-xl font-bold text-purple-700">
                                {profitMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Revenue Section */}
                <Card>
                    <CardHeader className="pb-3 border-b bg-emerald-50/50">
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                            <TrendingUp className="h-5 w-5" />
                            Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <tbody>
                                {pl?.revenue?.accounts?.map((item, idx: number) => (
                                    <tr key={idx} className="border-b hover:bg-muted/30">
                                        <td className="py-2 px-4">
                                            <span className="font-mono text-xs text-muted-foreground mr-2">
                                                {item.code}
                                            </span>
                                            {item.name}
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-emerald-50 font-medium">
                                    <td className="py-3 px-4">Total Revenue</td>
                                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                                        {formatCurrency(revenueTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* Expenses Section */}
                <Card>
                    <CardHeader className="pb-3 border-b bg-red-50/50">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                            <TrendingDown className="h-5 w-5" />
                            Expenses
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <tbody>
                                {pl?.operatingExpenses?.accounts?.map((item, idx: number) => (
                                    <tr key={idx} className="border-b hover:bg-muted/30">
                                        <td className="py-2 px-4">
                                            <span className="font-mono text-xs text-muted-foreground mr-2">
                                                {item.code}
                                            </span>
                                            {item.name}
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono">
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-red-50 font-medium">
                                    <td className="py-3 px-4">Total Expenses</td>
                                    <td className="py-3 px-4 text-right font-mono text-red-700">
                                        {formatCurrency(expensesTotal)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>
            </div>

            {/* Net Income */}
            <Card className={cn(
                "p-4",
                netProfit >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"
            )}>
                <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                        {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                    </span>
                    <span className={cn(
                        "text-2xl font-bold font-mono",
                        netProfit >= 0 ? "text-blue-700" : "text-orange-700"
                    )}>
                        {formatCurrency(Math.abs(netProfit))}
                    </span>
                </div>
            </Card>
        </div>
    );
};

// ==================== BALANCE SHEET TAB ====================

interface BalanceSheetTabProps {
    asOfDate: string;
    branchId?: string;
}

const BalanceSheetTab = ({ asOfDate, branchId }: BalanceSheetTabProps) => {
    const { data, isLoading, error, refetch } = useBalanceSheet({
        asOfDate,
        branchId: branchId || undefined,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">Failed to load balance sheet</p>
                <Button onClick={() => refetch()} size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Retry
                </Button>
            </div>
        );
    }

    const bs = data;
    const totalAssets = bs?.assets?.total || 0;
    const totalLiabilities = bs?.liabilities?.total || 0;
    const totalEquity = bs?.equity?.total || 0;
    const isBalanced = bs?.isBalanced || false;

    // Combine all asset items for display
    const assetItems = [
        ...(bs?.assets?.current || []).map(item => ({ ...item, section: 'Current Assets' })),
        ...(bs?.assets?.fixed || []).map(item => ({ ...item, section: 'Fixed Assets' })),
    ];

    // Combine all liability items for display
    const liabilityItems = [
        ...(bs?.liabilities?.current || []).map(item => ({ ...item, section: 'Current Liabilities' })),
        ...(bs?.liabilities?.longTerm || []).map(item => ({ ...item, section: 'Long-term Liabilities' })),
    ];

    // Equity items
    const equityItems = bs?.equity?.items || [];

    return (
        <div className="space-y-6">
            {/* Balance Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                    {isBalanced ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-medium">Balance Sheet is BALANCED</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <span className="font-medium">Balance Sheet is OUT OF BALANCE</span>
                        </div>
                    )}
                </div>
                <div className="text-sm text-muted-foreground">
                    Assets = Liabilities + Equity
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-blue-700">Total Assets</p>
                            <p className="text-xl font-bold text-blue-700">
                                {formatCompact(totalAssets)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-orange-50 border-orange-200">
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-orange-700">Total Liabilities</p>
                            <p className="text-xl font-bold text-orange-700">
                                {formatCompact(totalLiabilities)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center gap-3">
                        <Landmark className="h-8 w-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-purple-700">Total Equity</p>
                            <p className="text-xl font-bold text-purple-700">
                                {formatCompact(totalEquity)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Assets Section */}
                <Card>
                    <CardHeader className="pb-3 border-b bg-blue-50/50">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                            <Wallet className="h-5 w-5" />
                            Assets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <tbody>
                                {assetItems.map((item, idx: number) => (
                                    <tr key={idx} className="border-b hover:bg-muted/30">
                                        <td className="py-2 px-4">
                                            <span className="text-xs text-muted-foreground">{item.code}</span>
                                            <span className="ml-2">{item.name}</span>
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono">
                                            {item.amount !== undefined ? formatCurrency(item.amount) : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-blue-50 font-medium">
                                    <td className="py-3 px-4">Total Assets</td>
                                    <td className="py-3 px-4 text-right font-mono text-blue-700">
                                        {formatCurrency(totalAssets)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </CardContent>
                </Card>

                {/* Liabilities & Equity Section */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3 border-b bg-orange-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                                <CreditCard className="h-5 w-5" />
                                Liabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <tbody>
                                    {liabilityItems.map((item, idx: number) => (
                                        <tr key={idx} className="border-b hover:bg-muted/30">
                                            <td className="py-2 px-4">
                                                {item.name}
                                            </td>
                                            <td className="py-2 px-4 text-right font-mono">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-orange-50 font-medium">
                                        <td className="py-3 px-4">Total Liabilities</td>
                                        <td className="py-3 px-4 text-right font-mono text-orange-700">
                                            {formatCurrency(totalLiabilities)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3 border-b bg-purple-50/50">
                            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                                <Landmark className="h-5 w-5" />
                                Equity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full">
                                <tbody>
                                    {equityItems.map((item, idx: number) => (
                                        <tr key={idx} className="border-b hover:bg-muted/30">
                                            <td className="py-2 px-4">
                                                {item.name}
                                            </td>
                                            <td className="py-2 px-4 text-right font-mono">
                                                {formatCurrency(item.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-purple-50 font-medium">
                                        <td className="py-3 px-4">Total Equity</td>
                                        <td className="py-3 px-4 text-right font-mono text-purple-700">
                                            {formatCurrency(totalEquity)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Balance Check */}
            <div className="grid grid-cols-2 gap-6">
                <Card className="p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-700">Total Assets</span>
                        <span className="text-xl font-bold font-mono text-blue-700">
                            {formatCurrency(totalAssets)}
                        </span>
                    </div>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-purple-700">Liabilities + Equity</span>
                        <span className="text-xl font-bold font-mono text-purple-700">
                            {formatCurrency(totalLiabilities + totalEquity)}
                        </span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================

export default function FinancialReports() {
    const [activeTab, setActiveTab] = useState('trial-balance');
    const [asOfDate, setAsOfDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), 3, 1), 'yyyy-MM-dd')); // Apr 1
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [branchId, setBranchId] = useState<string>('');

    // Fetch branches
    const { branches: branchesData } = useBranches();
    const branches = branchesData || [];

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
                        <span className="text-foreground">Financial Reports</span>
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Financial Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and view financial statements
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Report Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 w-full max-w-lg">
                    <TabsTrigger value="trial-balance" className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Trial Balance
                    </TabsTrigger>
                    <TabsTrigger value="profit-loss" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Profit & Loss
                    </TabsTrigger>
                    <TabsTrigger value="balance-sheet" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Balance Sheet
                    </TabsTrigger>
                </TabsList>

                {/* Filters */}
                <Card className="mt-4">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-end gap-4">
                            {/* Branch Filter */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    Branch
                                </label>
                                <Select value={branchId} onValueChange={setBranchId}>
                                    <SelectTrigger className="w-48">
                                        <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="All Branches" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Branches</SelectItem>
                                        {branches.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {activeTab === 'profit-loss' ? (
                                <>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                            From Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="pl-9 w-40"
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
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="pl-9 w-40"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        As Of Date
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={asOfDate}
                                            onChange={(e) => setAsOfDate(e.target.value)}
                                            className="pl-9 w-40"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Content */}
                <TabsContent value="trial-balance" className="mt-4">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    Trial Balance
                                </CardTitle>
                                <Badge variant="secondary">
                                    As of {format(parseISO(asOfDate), 'dd MMM yyyy')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <TrialBalanceTab asOfDate={asOfDate} branchId={branchId} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profit-loss" className="mt-4">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Profit & Loss Statement
                                </CardTitle>
                                <Badge variant="secondary">
                                    {format(parseISO(startDate), 'dd MMM yyyy')} - {format(parseISO(endDate), 'dd MMM yyyy')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ProfitLossTab 
                                startDate={startDate} 
                                endDate={endDate} 
                                branchId={branchId} 
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="balance-sheet" className="mt-4">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Balance Sheet
                                </CardTitle>
                                <Badge variant="secondary">
                                    As of {format(parseISO(asOfDate), 'dd MMM yyyy')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <BalanceSheetTab asOfDate={asOfDate} branchId={branchId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

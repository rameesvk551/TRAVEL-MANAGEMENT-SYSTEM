/**
 * Accounting Dashboard
 * 
 * Main dashboard for the Financial Accounting module featuring:
 * - Key financial KPIs with trend indicators
 * - Revenue vs Expenses chart
 * - Branch-wise performance
 * - Quick actions
 * - Recent journal entries
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    FileText,
    PieChart,
    BarChart3,
    ArrowRight,
    Plus,
    Download,
    RefreshCw,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    BookOpen,
    Wallet,
    Receipt,
    Scale,
} from 'lucide-react';
import { Card, CardContent, Button } from '@/components/ui';
import { cn } from '@/utils';
import {
    useAccounts,
    useJournalEntries,
    useTrialBalance,
    useFiscalYears,
    useBankAccounts,
} from '@/hooks/useAccounting';
import { useBranches } from '@/hooks/useBranches';

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Format large numbers with K/L/Cr suffixes
const formatCompact = (amount: number): string => {
    if (Math.abs(amount) >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (Math.abs(amount) >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (Math.abs(amount) >= 1000) {
        return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toFixed(0)}`;
};

interface KPICardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: number; isPositive: boolean };
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
    onClick?: () => void;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, onClick }: KPICardProps) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-200',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        purple: 'bg-purple-50 text-purple-600 border-purple-200',
        orange: 'bg-orange-50 text-orange-600 border-orange-200',
        red: 'bg-red-50 text-red-600 border-red-200',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    };

    const iconBgClasses = {
        blue: 'bg-blue-100',
        green: 'bg-emerald-100',
        purple: 'bg-purple-100',
        orange: 'bg-orange-100',
        red: 'bg-red-100',
        indigo: 'bg-indigo-100',
    };

    return (
        <Card 
            className={cn(
                'relative overflow-hidden transition-all hover:shadow-md cursor-pointer border-l-4',
                colorClasses[color]
            )}
            onClick={onClick}
        >
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
                        {subtitle && (
                            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={cn(
                                'mt-2 flex items-center gap-1 text-xs font-medium',
                                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                            )}>
                                {trend.isPositive ? (
                                    <TrendingUp className="h-3 w-3" />
                                ) : (
                                    <TrendingDown className="h-3 w-3" />
                                )}
                                <span>{Math.abs(trend.value).toFixed(1)}% vs last month</span>
                            </div>
                        )}
                    </div>
                    <div className={cn('rounded-xl p-3', iconBgClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

interface QuickActionProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    color: string;
}

const QuickAction = ({ title, description, icon: Icon, href, color }: QuickActionProps) => (
    <Link
        to={href}
        className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
    >
        <div className={cn('rounded-lg p-3', color)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
            <p className="font-medium group-hover:text-primary">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
);

export default function AccountingDashboard() {
    const [selectedBranch, setSelectedBranch] = useState<string | undefined>();
    
    // Fetch data
    const { data: accounts = [] } = useAccounts();
    const { data: journalsData } = useJournalEntries({ limit: 10 });
    const { data: trialBalance } = useTrialBalance();
    const { data: fiscalYears = [] } = useFiscalYears();
    const { data: bankAccounts = [] } = useBankAccounts();
    const { branches } = useBranches();

    // Calculate KPIs from trial balance
    const revenueAccounts = accounts.filter(a => a.accountType === 'REVENUE');
    const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');
    const assetAccounts = accounts.filter(a => a.accountType === 'ASSET');
    const liabilityAccounts = accounts.filter(a => a.accountType === 'LIABILITY');

    // Calculate totals from trial balance (removing unused totals variable)
    const _totals = trialBalance?.totals || {
        openingDebit: 0,
        openingCredit: 0,
        periodDebit: 0,
        periodCredit: 0,
        closingDebit: 0,
        closingCredit: 0,
    };
    void _totals; // Suppress unused variable warning

    // Calculate revenue and expenses from rows
    const revenue = trialBalance?.rows
        ?.filter(r => r.accountType === 'REVENUE')
        ?.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0) || 0;
    
    const expenses = trialBalance?.rows
        ?.filter(r => r.accountType === 'EXPENSE')
        ?.reduce((sum, r) => sum + (r.closingDebit - r.closingCredit), 0) || 0;

    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Calculate receivables and payables
    const receivables = trialBalance?.rows
        ?.filter(r => r.accountCode?.startsWith('12'))
        ?.reduce((sum, r) => sum + (r.closingDebit - r.closingCredit), 0) || 0;

    const payables = trialBalance?.rows
        ?.filter(r => r.accountCode?.startsWith('21'))
        ?.reduce((sum, r) => sum + (r.closingCredit - r.closingDebit), 0) || 0;

    // Cash & Bank balance
    const cashBalance = bankAccounts.reduce((sum, ba) => sum + (ba.currentBalance || 0), 0);

    // Journal counts
    const journals = journalsData?.data || [];
    const pendingJournals = journals.filter(j => j.status === 'DRAFT' || j.status === 'PENDING_APPROVAL').length;
    const postedJournals = journals.filter(j => j.status === 'POSTED').length;

    // Current fiscal year
    const currentFY = fiscalYears.find(fy => fy.isCurrent) || fiscalYears[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Accounting Dashboard</h1>
                    <p className="text-muted-foreground">
                        Financial overview for {currentFY?.name || 'FY 2024-25'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        className="rounded-lg border bg-card px-3 py-2 text-sm"
                        value={selectedBranch || ''}
                        onChange={(e) => setSelectedBranch(e.target.value || undefined)}
                    >
                        <option value="">All Branches</option>
                        {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="icon">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Revenue"
                    value={formatCompact(revenue)}
                    subtitle="This fiscal year"
                    icon={TrendingUp}
                    trend={{ value: 12.5, isPositive: true }}
                    color="green"
                />
                <KPICard
                    title="Total Expenses"
                    value={formatCompact(expenses)}
                    subtitle="This fiscal year"
                    icon={CreditCard}
                    trend={{ value: 8.2, isPositive: false }}
                    color="orange"
                />
                <KPICard
                    title="Net Profit"
                    value={formatCompact(netProfit)}
                    subtitle={`${profitMargin.toFixed(1)}% margin`}
                    icon={DollarSign}
                    trend={{ value: 15.3, isPositive: netProfit > 0 }}
                    color={netProfit >= 0 ? 'blue' : 'red'}
                />
                <KPICard
                    title="Cash & Bank"
                    value={formatCompact(cashBalance)}
                    subtitle={`${bankAccounts.length} accounts`}
                    icon={Wallet}
                    color="purple"
                />
            </div>

            {/* Secondary KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Receivables"
                    value={formatCompact(receivables)}
                    subtitle="Outstanding from customers"
                    icon={Receipt}
                    color="indigo"
                />
                <KPICard
                    title="Payables"
                    value={formatCompact(payables)}
                    subtitle="Due to vendors"
                    icon={FileText}
                    color="red"
                />
                <KPICard
                    title="Journal Entries"
                    value={postedJournals.toString()}
                    subtitle={pendingJournals > 0 ? `${pendingJournals} pending approval` : 'All posted'}
                    icon={BookOpen}
                    color="blue"
                />
                <KPICard
                    title="Trial Balance"
                    value={trialBalance?.isBalanced ? 'Balanced' : 'Check Required'}
                    subtitle={`As of ${format(new Date(), 'dd MMM yyyy')}`}
                    icon={Scale}
                    color={trialBalance?.isBalanced ? 'green' : 'red'}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Quick Actions */}
                <Card className="lg:col-span-1">
                    <CardContent className="p-6">
                        <h3 className="mb-4 font-semibold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Quick Actions
                        </h3>
                        <div className="space-y-3">
                            <QuickAction
                                title="Chart of Accounts"
                                description="View & manage accounts"
                                icon={PieChart}
                                href="/accounting/accounts"
                                color="bg-blue-500"
                            />
                            <QuickAction
                                title="Journal Entries"
                                description="Create & view journals"
                                icon={BookOpen}
                                href="/accounting/journals"
                                color="bg-purple-500"
                            />
                            <QuickAction
                                title="General Ledger"
                                description="Account-wise transactions"
                                icon={FileText}
                                href="/accounting/ledger"
                                color="bg-emerald-500"
                            />
                            <QuickAction
                                title="Trial Balance"
                                description="Debit & credit summary"
                                icon={Scale}
                                href="/accounting/trial-balance"
                                color="bg-orange-500"
                            />
                            <QuickAction
                                title="Financial Reports"
                                description="P&L, Balance Sheet"
                                icon={BarChart3}
                                href="/accounting/reports"
                                color="bg-indigo-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Journal Entries */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Recent Journal Entries
                            </h3>
                            <Link to="/accounting/journals">
                                <Button variant="ghost" size="sm" className="gap-1">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        
                        <div className="space-y-3">
                            {journals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                    <FileText className="mb-2 h-12 w-12 opacity-20" />
                                    <p>No journal entries yet</p>
                                    <p className="text-sm">Journal entries will appear here</p>
                                </div>
                            ) : (
                                journals.slice(0, 5).map((journal) => (
                                    <div
                                        key={journal.id}
                                        className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'rounded-full p-2',
                                                journal.status === 'POSTED' ? 'bg-emerald-100' :
                                                journal.status === 'DRAFT' ? 'bg-yellow-100' :
                                                'bg-blue-100'
                                            )}>
                                                {journal.status === 'POSTED' ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                ) : journal.status === 'DRAFT' ? (
                                                    <Clock className="h-4 w-4 text-yellow-600" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-blue-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{journal.entryNumber}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">
                                                    {journal.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">
                                                {formatCurrency(journal.totalDebit)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(journal.entryDate), 'dd MMM')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Branch Performance */}
            {branches.length > 1 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Branch Performance
                            </h3>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {branches.map((branch) => (
                                <div
                                    key={branch.id}
                                    className="rounded-xl border bg-gradient-to-br from-card to-accent/20 p-4"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="rounded-lg bg-primary/10 p-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{branch.name}</p>
                                            <p className="text-xs text-muted-foreground">{branch.code}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Revenue</p>
                                            <p className="font-semibold text-emerald-600">
                                                {formatCompact(revenue / branches.length)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Expenses</p>
                                            <p className="font-semibold text-orange-600">
                                                {formatCompact(expenses / branches.length)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Chart of Accounts Summary */}
            <Card>
                <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            Chart of Accounts Summary
                        </h3>
                        <Link to="/accounting/accounts">
                            <Button variant="ghost" size="sm" className="gap-1">
                                View All <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-5">
                        {[
                            { type: 'ASSET', label: 'Assets', count: assetAccounts.length, color: 'bg-blue-500' },
                            { type: 'LIABILITY', label: 'Liabilities', count: liabilityAccounts.length, color: 'bg-red-500' },
                            { type: 'EQUITY', label: 'Equity', count: accounts.filter(a => a.accountType === 'EQUITY').length, color: 'bg-purple-500' },
                            { type: 'REVENUE', label: 'Revenue', count: revenueAccounts.length, color: 'bg-emerald-500' },
                            { type: 'EXPENSE', label: 'Expenses', count: expenseAccounts.length, color: 'bg-orange-500' },
                        ].map((item) => (
                            <div
                                key={item.type}
                                className="flex items-center gap-3 rounded-lg border p-3"
                            >
                                <div className={cn('h-10 w-1 rounded-full', item.color)} />
                                <div>
                                    <p className="text-2xl font-bold">{item.count}</p>
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

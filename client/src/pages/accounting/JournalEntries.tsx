/**
 * Journal Entries Page
 * 
 * List view of journal entries with:
 * - Filtering by date range, status, branch, entry type
 * - Search functionality
 * - Detail view modal
 * - Quick actions (post, reverse, approve)
 */

import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import {
    ChevronRight,
    ChevronLeft,
    Search,
    Plus,
    Download,
    RefreshCw,
    Eye,
    CheckCircle2,
    XCircle,
    RotateCcw,
    FileText,
    Calendar,
    Building2,
    AlertCircle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { cn } from '@/utils';
import { 
    useJournalEntries, 
    usePostJournalEntry, 
    useReverseJournalEntry,
    useApproveJournalEntry,
} from '@/hooks/useAccounting';
import { useBranches } from '@/hooks/useBranches';
import type { JournalEntry, JournalEntryStatus, JournalEntryType } from '@/types/accounting.types';

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

// Status configuration
const statusConfig: Record<JournalEntryStatus, { 
    label: string; 
    icon: React.ElementType;
    color: string;
    bgColor: string;
}> = {
    DRAFT: { 
        label: 'Draft', 
        icon: FileText,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    },
    POSTED: { 
        label: 'Posted', 
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
    },
    REVERSED: { 
        label: 'Reversed', 
        icon: RotateCcw,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    PENDING_APPROVAL: { 
        label: 'Pending Approval', 
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
    },
};

// Entry type configuration
const entryTypeConfig: Record<JournalEntryType, { label: string; color: string }> = {
    STANDARD: { label: 'Standard', color: 'bg-blue-100 text-blue-700' },
    REVERSING: { label: 'Reversing', color: 'bg-orange-100 text-orange-700' },
    RECURRING: { label: 'Recurring', color: 'bg-purple-100 text-purple-700' },
    ADJUSTING: { label: 'Adjusting', color: 'bg-yellow-100 text-yellow-700' },
    OPENING: { label: 'Opening', color: 'bg-green-100 text-green-700' },
    CLOSING: { label: 'Closing', color: 'bg-red-100 text-red-700' },
    INTER_BRANCH: { label: 'Inter-Branch', color: 'bg-indigo-100 text-indigo-700' },
};

interface JournalDetailModalProps {
    entry: JournalEntry;
    onClose: () => void;
    onPost: () => void;
    onReverse: () => void;
    onApprove: () => void;
    isPosting: boolean;
    isReversing: boolean;
    isApproving: boolean;
}

const JournalDetailModal = ({ 
    entry, 
    onClose, 
    onPost, 
    onReverse, 
    onApprove,
    isPosting,
    isReversing,
    isApproving,
}: JournalDetailModalProps) => {
    const StatusIcon = statusConfig[entry.status].icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    statusConfig[entry.status].bgColor
                                )}>
                                    <StatusIcon className={cn(
                                        "h-5 w-5",
                                        statusConfig[entry.status].color
                                    )} />
                                </div>
                                <div>
                                    <span className="font-mono">{entry.entryNumber}</span>
                                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                                        {format(parseISO(entry.entryDate), 'dd MMM yyyy')}
                                    </p>
                                </div>
                            </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={statusConfig[entry.status].bgColor + ' ' + statusConfig[entry.status].color}>
                                {statusConfig[entry.status].label}
                            </Badge>
                            <Badge className={entryTypeConfig[entry.entryType].color}>
                                {entryTypeConfig[entry.entryType].label}
                            </Badge>
                            <button
                                onClick={onClose}
                                className="ml-2 p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <XCircle className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-auto p-6">
                    {/* Entry Info */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div>
                            <dt className="text-sm text-muted-foreground">Branch</dt>
                            <dd className="font-medium flex items-center gap-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {entry.branchName || 'Main'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">Fiscal Year</dt>
                            <dd className="font-medium">{entry.fiscalYear}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">Period</dt>
                            <dd className="font-medium">P{entry.fiscalPeriod}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-muted-foreground">Source</dt>
                            <dd className="font-medium">{entry.sourceModule}</dd>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <dt className="text-sm text-muted-foreground mb-1">Description</dt>
                        <dd className="p-3 bg-muted/50 rounded-lg text-sm">{entry.description}</dd>
                    </div>

                    {/* Journal Lines */}
                    <div className="mb-6">
                        <h3 className="font-medium mb-3">Journal Lines</h3>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                                            Account
                                        </th>
                                        <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">
                                            Description
                                        </th>
                                        <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">
                                            Debit
                                        </th>
                                        <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">
                                            Credit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entry.lines?.map((line, idx) => (
                                        <tr key={line.id || idx} className="border-b last:border-0">
                                            <td className="py-2 px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {line.accountCode}
                                                    </span>
                                                    <span className="text-sm">{line.accountName}</span>
                                                </div>
                                            </td>
                                            <td className="py-2 px-3 text-sm text-muted-foreground">
                                                {line.description || '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-sm">
                                                {line.debitAmount > 0 ? formatCurrency(line.debitAmount) : '—'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono text-sm">
                                                {line.creditAmount > 0 ? formatCurrency(line.creditAmount) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/50 font-medium">
                                        <td colSpan={2} className="py-2 px-3 text-right">
                                            Total
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono">
                                            {formatCurrency(entry.totalDebit)}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono">
                                            {formatCurrency(entry.totalCredit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                        <div className="mb-6">
                            <dt className="text-sm text-muted-foreground mb-1">Notes</dt>
                            <dd className="text-sm">{entry.notes}</dd>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground pt-4 border-t">
                        <div>
                            <span>Created by: </span>
                            <span className="text-foreground">{entry.createdBy}</span>
                        </div>
                        <div>
                            <span>Created at: </span>
                            <span className="text-foreground">
                                {format(parseISO(entry.createdAt), 'dd MMM yyyy HH:mm')}
                            </span>
                        </div>
                        {entry.approvedBy && (
                            <div>
                                <span>Approved by: </span>
                                <span className="text-foreground">{entry.approvedBy}</span>
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Actions */}
                <div className="border-t p-4 flex justify-between items-center bg-muted/30">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <div className="flex gap-2">
                        {entry.status === 'PENDING_APPROVAL' && (
                            <Button 
                                onClick={onApprove}
                                disabled={isApproving}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {isApproving ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Approve
                            </Button>
                        )}
                        {entry.status === 'DRAFT' && (
                            <Button 
                                onClick={onPost}
                                disabled={isPosting}
                            >
                                {isPosting ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                )}
                                Post Entry
                            </Button>
                        )}
                        {entry.status === 'POSTED' && !entry.isReversed && (
                            <Button 
                                variant="outline"
                                onClick={onReverse}
                                disabled={isReversing}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                                {isReversing ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                )}
                                Reverse
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default function JournalEntries() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | ''>('');
    const [typeFilter, setTypeFilter] = useState<JournalEntryType | ''>('');
    const [branchFilter, setBranchFilter] = useState<string>('');
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    });
    const [page, setPage] = useState(1);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const limit = 20;

    // Fetch data
    const { branches: branchesData } = useBranches();
    const branches = branchesData || [];

    const { data: entriesData, isLoading, error, refetch } = useJournalEntries({
        dateFrom: dateRange.startDate,
        dateTo: dateRange.endDate,
        status: statusFilter || undefined,
        // Note: entryType filter will be applied client-side as API doesn't support it
        branchId: branchFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit,
    });

    // Apply client-side type filter
    const allEntries = entriesData?.data || [];
    const entries = typeFilter 
        ? allEntries.filter(e => e.entryType === typeFilter)
        : allEntries;
    const total = typeFilter ? entries.length : (entriesData?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // Mutations
    const postMutation = usePostJournalEntry();
    const reverseMutation = useReverseJournalEntry();
    const approveMutation = useApproveJournalEntry();

    // Handlers
    const handlePost = async () => {
        if (selectedEntry) {
            await postMutation.mutateAsync(selectedEntry.id);
            setSelectedEntry(null);
        }
    };

    const handleReverse = async () => {
        if (selectedEntry) {
            const reason = prompt('Enter reason for reversal:');
            if (reason) {
                await reverseMutation.mutateAsync({ id: selectedEntry.id, reason });
                setSelectedEntry(null);
            }
        }
    };

    const handleApprove = async () => {
        if (selectedEntry) {
            await approveMutation.mutateAsync(selectedEntry.id);
            setSelectedEntry(null);
        }
    };

    // Summary stats
    const stats = useMemo(() => {
        return {
            total: entries.length,
            draft: entries.filter(e => e.status === 'DRAFT').length,
            posted: entries.filter(e => e.status === 'POSTED').length,
            pending: entries.filter(e => e.status === 'PENDING_APPROVAL').length,
            totalDebit: entries.reduce((sum, e) => sum + e.totalDebit, 0),
        };
    }, [entries]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg text-muted-foreground">Failed to load journal entries</p>
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
                        <span className="text-foreground">Journal Entries</span>
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Journal Entries
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage journal entries
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                    </Button>
                    <Button onClick={() => navigate('/accounting/journal-entries/new')}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Entry
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Entries</p>
                            <p className="text-2xl font-bold">{total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Posted</p>
                            <p className="text-2xl font-bold text-emerald-600">{stats.posted}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-emerald-200" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Draft</p>
                            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                        </div>
                        <Clock className="h-8 w-8 text-gray-200" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Approval</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-amber-200" />
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by entry number or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-36"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-36"
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JournalEntryStatus | '')}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Type Filter */}
                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as JournalEntryType | '')}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Types</SelectItem>
                                {Object.entries(entryTypeConfig).map(([key, { label }]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Branch Filter */}
                        <Select value={branchFilter} onValueChange={setBranchFilter}>
                            <SelectTrigger className="w-40">
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
                </CardContent>
            </Card>

            {/* Entries Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Entry #
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Date
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Description
                                            </th>
                                            <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Branch
                                            </th>
                                            <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Type
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Amount
                                            </th>
                                            <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground w-20">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-12 text-muted-foreground">
                                                    No journal entries found for the selected criteria
                                                </td>
                                            </tr>
                                        ) : (
                                            entries.map((entry) => {
                                                const StatusIcon = statusConfig[entry.status].icon;
                                                return (
                                                    <tr 
                                                        key={entry.id} 
                                                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                                        onClick={() => setSelectedEntry(entry)}
                                                    >
                                                        <td className="py-3 px-4">
                                                            <span className="font-mono text-sm font-medium text-primary">
                                                                {entry.entryNumber}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm">
                                                            {format(parseISO(entry.entryDate), 'dd MMM yyyy')}
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <p className="text-sm line-clamp-1 max-w-xs">
                                                                {entry.description}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {entry.sourceModule}
                                                            </p>
                                                        </td>
                                                        <td className="py-3 px-4 text-sm">
                                                            {entry.branchName || '—'}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge className={entryTypeConfig[entry.entryType].color}>
                                                                {entryTypeConfig[entry.entryType].label}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-mono text-sm">
                                                            {formatCurrency(entry.totalDebit)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <div className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                                                                statusConfig[entry.status].bgColor,
                                                                statusConfig[entry.status].color
                                                            )}>
                                                                <StatusIcon className="h-3 w-3" />
                                                                {statusConfig[entry.status].label}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEntry(entry);
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
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

            {/* Detail Modal */}
            {selectedEntry && (
                <JournalDetailModal
                    entry={selectedEntry}
                    onClose={() => setSelectedEntry(null)}
                    onPost={handlePost}
                    onReverse={handleReverse}
                    onApprove={handleApprove}
                    isPosting={postMutation.isPending}
                    isReversing={reverseMutation.isPending}
                    isApproving={approveMutation.isPending}
                />
            )}
        </div>
    );
}

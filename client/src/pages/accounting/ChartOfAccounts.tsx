/**
 * Chart of Accounts Page
 * 
 * Hierarchical tree view of all accounts with:
 * - Expandable/collapsible tree structure
 * - Search and filter capabilities
 * - Account type color coding
 * - Balance display
 * - CRUD operations
 */

import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    ChevronDown,
    Search,
    Plus,
    Download,
    RefreshCw,
    Edit2,
    Eye,
    TrendingUp,
    TrendingDown,
    Wallet,
    CreditCard,
    Landmark,
    FolderTree,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { cn } from '@/utils';
import { useAccounts } from '@/hooks/useAccounting';
import type { Account, AccountType, AccountStatus } from '@/types/accounting.types';

// Account type configuration
const accountTypeConfig: Record<AccountType, { 
    label: string; 
    icon: React.ElementType; 
    color: string;
    bgColor: string;
    borderColor: string;
}> = {
    ASSET: { 
        label: 'Asset', 
        icon: Wallet, 
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    LIABILITY: { 
        label: 'Liability', 
        icon: CreditCard, 
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
    },
    EQUITY: { 
        label: 'Equity', 
        icon: Landmark, 
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
    },
    REVENUE: { 
        label: 'Revenue', 
        icon: TrendingUp, 
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
    },
    EXPENSE: { 
        label: 'Expense', 
        icon: TrendingDown, 
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
    },
};

const statusConfig: Record<AccountStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
    ACTIVE: { label: 'Active', variant: 'success' },
    INACTIVE: { label: 'Inactive', variant: 'secondary' },
    LOCKED: { label: 'Locked', variant: 'warning' },
};

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

// Build tree structure from flat accounts
interface TreeNode extends Account {
    children: TreeNode[];
    depth: number;
}

const buildTree = (accounts: Account[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: Create TreeNode objects
    accounts.forEach(account => {
        map.set(account.id, { ...account, children: [], depth: 0 });
    });

    // Second pass: Build parent-child relationships
    accounts.forEach(account => {
        const node = map.get(account.id)!;
        if (account.parentAccountId && map.has(account.parentAccountId)) {
            const parent = map.get(account.parentAccountId)!;
            node.depth = parent.depth + 1;
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    // Sort children by code
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes
            .sort((a, b) => a.code.localeCompare(b.code))
            .map(node => ({
                ...node,
                children: sortNodes(node.children),
            }));
    };

    return sortNodes(roots);
};

interface AccountTreeRowProps {
    node: TreeNode;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
    onView: (account: Account) => void;
    onEdit: (account: Account) => void;
    searchTerm: string;
}

const AccountTreeRow = ({ 
    node, 
    expandedIds, 
    onToggle, 
    onView, 
    onEdit,
    searchTerm,
}: AccountTreeRowProps) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const typeConfig = accountTypeConfig[node.accountType];
    const StatusIcon = typeConfig.icon;

    // Highlight matching text
    const highlightMatch = (text: string) => {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() 
                ? <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
                : part
        );
    };

    return (
        <>
            <tr 
                className={cn(
                    "group hover:bg-muted/50 transition-colors border-b border-border/50",
                    node.isHeader && "bg-muted/30 font-medium",
                    node.status !== 'ACTIVE' && "opacity-60"
                )}
            >
                {/* Account Code & Name */}
                <td className="py-3 px-4">
                    <div 
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${node.depth * 24}px` }}
                    >
                        {/* Expand/Collapse button */}
                        {hasChildren ? (
                            <button
                                onClick={() => onToggle(node.id)}
                                className="p-1 hover:bg-muted rounded transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                        ) : (
                            <span className="w-6" />
                        )}

                        {/* Account Type Icon */}
                        <div className={cn(
                            "p-1.5 rounded",
                            typeConfig.bgColor
                        )}>
                            <StatusIcon className={cn("h-4 w-4", typeConfig.color)} />
                        </div>

                        {/* Account Info */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                    {highlightMatch(node.code)}
                                </span>
                                {node.isHeader && (
                                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                        Header
                                    </Badge>
                                )}
                                {node.isBankAccount && (
                                    <Badge variant="default" className="text-xs px-1.5 py-0 bg-blue-100 text-blue-700">
                                        Bank
                                    </Badge>
                                )}
                                {node.isTaxAccount && (
                                    <Badge variant="default" className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700">
                                        Tax
                                    </Badge>
                                )}
                            </div>
                            <span className={cn(
                                "text-sm",
                                node.isHeader ? "font-semibold" : "font-normal"
                            )}>
                                {highlightMatch(node.name)}
                            </span>
                        </div>
                    </div>
                </td>

                {/* Account Type */}
                <td className="py-3 px-4">
                    <div className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                        typeConfig.bgColor,
                        typeConfig.color
                    )}>
                        {typeConfig.label}
                    </div>
                </td>

                {/* Normal Balance */}
                <td className="py-3 px-4 text-sm text-center">
                    <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        node.normalBalance === 'DEBIT' 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                    )}>
                        {node.normalBalance}
                    </span>
                </td>

                {/* Balance */}
                <td className="py-3 px-4 text-right font-mono text-sm">
                    {!node.isHeader && node.balance !== undefined ? (
                        <span className={node.balance < 0 ? 'text-red-600' : ''}>
                            {formatCurrency(node.balance)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </td>

                {/* Status */}
                <td className="py-3 px-4 text-center">
                    <Badge variant={statusConfig[node.status].variant} className="text-xs">
                        {statusConfig[node.status].label}
                    </Badge>
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onView(node)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="View Details"
                        >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                            onClick={() => onEdit(node)}
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="Edit Account"
                        >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </td>
            </tr>

            {/* Render children if expanded */}
            {isExpanded && node.children.map(child => (
                <AccountTreeRow
                    key={child.id}
                    node={child}
                    expandedIds={expandedIds}
                    onToggle={onToggle}
                    onView={onView}
                    onEdit={onEdit}
                    searchTerm={searchTerm}
                />
            ))}
        </>
    );
};

// Account Type Summary Card
interface TypeSummaryProps {
    type: AccountType;
    count: number;
    total: number;
    onClick: () => void;
    isActive: boolean;
}

const TypeSummaryCard = ({ type, count, onClick, isActive }: Omit<TypeSummaryProps, 'total'>) => {
    const config = accountTypeConfig[type];
    const Icon = config.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                "hover:shadow-md",
                isActive 
                    ? `${config.bgColor} ${config.borderColor} shadow-sm` 
                    : "bg-white border-border hover:border-gray-300"
            )}
        >
            <div className={cn(
                "p-2 rounded-lg mb-2",
                config.bgColor
            )}>
                <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <span className={cn("text-sm font-medium", config.color)}>
                {config.label}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
                {count} accounts
            </span>
        </button>
    );
};

export default function ChartOfAccounts() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<AccountType | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Fetch accounts
    const { data: accountsData, isLoading, error, refetch } = useAccounts({
        status: 'ACTIVE',
    });

    const accounts = accountsData || [];

    // Build tree for future hierarchical view (not currently used in flat filtered view)
    // const tree = useMemo(() => buildTree(accounts), [accounts]);

    // Filter tree based on search and type
    const filteredAccounts = useMemo(() => {
        let filtered = accounts;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(acc => 
                acc.code.toLowerCase().includes(term) ||
                acc.name.toLowerCase().includes(term) ||
                acc.description?.toLowerCase().includes(term)
            );
        }

        if (typeFilter) {
            filtered = filtered.filter(acc => acc.accountType === typeFilter);
        }

        return filtered;
    }, [accounts, searchTerm, typeFilter]);

    const filteredTree = useMemo(() => buildTree(filteredAccounts), [filteredAccounts]);

    // Calculate type summaries
    const typeSummaries = useMemo(() => {
        const summaries: Record<AccountType, { count: number; total: number }> = {
            ASSET: { count: 0, total: 0 },
            LIABILITY: { count: 0, total: 0 },
            EQUITY: { count: 0, total: 0 },
            REVENUE: { count: 0, total: 0 },
            EXPENSE: { count: 0, total: 0 },
        };

        accounts.forEach(acc => {
            summaries[acc.accountType].count++;
            if (acc.balance) {
                summaries[acc.accountType].total += acc.balance;
            }
        });

        return summaries;
    }, [accounts]);

    // Toggle expand/collapse
    const handleToggle = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Expand/collapse all
    const expandAll = useCallback(() => {
        const allIds = new Set(accounts.filter(a => a.isHeader).map(a => a.id));
        setExpandedIds(allIds);
    }, [accounts]);

    const collapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);

    // Handle view/edit
    const handleView = (account: Account) => {
        setSelectedAccount(account);
        setShowDetailModal(true);
    };

    const handleEdit = (account: Account) => {
        navigate(`/accounting/accounts/${account.id}/edit`);
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg text-muted-foreground">Failed to load chart of accounts</p>
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
                        <span className="text-foreground">Chart of Accounts</span>
                    </div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FolderTree className="h-6 w-6 text-primary" />
                        Chart of Accounts
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your hierarchical chart of accounts
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
                    <Button onClick={() => navigate('/accounting/accounts/new')}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Account
                    </Button>
                </div>
            </div>

            {/* Type Summary Cards */}
            <div className="grid grid-cols-5 gap-4">
                {(Object.keys(accountTypeConfig) as AccountType[]).map(type => (
                    <TypeSummaryCard
                        key={type}
                        type={type}
                        count={typeSummaries[type].count}
                        onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                        isActive={typeFilter === type}
                    />
                ))}
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by code, name, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={expandAll}
                                className="text-muted-foreground"
                            >
                                Expand All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={collapseAll}
                                className="text-muted-foreground"
                            >
                                Collapse All
                            </Button>
                        </div>
                    </div>
                    {typeFilter && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filtered by:</span>
                            <Badge 
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => setTypeFilter(null)}
                            >
                                {accountTypeConfig[typeFilter].label}
                                <span className="ml-1">×</span>
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Accounts Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                            Code / Name
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                            Type
                                        </th>
                                        <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                            Normal Balance
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                            Balance
                                        </th>
                                        <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground w-24">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTree.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                                {searchTerm || typeFilter 
                                                    ? 'No accounts match your search criteria'
                                                    : 'No accounts found. Create your first account to get started.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTree.map(node => (
                                            <AccountTreeRow
                                                key={node.id}
                                                node={node}
                                                expandedIds={expandedIds}
                                                onToggle={handleToggle}
                                                onView={handleView}
                                                onEdit={handleEdit}
                                                searchTerm={searchTerm}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Account Detail Modal */}
            {showDetailModal && selectedAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        accountTypeConfig[selectedAccount.accountType].bgColor
                                    )}>
                                        {(() => {
                                            const Icon = accountTypeConfig[selectedAccount.accountType].icon;
                                            return <Icon className={cn(
                                                "h-5 w-5",
                                                accountTypeConfig[selectedAccount.accountType].color
                                            )} />;
                                        })()}
                                    </div>
                                    Account Details
                                </CardTitle>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="p-1 hover:bg-muted rounded"
                                >
                                    ×
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Account Code</dt>
                                        <dd className="font-mono font-medium">{selectedAccount.code}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Account Type</dt>
                                        <dd>{accountTypeConfig[selectedAccount.accountType].label}</dd>
                                    </div>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Account Name</dt>
                                    <dd className="font-medium">{selectedAccount.name}</dd>
                                </div>
                                {selectedAccount.description && (
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Description</dt>
                                        <dd className="text-sm">{selectedAccount.description}</dd>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Normal Balance</dt>
                                        <dd>{selectedAccount.normalBalance}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Level</dt>
                                        <dd>{selectedAccount.level}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Status</dt>
                                        <dd>
                                            <Badge variant={statusConfig[selectedAccount.status].variant}>
                                                {statusConfig[selectedAccount.status].label}
                                            </Badge>
                                        </dd>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedAccount.isHeader && (
                                        <Badge variant="secondary">Header Account</Badge>
                                    )}
                                    {selectedAccount.isBankAccount && (
                                        <Badge className="bg-blue-100 text-blue-700">Bank Account</Badge>
                                    )}
                                    {selectedAccount.isTaxAccount && (
                                        <Badge className="bg-amber-100 text-amber-700">Tax Account</Badge>
                                    )}
                                    {selectedAccount.isSystemAccount && (
                                        <Badge className="bg-gray-100 text-gray-700">System Account</Badge>
                                    )}
                                </div>
                            </dl>
                            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                                    Close
                                </Button>
                                <Button onClick={() => {
                                    setShowDetailModal(false);
                                    handleEdit(selectedAccount);
                                }}>
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

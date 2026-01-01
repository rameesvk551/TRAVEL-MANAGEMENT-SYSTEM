import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLeads } from '@/hooks';
import { Lead } from '@/types/crm';
import { LeadDrawer } from '@/components/crm/LeadDrawer';
import { Button, Card, CardContent, Badge, Input } from '@/components/ui';
import { Search, Plus, Building2, Trophy, Users, Phone, Mail, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isOverdue = (dateStr?: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
};

export const Leads: React.FC = () => {
    const { data, isLoading, error, refetch } = useLeads();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Calculate stats
    const stats = useMemo(() => {
        const leads = data?.leads || [];
        return {
            totalDeals: leads.length,
            totalCompanies: leads.filter(l => l.tags?.includes('institutional') || l.tags?.includes('company')).length,
            wonDeals: leads.filter(l => l.status === 'won' || l.status === 'WON').length,
        };
    }, [data?.leads]);

    // Filter leads by search
    const filteredLeads = useMemo(() => {
        const leads = data?.leads || [];
        if (!searchQuery.trim()) return leads;
        const query = searchQuery.toLowerCase();
        return leads.filter(lead =>
            lead.name?.toLowerCase().includes(query) ||
            lead.email?.toLowerCase().includes(query) ||
            lead.phone?.includes(query)
        );
    }, [data?.leads, searchQuery]);

    const handleLeadClick = (lead: Lead) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setTimeout(() => setSelectedLead(null), 300);
    };

    const handleLeadUpdated = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-destructive">
                <p>Error loading leads. Please try again.</p>
                <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Breadcrumb */}
            <div className="px-6 py-3 text-sm text-slate-500 flex items-center gap-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <Link to="/" className="hover:text-emerald-600">Home</Link>
                <span>/</span>
                <Link to="/crm" className="hover:text-emerald-600">CRM</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">Leads</span>
            </div>

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Management</h1>
                    <Link to="/crm/leads/new">
                        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="w-4 h-4" />
                            New Lead
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-900"
                    />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <Users className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Total Deals</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalDeals}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Total Companies</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalCompanies}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide">Won</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.wonDeals}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Leads Table */}
                <Card className="bg-white dark:bg-slate-900 border-0 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SL NO</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Contact</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            {searchQuery ? 'No leads match your search.' : 'No leads found. Create your first lead!'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead, index) => {
                                        const isInstitutional = lead.tags?.includes('institutional') || lead.tags?.includes('company');
                                        const nextContactOverdue = false; // Would come from follow-ups data
                                        
                                        return (
                                            <tr 
                                                key={lead.id} 
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                                onClick={() => handleLeadClick(lead)}
                                            >
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    #{index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold",
                                                            isInstitutional ? "bg-blue-500" : "bg-emerald-500"
                                                        )}>
                                                            {lead.name?.[0]?.toUpperCase() || 'L'}
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-white">{lead.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {lead.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                {lead.phone}
                                                            </div>
                                                        )}
                                                        {lead.email && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                <Mail className="w-3.5 h-3.5" />
                                                                {lead.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={cn(
                                                            "font-medium",
                                                            isInstitutional 
                                                                ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                                                                : "border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                        )}
                                                    >
                                                        {isInstitutional ? 'Institutional' : 'Individual'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {lead.source || 'Other'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {lead.updatedAt ? formatDate(lead.updatedAt) : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* This would come from follow-up data */}
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">—</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Lead Drawer */}
            <LeadDrawer
                lead={selectedLead}
                isOpen={drawerOpen}
                onClose={handleCloseDrawer}
                onLeadUpdated={handleLeadUpdated}
            />
        </div>
    );
};

